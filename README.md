# VS2 Materials

Audio-reactive and plain GLSL Materials for **VS2 (Visual Synthesizer)** by [Imaginando](https://www.imaginando.pt/products/vs-visual-synthesizer), a VJ software package.

Each Material comes in two versions where possible: a **plain** version, and an **audio-reactive** version (`_audio`) that reacts to the music through VS2's FFT texture. Every Material has its own README with a description, a table of the knobs, and the constants in the code that are worth changing.

Author: The Winterval Conspiracy

## The Materials

### Tunnels and abstract scenes

| Material | Files | What it is |
|---|---|---|
| [Lissajous Curve](lissajous/README.md) | `lissajous.frag`, `lissajous_audio.frag` | A neon Lissajous figure that swells, tilts and morphs. |
| [Stargate Slit Scan](stargate_slitscan/README.md) | `stargate_slitscan.frag`, `stargate_slitscan_audio.frag` | Streaks of coloured light rushing out of a bright slit, in the style of the Stargate sequence in 2001: A Space Odyssey. |
| [Time Vortex](time_vortex/README.md) | `time_vortex.frag`, `time_vortex_audio.frag` | A smoky, fibrous tunnel of gold and blue light with a bright opening at the centre. |
| [Smoke Tunnel](smoke_tunnel/README.md) | `smoke_tunnel.frag`, `smoke_tunnel_audio.frag` | A winding tunnel of billowing, cumulus-like smoke clouds, lit by random bursts of lightning. |
| [Waterpark Tube](waterpark_tube/README.md) | `waterpark_tube.frag`, `waterpark_tube_audio.frag` | Sliding down a twisting, translucent tube of coloured sections, marked out by neon rings. |
| [Fractal Pyramid (audio-reactive)](fractal_pyramid/README.md) | `fractal_pyramid_audio.frag` | A glowing raymarched fractal pyramid, with the folds opening and closing to the music. |
| [Bumped Warp](bumped_warp/README.md) | `bumped_warp.frag`, `bumped_warp_audio.frag` | A shiny, warping, bump-mapped surface lit by a circling light, with holes that open in the pits of the bumps. |

### Fractals and mathematics

| Material | Files | What it is |
|---|---|---|
| [Mandelbrot Set](mandelbrot/README.md) | `mandelbrot.frag`, `mandelbrot_audio.frag` | The Mandelbrot set in glowing, rippling colour, with six places to dive into and a morph to a Julia set. |
| [Sierpinski Triangle](sierpinski/README.md) | `sierpinski.frag`, `sierpinski_audio.frag` | Neon-outlined Sierpinski triangle that dives into itself forever. |
| [Romanesco](romanesco/README.md) | `romanesco.frag`, `romanesco_audio.frag` | A lit, three-dimensional-looking head of romanesco: spiral florets made of smaller spiral florets. |
| [Game of Life](life/README.md) | `life.frag`, `life_audio.frag` | Conway's Game of Life: Gosper glider guns firing endless streams of gliders. |

### Vapourwave

| Material | Files | What it is |
|---|---|---|
| [Vapor Sun](vapor_sun/README.md) | `vapor_sun.frag`, `vapor_sun_audio.frag` | The retro sunset: a striped gradient sun over a calm, reflective sea, under a pink and violet sky. |
| [Vapor Grid](vapor_grid/README.md) | `vapor_grid.frag`, `vapor_grid_audio.frag` | A neon grid floor racing towards the horizon, with wireframe mountains. |
| [Vapor Shapes](vapor_shapes/README.md) | `vapor_shapes.frag`, `vapor_shapes_audio.frag` | Tumbling neon wireframe cubes, octahedra and pyramids, with VHS-style pink and cyan ghosting. |
| [Vapor Palms](vapor_palms/README.md) | `vapor_palms.frag`, `vapor_palms_audio.frag` | Palm tree silhouettes with a neon pink and cyan rim light, swaying in the breeze. |
| [Vapor VHS](vapor_vhs/README.md) | `vapor_vhs.frag`, `vapor_vhs_audio.frag` | A VHS glitch overlay: scanlines, a rolling tracking band, snow, glitch bars and colour fringing. |
| [Vapor Checker](vapor_checker/README.md) | `vapor_checker.frag`, `vapor_checker_audio.frag` | A pink and teal checkerboard floor that ripples like cloth and fades into a pink haze. |

### Noise music

| Material | Files | What it is |
|---|---|---|
| [Noise Shards](noise_shards/README.md) | `noise_shards.frag`, `noise_shards_audio.frag` | A screen that shatters into hard-edged shards which flip between light and dark and re-form without warning. |
| [Noise Spikes](noise_spikes/README.md) | `noise_spikes.frag`, `noise_spikes_audio.frag` | Jagged seismograph traces with sudden bursts of huge spikes, scrolling past like a chart recorder. |
| [Noise Slabs](noise_slabs/README.md) | `noise_slabs.frag`, `noise_slabs_audio.frag` | Brutalist slabs of white, red, acid green and blue that flash independently and re-cut the whole screen without warning. |
| [Noise Saw](noise_saw/README.md) | `noise_saw.frag`, `noise_saw_audio.frag` | Concentric buzzsaw rings that spin, drop out, and suddenly change size and tooth count. |
| [Noise Scribble](noise_scribble/README.md) | `noise_scribble.frag`, `noise_scribble_audio.frag` | Thin vector scribbles that slash across the screen and re-draw themselves without warning, with bright flares at the corners. |
| [Noise Fissure](noise_fissure/README.md) | `noise_fissure.frag`, `noise_fissure_audio.frag` | A network of jagged cracks that tears open across a black screen and re-forms somewhere else. |

## Tools

- [Shadertoy to VS2 Material converter](tools/shadertoy-converter/README.md): a single web page that converts a Shadertoy shader into a plain and an audio-reactive Material. Paste or upload the code, choose which numbers in it become knobs, set how bass, mids and highs move them, and download the `.frag` files. Shaders keep their original credit and licence, which you must follow.
- [SVG to VS2 Material converter](tools/svg-converter/README.md): a single web page that turns an SVG drawing into a plain and an audio-reactive Material. Paste or upload an SVG, set the knobs, choose how bass, mids and highs affect the image, preview it and download the `.frag` files. It runs entirely in the browser, so it can be hosted anywhere as a static page.

## The website

`index.html` at the top of the repository is a front page for the whole project: it introduces the Materials and the tools and links to both converters. Everything is static, so you can host the repository as a website (for example with GitHub Pages) and the front page and both tools work as they are. The page and the two tools share a dark look and a footer.

## Using a Material in VS2

1. Open VS2's Material Editor (see the "Material Editor: making your own shaders" section of the [VS2 user manual](https://help.imaginando.pt/en/article/vs-2-visual-synthesizer-user-manual-su8wyw/)) and create a new shader Material.
2. Paste in the whole contents of a `.frag` file, or import the file if your version of VS2 offers that. The file starts with a comment block of JSON (the manifest) that names the knobs; VS2 needs it.
3. Use the Material on a Layer. The knobs appear in the Mixer in the same order as in each Material's parameter table.

VS2 Materials are GLSL fragment shaders that look like ISF but are not compatible with it, so ISF shaders will not run unchanged (and these will not run in ISF hosts).

## Plain and audio-reactive versions

- `name.frag` is the plain version.
- `name_audio.frag` is the audio-reactive version. It averages the FFT texture over three frequency bands (bass, mids, highs), scales them by the `react` knob, and uses them to drive the picture.

VS2 gives each Material seven knobs, and all of the plain versions use all seven. To make room for `react`, each audio version turns one knob into a constant at the top of the file, named like `TRAIL_BASE`. Each Material's README says which, and what the constant does.

### Audio setup

For the audio versions to react, VS2 has to be sending them audio. Per the VS2 manual, set the audio Source in the Layer Properties input section, and adjust its Gain; the Spectrum Speed setting smooths how quickly the spectrum rises and falls, which is useful for taming flicker. Check the manual for your version of VS2. If an audio version does not react, check this first.

The audio versions read `fftTex`, the FFT texture that VS2 provides to Materials. Each of the three bands (bass, mids, highs) is a range of frequencies **in Hz**, set by the constants `BASS_HZ`, `MID_HZ` and `HIGH_HZ` near the top of each audio file. The defaults are 40 to 150 Hz, 250 to 2,000 Hz and 4,000 to 12,000 Hz.

**How Hz becomes a place on the texture.** VS2 does not document how frequencies are laid out across the FFT texture, so the audio versions make an assumption, written as three more constants: `FFT_MIN_HZ` (the frequency at the left edge, 20), `FFT_MAX_HZ` (the right edge, 20,000) and `FFT_LOG` (1.0 if the frequencies are spaced logarithmically, 0.0 if evenly). The assumption is based on the FFT debug Material marking bass, mids and highs near the left, middle and right of the texture, which fits a logarithmic layout. It has not been confirmed.

**Checking it against your own VS2.** If a band seems to react to the wrong part of the music, calibrate the assumption with a tone generator and an FFT debug Material that shows the spectrum with a grid every 0.1 across:

1. Play a steady sine tone at 100 Hz, then 1,000 Hz, then 10,000 Hz, and note where along the texture (0 to 1) the peak appears.
2. Compare with this table:

| Tone | Logarithmic, 20 to 20,000 Hz (the default) | Even, 20 to 20,000 Hz | Even, 0 to 22,050 Hz |
|---|---|---|---|
| 100 Hz | about 0.23 | about 0.004 | about 0.005 |
| 1,000 Hz | about 0.57 | about 0.05 | about 0.045 |
| 10,000 Hz | about 0.90 | about 0.50 | about 0.45 |

3. Set `FFT_MIN_HZ`, `FFT_MAX_HZ` and `FFT_LOG` in each audio file (or, in the SVG converter, the "Texture" boxes) to whichever row matches. The Hz constants then mean what they say.

## Conventions

The Materials follow a set of conventions so that a knob controller can keep the same mappings from one Material to the next.

**Knob slots.** Where it makes sense, the knobs are in the same order in every Material:

| Slot | Usually |
|---|---|
| 1 | `zoom`: size or distance |
| 2 | `angle`: rotation of the picture in degrees (not a speed) |
| 3 | A size or amount (often `width`) |
| 4 | A second size or amount (often `height`) |
| 5 | Something specific to that Material (`react` in the audio versions) |
| 6 | `glow` |
| 7 | `rainbow`: colour |

Some Materials swap slots 1 to 4 for knobs that suit them better (the Waterpark Tube has ring spacing and thickness where zoom and angle would be; the Smoke Tunnel has complexity, chaos and lightning). The README of each Material has the exact table.

**Rainbow.** `rainbow` at 0 keeps only the Layer's colour, so the Material takes on whatever colour the Layer is set to. At 1 it uses its own palette. Most Materials default to 1.

**Transparency.** Most of these Materials treat black as transparent (the alpha is taken from the brightness), so they layer well: put a grid over a sun, a VHS overlay over everything. The exception is the Vapor Palms, whose silhouettes are opaque on purpose.

**Speed.** Every Material moves with `time * SPEED_SCALE`. `SPEED_SCALE` is set to 8 in every file, and VS2's Speed knob still scales on top of it. Edit that constant at the top of a file to make a Material faster or slower overall.

**Angle is an angle.** `angle` sets the picture's orientation in degrees, from -180 to 180. It is not a spin speed, so modulating it moves smoothly instead of jumping. For constant spin, put an LFO on it.

**Speed knobs that jump.** A few knobs are a speed or a count (`rate` in Game of Life, `rotSpeed` in the Fractal Pyramid, `section` in the Waterpark Tube). Because a Material has no memory of its previous frame, changing these while the Material runs can make the picture jump. They are fine to set by hand but poor to modulate quickly.

## Performance

None of these were written for a particular GPU, but the cost varies a lot.

- **Heaviest:** Fractal Pyramid (a 64-step ray march), Romanesco, Time Vortex, Smoke Tunnel, Vapor Palms and Vapor Shapes. Each README says what to reduce first.
- **Moderate:** Noise Scribble and Noise Shards.
- **Light:** the other Vapor Materials, Stargate, Sierpinski, Game of Life, Lissajous and the other Noise Materials.

If a Material is slow, test it at a lower output resolution first.

## Photosensitivity

The Noise music Materials are designed to flash, cut and change suddenly, and several other Materials strobe or flicker when driven hard by music. Do not use them for audiences that might include people with photosensitive epilepsy without a warning. Each of those Materials has a `rate` knob or constants that slow the changes down.

## Status

- Every file passes a syntax check with the glslang validator (GLSL 3.30), using stand-ins for the variables VS2 provides (`time`, `resolution`, `texCoord`, `color`, `alpha`, `fftTex`, `fragColor` and the knobs).
- The Game of Life engine was checked cell for cell against a brute-force simulation of Conway's Game of Life.
- Shaders made with the converter tools have been tried in VS2 and work.
- **The hand-built Materials have not all been tested visually in VS2.** Treat the colours, proportions and audio levels as a starting point and expect to tune them. Issues and suggestions are welcome.

## Licence and credits

This repository is released under the **MIT Licence** (see the `LICENSE` file): you may use, change and share it, including commercially, as long as the licence notice stays with it.

- The Materials are by The Winterval Conspiracy (Simon Gray), except where noted.
- **Fractal Pyramid** and **Bumped Warp** are adapted from other people's Shadertoy shaders, and the links to the originals are kept in their manifests. The audio reactions, the extra knobs and the reorganised code in them are new.
- **Shaders converted with the Shadertoy converter stay under their own licences** (Shadertoy's default is CC BY-NC-SA 3.0, which is not the same as MIT), and the converted files carry the credit.

## Repository layout

```
index.html                 the project's front page (it links to both tools)
LICENSE                    the MIT Licence
README.md                  this file
<material>/
    README.md              description, parameters, constants
    <material>.frag        plain version
    <material>_audio.frag  audio-reactive version
tools/
    svg-converter/
        index.html         the SVG converter page (host this)
        README.md          how to use and host it
    shadertoy-converter/
        index.html         the Shadertoy converter page (host this)
        README.md          how to use and host it
```

Fractal Pyramid has only an audio-reactive version, because its original is not part of this repository.

## Adding a new Material

Each new Material in this project gets:

1. A plain `.frag` and an audio-reactive `_audio.frag`.
2. Its own folder with a `README.md` like the others.
3. The knob slot conventions above, `angle` in degrees, and `SPEED_SCALE = 8`.
4. A fresh UUID in its manifest, and the author name "The Winterval Conspiracy".
5. A syntax check before it is added.
