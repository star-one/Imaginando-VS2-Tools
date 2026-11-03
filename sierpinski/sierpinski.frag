/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2208,
            "name": "zoom",
            "min": 0.15,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.2105,
            "name": "width",
            "min": 0.01,
            "max": 0.2
        },
        {
            "default": 0.5385,
            "name": "levels",
            "min": 3.0,
            "max": 16.0
        },
        {
            "default": 0.4,
            "name": "fill"
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
    "uuid": "b8e2a5d0-6f14-4c93-9a7b-3d1e5f8c0b26"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Speed of the endless dive: loops per unit of time (each loop zooms in 8x).
const float DIVE_RATE = 0.02;

const float TAU = 6.28318530718;
const float SQ3_2 = 0.8660254;
const int MAX_LEVELS = 20;

vec3 palette(float t)
{
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    // Half-height of the view in triangle units (the whole triangle has side 1).
    float wh = 0.1 / zoom;

    // Zoomed in (zoom >= 1) the view dives endlessly into the triangle and loops
    // seamlessly. Zoomed right out (zoom < 0.7) it holds still on the whole triangle.
    // In between, the loop shows a small jump each time it restarts.
    float k = smoothstep(0.7, 1.0, zoom);
    vec2 centre = mix(vec2(0.5, 0.288675), vec2(0.357143, 0.123718), k);
    float dk = fract(tm * DIVE_RATE) * k;

    // world position inside the triangle with corners (0,0), (1,0) and (0.5, 0.866)
    vec2 w = centre + p * (2.0 * wh) * exp2(-3.0 * dk);

    // triangle coordinates: a runs along the bottom edge, b along the left edge
    float b = w.y / SQ3_2;
    float a = w.x - 0.5 * b;

    // how many levels of holes to look for; the dive reveals three more per loop
    float cap = levels + 3.0 * dk;

    float hole = -1.0;
    float e = 1.0;

    if (a >= 0.0 && b >= 0.0 && a + b <= 1.0)
    {
        for (int i = 0; i < MAX_LEVELS; i++)
        {
            if (float(i) >= cap) break;

            // split into four half-size triangles
            a *= 2.0;
            b *= 2.0;

            // the middle, upside-down one is a hole
            if (a < 1.0 && b < 1.0 && a + b > 1.0)
            {
                hole = float(i);
                e = min(min(1.0 - a, 1.0 - b), a + b - 1.0);   // distance to the hole's edge
                break;
            }

            // otherwise carry on inside whichever corner triangle we are in
            if (a >= 1.0) a -= 1.0;
            if (b >= 1.0) b -= 1.0;
        }
    }

    vec3 finalColor = vec3(0.0);

    if (hole >= 0.0)
    {
        // level relative to the dive, so colours and brightness stay continuous at the loop
        float lvRel = hole - 3.0 * dk;
        float fine = clamp(cap - hole, 0.0, 1.0);

        // width is measured in the hole's own units, so lines shrink with the holes
        float core = 1.0 - smoothstep(width * 0.8, width, e);
        float glowI = glow * exp(-e / (0.03 + 0.2 * glow));
        float levelFade = clamp(1.0 - 0.06 * lvRel, 0.35, 1.0) * fine;

        // rainbow = 0 keeps the Layer colour only; 1 colours each level of hole differently
        vec3 pal = mix(vec3(1.0), palette(lvRel * 0.11 + tm * 0.02), rainbow);

        finalColor = pal * (fill * 0.45 + glowI * 0.8) * levelFade;
        finalColor += mix(pal, vec3(1.0), 0.6) * core * levelFade;
    }

    finalColor = clamp(finalColor, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
