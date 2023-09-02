'use client'

import { OrbitControls, PerspectiveCamera, Sparkles, useTexture, useCursor, FirstPersonControls, CameraControls, PivotControls, ArcballControls, Sphere } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, RedFormat, NearestFilter, NearestMipmapLinearFilter, FrontSide, Vector2, Vector3 } from 'three'

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
    return mod((x*137.),y);
  }

  void main() {
    vUv = vec2(uv.x-0.5, uv.y-0.5);
    // 74 km/h (46 mph; 40 kn)	1,313 km (816 mi)	42 h	8.5 m (28 ft)	136 m (446 ft)	11.4 s, 11.9 m/s (39.1 ft/s)
    float numberOfSuperimposedWaves = 15.;
    float direction = 0.0;
    float amplitude = 8.5/2.; // m, trough to crest divided by 2
    float planeLength = 2000.; // m
    float numberOfWaves = planeLength/136.; // waves per 1km
    float waveSpeed = 11.9; // m/s
    vIntensity = 0.;
    for (float i = 0.; i < numberOfSuperimposedWaves; i++) {
      direction += 2.0*3.1415/numberOfSuperimposedWaves;
      vIntensity += uniformWaves(direction, amplitude, numberOfWaves, waveSpeed, numberOfSuperimposedWaves, planeLength, randomNumber(i, direction));
    }
    vec3 worldPosition = vec3(modelMatrix * vec4(position, 1.0));
    vec3 newWorldPosition = vec3(worldPosition.x,worldPosition.y,worldPosition.z+20.*numberOfSuperimposedWaves*vIntensity); // 20*numberOfSuperimposedWaves to undo the 1/20/numberofSuperimposedWaves scaling factor
    color = texture2D(colorGradient, vec2(0.3+3.*vIntensity, 0.5)).rgb;
    gl_Position = projectionMatrix * viewMatrix * vec4(newWorldPosition, 1.0);
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
  const [cameraTarget, setCameraTarget] = useState(new Vector3(0,0,0))
  const [cameraPosition, setCameraPosition] = useState(new Vector3(0,5,0))
  const planeLength = 2000.; // m

  const shaderData = useMemo(() => ({
    uniforms: {
      colorGradient: { value: colorGradient },
      u_time: { value: 0 },
    },
    vertexShader: vertexShaderSea,
    fragmentShader: fragmentShaderSea,
  }), [colorGradient])

  const calculateWaveIntensity = (x: number, y: number, time: number) => {
    const amplitude = 8.5/2.; // m, trough to crest divided by 2
    const numberOfWaves = planeLength/136.; // waves per 1km
    const waveSpeed = 11.9; // m/s
    const numberOfSuperimposedWaves = 15.0;
    const vUv = new Vector2(x-0.5, y-0.5);
    let intensity = 0;
    let direction = 0;
    for (let i = 0.0; i < numberOfSuperimposedWaves; i++) {
      direction += 2.0*3.1415/numberOfSuperimposedWaves;
      const rotatedUV = new Vector2(vUv.x*Math.cos(direction)-vUv.y*Math.sin(direction), vUv.x*Math.sin(direction)+vUv.y*Math.cos(direction));
      const random_inputs = new Vector2(i, direction);
      const phase = (random_inputs.x*137.)%random_inputs.y;
      const adjusted_amplitude = amplitude;
      intensity += adjusted_amplitude/numberOfSuperimposedWaves/20*Math.sin(2.*3.14159*(phase+rotatedUV.y*numberOfWaves+time*waveSpeed/planeLength*numberOfWaves));
    }
    return 20.*numberOfSuperimposedWaves*intensity;
  }

  useFrame((state) => {
    shaderData.uniforms.u_time.value = state.clock.elapsedTime;
    console.log(state.camera.position)
    //setCameraPosition(new Vector3(0,10,15+calculateWaveIntensity(0.5-state.camera.position.x/planeLength/2, 0.5-state.camera.position.y/planeLength/2, state.clock.elapsedTime)));
    setCameraTarget(new Vector3(0,0,1+calculateWaveIntensity(0.5, 0.5, state.clock.elapsedTime)));
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={90.0} up={[0, 0, 1]} position={cameraPosition} />
      <OrbitControls target={cameraTarget} />
      <Sphere position={cameraTarget} />
      <mesh ref={seaRef} position={[0,0,0]}>
        <planeGeometry args={[2000, 2000, 256, 256]} />
        <shaderMaterial {...shaderData} side={FrontSide} />
      </mesh>
    </>
  );
}