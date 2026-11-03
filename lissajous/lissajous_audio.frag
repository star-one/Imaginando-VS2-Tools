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
            "default": 0.2857,
            "name": "ratio",
            "min": 1.0,
            "max": 8.0
        },
        {
            "default": 0.6,
            "name": "width"
        },
        {
            "default": 0.6,
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
            "default": 0.0,
            "name": "rainbow"
        }
    ],
    "url": "",
    "uuid": "c1d9f4a2-8e37-4b50-a6c8-2d7e0b9f3a61"
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

const float TAU = 6.28318530718;
const int SEGMENTS = 128;
const float THICKNESS = 0.01;

vec3 hsv2rgb(vec3 c)
{
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// distance from point p to segment a-b, plus position along it (0..1)
vec2 segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.4 * bassLv, 0.0, 1.0);
    float ratioEff = ratio + midLv;
    float th = THICKNESS * (1.0 + 0.8 * highLv);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // mids tilt the figure (up to 45 degrees); rotate the pixel opposite to the figure's rotation
    float ang = radians(midLv * 45.0);
    float cs = cos(ang);
    float sn = sin(ang);
    p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);

    // amplitudes: width/height 1.0 touches the screen edges at zoom 1.0
    vec2 amp = vec2(width * 0.5 * aspect, height * 0.5) * zoom * (1.0 + 0.35 * bassLv);

    // slow constant phase drift keeps the figure alive without modulation
    float phase = tm * 0.3;

    float bestD = 1e5;
    float bestT = 0.0;

    vec2 prev = vec2(0.0, amp.y * sin(phase));
    for (int i = 1; i <= SEGMENTS; i++)
    {
        float t = float(i) / float(SEGMENTS);
        float a = t * TAU;
        vec2 cur = vec2(amp.x * sin(a), amp.y * sin(ratioEff * a + phase));
        vec2 sd = segDist(p, prev, cur);
        if (sd.x < bestD)
        {
            bestD = sd.x;
            bestT = (float(i - 1) + sd.y) / float(SEGMENTS);
        }
        prev = cur;
    }

    // crisp core of fixed thickness, plus a halo whose strength and spread follow glow
    float core = smoothstep(th, th * 0.4, bestD);
    float halo = glowEff * exp(-bestD / (th * (2.0 + 6.0 * glowEff)));
    float intensity = clamp(core + halo, 0.0, 1.0);

    // rainbow = 0 keeps the Layer colour only; up to 1 spreads hues along the curve
    vec3 rainbowCol = hsv2rgb(vec3(fract(bestT + tm * 0.1 + highLv * 0.3), 0.8, 1.0));
    vec3 tint = mix(vec3(1.0), rainbowCol, rainbow);

    vec3 finalColor = tint * intensity;
    float coloredPixels = dot(clamp(finalColor, 0., 1.), vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
