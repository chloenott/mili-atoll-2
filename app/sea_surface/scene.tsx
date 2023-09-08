'use client'

import { OrbitControls, PerspectiveCamera, Sparkles, useTexture, useCursor, FirstPersonControls, CameraControls, PivotControls, ArcballControls, Sphere } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial, Texture, RedFormat, NearestFilter, NearestMipmapLinearFilter, FrontSide, Vector2, Vector3, SphereGeometry, ShaderMaterial, PlaneGeometry } from 'three'
import { alphaTest } from 'three/examples/jsm/nodes/Nodes.js';

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

const vertexShaderSea = `
  varying vec2 vUv;
  varying float vIntensity;
  uniform float u_time;
  uniform sampler2D colorGradient;
  uniform sampler2D spectraTexture;
  varying vec3 color;

  float uniformWaves(float direction, float amplitude, float numberOfWaves, float waveSpeed, float numberOfSuperimposedWaves, float planeLength, float phase) {
    vec2 rotatedUV = vec2(vUv.x*cos(direction)-vUv.y*sin(direction), vUv.x*sin(direction)+vUv.y*cos(direction));
    float intensity = amplitude/numberOfSuperimposedWaves/1.*sin(2.*3.14159*(phase+rotatedUV.y*numberOfWaves+u_time*waveSpeed/planeLength*numberOfWaves));
    return intensity;
  }

  float randomNumber(float x, float y) {
    return 0.*(x*7919./100.)+(y*6271./100.);
  }

  void main() {
    vUv = vec2(uv.x-0.5, uv.y-0.5);
    float planeLength = 2000.; // m
    float direction = 0.;
    float numberOfWaves = 0.;
    float waveSpeed = 0.;
    float amplitude = 0.;
    float lookupX = 0.;
    float lookupY = 0.;
    float phiCountMax = 72.;
    float periodCountMax = 60.;
    float numberOfSuperimposedWaves = phiCountMax*periodCountMax/2./2.;
    float numberOfWavesPer1000m[60] = float[](0.8333333, 0.88709944, 0.9443345, 1.0052624, 1.0701212,
        1.1391647, 1.2126629, 1.2909032, 1.3741914, 1.4628534,
        1.5572356, 1.6577075, 1.7646618, 1.8785164, 1.9997172,
        2.1287377, 2.2660825, 2.4122884, 2.5679278, 2.733609,
        2.9099796, 3.0977292, 3.2975929, 3.5103514, 3.7368371,
        3.9779353, 4.234589, 4.507802, 4.7986426, 5.1082478,
        5.437829, 5.788674, 6.162155, 6.559734, 6.9829636,
        7.4334993, 7.913104, 8.423653, 8.967141, 9.545695,
        10.161577, 10.817195, 11.515115, 12.25806, 13.0489435,
        13.890853, 14.787082, 15.741134, 16.75674, 17.837877,
        18.988764, 20.213905, 21.518095, 22.906427, 24.384336,
        25.957598, 27.632364, 29.415186, 31.313036, 33.333336
    );
    vIntensity = 0.;
    for (float angle = 0.; angle < phiCountMax; angle=angle+2.) {
      for (float period = 0.; period < periodCountMax; period=period+2.) {
        direction = angle/60.*3.1415*2. + 3.1415; // North is 0, East is 90, direction refers to the direction the waves are going
        numberOfWaves = planeLength/1000.*numberOfWavesPer1000m[int(period)];
        waveSpeed = 11.9;
        lookupX = sin(direction)*numberOfWavesPer1000m[int(period)]/numberOfWavesPer1000m[int(periodCountMax-1.)]/2.;
        lookupY = cos(direction)*numberOfWavesPer1000m[int(period)]/numberOfWavesPer1000m[int(periodCountMax-1.)]/2.;
        amplitude = texture2D(spectraTexture, vec2(lookupX, lookupY)).r/255.*10.;
        waveSpeed = sqrt(9.81*1000./numberOfWavesPer1000m[int(period)]);
        vIntensity += uniformWaves(direction, amplitude, numberOfWaves, waveSpeed, numberOfSuperimposedWaves, planeLength, randomNumber(angle, period));
      }
    }
    vec3 worldPosition = vec3(modelMatrix * vec4(position, 1.0));
    vec3 newWorldPosition = vec3(worldPosition.x,worldPosition.y,worldPosition.z+100.*1.*numberOfSuperimposedWaves*vIntensity); // 20*numberOfSuperimposedWaves to undo the 1/20/numberofSuperimposedWaves scaling factor
    color = texture2D(colorGradient, vec2(0.3+2500.*vIntensity, 0.5)).rgb;
    gl_Position = projectionMatrix * viewMatrix * vec4(newWorldPosition, 1.0);
  }
`

const fragmentShaderSea = `
  uniform float startRadiusInUvUnits;
  uniform float endRadiusInUvUnits;
  varying vec2 vUv;
  varying float vIntensity;
  varying vec3 color;

  void main() {
    float uvLength = length(vUv);
    float base = smoothstep(startRadiusInUvUnits-0.05, startRadiusInUvUnits, uvLength);
    float mask = smoothstep(endRadiusInUvUnits-0.05, endRadiusInUvUnits, uvLength);
    float alpha = base - mask;
    gl_FragColor = vec4(color, alpha);
  }
`

