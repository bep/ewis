
**EWIS** is a Web MIDI app that let you trigger chords and play on top of them using your [EWI](https://en.wikipedia.org/wiki/EWI_(musical_instrument)) or similar wind controller. There is a live version running at https://ewis.netlify.com/ -- but note that this app may change at any time, so don't count on it for your live performances. I may publish versioned URLs if this is of interest to people. The source code can be found [here](https://github.com/bep/ewis).

This app is developed by [bep](https://github.com/bep) and powered by [Hugo](https://gohugo.io/), [Vue](http://vuejs.org/) and [WebMIDI](https://github.com/djipco/webmidi).

### How to Use

You need:

* An [EWI](https://en.wikipedia.org/wiki/EWI_(musical_instrument)) or similar breath controller.
* A "breath friendly" synth or two. I recommend [Magellan](http://www.yonac.com/magellan/) on iOS (it is available for both iPad and iPhone) with [mkirino01's](https://www.youtube.com/watch?v=nKvo1yZBkr0) great, free patches. It has two synth engines, so you can use one for the lead and the second for a pad type of sound for the chords.
* A browser that supports [Web MIDI](https://github.com/djipco/webmidi#browser-support). On IOS (e.g. iPad) you need to install [Web MIDI Browser ](https://itunes.apple.com/us/app/web-midi-browser/id953846217?mt=8). On `macOS`, Chrome works great (Safari does not).

I have tested this on both `macOS` (in both Logic X and MainStage) and on `IOS` (using the Magellan synth running on an iPad Air) with an [Akai EWI USB](http://www.akaipro.com/products/ewi-series/ewi-usb).

I have the "thumb bend down" mapped to CC 64 (sostenuto; see the `CC Toggle` setting below), which is what I use to trigger a new chord sequence with a single tap. This plays-and-holds up to the number of notes configured by the `Polyphony` setting (see below) with velocity matching the breath.  

### Settings

| Setting | Description |
| --- | --- |
| Input| The MIDI input device. |
| Input&nbsp;Channel | The MIDI input channel. |
| Output | The MIDI output device, i.e. a synth. |
| Output&nbsp;Channel | The MIDI output channel. |
| Polyphony | How many notes to play in a chord. |
| CC&nbsp;Toggle | The [MIDI CC](http://nickfever.com/music/midi-cc-list) number to use to trigger a new chord. |
| CC&nbsp;Breath | The MIDI CC in use for breath control. |
| %&nbsp;Breath&nbsp;Forward | Percentage of the MIDI breath value that gets forwarded to the output channel. This can be used to add some life to the chord pad. |


### Build From Source 
You need [Hugo](https://gohugo.io/) installed. Then you can just `git clone https://github.com/bep/ewis.git` and run `hugo server`.

If you want to develop and test your tweaks on an iPad, you may want a public URL for your development server. One way would be to use [ngrok](https://ngrok.com/) and then start your server with:

```bash
hugo server --liveReloadPort=443 --baseURL=https://[your-id].ngrok.io --appendPort=false
```
