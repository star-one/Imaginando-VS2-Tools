# Noise Fissure

*A network of jagged cracks that tears open across a black screen and re-forms somewhere else.*

## What it does

Bright cracks with white-hot cores run across the screen along the contours of a warped noise field, torn into zigzags. Every so
often the whole crack network re-forms in a new place, with no transition, and in between it creeps slowly. The cracks are
coloured region by region.

The cracks are large continuous lines, not per-pixel randomness, so it does not look like TV static.

## Files

- `noise_fissure.frag`: the plain version: every knob is yours
- `noise_fissure_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Scale of the crack network: bigger zoom gives fewer, larger cracks. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0.01 to 0.2 | 0.05 | How wide the cracks are. |
| 4 | `jagged` | 0 to 1 | 0.5 | How much the lines zigzag. 0 gives smooth curves. |
| 5 | `rate` | 0 to 2 | 0.5 | How often the crack network re-forms. 0 freezes it. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spreading out from the cracks. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each region of crack from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Scale of the crack network: bigger zoom gives fewer, larger cracks. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0.01 to 0.2 | 0.05 | How wide the cracks are. |
| 4 | `jagged` | 0 to 1 | 0.5 | How much the lines zigzag. 0 gives smooth curves. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spreading out from the cracks. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each region of crack from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `rate` is now the constant `RATE_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the whole network re-forms whenever the bass level crosses a quarter of full scale, the cracks widen by up to a bit over double, and the glow lifts.
- **Mids:** the cracks get more jagged.
- **Highs:** the white-hot cores flare brighter and the crack colours change.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float jaggedEff = clamp(jagged + 0.5 * midLv, 0.0, 1.0);
    float widthEff = width * (1.0 + 1.2 * bassLv);
    float seed = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6) + floor(bassLv * 4.0) * 9.0, 512.0);
    vec3 crackCol = mix(vec3(1.0), pick(hash(vec2(floor(n * 6.0), seed + floor(highLv * 4.0)))), rainbow);
    vec3 col = crackCol * (crack * 0.8 + halo) + vec3(1.0) * core * (0.4 + 1.2 * highLv);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `RATE_BASE` | `0.5` | audio only | How often the crack network re-forms in the audio version (the plain version has the `rate` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `vec2 q = p / zoom * 3.0`: the scale of the network: raise `3.0` for more, smaller cracks.
- `q += jagged * 0.8 * w;`: how hard the zigzag warp can tear the lines: raise `0.8` for a more extreme maximum.

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- Light on the GPU: about six value-noise lookups per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
