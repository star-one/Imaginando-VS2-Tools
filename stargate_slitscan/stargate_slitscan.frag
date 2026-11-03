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
            "default": 0.3,
            "name": "height"
        },
        {
            "default": 0.5,
            "name": "stretch"
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
    "uuid": "e4a7c3d1-92b6-4f58-8d0a-3c6b1f7e2a95"
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

float vnoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 palette(float t)
{
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees; turn the whole tunnel, then apply zoom
    float ang = radians(angle);
    float cs = cos(ang);
    float sn = sin(ang);
    p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);
    p /= zoom;

    // the slit: a bright horizontal band whose half-height follows "height"
    float ay = abs(p.y);
    float h0 = 0.01 + height * 0.12;
    float s = max(ay - h0, 0.0);

    // perspective: depth grows towards the slit, streaks fan out from it
    float z = 1.0 / (s + 0.03);
    float u = p.x * z;
    float v = z + tm;

    // width = streak thickness, stretch = how far streaks are smeared along depth
    float uf = mix(6.0, 0.6, width);
    float vf = mix(3.0, 0.2, stretch);

    float n1 = vnoise(vec2(u * uf, v * vf));
    float n2 = vnoise(vec2(u * uf * 2.3 + 17.0, v * vf * 1.7 + 5.0));
    float n = n1 * 0.65 + n2 * 0.35;
    float streak = smoothstep(0.35, 0.85, n);

    // detail fades out approaching the slit to avoid shimmering
    float fade = smoothstep(0.0, 0.2, s);
    float streakI = streak * fade * (0.7 + 0.6 * glow);

    // colour: 0 = Layer colour only, 1 = full drifting palette
    vec3 streakCol = mix(vec3(1.0), palette(n2 * 0.6 + v * 0.04 + tm * 0.05), rainbow);

    // bright slit core plus halo that follows glow
    float core = smoothstep(h0, h0 * 0.4, ay);
    float halo = glow * exp(-s / (0.02 + 0.25 * glow));
    vec3 haloCol = mix(vec3(1.0), palette(tm * 0.05), rainbow * 0.5);

    vec3 finalColor = streakCol * streakI + haloCol * (core + halo);

    float coloredPixels = dot(clamp(finalColor, 0., 1.), vec3(1.0));
    fragColor = vec4(clamp(finalColor, 0., 1.) * color.rgb, alpha * coloredPixels);
}
