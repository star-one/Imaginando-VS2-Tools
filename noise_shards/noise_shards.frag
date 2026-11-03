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
            "default": 0.2632,
            "name": "cracks",
            "min": 0.002,
            "max": 0.04
        },
        {
            "default": 0.6,
            "name": "fill"
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
    "uuid": "42c6ed66-1ad2-4133-9ec2-e1931be09cec"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

// How much the corners of the shards tremble (in shard sizes).
const float TREMOR = 0.02;

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

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    // shard size: bigger zoom gives bigger, fewer shards
    float cells = 6.0 / zoom;
    vec2 g = p * cells;
    vec2 ic = floor(g);

    // the whole layout is re-rolled at irregular moments
    float t = tm * rate;
    float lay = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6), 512.0);

    // find the nearest and second-nearest shard centres
    float d1 = 1e5;
    float d2 = 1e5;
    vec2 id1 = vec2(0.0);
    for (int j = -1; j <= 1; j++)
    {
        for (int i = -1; i <= 1; i++)
        {
            vec2 cc = ic + vec2(float(i), float(j));
            vec2 site = cc + hash2(cc + lay);
            site += TREMOR * vec2(sin(tm * 23.0 + hash(cc) * TAU), cos(tm * 29.0 + hash(cc + 3.0) * TAU));
            float d = length(g - site);
            if (d < d1)
            {
                d2 = d1;
                d1 = d;
                id1 = cc;
            }
            else if (d < d2)
            {
                d2 = d;
            }
        }
    }

    // each shard is lit or dark, and flips at its own irregular moments
    float hs = hash(id1 + lay + 5.5);
    float lit = step(hs, fill);
    float ft = tickId(t * 3.0 + hs * 7.0);
    float flip = step(0.8, hash(vec2(ft, hs * 91.0)));
    lit = abs(lit - flip);

    // rainbow = 0 keeps the Layer colour only; 1 gives the harsh palette
    vec3 shardCol = mix(vec3(1.0), pick(hash(id1 + lay + 9.9)), rainbow);

    // hard bright cracks along the edges, with a glow
    float edge = d2 - d1;
    float wC = cracks * cells;
    float crack = 1.0 - smoothstep(wC, wC + aa * cells * 2.0, edge);
    float crackGlow = glow * exp(-edge / (0.12 + 0.3 * glow)) * 0.5;

    vec3 col = shardCol * lit * 0.85;
    col += mix(vec3(1.0), shardCol, 0.5) * crack;
    col += shardCol * crackGlow * (1.0 - crack);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
