# Noise Slabs

*Brutalist slabs of white, red, acid green and blue that flash independently and re-cut the whole screen without warning.*

## What it does

The screen is cut into rectangular slabs of every size by splitting again and again at random places. Each slab flashes on and
off at its own irregular moments, some are filled with hard stripes, and thin black gutters separate them. Every so often the
whole layout is re-cut, with no transition. Made for Noise Music: blunt, harsh and unpredictable.

It is built from large flat shapes, not per-pixel randomness, so it does not look like TV static.

## Files

- `noise_slabs.frag`: the plain version: every knob is yours
- `noise_slabs_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 1 to 4 | 1 | Repeats the layout: 1 is a single layout across the screen, 4 is a patchwork of 4 by 4 separate layouts. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `levels` | 2 to 7 | 5 | How many times the slabs are split: more gives more, smaller slabs. Some slabs are left big whatever this is set to. |
| 4 | `gutter` | 0.001 to 0.02 | 0.004 | Width of the black gutters between slabs, in screen heights. |
| 5 | `rate` | 0 to 2 | 0.5 | How often the layout is re-cut and the slabs flash. 0 freezes the layout. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow along the inner edges of the lit slabs. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each slab from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 1 to 4 | 1 | Repeats the layout: 1 is a single layout across the screen, 4 is a patchwork of 4 by 4 separate layouts. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `levels` | 2 to 7 | 5 | How many times the slabs are split: more gives more, smaller slabs. Some slabs are left big whatever this is set to. |
| 4 | `gutter` | 0.001 to 0.02 | 0.004 | Width of the black gutters between slabs, in screen heights. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow along the inner edges of the lit slabs. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each slab from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `rate` is now the constant `RATE_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the whole layout is re-cut whenever the bass level crosses a quarter of full scale, so heavy hits change the whole picture. The glow lifts.
- **Mids:** more of the slabs are lit.
- **Highs:** the slabs flash up to four times faster.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float lay = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6) + floor(bassLv * 4.0) * 29.0, 512.0)
    float flickRate = (0.5 + 3.0 * hs) * (1.0 + 3.0 * highLv);
    float on = step(ff, 0.25 + 0.6 * hs + 0.3 * midLv);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `RATE_BASE` | `0.5` | audio only | How often the layout is re-cut and the slabs flash in the audio version (the plain version has the `rate` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `if (h < 0.12 && l > 1) break;`: the chance that a slab is left unsplit at each level: raise `0.12` for more big slabs.
- `float stripeOn = step(0.7, hash(vec2(id, lay + 57.0)));`: which slabs get stripes: lower `0.7` for more striped slabs.

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- Light on the GPU: a loop of at most seven splits per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
