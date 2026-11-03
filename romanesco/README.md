# Romanesco

*A lit, three-dimensional-looking head of romanesco: spiral florets made of smaller spiral florets.*

## What it does

Romanesco is a natural fractal: spiral cones made of smaller spiral cones. This Material builds a head of golden-angle spirals
of florets, puts a smaller spiral inside every floret, and does that again, then lights the result as a bumpy surface, with a
light that slowly circles the head. The default is a green palette that drifts towards yellow and cyan.

## Files

- `romanesco.frag`: the plain version: every knob is yours
- `romanesco_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 4 | 0.5 | At the default, the whole head. At about 2 and above, the view dives endlessly into the centre floret and loops seamlessly. In between the dive restarts with a small jump each loop. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the head, in degrees. |
| 3 | `florets` | 13 to 55 | 34 | How many florets per head. 34 (the default) is a Fibonacci number, which looks most natural. |
| 4 | `depth` | 0 to 1 | 0.6 | How strong the florets-on-florets are: 0 is plain cones. |
| 5 | `relief` | 0 to 1 | 0.6 | How pointed the cones look, from soft to sharp. |
| 6 | `glow` | 0 to 1 | 0.35 | Soft inner glow plus an aura around the head. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the romanesco green palette. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 4 | 0.5 | At the default, the whole head. At about 2 and above, the view dives endlessly into the centre floret and loops seamlessly. In between the dive restarts with a small jump each loop. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the head, in degrees. |
| 3 | `florets` | 13 to 55 | 34 | How many florets per head. 34 (the default) is a Fibonacci number, which looks most natural. |
| 4 | `depth` | 0 to 1 | 0.6 | How strong the florets-on-florets are: 0 is plain cones. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Soft inner glow plus an aura around the head. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the romanesco green palette. |

**Compared with the plain version:**

- `relief` is now the constant `RELIEF_BASE`, and the bass adds to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the relief pumps, the glow lifts and the view punches in.
- **Mids:** the light sweeps round faster and the sub-florets strengthen.
- **Highs:** sparkling highlights, and the hue shifts.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float reliefEff = clamp(RELIEF_BASE + 0.35 * bassLv, 0.0, 1.0);
    float depthEff = clamp(depth + 0.3 * midLv, 0.0, 1.0);
    float wh = 0.58 / (zoom * (1.0 + 0.12 * bassLv));
    float tl = tm * 0.05 + 0.9 + midLv * 3.0;
    float spec = pow(max(Rf.z, 0.0), 20.0) * (0.25 + 0.6 * highLv);
    float hue = 0.2 + 0.12 * sin(tm * 0.02) + 0.04 * ao + highLv * 0.12;
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `LEVELS` | `3` | both | Levels of florets on florets. 3 gives florets, sub-florets and sub-sub-florets. Set it to 2 if the Material is too heavy for your machine. |
| `DIVE_RATE` | `0.02` | both | Speed of the endless dive when zoomed in. |
| `RELIEF_BASE` | `0.6` | audio only | Resting relief for the audio version, since it has no `relief` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float wh = 0.58 / zoom;`: the size of the view.
- `float k = smoothstep(1.2, 2.1, zoom);`: the zoom range over which the endless dive fades in.
- `float decay = mix(0.35, 0.85, depth);`: how much weaker each deeper level is.

## Tips and notes

- The heaviest of the fractal Materials: each level finds the nearest floret by testing about fifteen candidates per pixel. Reduce `LEVELS` first if it is slow.
- Changing `florets` live pops the pattern, because the number of florets changes in whole steps.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
