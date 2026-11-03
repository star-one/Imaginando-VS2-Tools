# Vapor VHS

*A VHS glitch overlay: scanlines, a rolling tracking band, snow, glitch bars and colour fringing.*

## What it does

An overlay that looks like a worn videotape: faint scanlines, a noisy tracking band that rolls up the screen, a sprinkling of
snow, flashing pink and cyan glitch bars with glowing edges, and a hint of colour fringing at the left and right edges. It is
mostly transparent, so it works on a layer above the other vapourwave Materials.

## Files

- `vapor_vhs.frag`: the plain version: every knob is yours
- `vapor_vhs_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.5 to 3 | 1 | Size of the scanlines, snow and streaks. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole overlay, in degrees. At 90 degrees the glitching runs vertically. |
| 3 | `tracking` | 0 to 1 | 0.5 | Strength and height of the rolling tracking band. |
| 4 | `glitch` | 0 to 1 | 0.4 | How often the glitch bars appear. |
| 5 | `snow` | 0 to 1 | 0.3 | How much snow there is. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the glitch bars and colour fringing at the edges. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the pink and cyan. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.5 to 3 | 1 | Size of the scanlines, snow and streaks. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole overlay, in degrees. At 90 degrees the glitching runs vertically. |
| 3 | `tracking` | 0 to 1 | 0.5 | Strength and height of the rolling tracking band. |
| 4 | `glitch` | 0 to 1 | 0.4 | How often the glitch bars appear. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the glitch bars and colour fringing at the edges. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (greyscale); 1 gives the pink and cyan. |

**Compared with the plain version:**

- `snow` is now the constant `SNOW_BASE`, and the highs add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** more glitch bars appear, and the glow lifts.
- **Mids:** the tracking band gets stronger.
- **Highs:** the snow gets thicker.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float snowEff = clamp(SNOW_BASE + 0.7 * highLv, 0.0, 1.0);
    float glitchEff = clamp(glitch + 0.6 * bassLv, 0.0, 1.0);
    float trackingEff = clamp(tracking + 0.4 * midLv, 0.0, 1.0);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `SCAN` | `0.12` | both | How strong the faint scanlines are. 0 removes them. |
| `SNOW_BASE` | `0.3` | audio only | Resting amount of snow for the audio version, since it has no `snow` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float gc = floor(tm * 6.0);`: how often the glitch bars change: the `6.0` is changes per second.

## Tips and notes

- Very light on the GPU.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
