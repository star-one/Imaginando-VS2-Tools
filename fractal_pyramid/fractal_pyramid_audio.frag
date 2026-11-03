/*
{
    "author": "The Winterval Conspiracy (audio-reactive version of a Shadertoy fractal pyramid)",
    "color": "magenta",
    "movement": true,
    "parameters": [
        {
            "default": 0.5,
            "name": "zoom"
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.5,
            "name": "fold"
        },
        {
            "default": 0.5,
            "name": "rotSpeed"
        },
        {
            "default": 0.5,
            "name": "react",
            "min": 0.0,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "glow"
        },
        {
            "default": 0.5,
            "name": "colorMix"
        }
    ],
    "url": "https://www.shadertoy.com/view/fractal-pyramid",
    "uuid": "a1c47e92-5d08-4b36-9e7f-c2d8b0f61a35"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

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

// working values, worked out once per pixel in main()
float tmG;
float speed;
float camDist;
float foldAmt;
float glowInt;
float cMix;

vec3 palette(float d)
{
    vec3 col1 = vec3(0.2, 0.7, 0.9);
    vec3 col2 = color.rgb;
    return mix(col1, col2, d + cMix - 0.5);
}

vec2 rotate(vec2 p, float a)
{
    float c = cos(a);
    float s = sin(a);
    return p * mat2(c, s, -s, c);
}

float map(vec3 p)
{
    for (int i = 0; i < 8; ++i)
    {
        float t = tmG * speed;
        p.xz = rotate(p.xz, t);
        p.xy = rotate(p.xy, t * 1.89);
        p.xz = abs(p.xz);
        p.xz -= foldAmt;
    }
    return dot(sign(p), p) / 5.0;
}

vec4 rm(vec3 ro, vec3 rd)
{
    float t = 0.0;
    vec3 col = vec3(0.0);
    float d = 0.0;
    for (float i = 0.0; i < 64.0; i++)
    {
        vec3 p = ro + rd * t;
        d = map(p) * 0.5;
        if (d < 0.02)
        {
            break;
        }
        if (d > 100.0)
        {
            break;
        }
        col += palette(length(p) * 0.1) / (glowInt * d);
        t += d;
    }
    return vec4(col, 1.0 / (d * 100.0));
}

void main(void)
{
    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    tmG = time * SPEED_SCALE;
    speed = 0.05 + rotSpeed * 0.4;

    // bass: the camera lunges in and the glow flares
    camDist = (20.0 + zoom * 60.0) * (1.0 - 0.15 * bassLv);

    // mids: the folds open and close
    foldAmt = 0.2 + clamp(fold + 0.2 * midLv, 0.0, 1.0) * 0.8;

    // glow: higher knob = brighter (the original had this the other way round,
    // dimmer as the knob went up; the default look is the same)
    glowInt = (800.0 - glow * 600.0) * (1.0 - 0.5 * bassLv);

    // highs: the colours slide between the two palette ends
    cMix = colorMix + 0.3 * highLv;

    float div = resolution.y / resolution.x;
    vec2 uv = (texCoord - 0.5) * vec2(1.0, div);

    // the camera orbits the pyramid; angle sets where the orbit starts
    vec3 ro = vec3(0.0, 0.0, -camDist);
    ro.xz = rotate(ro.xz, tmG * speed + radians(angle));

    vec3 cf = normalize(-ro);
    vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
    vec3 cu = normalize(cross(cf, cs));

    vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;
    vec3 rd = normalize(uuv - ro);

    vec4 col = rm(ro, rd);

    float brightness = dot(col.rgb, vec3(0.333));
    fragColor = vec4(col.rgb, alpha * brightness);
}
