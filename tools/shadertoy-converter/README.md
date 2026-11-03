# Shadertoy to VS2 Material converter

*A single web page that converts a Shadertoy shader into a plain and an audio-reactive Material for VS2 (Visual Synthesizer), with you choosing which numbers in the code become knobs.*

## What it does

VS2 Materials are GLSL fragment shaders with a little extra: a comment block of JSON at the top that names the knobs, and a few built-in variables. Shadertoy shaders are GLSL too, but they are written as a function called `mainImage` that expects Shadertoy's own variables (`iTime`, `iResolution` and so on). This page:

1. reads the shader code you give it and finds the numbers in it,
2. lets you choose which of them should be controlled by a knob in VS2,
3. wraps the shader so that VS2 supplies everything it expects, and
4. writes a plain `.frag` file and an audio-reactive `_audio.frag` file.

Nothing is uploaded: the page makes no network requests and your code never leaves your device. (It cannot fetch a shader from a Shadertoy link: Shadertoy does not allow that from a web page, so paste the code or upload it.)

## Licence and credit: please read

Unless its author says otherwise, a Shadertoy shader is licensed **CC BY-NC-SA 3.0**: you must credit the author, you may not use it commercially, and anything you make from it must be shared under the same licence. Some authors choose other licences, and a few allow nothing at all, so check the shader's page.

The page has a "Credit" section (title, original author, link and licence). It writes them into the manifest and into a header comment in both files, together with your name as the converter. Keep that credit if you share the files. Following the licence is up to you; the page cannot do it for you.

## Hosting it

`index.html` is one self-contained file with no dependencies. Put it on any web host that serves static files (GitHub Pages, for example), or open it from your computer. Use a modern browser. The live preview needs WebGL2; without it the page still works and you can still download the Materials.

The only thing the page can store is your name, and only if you tick "Remember my name": it is saved as a cookie on your device for a year and is never sent anywhere by the page. Browsers usually do not keep cookies for pages opened straight from a file.

## Using it

1. **The shader:** paste the code from the shader's **Image** tab (it contains `mainImage`), or upload a `.glsl`, `.frag` or `.txt` file, or drag one onto the page. If the shader has a **Common** tab, paste that into the extra box. The Material is named after the uploaded file by default, and you can change the name.
2. **Credit:** title, author, link and licence.
3. **Textures:** only appears if the shader reads texture channels (`iChannel0` to `iChannel3`). Choose Sound, Noise or Black for each (see below).
4. **Numbers and preview:** the numbers in the code are listed next to a live preview. Drag the slider in a row to try other values for that number, and choose a knob for the ones worth keeping (see below). Tick the box to preview the audio version with simulated music.
5. **Knobs:** set each knob's name, range and starting value and, for the audio version, how bass, mids and highs move it. Optionally choose two knobs to stand in for the mouse.
6. **The Material:** name, your name, Layer colour, speed multiplier, transparency, UUIDs, and the settings of the audio version.
7. **Download:** the plain and audio files, or copy the code. In VS2, create a new shader Material in the Material Editor and paste the code in (or import the file). See the VS2 manual's Material Editor section.

## Turning numbers into knobs

The list shows the **named values** in the code: `#define NAME 1.5`, `const float` constants, and variables that start from a decimal number, including the parts of vector constants (for example `LIGHT.x`). Tick "Show every number" to also see numbers inside expressions, with the line they are on, and use the search box to find one. Choose a knob for each number you want to control. Several numbers can share a knob.

- The knob starts at the value the number had, or at the value you tried (see below), so the picture is unchanged until you turn it. A knob's value is the value of the first number linked to it. If several numbers share a knob and had different values, the others keep their proportions to the first (or their differences, if one was zero).
- The knob's range starts as 0 to three times the value (or -1 to 1 for zero), and you can change it. The knob is named after the variable, and given a suffix if that would clash with a name already in the shader.
- Only decimal numbers can be knobs (a number written `2` rather than `2.0` is an integer). Numbers inside global arrays or lists of global variables cannot, and the page says so.
- Some constants depend on others: if a number you changed feeds a `const` or another `#define`, the page removes the `const` and sets the value when the Material starts, so the shader still compiles.

You use up to seven knobs, the most VS2 shows.

## Trying a number before you commit

Every number in the list has its own slider in the **Try it** column, running from 0 to three times the number's value. Drag it and the preview changes straight away. Nothing is committed: the downloads are never affected.

- A number you have tried is highlighted, shows its original value beside it, and has a button to put it back. "Put every tried number back" clears them all.
- When you then pick a knob for a number you have tried, the knob **starts at the value you tried**, and the slider's range becomes the knob's range.
- A number that is on a knob has its slider switched off: use the knob's own slider, under the preview.
- Up to eight numbers can be tried at once, and trying a ninth puts the oldest back. Each tried number needs its own control in the preview, so the page makes a separate preview copy of the shader in which tried numbers are replaced by temporary controls. That copy is only ever used for the preview.
- On a wide screen the preview sits beside the list and stays in view as you scroll the list. On a narrow screen it comes after the list and before the knobs.

## What the wrapper provides

