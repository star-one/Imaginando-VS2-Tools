# Noise Saw

*Concentric buzzsaw rings that spin, drop out, and suddenly change size and tooth count.*

## What it does

Up to six toothed rings, each a saw blade whose teeth ramp up slowly and drop away suddenly. The blades spin at different speeds
and directions, drop out and return at irregular moments, and every so often jump to new radii and tooth counts all at once.
It looks like a grinder: mechanical, abrasive and unstable.

## Files

- `noise_saw.frag`: the plain version: every knob is yours
- `noise_saw_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Size of the whole thing: bigger zoom gives larger saws. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `teeth` | 0.3 to 3 | 1 | Multiplies the number of teeth on every saw (each has between 5 and 36 before this). |
| 4 | `height` | 0.01 to 0.15 | 0.05 | Height of each tooth, in screen heights. |
| 5 | `rings` | 1 to 7 | 4 | How many saws there are (1 to 6). The very top of the knob counts as 6. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each saw from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Size of the whole thing: bigger zoom gives larger saws. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `teeth` | 0.3 to 3 | 1 | Multiplies the number of teeth on every saw (each has between 5 and 36 before this). |
| 4 | `height` | 0.01 to 0.15 | 0.05 | Height of each tooth, in screen heights. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each saw from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `rings` is now the constant `RINGS_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the saws jump to new sizes and tooth counts whenever the bass level crosses a third of full scale, the teeth grow up to 80 percent taller, and the glow lifts.
- **Mids:** the saws wobble in and out in radius.
- **Highs:** the saws drop out much more often, so bright noise makes them strobe.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float ev = mod(floor(t) + 31.0 * floor(t * 1.618 + 0.37) + 977.0 * floor(t * 0.382 + 0.11) + floor(bassLv * 3.0) * 11.0, 4096.0);
    float toothH = height * (1.0 + 0.8 * bassLv);
        float R = 0.07 + fk * 0.075 + (hk - 0.5) * 0.04 + midLv * 0.03 * sin(tm * 4.0 + fk * 2.0);
        float on = step(0.15 + 0.5 * highLv, hash(vec2(tickId(tm * 0.7 + fk * 1.9), fk)));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `SPIN` | `0.15` | both | How fast the saws spin. |
| `EVENT_RATE` | `0.5` | both | How often the saws jump to new sizes and tooth counts. |
| `TH` | `0.006` | both | Half-thickness of the saw lines, in screen heights. |
| `RINGS_BASE` | `4` | audio only | How many saws the audio version draws (the plain version has the `rings` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float N = max(floor(mix(5.0, 36.0, h2) * teeth), 3.0);`: the range of tooth counts. The result must stay a whole number or the teeth will not meet at the seam.
- `float R = 0.07 + fk * 0.075 + (hk - 0.5) * 0.04;`: the radius of each saw: the first is `0.07` and each next is `0.075` further out.

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- Light on the GPU: a few tests per saw per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
