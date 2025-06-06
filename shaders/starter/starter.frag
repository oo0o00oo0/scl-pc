precision mediump float;

uniform vec4 uColor;
varying vec2 vUv0;

void main(void) {
  // Mix the animated color with UV coordinates for visual interest
  vec3 finalColor = mix(uColor.rgb, vec3(1.0, vUv0.x, vUv0.y), 0.3);
  gl_FragColor = vec4(finalColor, uColor.a);
}