/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.375,
            "name": "zoom",
            "min": 0.4,
            "max": 2.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.4444,
            "name": "points",
            "min": 3.0,
            "max": 12.0
        },
        {
            "default": 0.3,
            "name": "jitter"
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
    "uuid": "592d91eb-13dd-4521-9557-57f9e8a64fb9"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How many pens there are (the plain version has a pens knob).
const int PENS_BASE = 3;

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

// How often the pens jump to new paths.
const float EVENT_RATE = 0.5;

// Half-width of the lines, in screen heights.
const float TH = 0.003;

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

// Corner i of pen q's path at the moment given by tick. Every corner is a random place
// on or just beyond the screen, so the paths slash right across it.
vec2 corner(float i, float q, float tick, float spread, float aspect, float tm, float jit)
{
    vec2 pos = (hash2(vec2(i, q * 13.0 + tick)) - 0.5) * vec2(aspect, 1.0) * 1.3 * spread;
    pos += jit * 0.03 * vec2(sin(tm * 37.0 + i * 3.1 + q), cos(tm * 41.0 + i * 5.3 + q * 2.0));
    return pos;
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float jitterEff = clamp(jitter + 0.6 * midLv, 0.0, 1.5);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    int K = int(clamp(floor(points), 3.0, 12.0));
    int nPens = PENS_BASE;
    float jit = jitterEff;

    vec3 col = vec3(0.0);
    for (int q = 0; q < 4; q++)
    {
        if (q >= nPens) break;
        float fq = float(q);

        // each pen re-rolls its whole path at its own irregular moments
        float tick = tickId(tm * EVENT_RATE * (1.0 + 0.37 * fq)) + floor(bassLv * 4.0) * 7.0;

        vec2 prev = corner(0.0, fq, tick, zoom, aspect, tm, jit);
        float d = 1e5;
        float flare = 0.0;
        flare += exp(-length(p - prev) / 0.012);
        for (int i = 1; i < 12; i++)
        {
            if (i >= K) break;
            vec2 cur = corner(float(i), fq, tick, zoom, aspect, tm, jit);
            d = min(d, segDist(p, prev, cur));
            flare += exp(-length(p - cur) / 0.012);
            prev = cur;
        }

        float line = 1.0 - smoothstep(TH * 0.6, TH, d);
        float halo = glowEff * exp(-d / 0.02) * 0.4;

        // each pen drops out and returns at irregular moments
        float on = step(0.1, hash(vec2(tickId(tm * 3.0 + fq * 2.3), fq)));
        vec3 pc = mix(vec3(1.0), pick(hash(vec2(fq + tick, 5.5))), rainbow);
        col += pc * (line + halo + flare * (0.6 + 2.0 * highLv)) * on;
    }

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
