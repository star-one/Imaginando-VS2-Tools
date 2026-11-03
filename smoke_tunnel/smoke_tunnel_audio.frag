/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4444,
            "name": "zoom",
            "min": 0.2,
            "max": 2.0
        },
        {
            "default": 0.5,
            "name": "complexity"
        },
        {
            "default": 0.5,
            "name": "chaos"
        },
        {
            "default": 0.4,
            "name": "lightning"
        },
        {
            "default": 0.5,
            "name": "react",
            "min": 0.0,
            "max": 4.0
        },
        {
            "default": 0.35,
            "name": "glow"
        },
        {
            "default": 0.8,
            "name": "rainbow"
        }
    ],
    "url": "",
    "uuid": "3b8e5d17-a4c2-4096-9f7d-1e6a8c4b2d05"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Base spiral of the clouds; mids add more twist.
const float TWIST_BASE = 0.15;

// The frequency range of each audio band, in Hz.
// Change these to make a band listen to a different part of the sound.
const vec2 BASS_HZ = vec2(40.0, 150.0);
const vec2 MID_HZ  = vec2(250.0, 2000.0);
const vec2 HIGH_HZ = vec2(4000.0, 12000.0);

// How VS2 lays out the FFT texture. VS2 does not document this, so these are assumptions:
// the left edge of the texture is FFT_MIN_HZ, the right edge is FFT_MAX_HZ, and the
// frequencies in between are spaced logarithmically (FFT_LOG = 1.0) or evenly (FFT_LOG = 0.0).
// If a band reacts to the wrong part of the music, calibrate these (see the main README).
// FFT_MIN_HZ must be above 0.
const float FFT_MIN_HZ = 20.0;
const float FFT_MAX_HZ = 20000.0;
const float FFT_LOG = 1.0;

// where a frequency sits across the FFT texture (0 = left edge, 1 = right edge)
float hzToX(float hz)
{
    float h = clamp(hz, FFT_MIN_HZ, FFT_MAX_HZ);
    float lin = (h - FFT_MIN_HZ) / (FFT_MAX_HZ - FFT_MIN_HZ);
    float lg = log(h / FFT_MIN_HZ) / log(FFT_MAX_HZ / FFT_MIN_HZ);
    return mix(lin, lg, FFT_LOG);
}

// average level of the FFT over a range of frequencies, given in Hz
float band(vec2 hz)
{
    float x0 = hzToX(hz.x);
    float x1 = hzToX(hz.y);
    float sum = 0.0;
    for (int i = 0; i < 4; i++)
    {
        float x = mix(x0, x1, (float(i) + 0.5) / 4.0);
        sum += texture(fftTex, vec2(x, 0.0)).r;
    }
    return sum / 4.0;
}

