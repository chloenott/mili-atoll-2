'use client'

import { CameraShake, PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Mesh, MeshBasicMaterial, Object3D, Matrix4, InstancedMesh, PlaneGeometry, Vector3 } from 'three'
import { randFloat } from 'three/src/math/MathUtils.js';

type MeshWithStandardMaterial = Mesh<THREE.PlaneGeometry, MeshBasicMaterial>;

export function Scene() {
  const largeMapYOffset = 3;
  const imageScale = 80;
  const numberOfBirds = 500;
  const birdsGroupRef = useRef<Object3D>(new Object3D());
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const cameraRef = useRef<MeshWithStandardMaterial>(null)
  const cameraPositionTarget = useRef<THREE.Vector3>(new Vector3(0,0,5))
  const opacityTarget = useRef(1);
  const birdsPositionTarget = useRef<THREE.Vector3>(new Vector3(0,0,0))
  const cameraHeightOffset = useRef(0)
  const satelliteImagesRef = useRef<THREE.Group>(null)
  const satelliteLargeMapRef = useRef<THREE.Mesh>(null)
  const scene = useThree((state) => state.scene);
  const satelliteTextures = useTexture([
    '/images/satellite-1-watercolor.webp',
    '/images/satellite-2-watercolor.webp',
    '/images/satellite-3-watercolor.webp',
    '/images/satellite-4-watercolor.webp',
    '/images/satellite-5-watercolor.webp',
  ])
  const satelliteLargeMap = useTexture('/images/satellite-large-map.webp')
  const birdTexture = useTexture('/images/bird.png')
  const aspectRatio = satelliteTextures && satelliteTextures[0] ? satelliteTextures[0].image.width / satelliteTextures[0].image.height : 1;
  const aspectRatioLarge = satelliteLargeMap ? satelliteLargeMap.image.width / satelliteLargeMap.image.height : 1;
  const currentCursorPosition = useRef({clientX: 0, clientY: 0})

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
    const birdsGroup = new Object3D();
    birdsGroup.add(mesh);
    birdsGroup.rotateZ(0);
    birdsGroupRef.current = birdsGroup;
    scene.add(birdsGroup);

    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      currentCursorPosition.current = {clientX: e.clientX, clientY: e.clientY}
      const camera = cameraRef.current;
      if (camera) {
        cameraPositionTarget.current = cameraHeightOffset.current == 0 ? 
                                          new Vector3(mouseY*0.9, -mouseX*0.9, 5+(-mouseY)*0.5+cameraHeightOffset.current)
                                          : new Vector3(20+mouseY*100, -mouseX*100, cameraHeightOffset.current)
        camera.rotation.y = -mouseY * 0.02;
        camera.rotation.x = -mouseX * 0.02;
      }
    };

    const handleWindowClick = () => {
      const camera = cameraRef.current;
      if (camera) {
        setCurrentImageIndex(1)
        cameraHeightOffset.current = cameraHeightOffset.current == 0 ? 20 : 0;
        opacityTarget.current = cameraHeightOffset.current == 0 ? 1 : 0;
        birdsPositionTarget.current = cameraHeightOffset.current == 0 ? new Vector3(0,0,0) : new Vector3(-100,0,0);
        handleMouseMove(currentCursorPosition.current)
      }
      if (satelliteImagesRef.current && satelliteLargeMapRef.current) {
        satelliteImagesRef.current.position.x = 0;
        satelliteLargeMapRef.current.position.x = largeMapYOffset;
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleWindowClick);
    return () => {
      scene.remove(birdsGroup)
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birdTexture])

  useEffect(() => {
    const imageChangeTimeout = setTimeout(() => {
      setCurrentImageIndex((currentImageIndex + 1) % satelliteTextures.length)
      if (satelliteImagesRef.current && satelliteLargeMapRef.current) {
        satelliteImagesRef.current.position.x = 0;
        satelliteLargeMapRef.current.position.x = largeMapYOffset;
      }
    }, 5000)
    return () => {
      clearInterval(imageChangeTimeout)
    }
  })

  useFrame((state, delta) => {
    if (cameraHeightOffset.current == 0 && satelliteImagesRef && satelliteImagesRef.current && satelliteImagesRef.current.position && satelliteLargeMapRef && satelliteLargeMapRef.current && satelliteLargeMapRef.current.position) {
      satelliteImagesRef.current.position.x -= delta*1
      satelliteLargeMapRef.current.position.x -= delta*1
    }
    birdsGroupRef.current.position.lerp(birdsPositionTarget.current, delta*5);
    if (cameraRef.current) {
      cameraRef.current.position.lerp(cameraPositionTarget.current, delta*2);
    }
    satelliteImagesRef.current?.children.forEach((child) => {
      if (child instanceof Mesh) {
        child.material.opacity = child.material.opacity - (child.material.opacity-opacityTarget.current)*delta*10
      }
    })
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={120} near={0.001} rotation={[0,0,-Math.PI/2]} />
      <mesh ref={satelliteLargeMapRef} position={[largeMapYOffset, -10, -10.5]} rotation={[0,0,-Math.PI/2]}>
        <planeGeometry args={[imageScale*aspectRatioLarge*3, imageScale*3]} />
        <meshBasicMaterial map={satelliteLargeMap} />
      </mesh>
      <group ref={satelliteImagesRef} position={[0, 0, -10]} rotation={[0,0,-Math.PI/2]}>
        <mesh visible={currentImageIndex == 0 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[0]} transparent={true} />
        </mesh>
        <mesh visible={currentImageIndex == 1 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[1]} transparent={true} />
        </mesh>
        <mesh visible={currentImageIndex == 2 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[2]} transparent={true} />
        </mesh>
        <mesh visible={currentImageIndex == 3 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[3]} transparent={true} />
        </mesh>
        <mesh visible={currentImageIndex == 4 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[4]} transparent={true} />
        </mesh>
        <mesh visible={currentImageIndex == 5 ? true : false}>
          <planeGeometry args={[imageScale*aspectRatio, imageScale]} />
          <meshBasicMaterial map={satelliteTextures[5]} transparent={true} />
        </mesh>
      </group>
    </>
  );
}