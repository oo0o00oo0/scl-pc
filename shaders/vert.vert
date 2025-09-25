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

uniform float uSplatOpacity;
uniform float uSplatScale;   
// Overall scaling factor for splat size
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

  float normalizedSize = 0.1;
  vec2 normalizedOffset = normalize(corner.offset) * normalizedSize;

  float w = logistic01(uSplatOpacity, /*m*/ 0.9, /*k*/ 8.0);

  float minVal = 0.05;

  w = mix(minVal, 1.0, w);

  vec2 blend = mix(normalizedOffset, corner.offset, w * uSplatScale);
  // vec3 blendColor = mix(vec3(0.95, 0.95, 0.96), prepareOutputFromGamma(max(clr.xyz, 0.0)), w);
  vec3 blendColor = prepareOutputFromGamma(max(clr.xyz, 0.0));

  gl_Position = center.proj + vec4(blend, 0, 0);
  gaussianUV = corner.uv;
  gaussianColor = vec4(prepareOutputFromGamma(max(blendColor.xyz, 0.0)), clr.w * uSplatOpacity);

    #ifndef DITHER_NONE
  id = float(source.id);
    #endif

    #ifdef PREPASS_PASS
  vLinearDepth = -center.view.z;
    #endif
}
