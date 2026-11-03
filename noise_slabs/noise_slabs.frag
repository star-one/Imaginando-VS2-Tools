/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.0,
            "name": "zoom",
            "min": 1.0,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.6,
            "name": "levels",
            "min": 2.0,
            "max": 7.0
        },
        {
            "default": 0.1795,
            "name": "gutter",
            "min": 0.0005,
            "max": 0.02
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
    "uuid": "ad193c33-33bf-4282-aa38-04336e5a4982"
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

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    // zoom repeats the layout: 1 is a single layout across the screen, 3 is a 3 x 3 patchwork
    vec2 uvAll = (p / vec2(aspect, 1.0) + 0.5) * zoom;
    vec2 tile = floor(uvAll);
    vec2 uv = fract(uvAll);

    // the whole layout is re-rolled at irregular moments
    float t = tm * rate;
    float lay = mod(floor(t * 0.5) + 13.0 * floor(t * 0.809 + 0.21) + 101.0 * floor(t * 0.236 + 0.6), 512.0)
                 + hash(tile) * 50.0;

    // cut the tile into slabs: split it again and again at random places
    int nl = int(clamp(floor(levels), 1.0, 7.0));
    vec2 rmin = vec2(0.0);
    vec2 rmax = vec2(1.0);
    float id = 1.0;
    for (int l = 0; l < 7; l++)
    {
        if (l >= nl) break;
        float h = hash(vec2(id, lay + float(l)));
        if (h < 0.12 && l > 1) break;                  // some slabs are left big

        vec2 sz = rmax - rmin;
        bool splitX = (sz.x * aspect * (0.8 + 0.4 * hash(vec2(id, lay + 7.0))) > sz.y);   // usually cut the longer side
        float s = mix(0.2, 0.8, hash(vec2(id + 3.0, lay + float(l) + 9.0)));
        if (splitX)
        {
            float xs = mix(rmin.x, rmax.x, s);
            if (uv.x < xs) { rmax.x = xs; id = id * 2.0; }
            else { rmin.x = xs; id = id * 2.0 + 1.0; }
        }
        else
        {
            float ys = mix(rmin.y, rmax.y, s);
            if (uv.y < ys) { rmax.y = ys; id = id * 2.0; }
            else { rmin.y = ys; id = id * 2.0 + 1.0; }
        }
    }

    // each slab flashes on and off at its own irregular moments
    float hs = hash(vec2(id, lay + 41.0));
    float flickRate = 0.5 + 3.0 * hs;
    float ft = tickId(t * flickRate + hs * 13.0);
    float ff = hash(vec2(ft, id));
    float on = step(ff, 0.25 + 0.6 * hs);

    // some slabs are filled with hard stripes instead of a flat colour
    float stripeOn = step(0.7, hash(vec2(id, lay + 57.0)));
    float vertical = step(0.5, hash(vec2(id, lay + 63.0)));
    float coord = mix(uv.y, uv.x, vertical);
    float freq = floor(mix(6.0, 40.0, hash(vec2(id, lay + 71.0))));
    float stripes = step(fract(coord * freq + tm * 0.3 * (hs - 0.5)), 0.5);
    float fillPat = mix(1.0, stripes, stripeOn);

    // gutters between the slabs, measured in screen heights
    float ex = min(uv.x - rmin.x, rmax.x - uv.x) * aspect / zoom;
    float ey = min(uv.y - rmin.y, rmax.y - uv.y) / zoom;
    float e = min(ex, ey);
    float gmask = smoothstep(gutter * 0.5, gutter, e);
    float edgeGlow = glow * exp(-e / 0.03) * 0.4;

    // rainbow = 0 keeps the Layer colour only; 1 gives the harsh palette
    vec3 slabCol = mix(vec3(1.0), pick(hash(vec2(id, lay + 83.0))), rainbow);
    vec3 col = slabCol * on * (fillPat + edgeGlow) * gmask;

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
