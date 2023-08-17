'use client'

import { Canvas } from '@react-three/fiber'
import { Scene } from './scene'

export default function R3fCanvas() {
  return (
    <Canvas style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Scene />
    </Canvas>
  );
}