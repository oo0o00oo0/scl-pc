#include "gsplatCommonVS"

varying mediump vec2 gaussianUV;
varying mediump vec4 gaussianColor;

uniform sampler2D vertex_weights_texture;
uniform sampler2D chunks_data_texture;

mediump vec4 discardVec = vec4(0.0, 0.0, 2.0, 1.0);

uniform float uTime;
uniform float uSplatOpacity;

float noise1D(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(i) * 43758.5453123);
  float b = fract(sin(i + 1.0) * 43758.5453123);
  return mix(a, b, u);
}

float noise2D(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = noise1D(i.x + i.y * 57.0);
  float b = noise1D(i.x + 1.0 + i.y * 57.0);
  float c = noise1D(i.x + (i.y + 1.0) * 57.0);
  float d = noise1D(i.x + 1.0 + (i.y + 1.0) * 57.0);

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 applyXYAnimation(vec3 center) {
  float heightIntensity = 1.0;
  float amplitude = .02;
  float speed = 2.6;
  // float equency1 = 100.0;
  float frequency1 = 150.0;
  float frequency2 = 70.0;

  float wave1_x = sin(uTime * 4.0 + center.y * frequency1) * amplitude * heightIntensity;
  float wave1_z = cos(uTime * speed + center.y * frequency2) * amplitude * heightIntensity; // Using cos for 90° phase shift

  center.x += wave1_x * -0.4;
  center.y += wave1_z;

  return center;
}
vec3 applyWaveAnimation(vec3 center) {
  float heightIntensity = 1.0;
  float amplitude = .02;
  float speed = 2.6;
  float frequency1 = 150.0;
  float frequency2 = 70.0;

  float wave1_x = sin(uTime * 4.0 + center.y * frequency1) * amplitude * heightIntensity;
  float wave1_z = cos(uTime * speed + center.y * frequency2) * amplitude * heightIntensity; // Using cos for 90° phase shift

  center.x += wave1_x * -0.4;
  center.z += wave1_x * -0.4;
  center.y += wave1_z;

  return center;
}

vec3 floatyNose(vec3 center) {
  float speed = 0.05;
  float time = uTime * speed;

  float amplitude = 1.21;
  float frequency1 = .05;

  float noiseScale = 100.0;
  vec2 noisePos = vec2(center.x * noiseScale + time * 0.5, center.z * noiseScale + time * 0.3);

  float noiseX = noise2D(noisePos) * 2.0 - 1.0;
  float noiseZ = noise2D(noisePos + vec2(1.234, 5.678)) * 2.0 - 1.0;

  float noiseStrength = 6.3;

  float totalStrength = 2.0;

  center.x += noiseX * noiseStrength * totalStrength;
  center.z += noiseZ * noiseStrength * totalStrength;

  float verticalNoise = noise2D(noisePos * 5.0 + vec2(9.876, 3.210));
  center.y += verticalNoise * 0.1 * totalStrength;

  return center;
}

vec3 applySkinningAnimation(vec3 center, float strength) {
  float speed = 0.25;
  float time = uTime * speed;

  float amplitude = .005;
  float frequency1 = .05;

  float noiseScale = .4;
  vec2 noisePos = vec2(center.x * noiseScale + time * 0.5, center.z * noiseScale + time * 0.3);

  float noiseX = noise2D(noisePos) * 2.0 - 1.0;
  float noiseZ = noise2D(noisePos + vec2(1.234, 5.678)) * 2.0 - 1.0;

  float noiseStrength = 0.3;

  float totalStrength = strength * (2.0);

  center.x += noiseX * noiseStrength * totalStrength;
  center.z += noiseZ * noiseStrength * totalStrength;

  float verticalNoise = noise2D(noisePos * 5.0 + vec2(9.876, 3.210));
  center.y += verticalNoise * 0.1 * totalStrength;

  return center;
}

vec3 animateWavePosition(vec3 center) {
  center = applyWaveAnimation(center);
  return center;
}

void main(void) {

  SplatSource source;
  if(!initSource(source)) {
    gl_Position = discardVec;
    return;
  }

  vec4 data_texture = texelFetch(chunks_data_texture, source.uv, 0);

  vec3 centerPos = readCenter(source);
  vec4 clr = readColor(source);
  float finalOpacity = clr.w;

  vec4 weight_texture = texelFetch(vertex_weights_texture, source.uv, 0);
  if(abs(0.0 - data_texture.a) < 0.01) {
    centerPos = applySkinningAnimation(centerPos, weight_texture.r);
    // clr = vec4(0.0, 0.0, 1.0, clr.a);
    // clr = vec4(weight_texture.r, 0.0, 0.0, clr.a);

  }
  if(abs(1.0 - data_texture.a) < 0.01) {
    centerPos = applySkinningAnimation(centerPos, weight_texture.r);
    // clr = vec4(1.0, 0.0, 1.0, clr.a);
    // clr = vec4(weight_texture.r, 0.0, 0.0, clr.a);
  }
  if(abs(2.0 - data_texture.a) < 0.01) {
    centerPos = animateWavePosition(centerPos);
    // clr = vec4(1.0, 1.0, 0.0, clr.a);
    // clr = vec4(weight_texture.r, 0.0, 0.0, clr.a);
  }
  if(abs(3.0 - data_texture.a) < 0.01) {
    centerPos = applySkinningAnimation(centerPos, weight_texture.r * 5.5);
    // clr = vec4(0.0, 1.0, 0.0, clr.a);
    // clr = vec4(weight_texture.r, 0.0, 0.0, clr.a);
  }
  if(abs(4.0 - data_texture.a) < 0.01) {
    centerPos = floatyNose(centerPos);
    // clr = vec4(0.0, 1.0, 0.0, clr.a);
    // clr = vec4(weight_texture.r, 0.0, 1.0, clr.a);
  }

  SplatCenter center;
  initCenter(centerPos, center);

  SplatCorner corner;
  if(!initCorner(source, center, corner)) {
    gl_Position = discardVec;
    return;
  }

  clipCorner(corner, clr.w);

  gl_Position = center.proj + vec4(corner.offset, 0.0, 0.0);

  gaussianUV = corner.uv;
  gaussianColor = vec4(prepareOutputFromGamma(max(clr.xyz, 0.0)), finalOpacity);
}