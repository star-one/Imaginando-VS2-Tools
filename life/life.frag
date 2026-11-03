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
            "default": 0.5,
            "name": "guns",
            "min": 1.0,
            "max": 5.0
        },
        {
            "default": 0.25,
            "name": "rate",
            "min": 0.0,
            "max": 4.0
        },
        {
            "default": 0.5,
            "name": "trail"
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
    "uuid": "6b2e9d41-f3a8-4c07-b5d9-1a7c8e4f0b52"
}
*/

#ifdef GL_ES
precision highp float;
#endif

// Overall animation speed multiplier. Raise it for a faster maximum speed,
// lower it for a slower one. VS2's Speed knob still scales on top of this.
const float SPEED_SCALE = 8.0;

// Number of cells across the screen height when zoom = 1.
const float CELLS_HIGH = 60.0;

// A Material cannot remember its previous frame, so it cannot run a live Life simulation.
// Instead this plays Conway's Game of Life on a layout whose evolution is known exactly:
// Gosper glider guns, each firing a glider every 30 generations. The gun itself is stored
// as its 30 repeating frames, and the gliders are worked out from their position and phase.
// The result was checked cell for cell against a real Life simulation.
//
// The guns have already been running for this many generations when the Material starts,
// so the streams of gliders are already long.
const float T_OFF = 6000.0;

// Screen centre, in cells measured from the top-left cell of the first gun.
const vec2 CAM = vec2(50.0, 28.0);

// Each extra gun sits this far from the one before (chosen so no stream hits another gun).
const vec2 GUN_STEP = vec2(-26.0, 14.0);

const float TAU = 6.28318530718;

// The table covers the gun and its surroundings: cells x from -2 to 39 and y from -2 to 12.
const int BH = 15;
const int SPLIT = 21;

// Glider stream: at generation T1 a glider in phase P1 has its template origin at (OXG, OYG).
const float T1 = 300.0;
const float P1 = 1.0;
const float OXG = 30.0;
const float OYG = 16.0;
const float UMIN = -40.0;

// The four phases of a glider, as bit masks over a 4 x 4 box (bit = row * 4 + column).
const int TPL[4] = int[4](1858, 9808, 25920, 27680);

const int GUN_LO[450] = int[450](
    0, 0, 0, 0, 49152, 139264, 266252, 856076, 266240, 139264, 49152, 0, 0, 0, 0,
    0, 0, 0, 0, 16384, 24576, 798732, 800780, 798720, 24576, 16384, 0, 0, 0, 0,
    0, 0, 0, 0, 24576, 20480, 1837068, 1198092, 788480, 20480, 24576, 0, 0, 0, 0,
    0, 0, 0, 0, 24576, 1593344, 1849356, 1186828, 800768, 20480, 24576, 0, 0, 0, 0,
    0, 0, 0, 0, 1073152, 280576, 263180, 132108, 1836032, 18432, 24576, 0, 0, 0, 0,
    0, 0, 0, 0, 24576, 548864, 396300, 1183244, 1838080, 548864, 24576, 0, 0, 0, 0,
    0, 0, 0, 0, 24576, 290816, 1972748, 135692, 268800, 815104, 24576, 0, 0, 0, 0,
    0, 0, 0, 0, 20480, 411648, 658444, 140044, 920576, 804864, 20480, 0, 0, 0, 0,
    0, 0, 0, 0, 8192, 408576, 204300, 725516, 663040, 1719296, 8192, 0, 0, 0, 0,
    0, 0, 0, 0, 10240, 467456, 524, 8460, 655872, 1581568, 10240, 0, 0, 0, 0,
    0, 0, 0, 0, 135168, 136192, 131852, 780, 787200, 1840128, 1052672, 0, 0, 0, 0,
    0, 0, 0, 0, 2048, 461312, 1292, 263308, 263424, 264704, 1050624, 0, 0, 0, 0,
    0, 0, 0, 0, 132096, 133632, 265484, 3468, 920832, 1575424, 1049600, 0, 0, 0, 0,
    0, 0, 0, 0, 1024, 395776, 4492, 659852, 790912, 2560, 525312, 0, 0, 0, 0,
    0, 0, 0, 0, 1024, 3840, 137868, 1587788, 1841792, 790272, 1024, 0, 0, 0, 0,
    0, 0, 0, 0, 3072, 4352, 8332, 8908, 8320, 266496, 3072, 0, 0, 0, 0,
    0, 0, 0, 0, 2048, 6144, 12492, 28876, 12480, 6144, 2048, 0, 0, 0, 0,
    0, 0, 0, 0, 6144, 10240, 16588, 18732, 16576, 10240, 6144, 0, 0, 0, 0,
    0, 0, 0, 0, 6144, 10240, 28892, 57660, 28864, 10240, 6144, 0, 0, 0, 0,
    0, 0, 0, 0, 6144, 18440, 32964, 33028, 33016, 18432, 6144, 0, 0, 0, 0,
    0, 0, 0, 0, 6144, 6144, 49292, 114964, 49400, 6256, 6144, 0, 0, 0, 0,
    0, 0, 0, 0, 6144, 14336, 90124, 73988, 90240, 14472, 6176, 0, 0, 0, 0,
    0, 0, 0, 0, 10240, 18432, 49164, 200716, 49536, 18496, 10240, 0, 0, 0, 0,
    0, 0, 0, 0, 4096, 61440, 122892, 73740, 123008, 61568, 4096, 0, 0, 0, 0,
    0, 0, 0, 0, 20480, 69632, 65548, 135180, 65536, 69632, 20480, 0, 0, 0, 0,
    0, 0, 0, 0, 8192, 40960, 196620, 196620, 196608, 40960, 8192, 0, 0, 0, 0,
    0, 0, 0, 0, 16384, 81920, 163852, 294924, 163840, 81920, 16384, 0, 0, 0, 0,
    0, 0, 0, 0, 32768, 81920, 180236, 442380, 180224, 81920, 32768, 0, 0, 0, 0,
    0, 0, 0, 0, 32768, 81920, 401420, 401420, 401408, 81920, 32768, 0, 0, 0, 0,
    0, 0, 0, 0, 32768, 245760, 352268, 618508, 352256, 245760, 32768, 0, 0, 0, 0
);

