# SVG to VS2 Material converter

*A single web page that turns an SVG drawing into a plain and an audio-reactive Material for VS2 (Visual Synthesizer).*

## What it does

A Material cannot read an SVG while it runs: shaders have no way to load a file or read text. So this page does the reading for you. It
parses the SVG in your browser, flattens the curves into short straight edges, simplifies them to a size you choose, and writes the
edges into a finished `.frag` file as a list of numbers. The Material then draws that shape live as neon outlines or a filled
shape, and you can move, rotate, scale, warp, glitch or trace it, and (in the audio version) make it react to the music.

Nothing is uploaded: the page makes no network requests, and your SVG never leaves your device. The only thing the page can store is your author name, and only if you tick "Remember my name": it is saved as a cookie on your device for a year and is never sent anywhere by the page. Browsers usually do not keep cookies for pages opened straight from a file, so the name is only remembered when the page is hosted.

## Hosting it

`index.html` is one self-contained file with no dependencies. Put it on any web host that serves static files (GitHub Pages, for
example), or just open it from your computer. Use a modern browser. The live preview needs WebGL2; without it the page still works and
you can still download the Materials.

## Using it

1. **Your SVG:** paste SVG code, upload an `.svg` file, drag a file onto the page, or try one of the examples.
2. **How the shape is converted:**
   - **Maximum straight segments** (20 to 1000, default 300): the shape is simplified to fit. More is more faithful but slower, because every pixel checks every segment. About 300 is comfortable on a laptop, and the page warns above 600.
   - **Which shapes can be filled:** follow the SVG's own fill, treat every closed shape as fillable, or outlines only. Holes are handled with the even-odd rule, so the hole in a letter O stays empty.
   - **Flip upside down:** in case your drawing comes out the wrong way up.
