# Game of Life

*Conway's Game of Life: Gosper glider guns firing endless streams of gliders.*

## What it does

This plays Conway's Game of Life using the classic Gosper glider gun, which fires a glider every 30 generations. Up to four
guns fire parallel streams of gliders across the screen. Births fade in with a flash, deaths fade out in trails, and the colours
drift along the streams.

**Why not a random soup?** A Material can't remember its previous frame, so it can't run a live simulation where each
generation builds on the last. Instead each gun is stored as its 30 repeating frames, and the gliders are worked out exactly
from their position and phase, so every cell on the screen is exactly what real Life would show. This was checked cell for cell
against a brute-force Life simulation, for one gun and for four. The cost is that the layout is fixed: you can't draw your own
patterns, and the picture repeats every 30 generations.

## Files

- `life.frag`: the plain version: every knob is yours
- `life_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Cell size. At zoom 1 there are 60 cells across the screen height. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole grid, in degrees. |
| 3 | `guns` | 1 to 5 | 3 | How many guns, and so how many parallel glider streams (1 to 4). Extra guns are placed out of the way, to the left and below. |
| 4 | `rate` | 0 to 4 | 1 | Generations per second at Speed 1, before `SPEED_SCALE`. With the standard `SPEED_SCALE` of 8, the default gives about 8 generations a second. |
| 5 | `trail` | 0 to 1 | 0.5 | How slowly dead cells fade away. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spilling into the gap around live cells. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours the cells with a palette that drifts along the streams. |

- `guns` is rounded down to a whole number from 1 to 4 (the very top of the knob counts as 4).

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.4 to 3 | 1 | Cell size. At zoom 1 there are 60 cells across the screen height. |
| 2 | `angle` | -180 to 180 | 0 | Rotates the whole grid, in degrees. |
| 3 | `guns` | 1 to 5 | 3 | How many guns, and so how many parallel glider streams (1 to 4). Extra guns are placed out of the way, to the left and below. |
| 4 | `rate` | 0 to 4 | 1 | Generations per second at Speed 1, before `SPEED_SCALE`. With the standard `SPEED_SCALE` of 8, the default gives about 8 generations a second. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow spilling into the gap around live cells. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only; 1 colours the cells with a palette that drifts along the streams. |

**Compared with the plain version:**

- `trail` is now the constant `TRAIL_BASE`, and the mids add to it.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the glow flares and the view punches in slightly.
- **Mids:** the trails linger longer and the grid tilts by up to 15 degrees.
- **Highs:** births flash brighter and the hue shifts.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float trailEff = clamp(TRAIL_BASE + 0.4 * midLv, 0.0, 1.0);
    p = rot(radians(angle + midLv * 15.0)) * p;
    float cellsHigh = CELLS_HIGH / (zoom * (1.0 + 0.1 * bassLv));
    float hue = (cell.x - cell.y) * 0.004 + (cell.x + cell.y) * 0.01 + tm * 0.03 + highLv * 0.15;
    vec3 finalColor = pal * bright * (mask + halo) + vec3(1.0) * flash * mask * (0.5 + 1.5 * highLv);
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `CELLS_HIGH` | `60.0` | both | Cells across the screen height when zoom is 1. |
| `T_OFF` | `6000.0` | both | How many generations the guns have already been running at the start, so the streams are already long. Leave it a multiple of 30 and large. |
| `CAM` | `vec2(50.0, 28.0)` | both | Which cell sits at the screen centre, measured from the first gun's top-left cell. Change it to move the guns around on screen. |
| `GUN_STEP` | `vec2(-26.0, 14.0)` | both | Where each extra gun sits relative to the one before it. These values were chosen so that no stream hits another gun; changing them can break the exactness. |
| `TRAIL_BASE` | `0.5` | audio only | Resting trail for the audio version, since it has no `trail` knob. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Leave these alone

`BH`, `SPLIT`, `T1`, `P1`, `OXG`, `OYG`, `UMIN`, `TPL` and the two big tables `GUN_LO` and `GUN_HI` are the stored gun frames and the glider
formula. They were generated and checked against real Life, so changing them will break the pattern.

## Tips and notes

- Modulating `rate` live makes the generations jump rather than glide, because the generation count is the time multiplied by the rate.
- The whole picture is periodic with a period of 30 generations.
- Light on the GPU: a table lookup and a few tests per pixel.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
