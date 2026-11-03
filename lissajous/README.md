# Lissajous Curve

*A neon Lissajous figure that swells, tilts and morphs.*

## What it does

A Lissajous curve is what you get when a point moves left and right at one frequency while moving up and down at another.
This Material draws one as a glowing line with a soft halo. A slow drift in the phase keeps the figure moving even when
nothing is modulating it. The `ratio` knob sets the two frequencies against each other: whole numbers give closed, symmetrical
figures, and values in between give open curves that keep drifting.

## Files

- `lissajous.frag`: the plain version: every knob is yours
- `lissajous_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Overall size of the figure. The figure is `width` and `height` times this. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the figure, in degrees. |
| 3 | `width` | 0 to 1 | 0.6 | Horizontal size of the figure. 1.0 reaches the screen edges at zoom 1. |
| 4 | `height` | 0 to 1 | 0.6 | Vertical size of the figure. |
| 5 | `ratio` | 1 to 8 | 3 | Frequency ratio between the vertical and horizontal motion. Whole numbers close the curve. |
| 6 | `glow` | 0 to 1 | 0.35 | Strength and spread of the halo around the line. |
| 7 | `rainbow` | 0 to 1 | 0 | 0 keeps the Layer colour only; 1 cycles through colours along the length of the curve. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Overall size of the figure. The figure is `width` and `height` times this. |
| 2 | `ratio` | 1 to 8 | 3 | Frequency ratio between the vertical and horizontal motion. Whole numbers close the curve. |
| 3 | `width` | 0 to 1 | 0.6 | Horizontal size of the figure. 1.0 reaches the screen edges at zoom 1. |
| 4 | `height` | 0 to 1 | 0.6 | Vertical size of the figure. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Strength and spread of the halo around the line. |
| 7 | `rainbow` | 0 to 1 | 0 | 0 keeps the Layer colour only; 1 cycles through colours along the length of the curve. |

**Compared with the plain version:**

- `angle` is gone: the mids tilt the figure instead. `ratio` moves into slot 2 so that `react` can sit in slot 5.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the figure swells by up to a third and the glow lifts.
- **Mids:** the ratio morphs by up to one whole step, and the figure tilts by up to 45 degrees.
- **Highs:** the line gets thicker and the colours slide along the curve.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float ratioEff = ratio + midLv;
    float th = THICKNESS * (1.0 + 0.8 * highLv);
    float ang = radians(midLv * 45.0);
    vec2 amp = vec2(width * 0.5 * aspect, height * 0.5) * zoom * (1.0 + 0.35 * bassLv);
    vec3 rainbowCol = hsv2rgb(vec3(fract(bestT + tm * 0.1 + highLv * 0.3), 0.8, 1.0));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `SEGMENTS` | `128` | both | How many straight pieces the curve is drawn from. More is smoother (and slower); fewer is faster but can look polygonal, especially at high ratios. |
| `THICKNESS` | `0.01` | both | Width of the line's bright core, in screen heights. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float phase = tm * 0.3;`: the slow drift of the figure. Change `0.3` to drift faster or slower; set it to `0.0` for a still figure.

## Tips and notes

- Cost depends on `SEGMENTS`: every pixel measures its distance to all of them.
- Because the drift is built into the Material, a Speed of 0 in VS2 freezes the figure completely.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