3. **The Material:** its name (used for the file names; if you upload a file it starts as that file's name, and you can change it), author (tick "Remember my name" to keep it in a cookie on your device so you do not have to type it again), Layer colour, speed multiplier (`SPEED_SCALE`, project default 8), the **effect** on knob 5, and the two UUIDs.
4. **The seven knobs:** the lowest, highest and starting value of each.
   **Audio reactions:** a table where you choose how strongly bass, mids and highs drive each of nine settings (size, rotation, thickness, fill, effect strength, glow, colour shift, brightness and shake).
   **Audio frequency bands:** the lowest and highest frequency of the bass, mids and highs bands, in Hz, plus the assumed layout of VS2's FFT texture (the frequencies at its left and right edges, and logarithmic or even spacing). The defaults are 40 to 150 Hz, 250 to 2,000 Hz and 4,000 to 12,000 Hz, on a logarithmic 20 to 20,000 Hz texture. See the [main README](../../README.md#audio-setup) for how to check the texture layout against your own VS2.
5. **Preview:** a live view of the generated code, with a slider for every knob. Tick the box to preview the audio version with simulated music.
6. **Download:** the plain `.frag`, the audio-reactive `_audio.frag`, or copy the code.

In VS2, create a new shader Material in the Material Editor and paste the code in (or import the file). See the VS2 manual's Material Editor section.

## The Material it makes

| Knob | Name | What it does |
|---|---|---|
| 1 | `zoom` | Size of the shape. The whole shape fits in a square of side 1, so at zoom 1 its longest side is as tall as the screen |
| 2 | `angle` | Rotation, in degrees |
| 3 | `thickness` | Line thickness, in screen heights |
| 4 | `fill` | How solid the filled shapes are. 0 is outlines only |
| 5 | the effect: `wobble`, `glitch`, `pulse` or `trace` | How strong the effect is. The audio version has `react` here instead |
| 6 | `glow` | Glow around the lines |
| 7 | `rainbow` | 0 keeps the Layer colour only; 1 gives a colour gradient across the shape |

### The effects

- **Wobble:** the shape ripples as if under water. `WOBBLE_SPEED` sets how fast.
- **Glitch:** the shape is cut into horizontal slices, and slices jump sideways at irregular moments; a stronger effect means more slices jump, and further. `GLITCH_BANDS` is the number of slices and `GLITCH_RATE` how often they change.
- **Pulse:** the shape swells and shrinks by up to 30 percent. `PULSE_RATE` sets how fast.
- **Trace:** the outline draws itself on, over and over, with a bright head. At 0 the whole shape is shown; at 1 it draws from nothing each time. `TRACE_RATE` sets how fast.

### The audio version

`react` (0 to 4, default 2) sets the overall sensitivity. The effect amount becomes the constant `EFFECT_BASE`, set from the knob's starting value.

**You choose how the music changes the picture.** The "Audio reactions" table has a row for each of nine settings and a column for each of bass, mids and highs. Each box is how strongly that band drives that setting: 0 does nothing, 1 is the standard amount, up to 3. A band can drive several settings and a setting can follow several bands. The standard reactions are filled in to start with, so you only change what you want to.

| Setting | What strength 1 does | Driven by, to start with |
|---|---|---|
| Size | The shape swells by up to 15 percent | Bass |
| Rotation | The shape tilts by up to 25 degrees | Mids |
| Line thickness | The lines get up to three times thicker | Highs |
| Fill | Filled shapes get up to 0.4 more solid | Bass |
| Effect strength | The effect gets up to 0.6 stronger, on top of `EFFECT_BASE` | Bass |
| Glow | The glow gets up to 0.4 brighter | Bass |
| Colour shift | The colour gradient slides along the shape | Highs |
| Brightness | The lines flash up to two and a half times brighter | nothing |
| Shake | The whole shape trembles by up to 2 percent of the screen height | nothing |

"Reset to the standard reactions" and "Switch all reactions off" are one click each. In the generated file, every reaction is one line near the top of `main()`, and the number in front of `bassLv`, `midLv` or `highLv` is its strength, so you can also tune it by hand later.

The frequency range of each band is set separately, in Hz, in the "Audio frequency bands" boxes.

Set up audio in VS2 as described in the [main README](../../README.md#audio-setup).

## Constants you can change in a generated file

| Constant | What it does |
|---|---|
| `SPEED_SCALE` | Overall speed multiplier |
| `WOBBLE_SPEED`, `GLITCH_BANDS`, `GLITCH_RATE`, `PULSE_RATE`, `TRACE_RATE` | The settings of the chosen effect (only the one for your effect is in the file) |
| `EFFECT_BASE` | Resting effect strength in the audio version |
| `BASS_HZ`, `MID_HZ`, `HIGH_HZ` | The frequency range of each audio band, in Hz (audio version) |
| `FFT_MIN_HZ`, `FFT_MAX_HZ`, `FFT_LOG` | The assumed layout of the FFT texture: the frequencies at its left and right edges, and logarithmic or even spacing (audio version) |

**Leave alone:** `NC`, `NO`, `SEGC`, `SEGO` (and `TC` and `TO` for Trace) are your shape. Re-run the converter to change them.

## What converts, and what does not

**Converts:** paths (all commands, including curves and arcs), rectangles (with rounded corners), circles, ellipses, lines, polylines and polygons, nested groups, `<use>` references, and transforms (translate, scale, rotate, skew and matrix).

**Does not convert:** text (convert it to outlines in your drawing program first), gradients, filters, clipping and masks, images and patterns. Colours and stroke widths in the SVG are ignored: colour and thickness come from the Material's knobs. A shape with neither a fill nor a stroke is treated as invisible.

For best results, in your drawing program turn strokes and text into paths and ungroup clones before exporting.

## Photosensitivity

The Glitch effect and the audio-reactive versions change suddenly, and Trace flashes a bright head. Do not use them for audiences that might include people with photosensitive epilepsy without a warning.

## Status

- The SVG reading, filling and code generation were tested with a range of drawings (polygons, curves, arcs, holes, transforms, `<use>`, rectangles with rounded corners, very large paths, and invalid or empty files), and the fill logic was checked against known inside and outside points.
- Every combination of effect, plain and audio version that was tested compiles as a desktop GLSL 3.30 shader and as a WebGL2 (GLSL ES 3.00) shader.
- The audio reactions table was tested with the standard reactions, custom ones, everything off and everything on; each variant compiles in both forms, and the standard reactions produce the same code as before the table existed.
- The page itself was tested in a simulated browser. **The live WebGL preview has not been tested in a real browser,** and the generated Materials have not been tested in VS2. If the preview shows a compile message, the Material may still work in VS2.

## Credits

Part of [VS2 Materials](../../README.md). Author: The Winterval Conspiracy. Not affiliated with Imaginando.
