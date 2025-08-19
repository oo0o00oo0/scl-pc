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
uniform float uOpacityOverride;

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
  vec2 blend = mix(normalizedOffset, corner.offset, clamp(uSplatOpacity, 0.0, 1.0));

  gl_Position = center.proj + vec4(blend, 0, 0);
  gaussianUV = corner.uv;
  gaussianColor = vec4(prepareOutputFromGamma(max(clr.xyz, 0.0)), clr.w * 1.0);

    #ifndef DITHER_NONE
  id = float(source.id);
    #endif

    #ifdef PREPASS_PASS
  vLinearDepth = -center.view.z;
    #endif
}
