'use client'

import { CameraShake, PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Mesh, MeshBasicMaterial, Object3D, Matrix4, InstancedMesh, PlaneGeometry, Vector3 } from 'three'
import { randFloat } from 'three/src/math/MathUtils.js';

type MeshWithStandardMaterial = Mesh<THREE.PlaneGeometry, MeshBasicMaterial>;

export function Scene() {
  const imageScale = 80;
  const numberOfBirds = 500;
  const birdsGroup = new Object3D();
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const cameraRef = useRef<MeshWithStandardMaterial>(null)
  const cameraPositionTarget = useRef<THREE.Vector3>(new Vector3(0,0,5))
  const satelliteImagesRef = useRef<THREE.Group>(null)
  const scene = useThree((state) => state.scene);
  const satelliteTextures = useTexture([
    '/images/satellite-1-watercolor.webp',
    '/images/satellite-2-watercolor.webp',
    '/images/satellite-3-watercolor.webp',
    '/images/satellite-4-watercolor.webp',
    '/images/satellite-5-watercolor.webp',
  ])
  const birdTexture = useTexture('/images/bird.png')
  const aspectRatio = satelliteTextures && satelliteTextures[0] ? satelliteTextures[0].image.width / satelliteTextures[0].image.height : 1;

  useEffect(() => {
    const matrix = new Matrix4();
    const birdMaterial = new MeshBasicMaterial({map: birdTexture, transparent: true, depthWrite: false});
    const mesh = new InstancedMesh(new PlaneGeometry(0.2, 0.2, 2, 2), birdMaterial, numberOfBirds);
    for (let i = 0; i < numberOfBirds-2; i++) {
      matrix.setPosition(randFloat(-5,5)*((1-i/numberOfBirds)*5+1), randFloat(-5,5)*((1-i/numberOfBirds)*5+1), -5+9*i/numberOfBirds);
      mesh.setMatrixAt(i, matrix);
    }
    for (let i = 0; i < 2; i++) {
      matrix.setPosition(-0.1+i/10, 0.0-i/10, 4.7+i/10);
      mesh.setMatrixAt(i+numberOfBirds-2, matrix);
    }
    mesh.rotateZ(-Math.PI/2);
    birdsGroup.add(mesh);
    birdsGroup.rotateZ(0);
    scene.add(birdsGroup);

    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      const camera = cameraRef.current;
      if (camera) {
        cameraPositionTarget.current = new Vector3(mouseY * 0.9, -mouseX * 0.9, 5+(-mouseY)*0.5);
        camera.rotation.y = -mouseY * 0.02;
        camera.rotation.x = -mouseX * 0.02;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      scene.remove(birdsGroup)
      window.removeEventListener('mousemove', handleMouseMove);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birdTexture])

  useEffect(() => {
    const imageChangeTimeout = setTimeout(() => {
      setCurrentImageIndex((currentImageIndex + 1) % satelliteTextures.length)
      if (satelliteImagesRef.current) {
        satelliteImagesRef.current.position.x = 0;
      }
    }, 5000)
    return () => {
      clearInterval(imageChangeTimeout)
    }
  })

  useFrame((state, delta) => {
    if (satelliteImagesRef && satelliteImagesRef.current && satelliteImagesRef.current.position) {
      satelliteImagesRef.current.position.x -= delta*1
    }
    birdsGroup.position.z = 0.02*Math.sin(state.clock.elapsedTime/2);
    if (cameraRef.current) {
      cameraRef.current.position.lerp(cameraPositionTarget.current, delta/5);
    }
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={120} near={0.001} rotation={[0,0,-Math.PI/2]} />
      <group ref={satelliteImagesRef} position={[0, 0, -10]} rotation={[0,0,-Math.PI/2]}>
        <mesh visible={currentImageIndex == 0 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[0]} />
        </mesh>
        <mesh visible={currentImageIndex == 1 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[1]} />
        </mesh>
        <mesh visible={currentImageIndex == 2 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[2]} />
        </mesh>
        <mesh visible={currentImageIndex == 3 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[3]} />
        </mesh>
        <mesh visible={currentImageIndex == 4 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[4]} />
        </mesh>
        <mesh visible={currentImageIndex == 5 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[5]} />
        </mesh>
      </group>
    </>
  );
}