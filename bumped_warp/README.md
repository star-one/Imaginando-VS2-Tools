# Bumped Warp

*A shiny, warping, bump-mapped surface lit by a circling light, with holes that open in the pits of the bumps.*

## What it does

A pattern of swirling sinusoidal waves is treated as a bumpy surface and lit by a light that circles above it, with soft
diffuse lighting, sharp highlights and a bluish reflection. The colour comes from the Layer colour mixed with the warp pattern
itself (steel blue by default).

The seventh knob, `holes`, cuts away the pits of the bumps, so the layer underneath shows through them. At 0 there are no holes
and the picture is as the original Material was. As the knob goes up the holes grow, until only the tops of the bumps are left.

## Files

- `bumped_warp.frag`: the plain version: every knob is yours
- `bumped_warp_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `warpSpeed` | 0 to 1 | 0.5 | How fast the warp moves. The knob maps to a speed of 0.1 to 2.1, before `SPEED_SCALE`. |
| 2 | `warpFreq` | 0 to 1 | 0.5 | How many bumps there are: 0 is few and large, 1 is many and small (a frequency of 2 to 6). |
| 3 | `warpAmp` | 0 to 1 | 0.5 | How strongly the pattern is warped and swirled (0.2 to 1.0). |
| 4 | `bumpStrength` | 0 to 1 | 0.5 | How steep the bumps look when lit, from shallow to deep. |
| 5 | `lightSpeed` | 0 to 1 | 0.5 | How fast the light circles above the surface (0.2 to 2.2). |
| 6 | `specular` | 0 to 1 | 0.5 | How tight the shiny highlights are: higher is smaller and sharper. |
| 7 | `holes` | 0 to 1 | 0 | 0 is no holes. Raising it cuts away the pits of the bumps, letting the layer below show through; higher makes the holes bigger. |

- The knobs keep the order of the original Material, with `holes` as the seventh. Unlike most of this project there are no `zoom` or `angle` knobs.

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `warpSpeed` | 0 to 1 | 0.5 | How fast the warp moves. The knob maps to a speed of 0.1 to 2.1, before `SPEED_SCALE`. |
| 2 | `warpFreq` | 0 to 1 | 0.5 | How many bumps there are: 0 is few and large, 1 is many and small (a frequency of 2 to 6). |
| 3 | `warpAmp` | 0 to 1 | 0.5 | How strongly the pattern is warped and swirled (0.2 to 1.0). |
| 4 | `bumpStrength` | 0 to 1 | 0.5 | How steep the bumps look when lit, from shallow to deep. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `specular` | 0 to 1 | 0.5 | How tight the shiny highlights are: higher is smaller and sharper. |
| 7 | `holes` | 0 to 1 | 0 | 0 is no holes. Raising it cuts away the pits of the bumps, letting the layer below show through; higher makes the holes bigger. |

**Compared with the plain version:**

- `lightSpeed` is now the constant `LIGHT_SPEED_BASE`, written as a knob position from 0 to 1 (0.5 matches the plain default).

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the bumps look up to two and a half times steeper, and the holes open wider on every beat (even when `holes` is at 0).
- **Mids:** the warp gets stronger, so the pattern swirls harder.
- **Highs:** the shiny highlights get up to three times brighter.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    amp = 0.2 + clamp(warpAmp + 0.3 * midLv, 0.0, 1.0) * 0.8;
    bumpFactor = 0.01 + bumpStrength * 0.15 * (1.0 + 1.5 * bassLv);
    vec3 col = (texCol * (diff * vec3(1.0, 0.97, 0.92) * 2.0 + 0.5) + vec3(1.0, 0.6, 0.2) * spec * (2.0 + 4.0 * highLv)) * atten;
    float holeThr = clamp(holes + 0.3 * bassLv, 0.0, 1.0) * HOLE_MAX;
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `HOLE_MAX` | `0.8` | both | The biggest hole size: the surface height below which a pit is cut away when `holes` is at maximum. Raise it for bigger holes at the same setting. |
| `HOLE_SOFT` | `0.04` | both | How soft the edge of a hole is, in surface height. Smaller is sharper. |
| `LIGHT_SPEED_BASE` | `0.5` | audio only | Resting light speed in the audio version, as a knob position from 0 to 1 (the plain version has the `lightSpeed` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `speed = 0.1 + warpSpeed * 2.0;`: the range of the warp speed.
- `freq = 2.0 + warpFreq * 4.0;`: the range of the bump frequency.
- `amp = 0.2 + warpAmp * 0.8;`: the range of the warp strength.
- `specPow = 4.0 + specular * 24.0;`: the range of the highlight tightness.

## Tips and notes

- The holes are transparent, so the layer below shows through them. The rest of the surface keeps the original behaviour, where darker parts are already slightly see-through.
- At the standard `SPEED_SCALE` of 8 the warp and the light run much faster than in the original at the same Speed setting. Lower `SPEED_SCALE` for calmer motion.
- The warp function is worked out four times per pixel (once for the height, twice for the slopes and once for the colour), so this is a moderate cost.

## Credits

Adapted from the Shadertoy shader linked in the manifest (https://www.shadertoy.com/view/ldSGWh).
The holes, the audio reaction and the reorganised code are new, and are released under this repository's MIT licence.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
