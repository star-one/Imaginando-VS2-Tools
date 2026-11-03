# Mandelbrot Set

*The Mandelbrot set in glowing, rippling colour, with six places to dive into and a morph to a Julia set.*

## What it does

The Mandelbrot set is drawn in black (so it is transparent when layered), surrounded by smooth bands of colour that ripple
outwards, with a glow along its edge. The `target` knob picks a famous place to look at, and `zoom` dives into it. The `julia`
knob turns the same view into a Julia set.

## Files

- `mandelbrot.frag`: the plain version: every knob is yours
- `mandelbrot_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0 to 11 | 0 | How deep you have gone, in octaves: every +1 doubles the magnification. Stops at 11 because beyond that 32-bit floating point runs out of precision and the picture goes blocky. An LFO on this gives a continuous dive. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the view, in degrees. |
| 3 | `target` | 0 to 6 | 0 | Which place to look at: 0 the whole set, 1 seahorse valley, 2 elephant valley, 3 a mini Mandelbrot, 4 a spiral, 5 a triple spiral. The values are chosen by whole number, and the coordinates are approximate. |
| 4 | `detail` | 24 to 160 | 92 | Iterations per pixel: more shows finer structure near the edge and costs more. Also goes up automatically as you zoom in. |
| 5 | `julia` | 0 to 1 | 0 | 0 is the Mandelbrot set; 1 shows a Julia set for the same view; in between is a blend. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow along the edge of the set. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the drifting rainbow palette. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0 to 11 | 0 | How deep you have gone, in octaves: every +1 doubles the magnification. Stops at 11 because beyond that 32-bit floating point runs out of precision and the picture goes blocky. An LFO on this gives a continuous dive. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the view, in degrees. |
| 3 | `target` | 0 to 6 | 0 | Which place to look at: 0 the whole set, 1 seahorse valley, 2 elephant valley, 3 a mini Mandelbrot, 4 a spiral, 5 a triple spiral. The values are chosen by whole number, and the coordinates are approximate. |
| 4 | `detail` | 24 to 160 | 92 | Iterations per pixel: more shows finer structure near the edge and costs more. Also goes up automatically as you zoom in. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow along the edge of the set. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the drifting rainbow palette. |

**Compared with the plain version:**

- `julia` is now the constant `JULIA_BASE`, and the mids add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the zoom pulses deeper by up to most of an octave, and the glow lifts.
- **Mids:** the picture is pulled towards the Julia set.
- **Highs:** the colours get brighter and the palette shifts.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float juliaEff = clamp(JULIA_BASE + 0.35 * midLv, 0.0, 1.0);
    float zoomEff = zoom + 0.8 * bassLv;
        float intensity = shade * stripe * (1.0 + 0.5 * highLv);
        vec3 pal = mix(vec3(1.0), palette(sn * 0.03 + tm * COLOUR_RATE + highLv * 0.15), rainbow);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `MAX_ITER` | `160` | both | Hard cap on iterations per pixel, whatever `detail` says. Lower it for speed. The `detail` knob tops out at 160, so to go beyond that raise this and also the `max` of `detail` in the manifest at the top of the file. |
| `RIPPLE_RATE` | `0.15` | both | How fast the colour ripples flow out from the set. |
| `COLOUR_RATE` | `0.04` | both | How fast the palette drifts. |
| `JULIA_C` | `vec2(-0.8, 0.156)` | both | The Julia set that the julia knob morphs towards. Try other values near the edge of the Mandelbrot set for different shapes. |
| `JULIA_BASE` | `0.0` | audio only | Resting Julia amount for the audio version, since it has no `julia` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `if (ti == 1) { centre = vec2(-0.743643887037151, 0.131825904205330); base = 0.30; }`: one of the six places. `centre` is the point on the complex plane and `base` is the half-height of the view at zoom 0. Edit these lines to add your own favourite spots.

## Tips and notes

- The set itself is black, so on a layer it is see-through; put a bright layer underneath to see through it.
- The deepest zooms at some targets show blocky pixels; this is the float precision limit, not a bug.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
