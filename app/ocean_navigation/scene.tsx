'use client'

import { ThreeElements, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { VideoTexture, Mesh, MeshStandardMaterial } from 'three'

type MeshWithStandardMaterial = Mesh<THREE.SphereGeometry, MeshStandardMaterial>;

export function Scene() {
  const globeRef = useRef<MeshWithStandardMaterial>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

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
      if (globeRef && globeRef.current && globeRef.current.material) {
        globeRef.current.material.map = videoTexture
        globeRef.current.material.needsUpdate = true
        setVideoLoaded(true)
      } else {
        console.log('globeRef is not ready')
      }
    }
  }, [])

  return (
    <>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <mesh ref={globeRef} visible={videoLoaded}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}