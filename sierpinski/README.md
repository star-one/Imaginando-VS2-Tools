# Sierpinski Triangle

*Neon-outlined Sierpinski triangle that dives into itself forever.*

## What it does

The classic Sierpinski triangle: a triangle with an upside-down triangle removed from the middle, again and again. Each hole is
outlined in neon and coloured by its level. When zoomed in, the view dives endlessly into the triangle and loops seamlessly,
because the shape looks the same at every eighth of the scale.

## Files

- `sierpinski.frag`: the plain version: every knob is yours
- `sierpinski_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.15 to 4 | 1 | 1 and above: endless dive. Below 0.7: holds still on the whole triangle. Between 0.7 and 1 the dive restarts with a small jump each loop. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the picture, in degrees. |
| 3 | `width` | 0.01 to 0.2 | 0.05 | Line width, measured in the size of each hole, so lines shrink with the holes. |
| 4 | `levels` | 3 to 16 | 10 | How many levels of holes to draw. Higher shows finer detail. |
| 5 | `fill` | 0 to 1 | 0.4 | How solid the holes are with colour: 0 is outline only. |
| 6 | `glow` | 0 to 1 | 0.35 | Neon glow just inside each hole's edge. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each level of hole differently. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.15 to 4 | 1 | 1 and above: endless dive. Below 0.7: holds still on the whole triangle. Between 0.7 and 1 the dive restarts with a small jump each loop. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the picture, in degrees. |
| 3 | `width` | 0.01 to 0.2 | 0.05 | Line width, measured in the size of each hole, so lines shrink with the holes. |
| 4 | `levels` | 3 to 16 | 10 | How many levels of holes to draw. Higher shows finer detail. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Neon glow just inside each hole's edge. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours each level of hole differently. |

**Compared with the plain version:**

- `fill` is now the constant `FILL_BASE`, and the bass adds to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the holes fill and flash, the view punches in and the glow lifts.
- **Mids:** the triangle rotates by up to 30 degrees.
- **Highs:** the lines brighten and the colours shift.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float fillEff = clamp(FILL_BASE + 0.5 * bassLv, 0.0, 1.0);
    p = rot(radians(angle + midLv * 30.0)) * p;
    float wh = 0.1 / (zoom * (1.0 + 0.15 * bassLv));
        vec3 pal = mix(vec3(1.0), palette(lvRel * 0.11 + tm * 0.02 + highLv * 0.15), rainbow);
        finalColor += mix(pal, vec3(1.0), 0.6) * core * levelFade * (1.0 + 0.8 * highLv);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `DIVE_RATE` | `0.02` | both | Speed of the endless dive: loops per unit of time. Each loop zooms in eight times. |
| `MAX_LEVELS` | `20` | both | Upper limit on the number of levels the loop can draw. Keep it at least `levels` max plus 3. |
| `FILL_BASE` | `0.4` | audio only | Resting fill for the audio version, since it has no `fill` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float wh = 0.1 / zoom;`: the size of the view. The `0.1` is chosen so that the dive loops seamlessly at zoom 1; changing it breaks the seamless loop.
- `float k = smoothstep(0.7, 1.0, zoom);`: the zoom range over which the endless dive fades in.

## Tips and notes

- Light on the GPU: a short loop of simple tests per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
