# Noise Spikes

*Jagged seismograph traces with sudden bursts of huge spikes, scrolling past like a chart recorder.*

## What it does

Up to six horizontal lines cross the screen, each a zigzag through random spike heights. Most spikes are small, a few are huge,
they arrive in sudden bursts, and now and then one is enormous. The traces scroll sideways, and each drops out and returns at
irregular moments. In the audio version the size of the spikes follows the spectrum of the music across the screen.

It is built from lines, not per-pixel randomness, so it does not look like TV static.

## Files

- `noise_spikes.frag`: the plain version: every knob is yours
- `noise_spikes_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Width of the zigzag steps: bigger zoom gives coarser, wider steps (it scales `width`). |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0.005 to 0.08 | 0.02 | Width of each step of the zigzag. Small is fine and frantic; large is broad and slashing. |
| 4 | `height` | 0.05 to 0.6 | 0.25 | Height of the tallest spikes, in screen heights. |
| 5 | `traces` | 1 to 7 | 4 | How many lines there are (1 to 6), spread down the screen. The very top of the knob counts as 6. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives each trace its own colour from white, blood red, acid green and electric blue. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Width of the zigzag steps: bigger zoom gives coarser, wider steps (it scales `width`). |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0.005 to 0.08 | 0.02 | Width of each step of the zigzag. Small is fine and frantic; large is broad and slashing. |
| 4 | `height` | 0.05 to 0.6 | 0.25 | Height of the tallest spikes, in screen heights. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives each trace its own colour from white, blood red, acid green and electric blue. |

**Compared with the plain version:**

- `traces` is now the constant `TRACES_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Spectrum:** each spike's height is shaped by the FFT at its place on the screen, bass at the left and highs at the right as the spikes scroll past, scaled by `react`.
- **Bass:** all the spikes get up to half as tall again, and the glow lifts.
- **Mids:** the traces spread further apart.
- **Highs:** the lines get thicker.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float amp = height * (1.0 + 0.5 * bassLv);
        float base = (fk - (float(nT) - 1.0) * 0.5) * (0.8 * (1.0 + 0.5 * midLv) / float(nT));
        float line = 1.0 - smoothstep(LINE * 0.6, LINE * (1.0 + 2.0 * highLv), d);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `SCROLL` | `0.12` | both | How fast the traces scroll sideways, in screen heights per unit of time. Negative values scroll the other way. |
| `LINE` | `0.003` | both | Half-width of the lines, in screen heights. |
| `TRACES_BASE` | `3` | audio only | How many traces the audio version draws (the plain version has the `traces` knob). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float s = pow(v, 3.0);`: how lopsided the spike sizes are. A higher power gives more tiny spikes and fewer big ones; `1.0` makes them evenly random.
- `float big = 1.0 + 0.9 * step(0.96, hash(vec2(j, k + 29.0)));`: the rare enormous spikes: lower `0.96` for more of them.

## Tips and notes

- **Photosensitivity warning:** this Material flashes, cuts and changes suddenly, on purpose. Do not use it for an audience that might include people with photosensitive epilepsy without a warning, and use the rate knob (or constants) to slow it down if in doubt.
- The audio version's `envAt` function is where the spectrum shapes the spikes; the plain version returns 1 there.
- The spike heights use the whole width of the FFT texture, spread across the screen, so the Hz bands apply only to the bass, mids and highs reactions, not to the spike heights.
- Light on the GPU: a handful of line-distance tests per trace.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
