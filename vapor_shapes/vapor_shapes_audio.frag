/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4118,
            "name": "zoom",
            "min": 0.3,
            "max": 2.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.25,
            "name": "copies",
            "min": 1.0,
            "max": 5.0
        },
        {
            "default": 0.5,
            "name": "perspective"
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
    "uuid": "37c9e0b5-1a82-4d46-b3f7-8d2c5a6e9014"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Which shape is drawn: 0 cube, 1 octahedron, 2 pyramid, 3 a mix (the plain version has a shape knob).
const int SHAPE_MODE = 3;

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

// How far apart the pink and cyan ghost images are (screen height = 1).
const float AB = 0.006;

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

mat3 rotX(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

mat3 rotY(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotZ(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
}

// corner i of shape type: 0 = cube, 1 = octahedron, 2 = square pyramid
vec3 vert(int type, int i)
{
    if (type == 0)
    {
        return vec3(float(i & 1) * 2.0 - 1.0, float((i >> 1) & 1) * 2.0 - 1.0, float((i >> 2) & 1) * 2.0 - 1.0) * 0.7;
    }
    if (type == 1)
    {
        float sgn = ((i & 1) == 0) ? 1.0 : -1.0;
        int ax = i >> 1;
        vec3 v = vec3(0.0);
        if (ax == 0) v.x = sgn;
        else if (ax == 1) v.y = sgn;
        else v.z = sgn;
        return v;
    }
    if (i == 4) return vec3(0.0, 1.0, 0.0);
    return vec3(float(i & 1) * 2.0 - 1.0, -0.7, float((i >> 1) & 1) * 2.0 - 1.0) * vec3(0.8, 1.0, 0.8);
}

int vcount(int type)
{
    if (type == 0) return 8;
    if (type == 1) return 6;
    return 5;
}

// are corners i and j (i < j) joined by an edge?
bool isEdge(int type, int i, int j)
{
    if (type == 0)
    {
        int x = i ^ j;
        return (x == 1 || x == 2 || x == 4);
    }
    if (type == 1)
    {
        return (i >> 1) != (j >> 1);
    }
    if (j == 4) return true;
    int y = i ^ j;
    return (y == 1 || y == 2);
}

float segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return length(pa - ba * h);
}

// distance from p to the nearest edge of the tumbling shape
float shapeDist(vec2 p, int type, mat3 R, float size, float persp)
{
    vec2 pv[8];
    int n = vcount(type);
    for (int i = 0; i < 8; i++)
    {
        pv[i] = vec2(0.0);
        if (i >= n) continue;
        vec3 v = R * vert(type, i);
        float s = 1.0 / (1.0 + persp * 0.35 * v.z);
        pv[i] = v.xy * s * size;
    }

    float d = 1e5;
    for (int i = 0; i < 8; i++)
    {
        if (i >= n) break;
        for (int j = i + 1; j < 8; j++)
        {
            if (j >= n) break;
            if (isEdge(type, i, j)) d = min(d, segDist(p, pv[i], pv[j]));
        }
    }
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

    // angle is in degrees: rolls the whole picture
    p = rot(radians(angle)) * p;

    int nCopies = int(clamp(floor(copies), 1.0, 4.0));
    int mode = SHAPE_MODE;   // 0 cube, 1 octahedron, 2 pyramid, 3 a mix

    float size = 0.28 * zoom * (1.0 + 0.25 * bassLv);
    if (nCopies > 1) size *= 0.6;

    // pink and cyan ghost images, pulled apart like a bad VHS tape
    vec2 ab = vec2(AB * (1.0 + 4.0 * highLv), 0.0);

    float dPink = 1e5;
    float dCyan = 1e5;
    for (int c = 0; c < 4; c++)
    {
        if (c >= nCopies) break;
        float fc = float(c);

        vec2 centre = vec2(0.0);
        if (nCopies > 1)
        {
            float a = fc * TAU / float(nCopies) + tm * 0.04;
            centre = 0.3 * vec2(cos(a) * 1.3, sin(a));
        }

        int type = (mode == 3) ? (c % 3) : mode;
        float ph = fc * 1.7;
        mat3 R = rotY(tm * 0.23 + ph) * rotX(tm * 0.17 + ph * 0.6) * rotZ(tm * 0.11 + midLv * 1.0);

        dPink = min(dPink, shapeDist(p - centre - ab, type, R, size, perspective));
        dCyan = min(dCyan, shapeDist(p - centre + ab, type, R, size, perspective));
    }

    // neon lines: a crisp core plus a soft glow
    float w = 0.004;
    float gw = 0.01 + 0.03 * glowEff;
    float iPink = (1.0 - smoothstep(w * 0.6, w, dPink)) + glowEff * exp(-dPink / gw) * 0.5;
    float iCyan = (1.0 - smoothstep(w * 0.6, w, dCyan)) + glowEff * exp(-dCyan / gw) * 0.5;

    // rainbow = 0 keeps the Layer colour only; 1 gives the pink and cyan ghosts
    vec3 colPink = mix(vec3(1.0), vec3(1.0, 0.2, 0.7), rainbow);
    vec3 colCyan = mix(vec3(1.0), vec3(0.1, 0.9, 1.0), rainbow);
    vec3 col = colPink * iPink + colCyan * iCyan;

    // scanlines
    float scan = 0.82 + 0.18 * sin(texCoord.y * resolution.y * 1.5708);
    col *= scan;

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
