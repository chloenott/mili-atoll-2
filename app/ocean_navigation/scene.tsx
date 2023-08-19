'use client'

import { DeviceOrientationControls, OrbitControls, PerspectiveCamera, Sparkles, Torus, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber'
import { Bloom, Depth, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { Orbit } from 'next/font/google';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, LuminanceFormat, RedFormat, NearestFilter, NearestMipMapNearestFilter, NearestMipMapLinearFilter, LinearFilter, NearestMipmapNearestFilter, NearestMipmapLinearFilter, DoubleSide, FrontSide, AmbientLight, Fog } from 'three'
import { PostProcess } from './post_process';

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShaderSwells = `
  uniform sampler2D swellIntensity;
  uniform sampler2D colorGradient;
  varying vec2 vUv;
  varying float vIntensity;
  varying vec3 vSwell_color;

  float getFresnelIntensity() {
    float power = 10.0;
    vec3 viewDirection = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 transformedNormal = normalize(normalMatrix * normal);
    return pow(1.0 + dot(viewDirection, transformedNormal), power);
  }
  
  void main() {
    vUv = uv;
    vIntensity = max(texture2D(swellIntensity, vUv).r, 0.05);
    vec3 fresnelLight = getFresnelIntensity()*vec3(0.2,0.5,0.8);
    vSwell_color = 10.*fresnelLight + texture2D(colorGradient, vec2(-0.05+1.1*vIntensity, 0.5)).rgb;
    float modulationFactor = 0.17 + vIntensity*0.3;
    modulationFactor = vIntensity < 0.07 ? 0.2 : modulationFactor;
    vec3 newPosition = position + normal * modulationFactor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const fragmentShaderSwells = `
  varying float vIntensity;
  varying vec3 vSwell_color;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vSwell_color, vIntensity);
  }
`

const vertexShaderLand = `
  varying vec2 vUv;
  varying vec3 fresnelLight;

  float getFresnelIntensity() {
    float power = 2.0;
    vec3 viewDirection = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 transformedNormal = normalize(normalMatrix * normal);
    return pow(1.0 + dot(viewDirection, transformedNormal), power);
  }

  void main() {
    vUv = uv;
    fresnelLight = getFresnelIntensity()*vec3(0.2,0.5,0.8);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShaderLand = `
  uniform sampler2D colorGradient;
  uniform sampler2D blackMarble;
  varying vec2 vUv;
  varying vec3 fresnelLight;

  void main() {
    float intensity = texture2D(blackMarble, vUv).r;
    vec3 black_marble_color = texture2D(colorGradient, vec2(intensity, 0.5)).rgb;
    vec3 total_color = 2.*fresnelLight + black_marble_color;
    gl_FragColor = vec4(total_color, intensity > 0.02 ? 1. : intensity);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [colorGradient])

  const landShaderData = useMemo(() => ({
    uniforms: {
      blackMarble: { value: blackMarble },
      colorGradient: { value: colorGradient },
    },
    fragmentShader: fragmentShaderLand,
    vertexShader: vertexShaderLand,
  }), [blackMarble, colorGradient])

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
    vid.playbackRate = 1
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={15.0} />
      <OrbitControls enableZoom={false} />
      <mesh ref={globeRef} visible={videoLoaded}>
        <sphereGeometry args={[1, 512, 512]} />
        <shaderMaterial  {...shaderData} side={FrontSide} />
      </mesh>
      <mesh ref={landRef}>
        <sphereGeometry args={[1.21, 128, 128]} />
        <shaderMaterial  {...landShaderData} transparent={true} side={FrontSide} />
      </mesh>
      <Sparkles color={0xbbbbff} count={100} speed={0.2} size={5} scale={6} />
      <Sparkles color={0xbbccff} count={50} speed={0.4} size={10} scale={3.5} rotation={[Math.PI/4,Math.PI/4,0]} />
      <Sparkles color={0x00ffbb} count={20} speed={0.5} size={20} scale={3} rotation={[Math.PI/4,0,0]} />
      <PostProcess />
    </>
  );
}