const int GUN_HI[450] = int[450](
    0, 0, 32, 40, 98310, 98310, 6, 40, 32, 0, 0, 16, 96, 48, 0,
    0, 0, 16, 20, 98314, 98313, 10, 20, 16, 0, 0, 32, 64, 112, 0,
    0, 0, 8, 20, 98330, 98331, 26, 20, 8, 0, 0, 0, 80, 96, 32,
    0, 0, 8, 20, 98339, 98338, 34, 21, 8, 0, 0, 0, 64, 80, 96,
    0, 0, 8, 30, 98359, 98422, 54, 31, 8, 0, 0, 0, 32, 192, 96,
    0, 0, 24, 32, 98368, 98368, 64, 33, 27, 0, 0, 0, 64, 128, 224,
    0, 0, 16, 48, 98400, 98528, 96, 50, 18, 1, 0, 0, 0, 160, 192,
    0, 0, 48, 80, 98432, 98448, 128, 81, 51, 0, 0, 0, 0, 128, 160,
    0, 0, 48, 80, 98528, 98752, 224, 83, 51, 0, 0, 0, 0, 64, 384,
    0, 0, 48, 144, 98560, 98560, 256, 147, 50, 1, 0, 0, 0, 128, 256,
    0, 0, 48, 48, 98688, 99200, 384, 51, 50, 1, 0, 0, 0, 0, 320,
    0, 0, 48, 112, 99008, 98880, 704, 115, 50, 1, 1, 0, 0, 0, 256,
    0, 0, 80, 144, 98688, 99872, 384, 147, 82, 3, 1, 0, 0, 0, 128,
    0, 0, 32, 480, 99264, 98880, 960, 483, 36, 2, 2, 0, 0, 0, 256,
    0, 0, 160, 544, 98816, 99360, 512, 546, 165, 6, 0, 0, 0, 0, 0,
    0, 0, 64, 320, 99840, 99840, 1536, 322, 68, 7, 0, 0, 0, 0, 0,
    0, 0, 128, 640, 99584, 100608, 1280, 640, 133, 6, 2, 0, 0, 0, 0,
    0, 0, 256, 640, 99712, 101760, 1408, 640, 260, 5, 6, 0, 0, 0, 0,
    0, 0, 256, 640, 101440, 101440, 3136, 640, 258, 12, 6, 0, 0, 0, 0,
    0, 0, 256, 1920, 101056, 103136, 2752, 1920, 260, 8, 14, 0, 0, 0, 0,
    0, 0, 384, 1088, 100384, 104992, 2080, 1088, 384, 10, 12, 4, 0, 0, 0,
    0, 0, 128, 192, 104544, 104560, 6240, 192, 128, 8, 10, 12, 0, 0, 0,
    0, 0, 192, 160, 104464, 107664, 6160, 160, 192, 4, 24, 12, 0, 0, 0,
    0, 0, 192, 160, 120944, 123960, 6256, 160, 192, 8, 16, 28, 0, 0, 0,
    0, 0, 192, 32912, 71688, 66568, 63496, 144, 192, 0, 20, 24, 8, 0, 0,
    0, 0, 192, 192, 100376, 82972, 63512, 28864, 192, 0, 16, 20, 24, 0, 0,
    0, 0, 192, 224, 98356, 66596, 2100, 35040, 8384, 0, 8, 48, 24, 0, 0,
    0, 0, 160, 144, 98328, 98374, 3096, 4240, 160, 0, 16, 32, 56, 0, 0,
    0, 0, 64, 120, 98364, 98340, 2108, 2168, 64, 0, 0, 40, 48, 16, 0,
    0, 0, 80, 68, 98308, 98370, 4, 68, 80, 0, 0, 32, 40, 48, 0
);

