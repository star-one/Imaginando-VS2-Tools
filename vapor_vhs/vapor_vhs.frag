/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2,
            "name": "zoom",
            "min": 0.5,
            "max": 3.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.5,
            "name": "tracking"
        },
        {
            "default": 0.4,
            "name": "glitch"
        },
        {
            "default": 0.3,
            "name": "snow"
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
    "uuid": "2a5d8f61-e3b7-4c09-a1d4-9f6e0b7c3825"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

// How strong the faint scanlines are.
const float SCAN = 0.12;

vec3 PINK = vec3(1.0, 0.2, 0.7);
vec3 CYAN = vec3(0.1, 0.9, 1.0);

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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

    // rotate the whole picture by angle (in degrees), then go back to 0..1 coordinates
    vec2 pc = rot(radians(angle)) * ((texCoord - 0.5) * vec2(aspect, 1.0));
    vec2 uv = pc / vec2(aspect, 1.0) + 0.5;

    // zoom = size of the scanlines, snow and streaks
    float px = 2.0 * zoom;                              // snow grain size in pixels
    vec3 col = vec3(0.0);

    // ---- scanlines ----
    float sl = 0.5 + 0.5 * sin(uv.y * resolution.y * 3.14159 / (2.0 * zoom));
    col += vec3(1.0) * SCAN * sl;

    // ---- tracking band: a noisy bar that rolls up the screen ----
    float bandY = fract(0.6 - tm * 0.02);
    float dy = abs(uv.y - bandY);
    dy = min(dy, 1.0 - dy);
    float bandH = 0.02 + 0.10 * tracking;
    float inBand = 1.0 - smoothstep(0.0, bandH, dy);

    float row = floor(uv.y * 240.0 / zoom);
    float tick = floor(tm * 15.0);
    float jit = (hash(vec2(row, tick)) - 0.5) * 0.08 * inBand * tracking;
    float streak = smoothstep(0.55, 1.0, hash(vec2(row, tick + 3.0)));
    float dash = step(0.5, hash(vec2(floor((uv.x + jit) * 60.0 / zoom), row + tick)));
    float bandI = inBand * tracking * (0.25 + 0.75 * streak * dash);
    vec3 bandCol = mix(PINK, vec3(1.0), inBand * inBand);
    col += bandCol * bandI * 0.8;

    // ---- snow ----
    vec2 cellN = floor(uv * resolution / px);
    float sn = hash(cellN + floor(tm * 30.0) * vec2(17.0, 5.0));
    float flake = step(1.0 - 0.04 * snow, sn) * (0.4 + 0.6 * hash(cellN + 1.7));
    col += vec3(1.0) * flake * 0.6;

    // ---- glitch bars: blocks of pink and cyan that flash in and out ----
    float gc = floor(tm * 6.0);
    for (int k = 0; k < 3; k++)
    {
        float fk = float(k);
        float on = step(hash(vec2(gc, fk * 7.3)), glitch * 0.8);
        float by = hash(vec2(gc * 1.7, fk * 3.1));
        float bh = 0.004 + 0.05 * hash(vec2(gc, fk + 11.0));
        float bx0 = hash(vec2(gc, fk + 21.0)) * 0.6;
        float bx1 = bx0 + 0.2 + 0.5 * hash(vec2(gc, fk + 31.0));

        float inY = step(abs(uv.y - by), bh);
        float inX = step(bx0, uv.x) * step(uv.x, bx1);
        float flick = step(0.3, hash(vec2(floor(tm * 40.0), fk)));
        vec3 gcol = (k == 1) ? CYAN : PINK;

        float edge = abs(uv.y - by) - bh;
        col += gcol * on * inY * inX * flick * 0.8;
        col += gcol * on * flick * (1.0 - smoothstep(0.0, 0.0015, abs(edge))) * 0.5;
        col += gcol * on * flick * inX * glow * exp(-max(edge, 0.0) / 0.015) * 0.3;
    }

    // ---- colour fringing at the left and right edges ----
    col += CYAN * exp(-uv.x * 30.0) * 0.15 * glow;
    col += PINK * exp(-(1.0 - uv.x) * 30.0) * 0.15 * glow;

    // rainbow = 0 keeps the Layer colour only (greyscale); 1 gives the pink and cyan
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, rainbow);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
