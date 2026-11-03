# Stargate Slit Scan

*Streaks of coloured light rushing out of a bright slit, in the style of the Stargate sequence in 2001: A Space Odyssey.*

## What it does

A bright horizontal slit sits across the middle of the screen, with streaks of light fanning out from it above and below in
perspective, flowing towards the viewer. The picture is mirrored top and bottom, as in the film.

This is a procedural imitation of a slit-scan, not a real one: a Material can't read the picture from other layers, so it can't
scan real footage. The streaks are generated from noise instead.

## Files

- `stargate_slitscan.frag`: the plain version: every knob is yours
- `stargate_slitscan_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance: the streaks get larger or smaller. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0 to 1 | 0.6 | Streak thickness, from fine hairlines to broad bands. |
| 4 | `height` | 0 to 1 | 0.3 | Height of the central slit. |
| 5 | `stretch` | 0 to 1 | 0.5 | How far each streak is smeared along the direction of travel, from broken dashes to long lines. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the slit, plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the drifting rainbow palette. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance: the streaks get larger or smaller. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole picture, in degrees. |
| 3 | `width` | 0 to 1 | 0.6 | Streak thickness, from fine hairlines to broad bands. |
| 4 | `height` | 0 to 1 | 0.3 | Height of the central slit. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the slit, plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the drifting rainbow palette. |

**Compared with the plain version:**

- `stretch` is now the constant `STRETCH_BASE`, and the mids add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the slit opens wider and the glow lifts.
- **Mids:** the streaks stretch longer.
- **Highs:** the streaks get brighter and the palette shifts.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float stretchEff = clamp(STRETCH_BASE + 0.4 * midLv, 0.0, 1.0);
    float h0 = 0.01 + (height + 0.5 * bassLv) * 0.12;
    float streakI = streak * fade * (0.7 + 0.6 * glowEff) * (1.0 + highLv);
    vec3 streakCol = mix(vec3(1.0), palette(n2 * 0.6 + v * 0.04 + tm * 0.05 + highLv * 0.2), rainbow);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `STRETCH_BASE` | `0.5` | audio only | Resting streak smear (0 to 1) for the audio version, since it has no `stretch` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float h0 = 0.01 + height * 0.12;`: how tall the slit is. Raise `0.12` for a taller slit at the same knob position.
- `float vf = mix(3.0, 0.2, stretch);`: the range of the smear: `3.0` is the shortest streak and `0.2` the longest.

## Tips and notes

- Light on the GPU: a couple of noise lookups per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
