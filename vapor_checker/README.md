# Vapor Checker

*A pink and teal checkerboard floor that ripples like cloth and fades into a pink haze.*

## What it does

A checkerboard floor running to the horizon, in pink and teal tiles with neon seams between them, a glossy sheen down the middle
and a pink haze at the horizon. The floor can ripple like cloth in the wind. The tiles blur to their average colour near the
horizon, where they would otherwise shimmer.

## Files

- `vapor_checker.frag`: the plain version: every knob is yours
- `vapor_checker_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 3 | 1 | Tile size. |
| 2 | `angle` | -180 to 180 | 0 | Tilts the whole picture, in degrees. |
| 3 | `width` | 0.5 to 3 | 1 | Width of the tiles relative to their length. |
| 4 | `height` | -0.4 to 0.4 | -0.05 | Moves the horizon up and down the screen. |
| 5 | `warp` | 0 to 1 | 0.3 | How much the floor ripples. 0 is flat. |
| 6 | `glow` | 0 to 1 | 0.35 | Seam glow, sheen and the glow above the horizon. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the pink and teal. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 3 | 1 | Tile size. |
| 2 | `angle` | -180 to 180 | 0 | Tilts the whole picture, in degrees. |
| 3 | `width` | 0.5 to 3 | 1 | Width of the tiles relative to their length. |
| 4 | `height` | -0.4 to 0.4 | -0.05 | Moves the horizon up and down the screen. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Seam glow, sheen and the glow above the horizon. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the pink and teal. |

**Compared with the plain version:**

- `warp` is now the constant `WARP_BASE`, and the bass adds to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the floor ripples harder and the glow lifts.
- **Mids:** the tiles pulse in size by up to 15 percent.
- **Highs:** the neon seams brighten.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float warpEff = WARP_BASE + 0.9 * bassLv;
        float S = max(zoom * (1.0 + 0.15 * midLv), 0.05);                 // tile size
        col += (floorCol + seamCol * seam * (1.0 + 2.0 * highLv)) * fadeIn;
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `WARP_BASE` | `0.3` | audio only | Resting ripple amount for the audio version, since it has no `warp` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `vec3 tileA = PINK;`: the first tile colour. Change it to any `vec3(red, green, blue)` from 0 to 1.
- `vec3 tileB = CYAN * 0.55;`: the second tile colour.

## Tips and notes

- Very light on the GPU.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
