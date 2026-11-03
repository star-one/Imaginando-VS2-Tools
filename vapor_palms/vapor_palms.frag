/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4545,
            "name": "zoom",
            "min": 0.5,
            "max": 1.6
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.5,
            "name": "width"
        },
        {
            "default": 0.4286,
            "name": "height",
            "min": 0.3,
            "max": 1.0
        },
        {
            "default": 0.5,
            "name": "palms",
            "min": 1.0,
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
    "uuid": "c7e1a904-3b58-4f2d-96a0-d8f4b2e61c37"
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

float segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return length(pa - ba * h);
}

// Distance from p to a palm tree (negative inside it): a curved trunk,
// seven drooping fronds and two coconuts.
float palmDist(vec2 p, vec2 base, float trunkH, float lean, float fl, float sc, float phase, float tm, float sway)
{
    // quick reject: nothing of this palm is anywhere near
    vec2 mid = base + vec2(lean * 0.5, trunkH * 0.5);
    float reach = trunkH * 0.5 + fl * 1.5 + abs(lean) + 0.1;
    if (length(p - mid) > reach) return 1.0;

    float swing = sin(tm * 0.2 + phase) * 0.02 * sway;

    // trunk: six short segments that taper towards the top
    float d = 1e5;
    vec2 prev = base;
    for (int i = 1; i <= 6; i++)
    {
        float t = float(i) / 6.0;
        vec2 cur = base + vec2((lean + swing) * t * t, trunkH * t);
        float r = sc * (0.022 - 0.010 * t);
        d = min(d, segDist(p, prev, cur) - r);
        prev = cur;
    }
    vec2 crown = prev;

    // fronds fanning out from the crown and drooping under their own weight
    for (int k = 0; k < 7; k++)
    {
        float ang = 1.57 + (float(k) - 3.0) * 0.55 + sin(tm * 0.25 + phase + float(k)) * 0.04 * sway;
        vec2 dir = vec2(cos(ang), sin(ang));
        float droop = (0.35 + 0.65 * abs(cos(ang))) * 0.6;
        vec2 pp = crown;
        for (int i = 1; i <= 8; i++)
        {
            float s = float(i) / 8.0;
            vec2 cur = crown + fl * (dir * s + vec2(0.0, -droop * s * s));
            float r = sc * (0.016 * (1.0 - s) + 0.0025);
            d = min(d, segDist(p, pp, cur) - r);
            pp = cur;
        }
    }

    // coconuts
    d = min(d, length(p - crown - vec2(-0.012, -0.014) * sc) - 0.014 * sc);
    d = min(d, length(p - crown - vec2(0.014, -0.012) * sc) - 0.014 * sc);
    return d;
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees: tilts the whole picture
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;

    int nPalms = int(clamp(floor(palms), 1.0, 3.0));

    float d = 1e5;
    for (int c = 0; c < 3; c++)
    {
        if (c >= nPalms) break;

        vec2 base;
        float lean;
        float sc;
        float phase;
        if (c == 0)
        {
            base = vec2(-0.62, -0.58); lean = 0.14; sc = 1.0; phase = 0.0;
        }
        else if (c == 1)
        {
            base = vec2(0.66, -0.58); lean = -0.16; sc = 0.9; phase = 2.1;
        }
        else
        {
            base = vec2(-0.2, -0.58); lean = 0.05; sc = 0.55; phase = 4.0;
        }

        // height = trunk height, width = how long the fronds are
        float trunkH = height * zoom * sc;
        float fl = (0.12 + 0.2 * width) * zoom * sc;
        d = min(d, palmDist(p, base, trunkH, lean * zoom * sc, fl, zoom * sc, phase, tm, 1.0));
    }

    // dark solid silhouette with a neon rim light and a soft glow outside it
    float fillMask = smoothstep(aa, -aa, d);
    float rim = 1.0 - smoothstep(aa, aa * 3.0 + 0.003, abs(d));
    float halo = glow * exp(-max(d, 0.0) / 0.03) * 0.6;

    vec3 rimCol = mix(CYAN, PINK, smoothstep(-0.6, 0.6, p.x));
    rimCol = mix(vec3(1.0), rimCol, rainbow);      // rainbow = 0 keeps the Layer colour only
    vec3 fillCol = mix(vec3(0.02), vec3(0.09, 0.0, 0.18), rainbow);

    vec3 col = fillCol * fillMask + rimCol * (rim + halo);
    vec3 finalColor = clamp(col, 0.0, 1.0);

    // the silhouette is opaque so it hides whatever is behind it
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * clamp(max(fillMask, coloredPixels), 0.0, 1.0));
}