vec3 palette(float t)
{
    return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

// Is cell c (measured from one gun's top-left cell) alive at generation T?
float gunAlive(float T, vec2 c)
{
    // inside the gun's own box: look the cell up in the repeating frames
    if (c.x >= -2.0 && c.x < 40.0 && c.y >= -2.0 && c.y < 13.0)
    {
        int f = int(mod(T, 30.0));
        int row = f * BH + int(c.y + 2.0);
        int col = int(c.x + 2.0);
        int bits = (col < SPLIT) ? GUN_LO[row] : GUN_HI[row];
        int sh = (col < SPLIT) ? col : col - SPLIT;
        return float((bits >> sh) & 1);
    }

    // outside it: is the cell part of one of the gliders flying away?
    float w = T - T1 + P1;
    for (int lx = 0; lx < 4; lx++)
    {
        float s = c.x - OXG - float(lx);
        float ly = c.y - OYG - s;
        if (ly < 0.0 || ly > 3.0) continue;

        float r = mod(w - 4.0 * s, 30.0);
        if (r > 3.0) continue;

        float u = 4.0 * s + r;
        if (u < UMIN) continue;

        int bit = int(ly) * 4 + lx;
        if (((TPL[int(r)] >> bit) & 1) == 1) return 1.0;
    }
    return 0.0;
}

float worldAlive(float T, vec2 cell, int ng)
{
    float a = 0.0;
    for (int j = 0; j < 4; j++)
    {
        if (j >= ng) break;
        a = max(a, gunAlive(T, cell - GUN_STEP * float(j)));
    }
    return a;
}

void main()
{
    float tm = time * SPEED_SCALE;

    float aspect = resolution.x / resolution.y;

    // centred coordinates: screen height = 1, width = aspect
    vec2 p = (texCoord - 0.5) * vec2(aspect, 1.0);

    // angle is in degrees
    p = rot(radians(angle)) * p;

    // the grid of cells
    float cellsHigh = CELLS_HIGH / zoom;
    vec2 gpos = p * cellsHigh + CAM;
    vec2 cell = floor(gpos);
    vec2 q = fract(gpos) - 0.5;

    // generation clock: rate is generations per second at Speed 1, before SPEED_SCALE
    float t = tm * rate;
    float n = floor(t);
    float f = t - n;
    float T = T_OFF + n;
    int ng = int(clamp(floor(guns), 1.0, 4.0));

    // this generation and the three before it
    float a0 = worldAlive(T, cell, ng);
    float a1 = worldAlive(T - 1.0, cell, ng);
    float a2 = worldAlive(T - 2.0, cell, ng);
    float a3 = worldAlive(T - 3.0, cell, ng);

    // trail = how slowly dead cells fade away
    float decay = mix(2.5, 0.6, trail);

    // survivors stay at full brightness, newborn cells fade in, dead cells fade out
    float born = a0 * (1.0 - a1);
    float fadeIn = smoothstep(0.0, 0.35, f);
    float bright = a0 * mix(fadeIn, 1.0, a1);
    bright += (1.0 - a0) * a1 * exp(-decay * f);
    bright += (1.0 - a0) * (1.0 - a1) * a2 * exp(-decay * (1.0 + f));
    bright += (1.0 - a0) * (1.0 - a1) * (1.0 - a2) * a3 * exp(-decay * (2.0 + f));

    // each cell is a rounded square, with the glow spilling into the gap around it
    float rr = 0.18;
    float sd = length(max(abs(q) - (0.42 - rr), 0.0)) - rr;
    float aa = cellsHigh / resolution.y;
    float mask = smoothstep(aa, -aa, sd);
    float halo = glow * exp(-max(sd, 0.0) * 5.0) * 0.6;

    // colour drifts along the streams. rainbow = 0 keeps the Layer colour only
    float hue = (cell.x - cell.y) * 0.004 + (cell.x + cell.y) * 0.01 + tm * 0.03;
    vec3 pal = mix(vec3(1.0), palette(hue), rainbow);

    float flash = born * (1.0 - smoothstep(0.0, 0.6, f));
    vec3 finalColor = pal * bright * (mask + halo) + vec3(1.0) * flash * mask * 0.5;

    finalColor = clamp(finalColor, 0.0, 1.0);
    float coloredPixels = dot(finalColor, vec3(1.0));
    fragColor = vec4(finalColor * color.rgb, alpha * coloredPixels);
}
