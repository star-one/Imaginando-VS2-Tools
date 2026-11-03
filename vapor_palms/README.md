# Vapor Palms

*Palm tree silhouettes with a neon pink and cyan rim light, swaying in the breeze.*

## What it does

One to three palm trees, each with a curved trunk, seven drooping fronds and two coconuts, drawn as solid dark silhouettes with
a neon rim and a soft glow. They sway gently. Unlike the other Materials, the silhouettes are opaque, so they hide whatever is
behind them: put them over the sun and they cut across it.

## Files

- `vapor_palms.frag`: the plain version: every knob is yours
- `vapor_palms_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.5 to 1.6 | 1 | Size of the palms. |
| 2 | `angle` | -180 to 180 | 0 | Tilts the whole picture, in degrees. |
| 3 | `width` | 0 to 1 | 0.5 | Length of the fronds. |
| 4 | `height` | 0.3 to 1 | 0.6 | Height of the trunks. |
| 5 | `palms` | 1 to 4 | 2.5 | How many palms (1 to 3). The knob is rounded down, so the default shows two. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the rim. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white rim, black silhouette); 1 gives the pink and cyan rim and a deep violet fill. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.5 to 1.6 | 1 | Size of the palms. |
| 2 | `angle` | -180 to 180 | 0 | Tilts the whole picture, in degrees. |
| 3 | `width` | 0 to 1 | 0.5 | Length of the fronds. |
| 4 | `height` | 0.3 to 1 | 0.6 | Height of the trunks. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Glow around the rim. |
| 7 | `rainbow` | 0 to 1 | 1 | 0 keeps the Layer colour only (white rim, black silhouette); 1 gives the pink and cyan rim and a deep violet fill. |

**Compared with the plain version:**

- `palms` is now the constant `PALMS_BASE`.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the palms sway much harder and the glow lifts.
- **Mids:** the fronds get longer.
- **Highs:** the colours of the rim shift from side to side.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
        float fl = (0.12 + 0.2 * clamp(width + 0.3 * midLv, 0.0, 1.0)) * zoom * sc;
        d = min(d, palmDist(p, base, trunkH, lean * zoom * sc, fl, zoom * sc, phase, tm, 1.0 + 3.0 * bassLv));
    vec3 rimCol = mix(CYAN, PINK, smoothstep(-0.6, 0.6, p.x + (highLv - 0.5) * 0.6));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `PALMS_BASE` | `2` | audio only | How many palms the audio version shows (1 to 3). |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `base = vec2(-0.62, -0.58); lean = 0.14; sc = 1.0; phase = 0.0;`: where the first palm stands (`base`), how far it leans (`lean`) and its size (`sc`). The other palms have similar lines just below; edit them to rearrange the grove.
- `for (int i = 1; i <= 8; i++)`: the number of straight pieces each frond is drawn from. Lower for speed, raise for smoother curves.

## Tips and notes

- Each palm is about 65 line-segment tests per pixel, but pixels far from any palm are skipped, so the cost depends on how much of the screen the palms cover.
- The palms' transparency works differently from the other Materials: the silhouette is made opaque on purpose.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