export function Scene() {
  const seaRef = useRef<Mesh>(null)
  const colorGradient = useTexture('/images/color_gradient.png')
  const spectraTexture = useTexture('/images/2021-08-02T18_chunk1246.png')
  const [cameraTarget, setCameraTarget] = useState(new Vector3(0,0,0))
  const [cameraAngle, setCameraAngle] = useState(Math.PI/2)
  const planeLength = 2000.; // m
  const controlsRef = useRef<any>()
  const state = useThree((state) => state);

  const shaderDataHighDetail = useMemo(() => ({
    uniforms: {
      colorGradient: { value: colorGradient },
      spectraTexture: { value: spectraTexture },
      u_time: { value: 0 },
      startRadiusInUvUnits: { value: 0.0 },
      endRadiusInUvUnits: { value: 0.5 }
    },
    vertexShader: vertexShaderSea,
    fragmentShader: fragmentShaderSea,
    transparent: true,
  }), [colorGradient, spectraTexture])

  const shaderDataLowDetail = useMemo(() => ({
    uniforms: {
      colorGradient: { value: colorGradient },
      spectraTexture: { value: spectraTexture },
      u_time: { value: 0 },
      startRadiusInUvUnits: { value: 0.25 },
      endRadiusInUvUnits: { value: 0.5 }
    },
    vertexShader: vertexShaderSea,
    fragmentShader: fragmentShaderSea,
    transparent: true,
  }), [colorGradient, spectraTexture])

  const calculateWaveIntensity = (x: number, y: number, time: number) => {
    const amplitude = 8.5/2.; // m, trough to crest divided by 2
    const numberOfWaves = planeLength/136.; // waves per 1km
    const waveSpeed = 11.9; // m/s
    const numberOfSuperimposedWaves = 15.0;
    const vUv = new Vector2(x-0.5, y-0.5);
    let intensity = 0;
    let direction = 0;
    for (let i = 0.0; i < numberOfSuperimposedWaves; i++) {
      direction += 1.0*3.1415/numberOfSuperimposedWaves;
      const rotatedUV = new Vector2(vUv.x*Math.cos(direction)-vUv.y*Math.sin(direction), vUv.x*Math.sin(direction)+vUv.y*Math.cos(direction));
      const random_inputs = new Vector2(i, direction);
      const phase = (random_inputs.x*7919.)%(random_inputs.y*6271);
      const adjusted_amplitude = amplitude/5.0;
      intensity += adjusted_amplitude/numberOfSuperimposedWaves/1*Math.sin(2.*3.14159*(phase+rotatedUV.y*numberOfWaves+time*waveSpeed/planeLength*numberOfWaves));
    }
    return 100*1*numberOfSuperimposedWaves*intensity;
  }


  useEffect(() => {
    const smallMeshScale = 0.5;
    const offset = 0.5-smallMeshScale/2;
    const geometry = new PlaneGeometry(planeLength * smallMeshScale, planeLength * smallMeshScale, 128, 128);
    for (let i = 0; i < geometry.attributes.uv.count; i++) {
      geometry.attributes.uv.setX(i, geometry.attributes.uv.getX(i) * smallMeshScale + offset);
      geometry.attributes.uv.setY(i, geometry.attributes.uv.getY(i) * smallMeshScale + offset);
    }
    const mesh = new Mesh(geometry, new ShaderMaterial(shaderDataHighDetail));
    state.scene.add(mesh);

    const geometry2 = new PlaneGeometry(planeLength, planeLength, 128, 128);
    const mesh2 = new Mesh(geometry2, new ShaderMaterial(shaderDataLowDetail));
    state.scene.add(mesh2);
  })

  useFrame((state) => {
    shaderDataHighDetail.uniforms.u_time.value = state.clock.elapsedTime;
    shaderDataLowDetail.uniforms.u_time.value = state.clock.elapsedTime;
    // const heightAboveWave = 5;
    // setCameraTarget(new Vector3(0,0,3+calculateWaveIntensity(0.5, 0.5, state.clock.elapsedTime)));
    // let cameraPositionTemp = new Vector3();
    // state.camera.getWorldPosition(cameraPositionTemp)
    // const wavePositionAtCamera = new Vector3(cameraPositionTemp.x,cameraPositionTemp.y,calculateWaveIntensity(0.5+cameraPositionTemp.x/planeLength/2, 0.5+cameraPositionTemp.y/planeLength/2, state.clock.elapsedTime));
    // const horizontalDistanceCameraToTarget = Math.sqrt(Math.pow(wavePositionAtCamera.x,2)+Math.pow(wavePositionAtCamera.y,2));
    // const angle = Math.PI/2 - Math.atan2(heightAboveWave+wavePositionAtCamera.z-cameraTarget.z, horizontalDistanceCameraToTarget);
    // setCameraAngle(angle);
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={70.0} up={[0, 0, 1]} near={0.1} position={[0,0,20]} />
      <OrbitControls ref={controlsRef} />
      {/* <Sphere args={[1, 64, 64]} position={(new Vector3()).subVectors(cameraTarget, new Vector3(0,0,3))} /> */}
      {/* <mesh ref={seaRef} position={[0,0,0]}>
        <planeGeometry args={[planeLength, planeLength, 128, 128]} />
        <shaderMaterial {...shaderData} side={FrontSide} />
      </mesh> */}
    </>
  );
}