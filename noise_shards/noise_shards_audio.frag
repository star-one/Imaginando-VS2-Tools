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
            "default": 0.2632,
            "name": "cracks",
            "min": 0.002,
            "max": 0.04
        },
        {
            "default": 0.6,
            "name": "fill"
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
    "uuid": "70d6c635-de40-4035-b477-e538a00555f3"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How often the layout and the flips change (the plain version has a rate knob).
const float RATE_BASE = 0.5;

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

// How much the corners of the shards tremble (in shard sizes).
const float TREMOR = 0.02;

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
    float fillEff = clamp(fill + 0.3 * midLv, 0.0, 1.0);
    float cracksEff = cracks * (1.0 + 1.5 * bassLv);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    // shard size: bigger zoom gives bigger, fewer shards
    float cells = 6.0 / zoom;
    vec2 g = p * cells;
    vec2 ic = floor(g);

    // the whole layout is re-rolled at irregular moments
    float t = tm * RATE_BASE;
    float lay = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6) + floor(bassLv * 4.0) * 23.0, 512.0);

    // find the nearest and second-nearest shard centres
    float d1 = 1e5;
    float d2 = 1e5;
    vec2 id1 = vec2(0.0);
    for (int j = -1; j <= 1; j++)
    {
        for (int i = -1; i <= 1; i++)
        {
            vec2 cc = ic + vec2(float(i), float(j));
            vec2 site = cc + hash2(cc + lay);
            site += TREMOR * vec2(sin(tm * 23.0 + hash(cc) * TAU), cos(tm * 29.0 + hash(cc + 3.0) * TAU));
            float d = length(g - site);
            if (d < d1)
            {
                d2 = d1;
                d1 = d;
                id1 = cc;
            }
            else if (d < d2)
            {
                d2 = d;
            }
        }
    }

    // each shard is lit or dark, and flips at its own irregular moments
    float hs = hash(id1 + lay + 5.5);
    float lit = step(hs, fillEff);
    float ft = tickId(t * 3.0 + hs * 7.0);
    float flip = step(0.8 - 0.5 * highLv, hash(vec2(ft, hs * 91.0)));
    lit = abs(lit - flip);

    // rainbow = 0 keeps the Layer colour only; 1 gives the harsh palette
    vec3 shardCol = mix(vec3(1.0), pick(hash(id1 + lay + 9.9)), rainbow);

    // hard bright cracks along the edges, with a glow
    float edge = d2 - d1;
    float wC = cracksEff * cells;
    float crack = 1.0 - smoothstep(wC, wC + aa * cells * 2.0, edge);
    float crackGlow = glowEff * exp(-edge / (0.12 + 0.3 * glowEff)) * 0.5;

    vec3 col = shardCol * lit * 0.85;
    col += mix(vec3(1.0), shardCol, 0.5) * crack;
    col += shardCol * crackGlow * (1.0 - crack);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
