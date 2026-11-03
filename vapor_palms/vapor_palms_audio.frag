/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4545,
            "name": "zoom",
            "min": 0.5,
            "max": 1.6
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.5,
            "name": "width"
        },
        {
            "default": 0.4286,
            "name": "height",
            "min": 0.3,
            "max": 1.0
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
    "uuid": "e90b3d58-4c16-4a7f-8d25-b1f7a6c02e49"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How many palms there are (the plain version has a palms knob).
const int PALMS_BASE = 2;

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

vec3 PINK = vec3(1.0, 0.2, 0.7);
vec3 CYAN = vec3(0.1, 0.9, 1.0);

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

// Distance from p to a palm tree (negative inside it): a curved trunk,
// seven drooping fronds and two coconuts.
float palmDist(vec2 p, vec2 base, float trunkH, float lean, float fl, float sc, float phase, float tm, float sway)
{
    // quick reject: nothing of this palm is anywhere near
    vec2 mid = base + vec2(lean * 0.5, trunkH * 0.5);
    float reach = trunkH * 0.5 + fl * 1.5 + abs(lean) + 0.1;
    if (length(p - mid) > reach) return 1.0;

    float swing = sin(tm * 0.2 + phase) * 0.02 * sway;

    // trunk: six short segments that taper towards the top
    float d = 1e5;
    vec2 prev = base;
    for (int i = 1; i <= 6; i++)
    {
        float t = float(i) / 6.0;
        vec2 cur = base + vec2((lean + swing) * t * t, trunkH * t);
        float r = sc * (0.022 - 0.010 * t);
        d = min(d, segDist(p, prev, cur) - r);
        prev = cur;
    }
    vec2 crown = prev;

    // fronds fanning out from the crown and drooping under their own weight
    for (int k = 0; k < 7; k++)
    {
        float ang = 1.57 + (float(k) - 3.0) * 0.55 + sin(tm * 0.25 + phase + float(k)) * 0.04 * sway;
        vec2 dir = vec2(cos(ang), sin(ang));
        float droop = (0.35 + 0.65 * abs(cos(ang))) * 0.6;
        vec2 pp = crown;
        for (int i = 1; i <= 8; i++)
        {
            float s = float(i) / 8.0;
            vec2 cur = crown + fl * (dir * s + vec2(0.0, -droop * s * s));
            float r = sc * (0.016 * (1.0 - s) + 0.0025);
            d = min(d, segDist(p, pp, cur) - r);
            pp = cur;
        }
    }

    // coconuts
    d = min(d, length(p - crown - vec2(-0.012, -0.014) * sc) - 0.014 * sc);
    d = min(d, length(p - crown - vec2(0.014, -0.012) * sc) - 0.014 * sc);
    return d;
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

    // angle is in degrees: tilts the whole picture
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    int nPalms = PALMS_BASE;

    float d = 1e5;
    for (int c = 0; c < 3; c++)
    {
        if (c >= nPalms) break;

        vec2 base;
        float lean;
        float sc;
        float phase;
        if (c == 0)
        {
            base = vec2(-0.62, -0.58); lean = 0.14; sc = 1.0; phase = 0.0;
        }
        else if (c == 1)
        {
            base = vec2(0.66, -0.58); lean = -0.16; sc = 0.9; phase = 2.1;
        }
        else
        {
            base = vec2(-0.2, -0.58); lean = 0.05; sc = 0.55; phase = 4.0;
        }

        // height = trunk height, width = how long the fronds are
        float trunkH = height * zoom * sc;
        float fl = (0.12 + 0.2 * clamp(width + 0.3 * midLv, 0.0, 1.0)) * zoom * sc;
        d = min(d, palmDist(p, base, trunkH, lean * zoom * sc, fl, zoom * sc, phase, tm, 1.0 + 3.0 * bassLv));
    }

    // dark solid silhouette with a neon rim light and a soft glow outside it
    float fillMask = smoothstep(aa, -aa, d);
    float rim = 1.0 - smoothstep(aa, aa * 3.0 + 0.003, abs(d));
    float halo = glowEff * exp(-max(d, 0.0) / 0.03) * 0.6;

    vec3 rimCol = mix(CYAN, PINK, smoothstep(-0.6, 0.6, p.x + (highLv - 0.5) * 0.6));
    rimCol = mix(vec3(1.0), rimCol, rainbow);      // rainbow = 0 keeps the Layer colour only
    vec3 fillCol = mix(vec3(0.02), vec3(0.09, 0.0, 0.18), rainbow);

    vec3 col = fillCol * fillMask + rimCol * (rim + halo);
    vec3 finalColor = clamp(col, 0.0, 1.0);

    // the silhouette is opaque so it hides whatever is behind it
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * clamp(max(fillMask, coloredPixels), 0.0, 1.0));
}
