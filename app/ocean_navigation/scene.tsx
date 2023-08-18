'use client'

import { useTexture } from '@react-three/drei';
import { ThreeElements, useFrame } from '@react-three/fiber'
import { format } from 'path';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, LuminanceFormat, RedFormat, NearestFilter, NearestMipMapNearestFilter, NearestMipMapLinearFilter, LinearFilter, NearestMipmapNearestFilter, NearestMipmapLinearFilter } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShaderSwells = `
  uniform sampler2D swellIntensity;
  uniform sampler2D colorGradient;
  varying vec2 vUv;
  varying float vIntensity;
  varying vec3 vSwell_color;
  
  void main() {
    vUv = uv;
    vIntensity = texture2D(swellIntensity, vUv).r;
    vSwell_color = texture2D(colorGradient, vec2(max(vIntensity,0.05), 0.5)).rgb;
    float modulationFactor = vIntensity * 0.3;
    vec3 newPosition = position + normal * modulationFactor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const fragmentShaderSwells = `
  uniform sampler2D colorGradient;
  varying float vIntensity;
  varying vec3 vSwell_color;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vSwell_color, 1.);
  }
`

const vertexShaderLand = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShaderLand = `
  uniform sampler2D blackMarble;
  varying vec2 vUv;

  void main() {
    float intensity = texture2D(blackMarble, vUv).r;
    vec3 black_marble_color = vec3(1.,1.,1.);//intensity * vec3(0.8, 0.9, 1.0);
    gl_FragColor = vec4(black_marble_color, intensity > 0.9 ? 1. : intensity);
  }
`

export function Scene() {
  const globeRef = useRef<MeshWithStandardMaterial>(null)
  const landRef = useRef<MeshWithStandardMaterial>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const initTexture = new Texture()
  const colorGradient = useTexture('/images/color_gradient.png')
  const blackMarble = useTexture('/images/NASA_BlackMarble_2016_3km_white_4k.jpg')
  blackMarble.format = RedFormat
  blackMarble.minFilter = NearestMipmapLinearFilter

  const shaderData = useMemo(() => ({
    uniforms: {
      swellIntensity: { value: initTexture },
      colorGradient: { value: colorGradient },
    },
    fragmentShader: fragmentShaderSwells,
    vertexShader: vertexShaderSwells,
  }), [colorGradient])

  const landShaderData = useMemo(() => ({
    uniforms: {
      blackMarble: { value: blackMarble },
    },
    fragmentShader: fragmentShaderLand,
    vertexShader: vertexShaderLand,
  }), [blackMarble])

  useFrame((state, delta) => {
    if (globeRef && globeRef.current && globeRef.current.rotation && landRef && landRef.current && landRef.current.rotation) {
        globeRef.current.rotation.y += delta*0.1
        landRef.current.rotation.y += delta*0.1
      }
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
        <sphereGeometry args={[2, 256, 256]} />
        <shaderMaterial  {...shaderData} />
      </mesh>
      <mesh ref={landRef}>
        <sphereGeometry args={[2.05, 128, 128]} />
        <shaderMaterial  {...landShaderData} transparent={true} />
      </mesh>
    </>
  );
}