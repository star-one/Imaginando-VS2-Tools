/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2353,
            "name": "spacing",
            "min": 0.15,
            "max": 1.0
        },
        {
            "default": 0.1579,
            "name": "thickness",
            "min": 0.01,
            "max": 0.2
        },
        {
            "default": 0.5,
            "name": "bend"
        },
        {
            "default": 0.5,
            "name": "shapes"
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
    "uuid": "d7c13a96-5f08-4e2b-8b64-a9f3e0c71d28"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Length of each tube section (the plain version has this as a knob).
const float SECTION_LENGTH = 1.05;

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

// Chance (0..1) that any given section is black.
const float BLACK_CHANCE = 0.15;

const float TAU = 6.28318530718;
const float C0 = 0.03;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 hsv2rgb(vec3 c)
{
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main()
{
    float tm = time * SPEED_SCALE;

    // ---- audio: three bands, scaled by react and kept in 0..1 ----
    float bassLv = clamp(band(BASS_HZ) * react, 0.0, 1.0);
    float midLv  = clamp(band(MID_HZ)  * react, 0.0, 1.0);
    float highLv = clamp(band(HIGH_HZ) * react, 0.0, 1.0);

    float glowEff = clamp(glow + 0.5 * bassLv, 0.0, 1.0);
    float bendEff = clamp(bend + 0.4 * midLv, 0.0, 1.0);


    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    float r0 = length(p);

    // first-pass depth, used only to steer the bends of the tube
    float z0 = 0.3 / (r0 + C0);
    float zt = z0 + tm * 0.8;

    // bend 0 = straight tube; more bend = wider sweeps left/right and up/down,
    // with quicker turns near the top end
    vec2 path = vec2(sin(zt * 0.9 + 1.3 * sin(zt * 0.37)),
                     cos(zt * 0.7 + 1.1 * sin(zt * 0.53)));
    path += bendEff * bendEff * 0.7 * vec2(sin(zt * 2.9 + 1.7), cos(zt * 3.7 + 0.4));

    // far sections swing furthest, the screen centre stays anchored
    float swing = smoothstep(0.0, 0.4, r0) * exp(-r0 * 1.8);
    p -= path * (bendEff * 0.4) * swing;

    float r = length(p);
    float a = atan(p.y, p.x);

    // final depth: distance along the tube, flowing towards the viewer
    float z = 0.3 / (r + C0);
    float v = z + tm * 0.8;

    // the tube rolls a little as it turns
    float a2 = a + sin(v * 0.35) * bendEff * 1.2;

    // ---- sections: each one picks its own random look ----
    float secLen = SECTION_LENGTH;
    float secX = v / secLen;
    float id = floor(secX);
    float f = fract(secX);

    float h1 = hash(vec2(id, 3.1));
    float h2 = hash(vec2(id, 11.7));
    float h3 = hash(vec2(id, 23.3));
    float h4 = hash(vec2(id, 41.9));

    float isBlack = step(h1, BLACK_CHANCE);
    vec3 hueCol = mix(vec3(1.0), hsv2rgb(vec3(h2, 0.85, 1.0)), rainbow);
    float hasShapes = step(h3, shapes + 0.5 * highLv);

    // detail fades towards the centre to avoid shimmer
    float fade = smoothstep(C0, 0.3, r);

    // wall: lit from outside, so it glows evenly and dims with distance down the tube
    float lightFall = exp(-z * 0.15);
    float seamDist = min(f, 1.0 - f) * secLen;
    float seam = 0.55 + 0.45 * smoothstep(0.0, 0.04, seamDist);
    vec3 wall = hueCol * (1.0 - isBlack) * 0.7 * (1.0 + 0.5 * bassLv) * lightFall * seam;

    // ---- decoration: a grid of random geometric shapes on the inside wall ----
    float nc = floor(mix(5.0, 11.0, h4));        // cells around the tube (whole number, so no seam)
    float cell = 1.885 / nc;                     // square cells: tube circumference is 1.885
    float u = (a2 / TAU + 0.5) * nc;
    float w = f * secLen / cell;
    vec2 cid = vec2(mod(floor(u), nc), floor(w));
    vec2 q = fract(vec2(u, w)) - 0.5;

    float hc = hash(cid + vec2(id * 13.0, id * 7.0));
    float present = step(fract(hc * 7.31), 0.45);
    float type = floor(hc * 4.0);

    float sd;
    if (type < 0.5)
        sd = length(q) - 0.28;                          // disc
    else if (type < 1.5)
        sd = max(abs(q.x), abs(q.y)) - 0.24;            // square
    else if (type < 2.5)
        sd = (abs(q.x) + abs(q.y)) * 0.7071 - 0.26;     // diamond
    else
        sd = abs(length(q) - 0.25) - 0.05;              // ring outline

    float shapeMask = smoothstep(0.05, -0.02, sd) * present * hasShapes;
    vec3 shapeCol = mix(vec3(1.0), hsv2rgb(vec3(fract(h2 + 0.5), 0.7, 1.0)), rainbow);

    // ---- neon rings marking the movement: sharp-edged core with a soft glow around it ----
    float halfT = min(thickness * (1.0 + 0.6 * bassLv), spacing) * 0.5;
    float ringDist = abs(fract(v / spacing + 0.5) - 0.5) * spacing;

    // approximate size of one screen pixel along the tube, to keep the core edge crisp
    float pix = min(0.3 / ((r + C0) * (r + C0)) / resolution.y, halfT);
    float core = 1.0 - smoothstep(halfT - pix, halfT + pix, ringDist);

    float outside = max(ringDist - halfT, 0.0);
    float glowI = (0.15 + 1.2 * glowEff) * exp(-outside / (0.012 + 0.1 * glowEff));

    vec3 neonCol = mix(vec3(1.0), hsv2rgb(vec3(fract(h2 + 0.5), 0.9, 1.0)), rainbow);
    vec3 coreCol = mix(vec3(1.0), neonCol, 0.3);
    vec3 ringRGB = (coreCol * core + neonCol * glowI * (1.0 - core)) * (0.6 + 0.4 * lightFall);

    // bright exit light at the far end of the tube
    float halo = glowEff * exp(-r / (0.04 + 0.25 * glowEff));

    vec3 finalColor = wall * fade
                    + shapeCol * shapeMask * (0.9 + 0.8 * highLv) * lightFall * fade
                    + ringRGB * fade
                    + vec3(1.0) * halo;
    finalColor = clamp(finalColor, 0.0, 1.0);

    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
