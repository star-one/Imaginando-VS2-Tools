# Fractal Pyramid (audio-reactive)

*A glowing raymarched fractal pyramid, with the folds opening and closing to the music.*

## What it does

A 3D fractal pyramid made by repeatedly folding and rotating space, rendered by raymarching with a soft neon glow. The camera
orbits it. This is an audio-reactive version of an existing Material, so there is no separate plain version in this repository.

## Files

- `fractal_pyramid_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Parameters (audio-reactive)

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0 to 1 | 0.5 | Camera distance: higher is further away, so the pyramid looks smaller. |
| 2 | `angle` | -180 to 180 | 0 | Where the camera's orbit starts, in degrees. The camera keeps orbiting from there. |
| 3 | `fold` | 0 to 1 | 0.5 | How far the folds are opened, which changes the shape of the fractal. |
| 4 | `rotSpeed` | 0 to 1 | 0.5 | How fast the folds rotate and the camera orbits. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.5 | How bright the glow is. In the original this knob ran the other way (higher was dimmer); here higher is brighter, and the default look is unchanged. |
| 7 | `colorMix` | 0 to 1 | 0.5 | Mixes between the cyan end of the palette and the Layer colour. |

**Notes:**

- The slot order follows the project's conventions, so it differs from the original: zoom, angle, fold, rotSpeed, react, glow, colorMix.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the camera lunges in by up to 15 percent and the glow flares.
- **Mids:** the folds open and close.
- **Highs:** the colours slide between the two palette ends.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    camDist = (20.0 + zoom * 60.0) * (1.0 - 0.15 * bassLv);
    foldAmt = 0.2 + clamp(fold + 0.2 * midLv, 0.0, 1.0) * 0.8;
    glowInt = (800.0 - glow * 600.0) * (1.0 - 0.5 * bassLv);
    cMix = colorMix + 0.3 * highLv;
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | audio only | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `for (float i = 0.0; i < 64.0; i++)`: the number of steps each ray takes. This is the main cost: lower it for speed, at the price of the pyramid fading at the edges.
- `glowInt = (800.0 - glow * 600.0)`: the glow knob's range. Use `200.0 + glow * 600.0` instead to get the original behaviour back (higher is dimmer).

## Tips and notes

- One of the heaviest Materials: a 64-step ray march through an 8-fold structure for every pixel.
- Changing `rotSpeed` while it runs makes the whole pyramid jump, because the animation is the time multiplied by the speed.
- With the standard `SPEED_SCALE` of 8 the rotation and orbit run 8 times faster than the original at the same Speed setting.

## Credits

Adapted from a Shadertoy fractal pyramid shader, with the link to it kept in the manifest as it was supplied (https://www.shadertoy.com/view/fractal-pyramid).
The audio reaction, the `angle` knob and the reordered knob slots are new, and are released under this repository's MIT licence.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
