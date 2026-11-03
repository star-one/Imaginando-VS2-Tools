# Vapor Shapes

*Tumbling neon wireframe cubes, octahedra and pyramids, with VHS-style pink and cyan ghosting.*

## What it does

One to four wireframe solids tumble in 3D and are drawn as neon lines. Each is drawn twice, pink and cyan, slightly pulled apart
like a badly aligned tape, with faint scanlines over the top. The shapes can all be one type or a mix.

## Files

- `vapor_shapes.frag`: the plain version: every knob is yours
- `vapor_shapes_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 2 | 1 | Size of the shapes. |
| 2 | `angle` | -180 to 180 | 0 | Rolls the whole picture, in degrees. |
| 3 | `copies` | 1 to 5 | 2 | How many shapes (1 to 4). With more than one they orbit each other and are drawn smaller. |
| 4 | `perspective` | 0 to 1 | 0.5 | How strong the 3D perspective is: 0 is almost flat. |
| 5 | `shape` | 0 to 4 | 3 | Which solid: 0 cube, 1 octahedron, 2 pyramid, 3 a mix (the knob is rounded down). |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the pink and cyan ghosts. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.3 to 2 | 1 | Size of the shapes. |
| 2 | `angle` | -180 to 180 | 0 | Rolls the whole picture, in degrees. |
| 3 | `copies` | 1 to 5 | 2 | How many shapes (1 to 4). With more than one they orbit each other and are drawn smaller. |
| 4 | `perspective` | 0 to 1 | 0.5 | How strong the 3D perspective is: 0 is almost flat. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the lines. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 gives the pink and cyan ghosts. |

**Compared with the plain version:**

- `shape` is now the constant `SHAPE_MODE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the shapes swell by up to a quarter and the glow lifts.
- **Mids:** the shapes tilt by up to about a radian.
- **Highs:** the pink and cyan images are pulled further apart.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float size = 0.28 * zoom * (1.0 + 0.25 * bassLv);
    vec2 ab = vec2(AB * (1.0 + 4.0 * highLv), 0.0);
        mat3 R = rotY(tm * 0.23 + ph) * rotX(tm * 0.17 + ph * 0.6) * rotZ(tm * 0.11 + midLv * 1.0);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `AB` | `0.006` | both | How far apart the pink and cyan ghost images are, in screen heights. |
| `SHAPE_MODE` | `3` | audio only | Which solid is drawn in the audio version: 0 cube, 1 octahedron, 2 pyramid, 3 a mix. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float w = 0.004;`: the thickness of the line's bright core.
- `float scan = 0.82 + 0.18 * sin(texCoord.y * resolution.y * 1.5708);`: the scanlines: the `0.18` is their strength.

## Tips and notes

- The costliest of the vapourwave Materials after the palms: every pixel measures its distance to every edge, twice per shape.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
