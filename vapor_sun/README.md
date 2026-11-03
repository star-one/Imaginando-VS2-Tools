# Vapor Sun

*The retro sunset: a striped gradient sun over a calm, reflective sea, under a pink and violet sky.*

## What it does

A gradient sun, yellow at the top fading to hot pink at the bottom, with slits cut across its lower half. It sits over a horizon
with a pink-to-violet sky, twinkling stars and a thin cyan horizon line, and rippling water that reflects it. The slits scroll
slowly. Set `sky` to 0 and the sky and water vanish, leaving a sun on a transparent layer.

## Files

- `vapor_sun.frag`: the plain version: every knob is yours
- `vapor_sun_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 2 | 1 | Size of the sun. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole scene, in degrees. |
| 3 | `sky` | 0 to 1 | 0.7 | How much of the sky gradient and water to show. 0 leaves only the sun, stars and reflection on a transparent background. |
| 4 | `height` | -1 to 1 | 0.5 | Where the sun sits, in sun radii above the horizon: 1 sits fully above, 0 is half set, -1 is fully sunk. |
| 5 | `slits` | 3 to 16 | 9 | Number of slits cut into the sun. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the sun and along the horizon. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the full sunset colours. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 2 | 1 | Size of the sun. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole scene, in degrees. |
| 3 | `sky` | 0 to 1 | 0.7 | How much of the sky gradient and water to show. 0 leaves only the sun, stars and reflection on a transparent background. |
| 4 | `height` | -1 to 1 | 0.5 | Where the sun sits, in sun radii above the horizon: 1 sits fully above, 0 is half set, -1 is fully sunk. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the sun and along the horizon. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the full sunset colours. |

**Compared with the plain version:**

- `slits` is now the constant `SLITS_BASE`, and the mids add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the sun swells by up to an eighth and the glow lifts.
- **Mids:** more slits are cut into the sun.
- **Highs:** more stars appear in the sky.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float slitsEff = SLITS_BASE + 3.0 * midLv;
    float R = 0.25 * zoom * (1.0 + 0.12 * bassLv);
    float starOn = step(0.97 - 0.03 * highLv, hash(sc + 3.3));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `HORIZON` | `-0.08` | both | Height of the horizon on screen, where screen height is 1 and the centre is 0. Negative is below the middle. |
| `SLITS_BASE` | `9.0` | audio only | Resting number of slits for the audio version, since it has no `slits` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float R = 0.25 * zoom;`: the sun's radius at zoom 1, in screen heights.
- `float starOn = step(0.97, hash(sc + 3.3));`: how many stars there are: lower `0.97` for more, raise it for fewer.

## Tips and notes

- Very light on the GPU.
- Works well as the bottom layer, with the grid, palms and VHS Materials above it.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