| Shadertoy variable | In VS2 |
|---|---|
| `iTime` | VS2's clock times `SPEED_SCALE` (default 8; set 1 to run at the speed the shader was written for) |
| `iResolution` | The layer's size |
| `fragCoord` | The pixel position, as on Shadertoy |
| `iMouse` | Zero, or two knobs of your choice (across, and up), counted as pressed |
| `iTimeDelta`, `iFrame`, `iFrameRate`, `iSampleRate`, `iChannelTime`, `iChannelResolution` | Sensible fixed or clock-based values |
| `iDate` | A made-up fixed date, with the clock as the time of day |

The shader's own names that clash with VS2's (`time`, `resolution`, `color`, `alpha`, `texCoord`, `fftTex`, `fragColor`) are renamed with an `st_` prefix everywhere in the shader, so they cannot collide.

**Transparency:** opaque (as on Shadertoy), black is see-through (so layers show through, like most Materials in this project), or the shader's own alpha. You can also tint the picture with the Layer colour.

## Textures

VS2 Materials have no textures, so each channel the shader reads is replaced. The page guesses from how the shader reads it, and you can change it:

- **Sound:** the Shadertoy sound texture has the spectrum on its top row (`y = 0.25`, 0 to 22 kHz evenly spaced) and the waveform on its bottom row (`y = 0.75`). In the audio version the spectrum reads VS2's FFT, using the frequency layout assumed in the audio settings, scaled by `react`. VS2 gives no waveform, so that row is an approximation that wiggles with the loudness. The plain version has no audio, so it gets a slow made-up spectrum so that the shader still moves.
- **Noise:** smoothly blended random values on a 256 by 256 grid, standing in for Shadertoy's noise textures. The look is similar, but not the same pattern.
- **Black:** nothing.

Reads with `texture`, `texture2D`, `textureLod`, `texelFetch` and `textureSize` are converted, including nested ones. Cubemap reads give black. A channel passed into one of the shader's own functions cannot be converted, and the page warns you.

## The audio version

The audio version averages VS2's FFT over bass, mids and highs (ranges in Hz, with the assumed layout of the FFT texture, as in the other audio Materials), each scaled by `react`.

- **`react`** goes in the slot you choose (default 5). If fewer than seven knobs are in use it is simply added. If all seven are in use, it takes that slot, and the knob that was there becomes a fixed number.
- **Knob reactions:** a table gives each knob a strength for bass, mids and highs, from -3 to 3. A strength of 1 moves the knob a quarter of its range, scaled by the band's level, and the result is kept inside the knob's range. Negative strengths move it the other way.
- **Brightness:** optionally flash the whole picture brighter with the music.

In the generated file, each knob's line in `main()` shows these numbers, so you can tune them by hand later.

## Constants you can change in a generated file

| Constant | What it does |
|---|---|
| `SPEED_SCALE` | The clock multiplier. 1.0 is the original speed |
| `BASS_HZ`, `MID_HZ`, `HIGH_HZ` | The frequency range of each audio band, in Hz (audio version) |
| `FFT_MIN_HZ`, `FFT_MAX_HZ`, `FFT_LOG` | The assumed layout of VS2's FFT texture (audio version). See the [main README](../../README.md#audio-setup) for how to check it |

The knob values inside the shader are variables named `vk_` plus the knob's name. They are set at the start of `main()`.

## What does not convert

- **Shaders that read other buffers** (Buffer A to D, or feedback of their own previous frame): a Material cannot remember its previous frame. Choosing Noise or Black for those channels gives something, but not the shader's real picture.
- **Textures, video, webcam, cubemaps and keyboard input** (swap in sound, noise or black).
- **Sound shaders** (`mainSound`) and **VR shaders** (`mainVR`).
- **Speed:** heavy shaders (long ray-marching loops, for example) may be slow, especially on laptops.
- **Strict compilers:** VS2's GLSL version is not documented. The converted code compiles as desktop GLSL 3.30 and as GLSL ES 3.00, but a shader that relies on something unusual may still need a hand fix. The error VS2 shows usually names the line.

## Photosensitivity

Shadertoy shaders can flash and strobe, and the audio versions make that follow the music. Do not use them for audiences that might include people with photosensitive epilepsy without a warning.

## Status

- The conversion engine was tested on a set of Shadertoy-style shaders written for the purpose: a plasma with macros, constants and a dependent chain, an audio visualiser reading the sound texture, a shader using noise textures with `texelFetch`, `textureSize` and the mouse, a shader whose global names clash with VS2's, a ray marcher with local constants, and nested texture reads. Each converted file, in both versions and every transparency mode, compiles as desktop GLSL 3.30 and as GLSL ES 3.00.
- The page was tested in a simulated browser: loading, choosing knobs, renaming and ranges, audio strengths, the `react` slot, textures, transparency, file upload, error messages, credit, and the name cookie. The try-it sliders were tested too: trying a number, dragging it, committing it to a knob (which starts at the tried value), putting numbers back, the limit of eight, and that the downloadable code never contains a temporary control. The preview copies compile as desktop GLSL 3.30 and GLSL ES 3.00.
- **It has not been tried on a large collection of real Shadertoy shaders, the live WebGL preview has not been tested in a real browser, and converted Materials have not been tested in VS2.** Treat the first conversions as experiments and report anything that fails.

## Credits

Part of [VS2 Materials](../../README.md). Author: The Winterval Conspiracy. Not affiliated with Shadertoy or Imaginando. Shaders you convert belong to their authors.
