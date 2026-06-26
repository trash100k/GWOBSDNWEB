// Shared GLSL — Ashima 2D simplex + fbm + a warm caustic field.
// Reused by the obsidian slab (caustics) and the blade (heat flow).
export const GLSL_NOISE = /* glsl */ `
  vec3 gw_permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  float gw_snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = gw_permute(gw_permute(i.y + vec3(0.0, i1.y, 1.0))
                                 + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float gw_fbm(vec2 p){
    float s = 0.0, a = 0.5;
    for(int i = 0; i < 3; i++){ s += a * gw_snoise(p); p = p*2.03 + vec2(11.3, 7.7); a *= 0.5; }
    return s;
  }
  float gw_caustic(vec2 uv, float t){
    vec2 w = vec2(gw_fbm(uv*1.2 + vec2(0.0, t*0.12)),
                  gw_fbm(uv*1.2 + vec2(5.2, -t*0.10)));
    vec2 p = uv + w * 0.65;
    float c  = pow(clamp(1.0 - abs(gw_fbm(p*1.9 + vec2(t*0.15, 0.0))), 0.0, 1.0), 4.5);
    c += pow(clamp(1.0 - abs(gw_fbm(p*3.6 + vec2(-t*0.10, t*0.08) + 9.0)), 0.0, 1.0), 6.0) * 0.4;
    return c;
  }
`
