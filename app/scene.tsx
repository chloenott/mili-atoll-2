'use client'

import { PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';
import { create } from 'domain';
import { useEffect, useRef, useState } from 'react';
import { Mesh, MeshBasicMaterial, Object3D, Matrix4, InstancedMesh, PlaneGeometry } from 'three'
import { randFloat } from 'three/src/math/MathUtils.js';

type MeshWithStandardMaterial = Mesh<THREE.PlaneGeometry, MeshBasicMaterial>;

export function Scene() {
  const imageScale = 20;
  const numberOfBirds = 500;
  const birdsGroup = new Object3D();
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const imageMesh = useRef<MeshWithStandardMaterial>(null)
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
    const mesh = new InstancedMesh(new PlaneGeometry(0.1, 0.1, 2, 2), birdMaterial, numberOfBirds);
    for (let i = 0; i < 2; i++) {
      matrix.setPosition(-0.1+i/10, -0.1-i/10, 4.7+i/10);
      mesh.setMatrixAt(i, matrix);
    }
    for (let i = 2; i < numberOfBirds; i++) {
      matrix.setPosition(randFloat(-7,7), randFloat(-7,7), 2+1*i/numberOfBirds);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.rotateZ(-Math.PI/2);
    birdsGroup.add(mesh);
    birdsGroup.rotateZ(0);
    scene.add(birdsGroup);

    const imageChangeInterval = setInterval(() => {
      setCurrentImageIndex((currentImageIndex + 1) % satelliteTextures.length)
    }, 5000)
    return () => {
      clearInterval(imageChangeInterval)
      scene.remove(birdsGroup)
    }
  })

  useEffect(() => {
    if (satelliteImagesRef.current) {
      satelliteImagesRef.current.position.x = 0;
    }
  }, [currentImageIndex]);

  useFrame((state, delta) => {
    if (satelliteImagesRef && satelliteImagesRef.current && satelliteImagesRef.current.position) {
      satelliteImagesRef.current.position.x -= delta*0.1
    }
    birdsGroup.position.z = 0.02*Math.sin(state.clock.elapsedTime/2);
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={120} />
      <group ref={satelliteImagesRef}>
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