/*!
Copyright 2018 Bjørn Erik Pedersen <bjorn.erik.pedersen@gmail.com>. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

(function() {

    function midiValToColor(val) {
        var fraction = val / 127;
        var color_part_dec = 255 * fraction;
        var color_part_hex = Number(parseInt(color_part_dec, 10)).toString(16);
        return "#" + color_part_hex + color_part_hex + color_part_hex;
    }


    WebMidi.enable(function(err) {
        if (err) {
            alert("WebMidi failed", err);
            return
        }

        var normalizeName = function(name) {
            return name.replace(/\s\s+/g, ' ');
        }

        var byName = function(list, name) {
            name = normalizeName(name);
            for (var i = 0; i < list.length; i++) {
                if (name === normalizeName(list[i].name)) {
                    return list[i];
                }
            }
            return false;
        };

        var getDefaultDevice = function(list, re) {
            if (list.length === 0) {
                return ""
            }


            var regexp = new RegExp(re, "i");

            for (i = 0; i < list.length; i++) {
                if (list[i].name.match(regexp)) {
                    return list[i].name
                }
            }
            return list[0].name;
        };


        var defaultInput = normalizeName(getDefaultDevice(WebMidi.inputs, "ewi|bluetooth"));
        var defaultOutput = normalizeName(getDefaultDevice(WebMidi.inputs, "magellan"));

        var app = new Vue({
            delimiters: ['[[', ']]'],
            el: '#app',
            data: {
                opts: {
                    style: {
                        bgColor: "#000",
                        borderWidth: 3
                    },
                    inputs: WebMidi.inputs,
                    outputs: WebMidi.outputs,
                    channels: _.range(1, 10),
                    notesInChord: _.range(1, 10),
                    selected: {
                        input: defaultInput,
                        output: defaultOutput,
                        ccToggle: 64, // Sustain Pedal
                        ccBreath: 2, // Breath Controller
                        ccBreathForward: 30, // Percentage of breath input to forward to output channel
                        notesInChord: 4,
                        inputChannel: 1,
                        outputChannel: 2
                    }
                },
                events: []
            },
            methods: {
                onChange() {
                    if (this.initCallback) {
                        this.events.length = 0;
                        this.initCallback();
                    }
                },
                addEvent: function(e) {
                    var str = Array.prototype.slice.call(arguments).join(" ");
                    this.events.push(str);
                    var container = this.$el.querySelector("#events");
                    container.scrollTop = container.scrollHeight;
                },
            }
        })


        chorder = new Chorder(app);

        chorder.initIfReady();

        function Chorder(app) {
            // The state of the chorder. State 1 will stop any chord in play and start a new sequence.
            this.state = 0;

            // As distinct list of notes playing.
            // We need to keep track of the notes playing, so we can send note off to signal a stop.
            // Also, we use this as a threshold to know when the chord is "full". This may seem limiting, but it in practice
            // this feels more fluid than having to manually toggle something in the heat of the moment.
            // If we make "number of notes in a chord" configurable, we should be able to do both.
            this.notesPlaying = [];

            // Store away the breath values so we can set some sensible velocity for the chord tones.
            this.breathValues = [];

            this.log = function(e) {
                var str = Array.prototype.slice.call(arguments).join(" ");
                app.addEvent(str);
            };

            this.opts = app.opts;


            this.initIfReady = function() {
                var opts = this.opts;
                if (opts.selected.input && opts.selected.output) {
                    this.init()
                }
            }

            var that = this;

            app.initCallback = function() {
                that.initIfReady();
            }

            this.init = function() {
                this.stopPlaying();
                this.state = 0;


                var opts = this.opts;

                this.input = byName(WebMidi.inputs, opts.selected.input);
                this.output = byName(WebMidi.outputs, opts.selected.output);

                if (!this.input || !this.output) {
                    this.log("Failed to initialize");
                    return
                }

                this.input.removeListener();


                var selected = this.opts.selected;

                this.log("Ready to Play.", "Input:", selected.input, "Output:", selected.output);

                var that = this;

                var incrState = _.debounce(function(e) {
                    that.state++;
                    if (that.state >= 3) {
                        that.state = 1;
                    }
                    that.log("State:", that.state);
                }, 100);

                this.input.addListener('noteon', selected.inputChannel,
                    function(e) {
                        that.playNote(e);
                    }
                );

                this.input.addListener('controlchange', selected.inputChannel,
                    function(e) {
                        if (e.controller.number == selected.ccBreath) {
                            var val = e.data[2];
                            that.opts.style.bgColor = midiValToColor(val);
                            that.opts.style.borderWidth = 10 + (val * 2);
                            that.breathValues.push(val);

                            if (selected.ccBreathForward > 0) {
                                var forward = Math.floor(val * (selected.ccBreathForward / 100));
                                // Forward the breath value to the output channel. This allows for adding some "life" to the playing chord.
                                that.output.sendControlChange(selected.ccBreath, forward, selected.outputChannel, {});
                            }

                        }

                        if (e.controller.number == selected.ccToggle) {
                            incrState(e);
                        }
                    }
                );
            };

            this.stopPlaying = function() {
                if (this.notesPlaying.length > 0) {
                    // Stop the playing chord.
                    this.output.stopNote("all", this.opts.selected.outputChannel);
                    this.notesPlaying = [];
                }
            };

            this.playNote = function(e) {
                if (this.state > 0 && this.state <= 2) {
                    if (this.state == 1) {
                        this.stopPlaying();
                        this.state++;
                    }

                    if (_.includes(this.notesPlaying, e.note.number)) {
                        // Skip, already playing.
                        return;

                    }

                    this.log("Add note", e.note.name);
                    var velocity = _.max(this.breathValues);
                    this.breathValues = [];
                    var selected = this.opts.selected;

                    this.output.playNote(e.note.number, selected.outputChannel, {
                        rawVelocity: true,
                        duration: 20000,
                        velocity: velocity,
                        release: velocity
                    });


                    this.notesPlaying.push(e.note.number);

                    // Auto-toggle when reached the treshold.
                    if (this.notesPlaying.length >= selected.notesInChord) {
                        this.state = 3;
                    }

                };
            };
        };

    });

})();
