'use client'

import { useTexture } from '@react-three/drei';
import { ThreeElements, useFrame } from '@react-three/fiber'
import { format } from 'path';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, LuminanceFormat, RedFormat } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D swellIntensity;
  uniform sampler2D colorGradient;
  varying vec2 vUv;

  void main() {
    float intensity = texture2D(swellIntensity, vUv).r;
    vec3 color = texture2D(colorGradient, vec2(intensity, 0.5)).rgb;
    gl_FragColor = vec4(color, 1.);
  }
`

export function Scene() {
  const globeRef = useRef<MeshWithStandardMaterial>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const initTexture = new Texture()
  const birdTexture = useTexture('/images/color_gradient.png')

  const shaderData = useMemo(() => ({
    uniforms: {
      swellIntensity: { value: initTexture },
      colorGradient: { value: birdTexture },
    },
    fragmentShader,
    vertexShader,
  }), [])


  useFrame((state, delta) => {
    if (globeRef && globeRef.current && globeRef.current.rotation) 
      globeRef.current.rotation.y += delta*0.1
  })

  useEffect(() => {
    const vid = document.createElement('video')
    vid.src = '/videos/sample.mov'
    vid.autoplay = true
    vid.loop = true
    vid.muted = true
    vid.playsInline = true
    vid.onloadeddata = () => {
      vid.play()
      const videoTexture = new VideoTexture(vid)
      videoTexture.format = RedFormat
      if (globeRef && globeRef.current && globeRef.current.material) {
        shaderData.uniforms.swellIntensity.value = videoTexture
        setVideoLoaded(true)
      } else {
        console.log('globeRef is not ready')
      }
    }
  }, [])

  return (
    <>
      <mesh ref={globeRef} visible={videoLoaded}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial  {...shaderData} />
      </mesh>
    </>
  );
}