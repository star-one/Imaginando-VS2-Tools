/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2308,
            "name": "zoom",
            "min": 0.4,
            "max": 3.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.2593,
            "name": "teeth",
            "min": 0.3,
            "max": 3.0
        },
        {
            "default": 0.2857,
            "name": "height",
            "min": 0.01,
            "max": 0.15
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
            "default": 1.0,
            "name": "rainbow"
        }
    ],
    "url": "",
    "uuid": "bfd08226-2d72-4b42-912b-9e1fdb82ec9e"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How many saws there are (the plain version has a rings knob).
const int RINGS_BASE = 4;

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

// How fast the saws spin.
const float SPIN = 0.15;

// How often the saws jump to new sizes and tooth counts.
const float EVENT_RATE = 0.5;

// Half-thickness of the saw lines, in screen heights.
const float TH = 0.006;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p)
{
    return vec2(hash(p), hash(p + 19.19));
}

// An irregular clock: it changes at the moments three unrelated clocks tick over,
// so the changes arrive at seemingly random times rather than in a steady beat.
float tickId(float t)
{
    return mod(floor(t) + 31.0 * floor(t * 1.618 + 0.37) + 977.0 * floor(t * 0.382 + 0.11), 4096.0);
}

// The harsh palette: white, blood red, acid green, electric blue.
vec3 pick(float h)
{
    if (h < 0.4) return vec3(1.0);
    if (h < 0.7) return vec3(1.0, 0.05, 0.08);
    if (h < 0.85) return vec3(0.75, 1.0, 0.05);
    return vec3(0.1, 0.25, 1.0);
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return length(pa - ba * h);
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    // zoom: bigger zoom makes everything bigger
    p /= zoom;
    float r = length(p);
    float a = atan(p.y, p.x);

    float t = tm * EVENT_RATE;
    float ev = mod(floor(t) + 31.0 * floor(t * 1.618 + 0.37) + 977.0 * floor(t * 0.382 + 0.11) + floor(bassLv * 3.0) * 11.0, 4096.0);

    int nr = RINGS_BASE;
    float toothH = height * (1.0 + 0.8 * bassLv);

    vec3 col = vec3(0.0);
    for (int k = 0; k < 6; k++)
    {
        if (k >= nr) break;
        float fk = float(k);
        float hk = hash(vec2(fk, ev));
        float h2 = hash(vec2(fk + 9.0, ev * 0.37));

        float R = 0.07 + fk * 0.075 + (hk - 0.5) * 0.04 + midLv * 0.03 * sin(tm * 4.0 + fk * 2.0);
        float N = max(floor(mix(5.0, 36.0, h2) * teeth), 3.0);       // whole number, so the teeth meet at the seam
        float dir = (hash(vec2(fk + 3.0, 1.0)) < 0.5) ? -1.0 : 1.0;
        float spin = dir * (0.5 + 2.0 * hash(vec2(fk, 7.0)));

        // each tooth ramps up slowly and drops away suddenly, like a saw blade
        float s = fract(a * N / TAU + spin * tm * SPIN);
        float d = abs(r - (R + toothH * s));
        float ramp = 1.0 - smoothstep(TH * 0.6, TH, d);

        float ds = TH / max(r, 0.01) * N / TAU;                        // line width in tooth units
        float inRange = step(R - TH, r) * step(r, R + toothH + TH);
        float drop = (1.0 - smoothstep(0.0, ds, s)) * inRange;

        float halo = glowEff * exp(-d / 0.02) * 0.4;

        // each saw drops out and returns at irregular moments
        float on = step(0.15 + 0.5 * highLv, hash(vec2(tickId(tm * 0.7 + fk * 1.9), fk)));
        vec3 rc = mix(vec3(1.0), pick(hk), rainbow);
        col += rc * (max(ramp, drop) + halo) * on;
    }

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
