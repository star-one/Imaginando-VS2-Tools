# Time Vortex

*A smoky, fibrous tunnel of gold and blue light with a bright opening at the centre.*

## What it does

A tunnel of wispy, turbulent fibres of light streams towards the viewer, with a bright opening in the middle. The fibres spiral
slowly around the axis, and the colours drift between deep blue, cyan, gold and cream. It was inspired by the time vortex in the
Tom Baker era opening titles of Doctor Who; it is an impression of that look rather than a copy.

## Files

- `time_vortex.frag`: the plain version: every knob is yours
- `time_vortex_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole vortex, in degrees. |
| 3 | `width` | 0 to 1 | 0.5 | Fibre thickness: fewer, broader fibres when high; fine wisps when low. |
| 4 | `height` | 0 to 1 | 0.3 | Size of the bright opening at the centre. |
| 5 | `twist` | -1 to 1 | 0.15 | How much the fibres spiral around the axis. Signed: the middle of the knob is a gentle swirl, 0 is straight, and negative values spiral the other way. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the centre plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the blue and gold vortex palette. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole vortex, in degrees. |
| 3 | `width` | 0 to 1 | 0.5 | Fibre thickness: fewer, broader fibres when high; fine wisps when low. |
| 4 | `height` | 0 to 1 | 0.3 | Size of the bright opening at the centre. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the centre plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the blue and gold vortex palette. |

**Compared with the plain version:**

- `twist` is now the constant `TWIST_BASE`, and the mids add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the camera punches in, the centre opening widens and the glow lifts.
- **Mids:** the fibres spiral more.
- **Highs:** the brightness flickers and the palette shifts.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float twistEff = TWIST_BASE + 0.6 * midLv;
    p /= zoom * (1.0 + 0.2 * bassLv);
    float c0 = 0.01 + (height + 0.5 * bassLv) * 0.08;
    float bodyI = body * fade * vig * (0.7 + 0.6 * glowEff) * (1.0 + 0.8 * highLv);
    vec3 bodyCol = mix(vec3(1.0), vortexPalette(n2 * 0.6 + v * 0.03 + tm * 0.02 + highLv * 0.15), rainbow);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `TWIST_BASE` | `0.15` | audio only | Resting spiral of the fibres for the audio version, since it has no `twist` knob. Signed: 0 is straight. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float fa = mix(10.0, 1.5, width);`: the range of the fibre count around the tunnel: `10.0` for the finest and `1.5` for the broadest.
- `float c0 = 0.01 + height * 0.08;`: the size range of the centre opening.

## Tips and notes

- One of the heavier Materials: each pixel samples several layers of 3D noise. If it runs slowly, test it at a lower output resolution first.
- Detail fades out near the centre on purpose, to stop it shimmering.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
