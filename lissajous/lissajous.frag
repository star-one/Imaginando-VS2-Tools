/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4444,
            "name": "zoom",
            "min": 0.2,
            "max": 2.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.6,
            "name": "width"
        },
        {
            "default": 0.6,
            "name": "height"
        },
        {
            "default": 0.2857,
            "name": "ratio",
            "min": 1.0,
            "max": 8.0
        },
        {
            "default": 0.35,
            "name": "glow"
        },
        {
            "default": 0.0,
            "name": "rainbow"
        }
    ],
    "url": "",
    "uuid": "7c1e9a52-3b84-4d6f-a2e0-5f8b9c3d1a47"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;
const int SEGMENTS = 128;
const float THICKNESS = 0.01;

vec3 hsv2rgb(vec3 c)
{
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// distance from point p to segment a-b, plus position along it (0..1)
vec2 segDist(vec2 p, vec2 a, vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees; rotate the pixel opposite to the figure's rotation
    float ang = radians(angle);
    float cs = cos(ang);
    float sn = sin(ang);
    p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);

    // amplitudes: width/height 1.0 touches the screen edges at zoom 1.0
    vec2 amp = vec2(width * 0.5 * aspect, height * 0.5) * zoom;

    // slow constant phase drift keeps the figure alive without modulation
    float phase = tm * 0.3;

    float bestD = 1e5;
    float bestT = 0.0;

    vec2 prev = vec2(0.0, amp.y * sin(phase));
    for (int i = 1; i <= SEGMENTS; i++)
    {
        float t = float(i) / float(SEGMENTS);
        float a = t * TAU;
        vec2 cur = vec2(amp.x * sin(a), amp.y * sin(ratio * a + phase));
        vec2 sd = segDist(p, prev, cur);
        if (sd.x < bestD)
        {
            bestD = sd.x;
            bestT = (float(i - 1) + sd.y) / float(SEGMENTS);
        }
        prev = cur;
    }

    // crisp core of fixed thickness, plus a halo whose strength and spread follow glow
    float core = smoothstep(THICKNESS, THICKNESS * 0.4, bestD);
    float halo = glow * exp(-bestD / (THICKNESS * (2.0 + 6.0 * glow)));
    float intensity = clamp(core + halo, 0.0, 1.0);

    // rainbow = 0 keeps the Layer colour only; up to 1 spreads hues along the curve
    vec3 rainbowCol = hsv2rgb(vec3(fract(bestT + tm * 0.1), 0.8, 1.0));
    vec3 tint = mix(vec3(1.0), rainbowCol, rainbow);

    vec3 finalColor = tint * intensity;
    float coloredPixels = dot(clamp(finalColor, 0., 1.), vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
