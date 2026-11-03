/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2593,
            "name": "zoom",
            "min": 0.3,
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
            "min": 0.5,
            "max": 3.0
        },
        {
            "default": 0.4375,
            "name": "height",
            "min": -0.4,
            "max": 0.4
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
    "uuid": "b6d2c871-0f39-4a5e-8c14-e7a9d3f0825b"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// How much the floor ripples (the plain version has a warp knob); bass adds to it.
const float WARP_BASE = 0.3;

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

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float warpEff = WARP_BASE + 0.9 * bassLv;


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees: tilts the whole picture
    p = rot(radians(angle)) * p;

    // height moves the horizon up and down the screen
    float y0 = height;
    float depth = y0 - p.y;      // positive below the horizon

    vec3 col = vec3(0.0);

    // ---- glow above the horizon ----
    float up = max(-depth, 0.0);
    float aboveMask = step(0.0, -depth);
    col += aboveMask * mix(PINK, vec3(1.0, 0.5, 0.3), 0.4) * exp(-up * 7.0) * (0.35 + 0.65 * glowEff);
    col += aboveMask * vec3(0.25, 0.04, 0.4) * 0.35 * exp(-up * 2.0);

    // ---- the checkerboard floor, rushing towards the viewer ----
    if (depth > 0.0)
    {
        float z = 0.3 / (depth + 0.004);
        float S = max(zoom * (1.0 + 0.15 * midLv), 0.05);                 // tile size
        float xw = p.x * z;
        float zw = z + tm * 0.8;

        // warp ripples the floor like cloth in the wind
        zw += sin(xw * 0.9 + tm * 0.1) * warpEff * S * 0.8;
        xw += sin(zw * 0.7 - tm * 0.08) * warpEff * S * 0.5;

        float gx = xw / (S * width);
        float gz = zw / S;
        float chk = mod(floor(gx) + floor(gz), 2.0);

        // pink and teal tiles, going hazy towards the horizon
        vec3 tileA = PINK;
        vec3 tileB = CYAN * 0.55;
        vec3 tile = mix(tileB, tileA, chk);

        // far tiles are too small to resolve, so blend them to their average
        float contrast = smoothstep(0.0, 0.14, depth);
        tile = mix((tileA + tileB) * 0.5, tile, contrast);

        // neon seams between the tiles
        float ex = abs(fract(gx) - 0.5);
        float ez = abs(fract(gz) - 0.5);
        float seam = smoothstep(0.46, 0.5, max(ex, ez)) * contrast;
        vec3 seamCol = vec3(1.0, 0.9, 1.0) * glowEff * 0.6;

        // a glossy sheen down the middle, and haze at the horizon
        float sheen = glowEff * exp(-p.x * p.x * 4.0) * exp(-depth * 4.0) * 0.4;
        float fog = exp(-depth * 5.0);
        vec3 fogCol = vec3(1.0, 0.4, 0.6) * 0.6;

        float fadeIn = smoothstep(0.0, 0.02, depth);
        vec3 floorCol = mix(tile * 0.9 + sheen, fogCol, fog * 0.7);
        col += (floorCol + seamCol * seam * (1.0 + 2.0 * highLv)) * fadeIn;
    }

    // rainbow = 0 keeps the Layer colour only (greyscale); 1 gives the full vapourwave colours
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, rainbow);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
