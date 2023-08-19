'use client'

import { Canvas } from '@react-three/fiber'
import { Scene } from './scene'
import { NoToneMapping, WebGLRenderer } from 'three'
import { Stats } from '@react-three/drei'
import { toneMapping } from 'three/examples/jsm/nodes/Nodes.js'

export default function R3fCanvas() {
  return (
    <Canvas flat={true} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Scene />
      <Stats />
    </Canvas>
  );
}
