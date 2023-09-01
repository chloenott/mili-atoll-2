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

  float uniformWaves(float direction, float amplitude, float numberOfWaves, float waveSpeed) {
    vec2 rotatedUV = vec2(vUv.x*cos(direction)-vUv.y*sin(direction), vUv.x*sin(direction)+vUv.y*cos(direction));
    float height = amplitude*sin(rotatedUV.y*numberOfWaves+u_time*waveSpeed);
    return height;
  }
  
  void main() {
    vUv = uv;
    float numberOfSuperimposedWaves = 5.;
    float direction = 0.0;
    float amplitude = 1.0/numberOfSuperimposedWaves;
    float numberOfWaves = 50.;
    float waveSpeed = 5.;
    vIntensity = 0.;
    for (float i = 0.; i < numberOfSuperimposedWaves; i++) {
      direction += 2.0*3.1415/numberOfSuperimposedWaves;
      vIntensity += uniformWaves(direction, amplitude/(i+1.)+0.02, numberOfWaves, waveSpeed/numberOfWaves*50.);
    }
    vIntensity += 0.5;
    vec3 newPosition = position + normal*vIntensity;
    color = texture2D(colorGradient, vec2(0.2+0.4*vIntensity, 0.5)).rgb;
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
  const [hovered, set] = useState(false)
  useCursor(hovered, 'grab', 'auto', document.body)
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
      <PerspectiveCamera makeDefault position={[0, 3, 1.5]} fov={90.0} up={[0, 0, 1]} />
      <OrbitControls enableZoom={false} autoRotate={false} />
      <mesh ref={seaRef} onPointerOver={() => set(true)} onPointerOut={() => set(false)}>
        <planeGeometry args={[100, 100, 128, 128]} />
        <shaderMaterial {...shaderData} />
      </mesh>
    </>
  );
}