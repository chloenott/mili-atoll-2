'use client'

import { OrbitControls, PerspectiveCamera, Sparkles, useTexture, useCursor, FirstPersonControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, RedFormat, NearestFilter, NearestMipmapLinearFilter, FrontSide } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShaderSea = `
  varying vec2 vUv;
  varying float vIntensity;
  uniform float u_time;
  uniform sampler2D colorGradient;
  varying vec3 color;

  float uniformWaves(float direction, float amplitude, float numberOfWaves, float waveSpeed, float numberOfSuperimposedWaves, float planeLength, float phase) {
    vec2 rotatedUV = vec2(vUv.x*cos(direction)-vUv.y*sin(direction), vUv.x*sin(direction)+vUv.y*cos(direction));
    float intensity = amplitude/numberOfSuperimposedWaves/20.*sin(2.*3.14159*(phase+rotatedUV.y*numberOfWaves+u_time*waveSpeed/planeLength*numberOfWaves));
    return intensity;
  }

  float randomNumber(float x, float y) {
    return fract(sin(dot(vec2(x,y),vec2(12.9898,78.233)))*43758.5453);
  }

  void main() {
    vUv = vec2(uv.x-0.5, uv.y-0.5);
    // 74 km/h (46 mph; 40 kn)	1,313 km (816 mi)	42 h	8.5 m (28 ft)	136 m (446 ft)	11.4 s, 11.9 m/s (39.1 ft/s)
    float numberOfSuperimposedWaves = 15.;
    float direction = 0.0;
    float amplitude = 8.5/2.; // m, trough to crest divided by 2
    float planeLength = 1000.; // m
    float numberOfWaves = planeLength/136.; // waves per 1km
    float waveSpeed = 11.9; // m/s
    vIntensity = 0.;
    for (float i = 0.; i < numberOfSuperimposedWaves; i++) {
      direction += 1.0*3.1415/numberOfSuperimposedWaves;
      vIntensity += uniformWaves(direction, amplitude, numberOfWaves, waveSpeed, numberOfSuperimposedWaves, planeLength, randomNumber(i, direction));
    }
    vec3 newPosition = position + 20.*numberOfSuperimposedWaves*normal*vIntensity; // 20*numberOfSuperimposedWaves to undo the 1/20/numberofSuperimposedWaves scaling factor
    vIntensity += 0.5;
    color = texture2D(colorGradient, vec2(0.1+0.4*vIntensity, 0.5)).rgb;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const fragmentShaderSea = `
  varying vec2 vUv;
  varying float vIntensity;
  varying vec3 color;

  void main() {
    gl_FragColor = vec4(color, 1.);
  }
`

export function Scene() {
  const seaRef = useRef<Mesh>(null)
  const colorGradient = useTexture('/images/color_gradient.png')

  const shaderData = useMemo(() => ({
    uniforms: {
      colorGradient: { value: colorGradient },
      u_time: { value: 0 },
    },
    vertexShader: vertexShaderSea,
    fragmentShader: fragmentShaderSea,
  }), [colorGradient])

  useFrame((state) => {
    shaderData.uniforms.u_time.value = state.clock.elapsedTime;
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 250]} fov={90.0} up={[0, 0, 1]} />
      <OrbitControls enableZoom={false} autoRotate={false} enableDamping={false} />
      <mesh ref={seaRef}>
        <planeGeometry args={[1000, 1000, 256, 256]} />
        <shaderMaterial {...shaderData} side={FrontSide} />
      </mesh>
    </>
  );
}