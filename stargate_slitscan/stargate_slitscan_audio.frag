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
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.6,
            "name": "width"
        },
        {
            "default": 0.3,
            "name": "height"
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
    "uuid": "9e4b7d30-1c85-4f2a-b3d6-7a8c5e1f0942"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Base streak smear (0..1); mids stretch the streaks further.
const float STRETCH_BASE = 0.5;

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

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 palette(float t)
{
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float stretchEff = clamp(STRETCH_BASE + 0.4 * midLv, 0.0, 1.0);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees; turn the whole tunnel, then apply zoom
    float ang = radians(angle);
    float cs = cos(ang);
    float sn = sin(ang);
    p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);
    p /= zoom;

    // the slit: a bright horizontal band whose half-height follows "height"
    float ay = abs(p.y);
    float h0 = 0.01 + (height + 0.5 * bassLv) * 0.12;
    float s = max(ay - h0, 0.0);

    // perspective: depth grows towards the slit, streaks fan out from it
    float z = 1.0 / (s + 0.03);
    float u = p.x * z;
    float v = z + tm;

    // width = streak thickness, stretch = how far streaks are smeared along depth
    float uf = mix(6.0, 0.6, width);
    float vf = mix(3.0, 0.2, stretchEff);

    float n1 = vnoise(vec2(u * uf, v * vf));
    float n2 = vnoise(vec2(u * uf * 2.3 + 17.0, v * vf * 1.7 + 5.0));
    float n = n1 * 0.65 + n2 * 0.35;
    float streak = smoothstep(0.35, 0.85, n);

    // detail fades out approaching the slit to avoid shimmering
    float fade = smoothstep(0.0, 0.2, s);
    float streakI = streak * fade * (0.7 + 0.6 * glowEff) * (1.0 + highLv);

    // colour: 0 = Layer colour only, 1 = full drifting palette
    vec3 streakCol = mix(vec3(1.0), palette(n2 * 0.6 + v * 0.04 + tm * 0.05 + highLv * 0.2), rainbow);

    // bright slit core plus halo that follows glow
    float core = smoothstep(h0, h0 * 0.4, ay);
    float halo = glowEff * exp(-s / (0.02 + 0.25 * glowEff));
    vec3 haloCol = mix(vec3(1.0), palette(tm * 0.05), rainbow * 0.5);

    vec3 finalColor = streakCol * streakI + haloCol * (core + halo);

    float coloredPixels = dot(clamp(finalColor, 0., 1.), vec3(1.0));
    fragColor = vec4(clamp(finalColor, 0., 1.) * color.rgb, alpha * coloredPixels);
}
