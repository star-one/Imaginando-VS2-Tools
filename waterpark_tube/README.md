# Waterpark Tube

*Sliding down a twisting, translucent tube of coloured sections, marked out by neon rings.*

## What it does

The inside of a water-slide tube lit from outside. The tube bends left, right, up and down, and is made of sections that each
pick their own look at random as they appear: a colour, whether they are black, and whether they are decorated with a grid of
random geometric shapes (discs, squares, diamonds and ring outlines). Neon rings with a crisp edge and a soft glow mark your
movement through the tube, and keep glowing even in black sections.

## Files

- `waterpark_tube.frag`: the plain version: every knob is yours
- `waterpark_tube_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `spacing` | 0.15 to 1 | 0.35 | Distance between the neon rings along the tube. This replaces `zoom` in slot 1. |
| 2 | `thickness` | 0.01 to 0.2 | 0.04 | Width of each ring's bright core. This replaces `angle` in slot 2. If it is wider than the spacing the rings merge into a band. |
| 3 | `bend` | 0 to 1 | 0.5 | 0 is a straight tube; higher values add left, right, up and down turns, with quicker turns near the top. |
| 4 | `shapes` | 0 to 1 | 0.5 | How likely a section is to be decorated with geometric shapes. |
| 5 | `section` | 0 to 1 | 0.5 | Length of each section, from short to long. |
| 6 | `glow` | 0 to 1 | 0.35 | Ring brightness and halo, plus the bright light at the far end. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white sections); 1 gives the full range of section colours. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `spacing` | 0.15 to 1 | 0.35 | Distance between the neon rings along the tube. This replaces `zoom` in slot 1. |
| 2 | `thickness` | 0.01 to 0.2 | 0.04 | Width of each ring's bright core. This replaces `angle` in slot 2. If it is wider than the spacing the rings merge into a band. |
| 3 | `bend` | 0 to 1 | 0.5 | 0 is a straight tube; higher values add left, right, up and down turns, with quicker turns near the top. |
| 4 | `shapes` | 0 to 1 | 0.5 | How likely a section is to be decorated with geometric shapes. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Ring brightness and halo, plus the bright light at the far end. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white sections); 1 gives the full range of section colours. |

**Compared with the plain version:**

- `section` is now the constant `SECTION_LENGTH`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the rings thicken and glow harder, and the walls pulse.
- **Mids:** the tube bends more.
- **Highs:** more sections get decorated and the shapes brighten.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.5 * bassLv, 0.0, 1.0);
    float bendEff = clamp(bend + 0.4 * midLv, 0.0, 1.0);
    float hasShapes = step(h3, shapes + 0.5 * highLv);
    vec3 wall = hueCol * (1.0 - isBlack) * 0.7 * (1.0 + 0.5 * bassLv) * lightFall * seam;
    float halfT = min(thickness * (1.0 + 0.6 * bassLv), spacing) * 0.5;
                    + shapeCol * shapeMask * (0.9 + 0.8 * highLv) * lightFall * fade
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `BLACK_CHANCE` | `0.15` | both | Chance (0 to 1) that any section is black. 0 means never, 1 means always. |
| `SECTION_LENGTH` | `1.05` | audio only | Length of each tube section in the audio version (the plain version has this as the `section` knob). |
| `C0` | `0.03` | both | Size of the small opening at the far end of the tube. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float secLen = mix(0.3, 1.8, section);`: the range of section lengths the `section` knob covers.
- `float nc = floor(mix(5.0, 11.0, h4));`: how many shapes fit around the tube: a random whole number from 5 to 10 per section.

## Tips and notes

- Changing `section` while the tube is running reshuffles the random choices, so avoid modulating it live.
- Changing `spacing` while running slides the rings along, which can look jumpy if modulated fast.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
