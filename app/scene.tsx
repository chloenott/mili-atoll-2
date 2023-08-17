'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import THREE, { Mesh, MeshBasicMaterial } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.PlaneGeometry, MeshBasicMaterial>;

export function Scene() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const imageMesh = useRef<MeshWithStandardMaterial>(null)
  const satelliteImagesRef = useRef<THREE.Group>(null)
  const imageScale = 9;
  const satelliteTextures = useTexture([
    '/images/satellite-1-watercolor.webp',
    '/images/satellite-2-watercolor.webp',
    '/images/satellite-3-watercolor.webp',
    '/images/satellite-4-watercolor.webp',
    '/images/satellite-5-watercolor.webp',
  ])
  const aspectRatio = satelliteTextures && satelliteTextures[0] ? satelliteTextures[0].image.width / satelliteTextures[0].image.height : 1;

  useEffect(() => {
    const imageChangeInterval = setInterval(() => {
      setCurrentImageIndex((currentImageIndex + 1) % satelliteTextures.length)
    }, 3000)
    return () => {
      clearInterval(imageChangeInterval)
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
  })

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
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