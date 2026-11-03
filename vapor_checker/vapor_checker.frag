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
            "default": 0.3,
            "name": "warp"
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
    "uuid": "8b3f6c20-91a7-4e5d-b4c8-0d2a7e9f1563"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

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
    col += aboveMask * mix(PINK, vec3(1.0, 0.5, 0.3), 0.4) * exp(-up * 7.0) * (0.35 + 0.65 * glow);
    col += aboveMask * vec3(0.25, 0.04, 0.4) * 0.35 * exp(-up * 2.0);

    // ---- the checkerboard floor, rushing towards the viewer ----
    if (depth > 0.0)
    {
        float z = 0.3 / (depth + 0.004);
        float S = max(zoom, 0.05);                 // tile size
        float xw = p.x * z;
        float zw = z + tm * 0.8;

        // warp ripples the floor like cloth in the wind
        zw += sin(xw * 0.9 + tm * 0.1) * warp * S * 0.8;
        xw += sin(zw * 0.7 - tm * 0.08) * warp * S * 0.5;

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
        vec3 seamCol = vec3(1.0, 0.9, 1.0) * glow * 0.6;

        // a glossy sheen down the middle, and haze at the horizon
        float sheen = glow * exp(-p.x * p.x * 4.0) * exp(-depth * 4.0) * 0.4;
        float fog = exp(-depth * 5.0);
        vec3 fogCol = vec3(1.0, 0.4, 0.6) * 0.6;

        float fadeIn = smoothstep(0.0, 0.02, depth);
        vec3 floorCol = mix(tile * 0.9 + sheen, fogCol, fog * 0.7);
        col += (floorCol + seamCol * seam) * fadeIn;
    }

    // rainbow = 0 keeps the Layer colour only (greyscale); 1 gives the full vapourwave colours
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, rainbow);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
