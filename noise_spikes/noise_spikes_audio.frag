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
            "default": 0.2,
            "name": "width",
            "min": 0.005,
            "max": 0.08
        },
        {
            "default": 0.3636,
            "name": "height",
            "min": 0.05,
            "max": 0.6
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
    "uuid": "750457db-48a6-4425-be65-835dbee9adfa"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How many traces are drawn (the plain version has a traces knob).
const int TRACES_BASE = 3;

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

// How fast the traces scroll sideways, in screen heights per unit of time.
const float SCROLL = 0.12;

// Half-width of the lines, in screen heights.
const float LINE = 0.003;

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

// How much the spikes are shaped by the music. The plain version has none.
float envAt(float xs)
{
    return clamp(0.15 + 1.2 * react * texture(fftTex, vec2(clamp(xs, 0.0, 1.0), 0.0)).r, 0.0, 1.5);
}

// Height of the spike at column j on trace k. Most are small and a few are huge, they
// arrive in sudden bursts, and now and then one is enormous.
float vertY(float j, float k, float amp)
{
    float v = hash(vec2(j, k * 17.0));
    float s = pow(v, 3.0);
    float sgn = (hash(vec2(j + 0.5, k * 17.0 + 3.0)) < 0.5) ? -1.0 : 1.0;
    float burst = mix(0.12, 1.0, step(0.55, hash(vec2(floor(j / 6.0), k + 11.0))));
    float big = 1.0 + 0.9 * step(0.96, hash(vec2(j, k + 29.0)));
    return sgn * amp * s * burst * big;
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

    // column width: bigger zoom gives coarser, wider zigzags
    float cw = width * zoom;
    float scrollX = tm * SCROLL;
    float x = p.x + scrollX;
    float j = floor(x / cw);
    vec2 P2 = vec2(x, p.y);

    int nT = TRACES_BASE;
    float amp = height * (1.0 + 0.5 * bassLv);

    // how loud the music is at the four columns around this pixel (always 1 in the plain version)
    float e0 = envAt(((j - 1.0) * cw - scrollX) / aspect + 0.5);
    float e1 = envAt((j * cw - scrollX) / aspect + 0.5);
    float e2 = envAt(((j + 1.0) * cw - scrollX) / aspect + 0.5);
    float e3 = envAt(((j + 2.0) * cw - scrollX) / aspect + 0.5);

    vec3 col = vec3(0.0);
    for (int k = 0; k < 6; k++)
    {
        if (k >= nT) break;
        float fk = float(k);
        float base = (fk - (float(nT) - 1.0) * 0.5) * (0.8 * (1.0 + 0.5 * midLv) / float(nT));

        // a jagged line through the spike tops of the columns on either side of this pixel
        float ya = base + vertY(j - 1.0, fk, amp * e0);
        float yb = base + vertY(j, fk, amp * e1);
        float yc = base + vertY(j + 1.0, fk, amp * e2);
        float yd = base + vertY(j + 2.0, fk, amp * e3);
        float d = segDist(P2, vec2((j - 1.0) * cw, ya), vec2(j * cw, yb));
        d = min(d, segDist(P2, vec2(j * cw, yb), vec2((j + 1.0) * cw, yc)));
        d = min(d, segDist(P2, vec2((j + 1.0) * cw, yc), vec2((j + 2.0) * cw, yd)));

        float line = 1.0 - smoothstep(LINE * 0.6, LINE * (1.0 + 2.0 * highLv), d);
        float halo = glowEff * exp(-d / 0.015) * 0.5;

        // each trace drops out and returns at irregular moments
        float on = step(0.12, hash(vec2(tickId(tm * 2.0 + fk * 1.7), fk)));
        vec3 tc = mix(vec3(1.0), pick(hash(vec2(fk, 3.3))), rainbow);
        col += tc * (line + halo) * on;
    }

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
