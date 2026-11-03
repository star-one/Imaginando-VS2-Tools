# Smoke Tunnel

*A winding tunnel of billowing, cumulus-like smoke clouds, lit by random bursts of lightning.*

## What it does

You fly down a tunnel whose walls are rolling, textured clouds. The puffs are lit from the bright end of the tunnel, so they
have bright sides and shadowed sides. The tunnel can be dead straight or twist and turn left, right, up and down. Bursts of
lightning flash through the clouds at random. It was inspired by the look of the series 5 (2010) Doctor Who titles, as an impression
rather than a copy.

The lightning is always white with a hint of blue, whatever the `rainbow` knob or the Layer colour is set to.

## Files

- `smoke_tunnel.frag`: the plain version: every knob is yours
- `smoke_tunnel_audio.frag`: the audio-reactive version: reacts to the music through the FFT texture

## Parameters

VS2 shows seven knobs per Material. Ranges are the real values the code sees; defaults are shown as real values too. (Inside the manifest the defaults are stored normalised from 0 to 1.)

### Plain version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance. |
| 2 | `complexity` | 0 to 1 | 0.5 | How much fine, cauliflower-like detail is mixed into the clouds. This replaces `angle` in slot 2. |
| 3 | `chaos` | 0 to 1 | 0.5 | 0 is a straight tunnel; higher values bend it left, right, up and down, with sharper turns near the top. |
| 4 | `lightning` | 0 to 1 | 0.4 | How often lightning bursts happen. 0 is none. |
| 5 | `twist` | -1 to 1 | 0.15 | How much the clouds roll around the axis as they travel. Signed: 0 is straight, negative reverses. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the centre plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the violet, orange and gold smoke palette. |

### Audio-reactive version

| Slot | Parameter | Range | Default | What it does |
|---|---|---|---|---|
| 1 | `zoom` | 0.2 to 2 | 1 | Camera distance. |
| 2 | `complexity` | 0 to 1 | 0.5 | How much fine, cauliflower-like detail is mixed into the clouds. This replaces `angle` in slot 2. |
| 3 | `chaos` | 0 to 1 | 0.5 | 0 is a straight tunnel; higher values bend it left, right, up and down, with sharper turns near the top. |
| 4 | `lightning` | 0 to 1 | 0.4 | How often lightning bursts happen. 0 is none. |
| 5 | `react` | 0 to 4 | 2 | Audio sensitivity. 0 switches the audio reaction off; raise it for quiet sources and lower it if the picture saturates. |
| 6 | `glow` | 0 to 1 | 0.35 | Halo around the centre plus a slight lift in overall brightness. |
| 7 | `rainbow` | 0 to 1 | 0.8 | 0 keeps the Layer colour only; 1 gives the violet, orange and gold smoke palette. |

**Compared with the plain version:**

- `twist` is now the constant `TWIST_BASE`, and the mids add to it.
- Strong bass hits trigger lightning even when `lightning` is at 0.

## How the audio reacts

The audio version averages the FFT texture over three frequency bands (bass, mids, highs; their ranges in Hz are constants you can edit), each scaled by `react` and kept between 0 and 1. Set up the audio source as described in the [main README](../README.md#audio-setup).

- **Bass:** the camera punches in, the glow lifts, and strong kicks trigger lightning flashes.
- **Mids:** the clouds twist more and gain more fine detail.
- **Highs:** the lit sides of the puffs get brighter.

The lines in `main()` that do this are below. The number multiplying `bassLv`, `midLv` or `highLv` is the strength of that reaction, so change those numbers to taste:

```glsl
    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float twistEff = TWIST_BASE + 0.6 * midLv;
    float complexityEff = clamp(complexity + 0.4 * midLv, 0.0, 1.0);
    p /= zoom * (1.0 + 0.2 * bassLv);
    float lit = clamp(0.35 + n * 0.5 + (d - dL) * 3.0 + highLv * 0.3, 0.0, 1.0);
    float flash = max(on * (exp(-f * 6.0) + 0.6 * exp(-abs(f - 0.35) * 30.0)), smoothstep(0.6, 0.95, bassLv));
```

## Constants you can change in the code

Open the `.frag` file in any text editor (or VS2's Material Editor) and look near the top.

| Constant | Default | Files | What it does |
|---|---|---|---|
| `SPEED_SCALE` | `8.0` | both | Overall animation speed multiplier. Everything that moves runs off `time * SPEED_SCALE`. Raise it for a faster maximum speed, lower it for a slower one. VS2's own Speed knob still scales on top of this. |
| `TWIST_BASE` | `0.15` | audio only | Resting roll of the clouds for the audio version, since it has no `twist` knob. |
| `C0` | `0.03` | both | Size of the small bright opening at the far end of the tunnel. |
| `BASS_HZ` | `vec2(40.0, 150.0)` | audio only | The frequency range of the bass band, in Hz (lowest, highest). Move it to make the Material follow a different part of the sound, for example higher for a snare instead of a kick. |
| `MID_HZ` | `vec2(250.0, 2000.0)` | audio only | The frequency range of the mids band, in Hz. |
| `HIGH_HZ` | `vec2(4000.0, 12000.0)` | audio only | The frequency range of the highs band, in Hz. |
| `FFT_MIN_HZ` | `20.0` | audio only | What frequency the left edge of VS2's FFT texture stands for. VS2 does not document this, so it is an assumption (20 Hz). Must be above 0. See the main README for how to check it. |
| `FFT_MAX_HZ` | `20000.0` | audio only | What frequency the right edge of the FFT texture stands for (assumed to be 20,000 Hz). |
| `FFT_LOG` | `1.0` | audio only | How the frequencies are spaced across the FFT texture: 1.0 logarithmic (assumed), 0.0 evenly spaced. |

### Other numbers worth knowing

- `float lt = tm * 3.0;`: the lightning clock: how many random 'chances' per second. Lower it for slower, calmer storms.
- `vec3 lightCol = vec3(0.88, 0.93, 1.0);`: the lightning colour. Change it if you want a different tint.

## Tips and notes

- Changing `chaos` live only changes the amount of bend, so it glides rather than jumps.
- The clouds are noise-based rather than a physical simulation, to keep it fast enough for a laptop.

---

Part of [VS2 Materials](../README.md). Author: The Winterval Conspiracy.
