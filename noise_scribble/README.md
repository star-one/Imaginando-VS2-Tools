# Noise Scribble

*Thin vector scribbles that slash across the screen and re-draw themselves without warning, with bright flares at the corners.*

## What it does

Up to four pens each draw a jagged path through random points on or just beyond the screen, as thin hard lines with bright
flares at the corners. Each pen re-rolls its whole path at its own irregular moments, trembles in between, and drops out and
returns at random. It looks like an oscilloscope losing its mind.

It is built from lines, not per-pixel randomness, so it does not look like TV static.

## Files

- `noise_scribble.frag`: the plain version: every knob is yours
- `noise_scribble_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 2 | 1 | How far the paths spread. At 1 they reach a little beyond the screen edges. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `points` | 3 to 12 | 7 | How many corners each path has (3 to 12). |
| 4 | `jitter` | 0 to 1 | 0.3 | How much the corners tremble. |
| 5 | `pens` | 1 to 5 | 3 | How many separate scribbles there are (1 to 4). The very top of the knob counts as 4. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each pen from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 2 | 1 | How far the paths spread. At 1 they reach a little beyond the screen edges. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `points` | 3 to 12 | 7 | How many corners each path has (3 to 12). |
| 4 | `jitter` | 0 to 1 | 0.3 | How much the corners tremble. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each pen from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `pens` is now the constant `PENS_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** every pen re-rolls its path whenever the bass level crosses a quarter of full scale, and the glow lifts.
- **Mids:** the corners tremble much more.
- **Highs:** the flares at the corners flare up bright.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float jitterEff = clamp(jitter + 0.6 * midLv, 0.0, 1.5);
        float tick = tickId(tm * EVENT_RATE * (1.0 + 0.37 * fq)) + floor(bassLv * 4.0) * 7.0;
        col += pc * (line + halo + flare * (0.6 + 2.0 * highLv)) * on;
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `EVENT_RATE` | `0.5` | both | How often the pens re-roll their paths. |
| `TH` | `0.003` | both | Half-width of the lines, in screen heights. |
| `PENS_BASE` | `3` | audio only | How many pens the audio version draws (the plain version has the `pens` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `* 1.3 * spread;`: how far beyond the screen edges the corners can land (`1.3` is 30 percent beyond).
- `exp(-length(p - prev) / 0.012)`: the size of the flares at the corners: raise `0.012` for bigger flares.

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- Moderate cost: up to 44 line-distance tests per pixel with four pens and twelve points.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
