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
            "default": 0.5,
            "name": "width"
        },
        {
            "default": 0.3,
            "name": "height"
        },
        {
            "default": 0.575,
            "name": "twist",
            "min": -1.0,
            "max": 1.0
        },
        {
            "default": 0.35,
            "name": "glow"
        },
        {
            "default": 0.8,
            "name": "rainbow"
        }
    ],
    "url": "",
    "uuid": "0b9d4e6a-5c27-4a13-b8f2-d71e3a6c9f04"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

float hash3(vec3 p)
{
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float vnoise3(vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash3(i);
    float b = hash3(i + vec3(1.0, 0.0, 0.0));
    float c = hash3(i + vec3(0.0, 1.0, 0.0));
    float d = hash3(i + vec3(1.0, 1.0, 0.0));
    float e = hash3(i + vec3(0.0, 0.0, 1.0));
    float g = hash3(i + vec3(1.0, 0.0, 1.0));
    float h = hash3(i + vec3(0.0, 1.0, 1.0));
    float k = hash3(i + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
               mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

float fbm(vec3 p)
{
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++)
    {
        s += a * vnoise3(p);
        p = p * 2.03 + vec3(1.7, 9.2, 3.1);
        a *= 0.5;
    }
    return s / 0.875;
}

// deep blue -> cyan -> gold -> pale cream, cycled by t
vec3 vortexPalette(float t)
{
    float w = 0.5 + 0.5 * sin(TAU * t);
    vec3 blue = vec3(0.05, 0.15, 0.65);
    vec3 cyan = vec3(0.30, 0.80, 1.00);
    vec3 gold = vec3(1.00, 0.70, 0.20);
    vec3 cream = vec3(1.00, 0.95, 0.80);
    vec3 c = mix(blue, cyan, smoothstep(0.0, 0.4, w));
    c = mix(c, gold, smoothstep(0.35, 0.75, w));
    c = mix(c, cream, smoothstep(0.8, 1.0, w));
    return c;
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees; turn the whole vortex, then apply zoom
    float ang = radians(angle);
    float cs = cos(ang);
    float sn = sin(ang);
    p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);
    p /= zoom;

    float r = length(p);
    float a = atan(p.y, p.x);

    // height = size of the bright opening at the centre
    float c0 = 0.01 + height * 0.08;

    // tunnel depth: large near the centre, flowing towards the viewer with time
    float z = 0.3 / (r + c0);
    float v = z + tm;

    // twist spirals the fibres around the axis, drifting with depth
    float a2 = a + v * twist * 1.5;

    // width = fibre thickness (fewer, broader fibres when high)
    float fa = mix(10.0, 1.5, width);

    // angle is embedded on a circle so the noise has no seam
    vec3 q = vec3(cos(a2) * fa, sin(a2) * fa, v * 0.8);

    // domain warp for a smoky, turbulent look
    float w1 = vnoise3(q * 0.7 + vec3(5.2, 1.3, 8.1));
    q += (w1 - 0.5) * 1.2;

    float n = fbm(q);
    float n2 = vnoise3(q * 1.7 + vec3(3.3, 7.7, 1.1));

    float fibres = smoothstep(0.25, 0.85, n);
    float body = 0.9 * fibres + 0.1 * n;

    // detail fades towards the centre to avoid shimmer, and gently at the screen edge
    float fade = smoothstep(c0, 0.3, r);
    float vig = 1.0 - 0.5 * smoothstep(0.4, 1.1, r);
    float bodyI = body * fade * vig * (0.7 + 0.6 * glow);

    // rainbow = 0 keeps the Layer colour only; 1 gives the blue / gold vortex palette
    vec3 bodyCol = mix(vec3(1.0), vortexPalette(n2 * 0.6 + v * 0.03 + tm * 0.02), rainbow);

    // bright centre: opening plus halo
    float hole = smoothstep(c0, c0 * 0.3, r);
    float halo = glow * exp(-r / (0.04 + 0.25 * glow));
    vec3 haloCol = mix(vec3(1.0), vec3(1.0, 0.85, 0.5), rainbow);

    vec3 finalColor = clamp(bodyCol * bodyI + haloCol * (hole + halo), 0.0, 1.0);

    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
