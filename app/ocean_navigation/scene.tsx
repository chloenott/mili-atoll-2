'use client'

import { OrbitControls, PerspectiveCamera, Sparkles, useTexture, useCursor } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, RedFormat, NearestFilter, NearestMipmapLinearFilter, FrontSide } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShaderSwells = `
  uniform sampler2D swellIntensity;
  uniform sampler2D colorGradient;
  varying vec2 vUv;
  varying float vIntensity;
  varying vec3 vSwell_color;

  float getFresnelIntensity() {
    float power = 3.0;
    vec3 viewDirection = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 transformedNormal = normalize(normalMatrix * normal);
    return pow(1.0 + min(0.0,dot(viewDirection, transformedNormal)), power);
  }
  
  void main() {
    vUv = vec2(fract(uv.x*1024./1024.), uv.y);
    vIntensity = max(texture2D(swellIntensity, vUv).r, 0.05);
    vec3 fresnelLight = getFresnelIntensity()*vec3(0.2,0.5,0.8);
    float modulationFactor = 0.17 + vIntensity*0.5;
    vSwell_color = texture2D(colorGradient, vec2(0.15+0.3*getFresnelIntensity()+1.*vIntensity, 0.5)).rgb;
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
    gl_FragColor = vec4(vSwell_color, 1.);
  }
`

const vertexShaderLand = `
  varying vec2 vUv;
  varying vec3 fresnelLight;

  float getRimLight() {
    float power = 6.0;
    vec3 viewDirection = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 transformedNormal = normalize(normalMatrix * normal);
    return smoothstep(0.2,0.5,pow(1.0 + dot(viewDirection, transformedNormal), power));
  }

  float getFresnelIntensity() {
    float power = 1.;
    vec3 viewDirection = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vec3 transformedNormal = normalize(normalMatrix * normal);
    return pow(1.0 + dot(viewDirection, transformedNormal), power);
  }

  void main() {
    vUv = uv;
    fresnelLight = (-1.5*getFresnelIntensity()-getRimLight())*vec3(0.2,0.5,0.8);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShaderLand = `
  uniform sampler2D colorGradient;
  uniform sampler2D blackMarble;
  varying vec2 vUv;
  varying vec3 fresnelLight;

  void main() {
    float intensity = 0.1+0.9*texture2D(blackMarble, vUv).r;
    vec3 black_marble_color = texture2D(colorGradient, vec2(intensity, 0.5)).rgb;
    vec3 total_color = -1.*fresnelLight + black_marble_color;
    gl_FragColor = vec4(total_color, smoothstep(0.12, 0.13, intensity));
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

  useEffect(() => {
    const vid = document.createElement('video')
    vid.src = '/videos/sample.mov'
    vid.autoplay = true
    vid.loop = true
    vid.muted = true
    vid.playsInline = true
    vid.playbackRate = 0.75
    vid.onloadeddata = () => {
      vid.play()
      const videoTexture = new VideoTexture(vid)
      videoTexture.format = RedFormat
      videoTexture.minFilter = NearestFilter
      videoTexture.magFilter = NearestFilter
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
      <OrbitControls enableZoom={false} enableDamping={true} dampingFactor={0.02} autoRotate={true} autoRotateSpeed={-1} />
      <mesh ref={globeRef} visible={videoLoaded}>
        <sphereGeometry args={[1.8, 1024, 512]} />
        <shaderMaterial {...shaderData} side={FrontSide} />
      </mesh>
      <mesh ref={landRef} visible={videoLoaded}>
        <sphereGeometry args={[2.01, 64, 64]} />
        <shaderMaterial {...landShaderData} transparent={true} side={FrontSide} />
      </mesh>
      {/* <EasterlyText />
      <NortherlyText /> */}
      <Sparkles color={0xffffff} count={100} speed={0.2} size={12} scale={15} visible={videoLoaded} />
      <Sparkles color={0xffffff} count={50} speed={0.4} size={17} scale={4.5} rotation={[Math.PI/4,Math.PI/4,0]} visible={videoLoaded} />
      <Sparkles color={0xffffff} count={100} speed={0.5} size={8} scale={6} rotation={[Math.PI/3,0,0]} visible={videoLoaded} />
      {/* <PostProcess /> */}
    </>
  );
}