const float TAU = 6.28318530718;
const float C0 = 0.03;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// value noise that repeats every n cells in x, so clouds wrap around the tunnel without a seam
float pnoise(vec2 p, float n)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, n);
    float x1 = mod(i.x + 1.0, n);
    float a = hash(vec2(x0, i.y));
    float b = hash(vec2(x1, i.y));
    float c = hash(vec2(x0, i.y + 1.0));
    float d = hash(vec2(x1, i.y + 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// billowing cloud density: smooth large puffs plus creased "cauliflower" detail
float cloud(float ua, float v, float cx)
{
    float o1 = pnoise(vec2(ua * 4.0, v * 0.6), 4.0);
    float vw = v + (o1 - 0.5) * 0.8;
    float o2 = abs(2.0 * pnoise(vec2(ua * 8.0 + 3.7, vw * 1.2 + 1.3), 8.0) - 1.0);
    float o3 = abs(2.0 * pnoise(vec2(ua * 16.0 + 9.1, vw * 2.4 + 5.2), 16.0) - 1.0);
    return (o1 * 0.55 + cx * (o2 * 0.30 + o3 * 0.15)) / (0.55 + cx * 0.45);
}

// dark violet smoke -> orange -> pale gold, by t
vec3 smokeCol(float t)
{
    vec3 c = mix(vec3(0.12, 0.04, 0.18), vec3(1.0, 0.40, 0.08), smoothstep(0.0, 0.6, t));
    return mix(c, vec3(1.0, 0.85, 0.50), smoothstep(0.5, 1.0, t));
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float twistEff = TWIST_BASE + 0.6 * midLv;
    float complexityEff = clamp(complexity + 0.4 * midLv, 0.0, 1.0);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);
    p /= zoom * (1.0 + 0.2 * bassLv);

    float r0 = length(p);

    // first-pass depth, used only to steer the winding of the tunnel
    float z0 = 0.3 / (r0 + C0);
    float zt = z0 + tm * 0.6;

    // chaos 0 = flying straight down the tunnel; more chaos = bends left/right and up/down,
    // with sharper, quicker turns at the top end
    vec2 path = vec2(sin(zt * 0.9 + 1.3 * sin(zt * 0.37)),
                     cos(zt * 0.7 + 1.1 * sin(zt * 0.53)));
    path += chaos * chaos * 0.7 * vec2(sin(zt * 2.9 + 1.7), cos(zt * 3.7 + 0.4));

    // far sections swing furthest, the screen centre stays anchored
    float swing = smoothstep(0.0, 0.4, r0) * exp(-r0 * 1.8);
    p -= path * (chaos * 0.4) * swing;

    float r = length(p);
    float a = atan(p.y, p.x);

    // final depth, flowing towards the viewer with time
    float z = 0.3 / (r + C0);
    float v = z + tm * 0.8;

    // twist rolls the clouds around the axis as they travel
    float ua = (a + v * twistEff * 1.5) / TAU + 0.5 + tm * 0.02;

    // cumulus-style density, plus a second sample nudged towards the centre (the light)
    // so puffs get bright lit sides and darker shadowed sides
    float n = cloud(ua, v, complexityEff);
    float d = smoothstep(0.3, 0.75, n);
    float dL = smoothstep(0.3, 0.75, cloud(ua + 0.01, v + 0.12, complexityEff));
    float lit = clamp(0.35 + n * 0.5 + (d - dL) * 3.0 + highLv * 0.3, 0.0, 1.0);

    // detail fades towards the centre to avoid shimmer, and gently at the screen edge
    float fade = smoothstep(C0, 0.3, r);
    float vig = 1.0 - 0.5 * smoothstep(0.4, 1.1, r);
    float centre = exp(-r * 2.0);

    float bodyI = (0.06 + 0.94 * d) * (0.2 + 0.8 * lit) * (0.3 + 0.7 * centre) * fade * vig * (0.7 + 0.6 * glowEff);
    vec3 bodyCol = mix(vec3(1.0), smokeCol(lit * 0.75 + 0.5 * exp(-r * 2.5)), rainbow);

    // lightning: random bursts in short time cells, veins from one ridged noise sample
    float lt = tm * 3.0;
    float id = floor(lt);
    float f = fract(lt);
    float h = hash(vec2(id, 7.1));
    float on = step(h, lightning * 0.7);
    float flash = max(on * (exp(-f * 6.0) + 0.6 * exp(-abs(f - 0.35) * 30.0)), smoothstep(0.6, 0.95, bassLv));
    float rn = pnoise(vec2(ua * 8.0 + id * 5.3, v * 0.9 + id * 2.1), 8.0);
    float vein = pow(1.0 - abs(2.0 * rn - 1.0), 10.0);
    float mask = 0.4 + 0.6 * (0.5 + 0.5 * cos(a - h * TAU * 3.0));
    float zap = flash * mask * fade * (0.5 * d + 1.6 * vein * (0.3 + d));
    // lightning colour is fixed: white with a hint of blue, independent of rainbow and Layer colour
    vec3 lightCol = vec3(0.88, 0.93, 1.0);

    // bright centre: small opening plus halo
    float hole = smoothstep(C0, C0 * 0.3, r);
    float halo = glowEff * exp(-r / (0.05 + 0.3 * glowEff));
    vec3 haloCol = mix(vec3(1.0), vec3(1.0, 0.85, 0.5), rainbow);

    vec3 baseColor = clamp(bodyCol * bodyI + haloCol * (hole + halo), 0.0, 1.0) * color.rgb;
    vec3 finalColor = clamp(baseColor + lightCol * zap, 0.0, 1.0);

    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor, alpha * coloredPixels);
}
