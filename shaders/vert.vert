#include "gsplatCommonVS"

varying mediump vec2 gaussianUV;
varying mediump vec4 gaussianColor;

#ifndef DITHER_NONE
varying float id;
#endif

mediump vec4 discardVec = vec4(0.0, 0.0, 2.0, 1.0);

#ifdef PREPASS_PASS
varying float vLinearDepth;
#endif

uniform float uSplatOpacity;    // Overall scaling factor for splat size
// Normalized logistic S-curve in [0,1] with center m and slope k.
// m in [0,1] sets where the curve is 0.5; k controls steepness (lower = softer).
float logistic01(float t, float m, float k) {
  t = clamp(t, 0.0, 1.0);
  float L0 = 1.0 / (1.0 + exp(-k * (0.0 - m)));
  float L1 = 1.0 / (1.0 + exp(-k * (1.0 - m)));
  float y = 1.0 / (1.0 + exp(-k * (t - m)));
  return (y - L0) / (L1 - L0); // normalize to [0,1]
}

void main(void) {
  SplatSource source;
  if(!initSource(source)) {
    gl_Position = discardVec;
    return;
  }

  vec3 modelCenter = readCenter(source);

  SplatCenter center;
  if(!initCenter(modelCenter, center)) {
    gl_Position = discardVec;
    return;
  }

  SplatCorner corner;
  if(!initCorner(source, center, corner)) {
    gl_Position = discardVec;
    return;
  }

  vec4 clr = readColor(source);

    #if GSPLAT_AA
  clr.a *= corner.aaFactor;
    #endif

    #if SH_BANDS > 0
  vec3 dir = normalize(center.view * mat3(center.modelView));
  vec3 sh[SH_COEFFS];
  float scale;
  readSHData(source, sh, scale);
  clr.xyz += evalSH(sh, dir) * scale;
    #endif

  clipCorner(corner, clr.w);

  float normalizedSize = 0.0; // Adjust this value to control uniform splat size
  vec2 normalizedOffset = normalize(corner.offset) * normalizedSize;

  float t = clamp(uSplatOpacity, 0.0, 1.0);

// m = 0.85 delays the curve so it stays low most of the time
// k = 3.0 keeps the slope soft (increase toward 6–8 if you want snappier)
  float w = logistic01(t, /*m*/ 0.9, /*k*/ 8.0);

// Keep it from ever reaching 0:
  float minVal = 0.05;
  w = mix(minVal, 1.0, w);

// Apply to your blend
  vec2 blend = mix(normalizedOffset, corner.offset, w);
  vec3 blendColor = mix(vec3(0.95, 0.95, 0.96), prepareOutputFromGamma(max(clr.xyz, 0.0)), w);

  gl_Position = center.proj + vec4(blend, 0, 0);
  gaussianUV = corner.uv;
  gaussianColor = vec4(blendColor, clr.w * 1.0);

    #ifndef DITHER_NONE
  id = float(source.id);
    #endif

    #ifdef PREPASS_PASS
  vLinearDepth = -center.view.z;
    #endif
}
