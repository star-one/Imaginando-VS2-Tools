# Noise Shards

*A screen that shatters into hard-edged shards which flip between light and dark and re-form without warning.*

## What it does

The picture is cut into flat-coloured shards (a Voronoi pattern) separated by bright cracks. Each shard is lit or dark, and flips
at its own irregular moments. Every so often the whole pattern is re-rolled at once, so the shards jump into a new arrangement
with no transition. The corners tremble slightly the whole time. Made for Noise Music: harsh, jagged and sudden, with no steady beat.

It is built from large hard-edged shapes, not per-pixel randomness, so it does not look like TV static.

## Files

- `noise_shards.frag`: the plain version: every knob is yours
- `noise_shards_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Shard size: bigger zoom gives fewer, larger shards (about 6 across the screen height at zoom 1). |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `cracks` | 0.002 to 0.04 | 0.012 | Width of the bright cracks between the shards, in screen heights. |
| 4 | `fill` | 0 to 1 | 0.6 | What share of the shards are lit; the rest are dark. |
| 5 | `rate` | 0 to 2 | 0.5 | How often the layout re-rolls and the shards flip. 0 freezes the layout. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spreading out from the cracks. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white or Layer-coloured shards); 1 picks each shard's colour from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Shard size: bigger zoom gives fewer, larger shards (about 6 across the screen height at zoom 1). |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `cracks` | 0.002 to 0.04 | 0.012 | Width of the bright cracks between the shards, in screen heights. |
| 4 | `fill` | 0 to 1 | 0.6 | What share of the shards are lit; the rest are dark. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spreading out from the cracks. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white or Layer-coloured shards); 1 picks each shard's colour from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `rate` is now the constant `RATE_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the whole layout re-rolls whenever the bass level crosses a quarter of full scale, so heavy hits cut to new arrangements. The cracks also widen by up to two and a half times, and the glow lifts.
- **Mids:** more shards are lit.
- **Highs:** many more shards flip, so loud high-frequency noise makes the shards flicker wildly.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float fillEff = clamp(fill + 0.3 * midLv, 0.0, 1.0);
    float cracksEff = cracks * (1.0 + 1.5 * bassLv);
    float lay = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6) + floor(bassLv * 4.0) * 23.0, 512.0);
    float flip = step(0.8 - 0.5 * highLv, hash(vec2(ft, hs * 91.0)));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `TREMOR` | `0.02` | both | How much the corners of the shards tremble, in shard sizes. 0 holds them still. |
| `RATE_BASE` | `0.5` | audio only | How often the layout re-rolls and shards flip in the audio version (the plain version has the `rate` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float cells = 6.0 / zoom;`: the number of shards across the screen height at zoom 1. Raise `6.0` for more, smaller shards.
- `float flip = step(0.8, hash(vec2(ft, hs * 91.0)));`: how often a shard flips: lower `0.8` for more flips (it is about a one in five chance at 0.8).
- `float ft = tickId(t * 3.0 + hs * 7.0);`: how fast the shards' flip clock runs (the `3.0`).

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- Light on the GPU: nine shard centres are tested per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
