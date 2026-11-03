/*
{
    "author": "The Winterval Conspiracy",
    "color": "white",
    "movement": true,
    "parameters": [
        {
            "default": 0.4118,
            "name": "zoom",
            "min": 0.3,
            "max": 2.0
        },
        {
            "default": 0.5,
            "name": "angle",
            "min": -180.0,
            "max": 180.0
        },
        {
            "default": 0.7,
            "name": "sky"
        },
        {
            "default": 0.75,
            "name": "height",
            "min": -1.0,
            "max": 1.0
        },
        {
            "default": 0.4615,
            "name": "slits",
            "min": 3.0,
            "max": 16.0
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
    "uuid": "1d7b4e92-a0c5-4f38-9b16-e5a2d8c37f04"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

const float TAU = 6.28318530718;

// Height of the horizon on the screen (screen height = 1, centre = 0).
const float HORIZON = -0.08;

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

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    float aa = 1.5 / resolution.y;
    float y0 = HORIZON;

    // sun radius follows zoom; height is in sun radii above the horizon (negative = sunk)
    float R = 0.25 * zoom;
    float yc = y0 + height * R;

    float above = smoothstep(y0 - aa, y0 + aa, p.y);
    float below = 1.0 - above;

    vec3 col = vec3(0.0);

    // ---- sky: pink at the horizon, through magenta, up to deep violet ----
    float t = clamp((p.y - y0) / 0.9, 0.0, 1.0);
    vec3 skyCol = mix(vec3(1.0, 0.35, 0.45), vec3(0.45, 0.08, 0.6), smoothstep(0.0, 0.5, t));
    skyCol = mix(skyCol, vec3(0.08, 0.02, 0.2), smoothstep(0.3, 1.0, t));
    col += above * skyCol * 0.8 * sky;

    // glow hugging the horizon
    col += above * vec3(1.0, 0.4, 0.6) * glow * exp(-(p.y - y0) * 9.0) * 0.8;

    // ---- twinkling stars ----
    vec2 sp = p * 45.0;
    vec2 sc = floor(sp);
    vec2 sf = fract(sp) - 0.5 - (vec2(hash(sc), hash(sc + 7.7)) - 0.5) * 0.5;
    float starOn = step(0.97, hash(sc + 3.3));
    float twinkle = 0.5 + 0.5 * sin(tm * 0.6 + hash(sc) * TAU);
    float star = starOn * smoothstep(0.08, 0.0, length(sf)) * twinkle * smoothstep(0.05, 0.5, t);
    col += vec3(1.0, 0.9, 1.0) * star * 0.9 * above;

    // ---- the sun: a gradient disc, with slits cut into its lower half ----
    float d = length(vec2(p.x, p.y - yc));
    float disc = smoothstep(R, R - aa * 2.0, d);

    float lowerHalf = step(p.y, yc);
    float yy = clamp((yc - p.y) / R, 0.0, 1.0);
    float band = fract(yy * slits - tm * 0.03);
    float cutF = yy * 0.85;
    float keep = smoothstep(cutF, cutF + 0.05, band);
    float slitMask = mix(1.0, keep, lowerHalf);

    float sunMask = disc * slitMask * above;

    float tt = clamp((p.y - (yc - R)) / (2.0 * R), 0.0, 1.0);
    vec3 sunCol = mix(vec3(1.0, 0.1, 0.55), vec3(1.0, 0.5, 0.15), smoothstep(0.0, 0.5, tt));
    sunCol = mix(sunCol, vec3(1.0, 0.92, 0.3), smoothstep(0.45, 1.0, tt));
    col += sunCol * sunMask;

    // soft halo around the sun
    float halo = glow * exp(-max(d - R, 0.0) * 5.0) * 0.7 * above;
    col += vec3(1.0, 0.35, 0.55) * halo * (1.0 - sunMask);

    // ---- water below the horizon, with a rippling reflection of the sun ----
    float depth = max(y0 - p.y, 0.0);
    vec3 water = mix(vec3(0.25, 0.03, 0.4), vec3(0.04, 0.0, 0.12), smoothstep(0.0, 0.5, depth));
    col += below * water * 0.7 * sky;

    float rip = sin(depth * 140.0 - tm * 0.4) * 0.012 * (0.3 + depth * 3.0);
    float rd = length(vec2(p.x + rip, (y0 + depth * 0.8) - yc));
    float reflMask = smoothstep(R, R - aa * 2.0, rd) * below * exp(-depth * 3.0)
                   * (0.55 + 0.45 * sin(depth * 160.0 - tm * 0.5));
    vec3 reflCol = mix(vec3(1.0, 0.4, 0.2), vec3(1.0, 0.1, 0.55), smoothstep(0.0, 0.4, depth));
    col += reflCol * reflMask;

    // a thin cyan line along the horizon
    col += vec3(0.4, 0.9, 1.0) * smoothstep(aa * 3.0, 0.0, abs(p.y - y0)) * 0.6;

    // rainbow = 0 keeps the Layer colour only (greyscale); 1 gives the full vapourwave colours
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, rainbow);

    vec3 finalColor = clamp(col, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
