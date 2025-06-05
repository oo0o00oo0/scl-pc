import noise from "./noise.js";

export default /* glsl */ `
${noise}
#include "gsplatCommonVS"
varying mediump vec2 gaussianUV;
varying mediump vec4 gaussianColor;

uniform float uTime;
uniform float uSwirlAmount;

#ifndef DITHER_NONE
    varying float id;
#endif

mediump vec4 discardVec = vec4(0.0, 0.0, 2.0, 1.0);

float fade(float radius, float len, float feather){
    return 1.0 - smoothstep(radius - feather, radius + feather, len);
}

vec2 transitionInSize(vec3 origin, vec3 center, SplatCorner corner, float speed, float startDelay){

    float power = 2.0; // transition curve
    float secondaryFadeDelay = 0.7; // The delay between the first and second animation
    float pixelSize = 0.01; // The size of the initial particle pass
    float fadeBlend = 0.3; // Higher values create a softer feathered fade edge

    float radius = (uTime - startDelay) * speed;
    float len = length(origin - center);

    // Initial particle transition
    vec2 sizeA = normalize(corner.offset) * fade(pow(radius, 1.2), len, fadeBlend) * pixelSize;

    // Secondary full transition
    radius = max(0.0, (uTime - startDelay - secondaryFadeDelay)) * speed;
    float fullFade = fade(pow(radius, power), len, fadeBlend);
    vec2 sizeB = corner.offset * fullFade;
    
    // mix between the two
    return mix(sizeA, sizeB, fullFade);
}

vec3 swirl(vec3 pos, float amount) {
    float noiseScale = 1.09;
    float timeScale = 0.05;
    vec3 curlVelocity = BitangentNoise4D(vec4(pos * noiseScale, uTime * timeScale));

    // The noise returns a 3D vector you can treat as velocity or offset.
    return pos + (curlVelocity * 0.76  * amount);
}

void main(void) {
    // read gaussian details
    SplatSource source;
    if (!initSource(source)) {
        gl_Position = discardVec;
        return;
    }

    // Ge the splat center
    vec3 modelCenter = readCenter(source);

    // Add some swirly motion
    modelCenter = swirl(modelCenter, uSwirlAmount);

    SplatCenter center;
    if (!initCenter(modelCenter, center)) {
        gl_Position = discardVec;
        return;
    }

    // project center to screen space
    SplatCorner corner;
    if (!initCorner(source, center, corner)) {
        gl_Position = discardVec;
        return;
    }

    // read color
    vec4 clr = readColor(source);

    // evaluate spherical harmonics
    #if SH_BANDS > 0
        // calculate the model-space view direction
        vec3 dir = normalize(center.view * mat3(center.modelView));
        clr.xyz += evalSH(source, dir);
    #endif

    clipCorner(corner, clr.w);

    // animate
    float speed = 1.2;
    float transitionDelay = 0.0;
    vec3 origin = vec3(0.0);

    vec2 size = transitionInSize(origin, modelCenter, corner, speed, transitionDelay);

    // Max the splats smaller when swirling
    size = mix(size, normalize(corner.offset) * 0.1, uSwirlAmount); 

    // write output
    gl_Position = center.proj + vec4(size, 0, 0);
    gaussianUV = corner.uv;
    gaussianColor = vec4(prepareOutputFromGamma(max(clr.xyz, 0.0)), clr.w);

    #ifndef DITHER_NONE
        id = float(source.id);
    #endif
}
`;
