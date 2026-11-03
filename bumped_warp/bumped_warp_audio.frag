/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.5,
            "name": "warpSpeed"
        },
        {
            "default": 0.5,
            "name": "warpFreq"
        },
        {
            "default": 0.5,
            "name": "warpAmp"
        },
        {
            "default": 0.5,
            "name": "bumpStrength"
        },
        {
            "default": 0.5,
            "name": "react",
            "min": 0.0,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "specular"
        },
        {
            "default": 0.0,
            "name": "holes"
        }
    ],
    "url": "",
    "uuid": "9aa93ccb-0695-4404-baac-a9e46e91ee2c"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Resting light speed, as a knob position from 0 to 1 (the plain version has a lightSpeed knob).
const float LIGHT_SPEED_BASE = 0.5;

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

// The biggest hole size: the surface height (0 to about 1) below which a pit is cut away
// when the holes knob is at maximum.
const float HOLE_MAX = 0.8;

// How soft the edge of a hole is, in surface height. Smaller is sharper.
const float HOLE_SOFT = 0.04;

// working values, worked out once in main() from the knobs
float tmG;
float speed;
float freq;
float amp;
float bumpFactor;
float lSpeed;
float specPow;

// Warp function - sinusoidal feedback layers
vec2 W(vec2 p)
{
    p = (p + 3.0) * freq;
    float t = tmG * speed;

    for (int i = 0; i < 3; i++)
    {
        p += cos(p.yx * 3.0 + vec2(t, 1.57)) / 3.0 * amp;
        p += sin(p.yx + t + vec2(1.57, 0.0)) / 2.0 * amp;
        p *= 1.3;
    }

    // Jitter to reduce high-frequency aliasing
    p += fract(sin(p + vec2(13.0, 7.0)) * 5e5) * 0.03 - 0.015;

    return mod(p, 2.0) - 1.0;
}

// Bump function - returns surface height
float bumpFunc(vec2 p)
{
    return length(W(p)) * 0.7071;
}

// Smooth fractional for procedural color
vec3 smoothFract(vec3 x)
{
    x = fract(x);
    return min(x, x * (1.0 - x) * 12.0);
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);


    // Map parameters to useful ranges
    tmG = tm;
    speed = 0.1 + warpSpeed * 2.0;
    freq = 2.0 + warpFreq * 4.0;
    amp = 0.2 + clamp(warpAmp + 0.3 * midLv, 0.0, 1.0) * 0.8;
    bumpFactor = 0.01 + bumpStrength * 0.15 * (1.0 + 1.5 * bassLv);
    lSpeed = 0.2 + LIGHT_SPEED_BASE * 2.0;
    specPow = 4.0 + specular * 24.0;

    // Aspect-corrected centered UV
    float div = resolution.y / resolution.x;
    vec2 uv = (texCoord - 0.5) * vec2(1.0, div);

    // Vector setup
    vec3 sp = vec3(uv, 0.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 lp = vec3(cos(tm * lSpeed) * 0.5, sin(tm * lSpeed) * 0.2, -1.0);
    vec3 sn = vec3(0.0, 0.0, -1.0);

    // Bump mapping - perturb the normal
    vec2 eps = vec2(4.0 / resolution.y, 0.0);

    float f = bumpFunc(sp.xy);
    float fx = bumpFunc(sp.xy - eps.xy);
    float fy = bumpFunc(sp.xy - eps.yx);

    fx = (fx - f) / eps.x;
    fy = (fy - f) / eps.x;
    sn = normalize(sn + vec3(fx, fy, 0.0) * bumpFactor);

    // Lighting
    vec3 ld = lp - sp;
    float lDist = max(length(ld), 0.0001);
    ld /= lDist;

    float atten = 1.0 / (1.0 + lDist * lDist * 0.15);
    atten *= f * 0.9 + 0.1;

    // Diffuse
    float diff = max(dot(sn, ld), 0.0);
    diff = pow(diff, 4.0) * 0.66 + pow(diff, 8.0) * 0.34;

    // Specular
    float spec = pow(max(dot(reflect(-ld, sn), -rd), 0.0), specPow);

    // Procedural texture color using warp and VS2 color
    vec2 wp = W(sp.xy);
    vec3 texCol = smoothFract(wp.xyy) * 0.3 + 0.2;
    texCol = mix(texCol, color.rgb, 0.5);
    texCol = smoothstep(0.05, 0.75, pow(texCol, vec3(0.75, 0.8, 0.85)));

    // Final color
    vec3 col = (texCol * (diff * vec3(1.0, 0.97, 0.92) * 2.0 + 0.5) + vec3(1.0, 0.6, 0.2) * spec * (2.0 + 4.0 * highLv)) * atten;

    // Environment reflection
    float ref = max(dot(reflect(rd, sn), vec3(1.0)), 0.0);
    col += col * pow(ref, 4.0) * vec3(0.25, 0.5, 1.0) * 3.0;

    // Gamma correction and output
    vec3 finalCol = sqrt(clamp(col, 0.0, 1.0));
    float brightness = dot(finalCol, vec3(0.333));

    // Holes: the pits of the bumps are where the surface height f is low. Wherever f is below
    // the hole size, the surface is cut away so the layer underneath shows through.
    float holeThr = clamp(holes + 0.3 * bassLv, 0.0, 1.0) * HOLE_MAX;
    float holeMask = mix(1.0, smoothstep(holeThr, holeThr + HOLE_SOFT, f), step(0.001, holeThr));

    fragColor = vec4(finalCol, alpha * brightness * holeMask);
}
