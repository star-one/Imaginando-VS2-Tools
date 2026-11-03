/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.0,
            "name": "zoom",
            "min": 0.0,
            "max": 11.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.0,
            "name": "target",
            "min": 0.0,
            "max": 6.0
        },
        {
            "default": 0.5,
            "name": "detail",
            "min": 24.0,
            "max": 160.0
        },
        {
            "default": 0.0,
            "name": "julia"
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
    "uuid": "4a9c7e13-d2b8-4f60-a5e1-8b3d6f90c2a7"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

// Hard cap on iterations per pixel (the detail knob sets the actual number, up to this).
const int MAX_ITER = 160;

// How fast the ripples flow outwards and how fast the palette drifts.
const float RIPPLE_RATE = 0.15;
const float COLOUR_RATE = 0.04;

// The Julia set that the julia knob morphs towards.
const vec2 JULIA_C = vec2(-0.8, 0.156);

vec3 palette(float t)
{
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    float ca = cos(radians(angle));
    float sa = sin(radians(angle));
    p = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);

    // target picks a famous place to dive into (0 = the whole set); values are approximate
    int ti = int(clamp(floor(target), 0.0, 5.0));
    vec2 centre = vec2(-0.5, 0.0);
    float base = 1.4;                                   // half-height of the view when zoom = 0
    if (ti == 1) { centre = vec2(-0.743643887037151, 0.131825904205330); base = 0.30; }   // seahorse valley
    else if (ti == 2) { centre = vec2(0.275, 0.006); base = 0.15; }                        // elephant valley
    else if (ti == 3) { centre = vec2(-1.7549, 0.0); base = 0.08; }                        // mini Mandelbrot
    else if (ti == 4) { centre = vec2(-0.761574, -0.0847596); base = 0.03; }               // spiral
    else if (ti == 5) { centre = vec2(-0.10109636384562, 0.95628651080914); base = 0.05; } // triple spiral

    // zoom is a depth in octaves: every +1 doubles the magnification
    float scale = base * exp2(-zoom);
    vec2 pc = centre + p * 2.0 * scale;

    // julia = 0 is the Mandelbrot set; julia = 1 turns the same view into a Julia set
    vec2 cc = mix(pc, JULIA_C, julia);
    vec2 z = mix(vec2(0.0), pc, julia);

    // deeper views need more iterations
    int maxI = int(min(float(MAX_ITER), detail + zoom * 6.0));

    float n = 0.0;
    float escaped = 0.0;
    for (int i = 0; i < MAX_ITER; i++)
    {
        if (i >= maxI) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + cc;
        if (dot(z, z) > 256.0)
        {
            escaped = 1.0;
            n = float(i);
            break;
        }
    }

    vec3 finalColor = vec3(0.0);

    if (escaped > 0.5)
    {
        // smooth iteration count, so the colour bands have no steps
        float sn = n - log2(log2(dot(z, z))) + 4.0;

        // rim is close to 1 right next to the set and falls off with distance
        float rim = clamp(sn / float(maxI), 0.0, 1.0);

        float shade = 0.25 + 0.75 * sqrt(rim);
        float stripe = 0.65 + 0.35 * sin(sn * 1.2 - tm * RIPPLE_RATE);
        float intensity = shade * stripe;
        float rimGlow = glow * pow(rim, 4.0) * 1.5;

        // rainbow = 0 keeps the Layer colour only; 1 gives the drifting palette
        vec3 pal = mix(vec3(1.0), palette(sn * 0.03 + tm * COLOUR_RATE), rainbow);

        finalColor = pal * (intensity + rimGlow);
    }

    finalColor = clamp(finalColor, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
