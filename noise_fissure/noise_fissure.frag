/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.2308,
            "name": "zoom",
            "min": 0.4,
            "max": 3.0
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
            "default": 0.5,
            "name": "jagged"
        },
        {
            "default": 0.25,
            "name": "rate",
            "min": 0.0,
            "max": 2.0
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
    "uuid": "534f5032-192c-4ae4-9a9f-fc44e00bec15"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p)
{
    return vec2(hash(p), hash(p + 19.19));
}

// An irregular clock: it changes at the moments three unrelated clocks tick over,
// so the changes arrive at seemingly random times rather than in a steady beat.
float tickId(float t)
{
    return mod(floor(t) + 31.0 * floor(t * 1.618 + 0.37) + 977.0 * floor(t * 0.382 + 0.11), 4096.0);
}

// The harsh palette: white, blood red, acid green, electric blue.
vec3 pick(float h)
{
    if (h < 0.4) return vec3(1.0);
    if (h < 0.7) return vec3(1.0, 0.05, 0.08);
    if (h < 0.85) return vec3(0.75, 1.0, 0.05);
    return vec3(0.1, 0.25, 1.0);
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return length(pa - ba * h);
}

float vnoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    // the whole crack network is re-rolled at irregular moments
    float t = tm * rate;
    float seed = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6), 512.0);

    vec2 q = p / zoom * 3.0 + vec2(seed * 17.3, seed * 9.1) + tm * 0.02;

    // tear the lines with a high-frequency warp, so they zigzag instead of curving
    vec2 w = vec2(vnoise(q * 3.1 + 7.7), vnoise(q * 3.1 + 19.3)) - 0.5;
    q += jagged * 0.8 * w;

    float n = 0.6 * vnoise(q) + 0.3 * vnoise(q * 2.3 + 5.5) + 0.1 * vnoise(q * 5.1 + 11.1);

    // the cracks run where the noise crosses its middle value
    float f = abs(n - 0.5);
    float thr = width;
    float crack = 1.0 - smoothstep(thr * 0.7, thr, f);
    float core = 1.0 - smoothstep(thr * 0.15, thr * 0.35, f);
    float halo = glow * exp(-f / (thr * 2.0 + 0.01)) * 0.5;

    // rainbow = 0 keeps the Layer colour only; 1 colours each region of crack from the harsh palette
    vec3 crackCol = mix(vec3(1.0), pick(hash(vec2(floor(n * 6.0), seed))), rainbow);
    vec3 col = crackCol * (crack * 0.8 + halo) + vec3(1.0) * core;

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
