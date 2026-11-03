/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.0278,
            "name": "zoom",
            "min": 0.4,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.5,
            "name": "florets",
            "min": 13.0,
            "max": 55.0
        },
        {
            "default": 0.6,
            "name": "depth"
        },
        {
            "default": 0.6,
            "name": "relief"
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
    "uuid": "e5f09b28-3c71-4a8d-b6e4-0d2a9c7f1853"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Speed of the endless dive when zoomed in: loops per unit of time.
const float DIVE_RATE = 0.02;

// Levels of florets on florets (3 = florets, sub-florets, sub-sub-florets).
// Lower this to 2 if the Material is too heavy for your machine.
const int LEVELS = 3;

const float GOLDEN = 2.39996323;     // the golden angle in radians, as found in real romanesco

vec3 hsv2rgb(vec3 c)
{
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

// test floret number n against the best two found so far
void probe(float n, vec2 q, float s, float count,
           inout float d1, inout float d2, inout float bn, inout vec2 bc)
{
    if (n < 0.0 || n >= count) return;
    float a = n * GOLDEN;
    vec2 c = sqrt(n) * s * vec2(cos(a), sin(a));
    float d = length(q - c);
    if (d < d1)
    {
        d2 = d1;
        d1 = d;
        bn = n;
        bc = c;
    }
    else if (d < d2)
    {
        d2 = d;
    }
}

// find the nearest floret of a golden-angle spiral; the neighbours of floret n
// are always n plus or minus a Fibonacci number, so only those are tried
void nearest(vec2 q, float s, float count,
             out vec2 bc, out float bn, out float d1, out float d2)
{
    float n0 = floor(dot(q, q) / (s * s) + 0.5);
    n0 = min(n0, count - 1.0);

    d1 = 1e5;
    d2 = 1e5;
    bn = 0.0;
    bc = vec2(0.0);

    for (int k = -3; k <= 3; k++)
    {
        probe(n0 + float(k), q, s, count, d1, d2, bn, bc);
    }
    probe(n0 - 5.0, q, s, count, d1, d2, bn, bc);
    probe(n0 + 5.0, q, s, count, d1, d2, bn, bc);
    probe(n0 - 8.0, q, s, count, d1, d2, bn, bc);
    probe(n0 + 8.0, q, s, count, d1, d2, bn, bc);
    probe(n0 - 13.0, q, s, count, d1, d2, bn, bc);
    probe(n0 + 13.0, q, s, count, d1, d2, bn, bc);
    probe(n0 - 21.0, q, s, count, d1, d2, bn, bc);
    probe(n0 + 21.0, q, s, count, d1, d2, bn, bc);
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    // the head is a disc of radius 1 made of "count" florets, each floret radius rho
    float count = floor(florets);
    float s = 1.0 / (sqrt(count - 1.0) + 1.0);
    float rho = s;

    // Half-height of the view. Zoomed in (zoom >= 2) the view dives endlessly into the
    // centre floret and loops seamlessly; zoomed out it holds still on the whole head.
    float wh = 0.58 / zoom;
    float k = smoothstep(1.2, 2.1, zoom);
    float dd = fract(tm * DIVE_RATE) * k;

    vec2 q = p * (2.0 * wh) * pow(rho, dd);
    vec2 q0 = q;

    // each level adds cone-shaped bumps; their slopes are summed to light the surface
    vec2 grad = vec2(0.0);
    float ao = 1.0;
    float rotAcc = 0.0;
    float decay = mix(0.35, 0.85, depth);

    for (int l = 0; l <= LEVELS; l++)
    {
        // level weights, cross-faded with the dive so the loop restarts invisibly
        float w;
        if (l == 0)
        {
            w = 1.0 - dd;
        }
        else if (l == LEVELS)
        {
            if (dd <= 0.0) break;
            w = dd * pow(decay, float(l) - dd);
        }
        else
        {
            w = pow(decay, float(l) - dd);
        }

        vec2 bc;
        float bn;
        float d1;
        float d2;
        nearest(q, s, count, bc, bn, d1, d2);

        vec2 off = q - bc;
        float dl = max(length(off), 1e-4);

        // direction away from this floret's tip, in screen orientation
        vec2 dir = rot(rotAcc) * (off / dl);
        float inCone = 1.0 - smoothstep(0.85 * rho, 1.1 * rho, d1);
        grad += w * inCone * dir;

        // darken the creases between neighbouring florets
        float aoL = smoothstep(0.0, 0.25 * rho, d2 - d1);
        ao *= mix(1.0, 0.45 + 0.55 * aoL, w);

        // step inside this floret: its own spiral of smaller florets lives there,
        // turned to point along the floret's direction from the centre
        float th = bn * GOLDEN;
        q = rot(-th) * off / rho;
        rotAcc += th;
    }

    // lighting: a light that slowly circles the head
    vec3 N = normalize(vec3(grad * (0.25 + 1.0 * relief), 1.0));
    float tl = tm * 0.05 + 0.9;
    vec3 L = normalize(vec3(cos(tl) * 0.7, sin(tl) * 0.7, 0.75));
    float diff = max(dot(N, L), 0.0);
    vec3 Rf = reflect(-L, N);
    float spec = pow(max(Rf.z, 0.0), 20.0) * 0.25;

    float shade = (0.22 + 0.9 * diff + spec) * ao;
    shade += glow * 0.35 * ao;

    // romanesco green, drifting slowly towards yellow and cyan.
    // rainbow = 0 keeps the Layer colour only; 1 gives the green palette
    float hue = 0.2 + 0.12 * sin(tm * 0.02) + 0.04 * ao;
    vec3 pal = hsv2rgb(vec3(hue, 0.7, 1.0));
    vec3 baseCol = mix(vec3(1.0), pal, rainbow);

    // the edge of the head, with a soft aura around it
    float len0 = length(q0);
    float headMask = 1.0 - smoothstep(0.96, 1.0, len0);
    float aura = glow * 0.5 * exp(-max(len0 - 1.0, 0.0) * 6.0) * (1.0 - headMask);

    vec3 finalColor = baseCol * (shade * headMask + aura);

    finalColor = clamp(finalColor, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
