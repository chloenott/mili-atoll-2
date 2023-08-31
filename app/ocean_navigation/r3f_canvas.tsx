'use client'

import { Canvas } from '@react-three/fiber'
import { Scene } from './scene'
import { NoToneMapping, WebGLRenderer } from 'three'
import { Scroll, ScrollControls, Stats } from '@react-three/drei'

export default function R3fCanvas() {
  return (
    <Canvas flat={true}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: 'radial-gradient(circle at center, #46D4FF, #46B5FF)', backgroundSize: '200vh 200vh', backgroundPosition: "center", backgroundRepeat: "no-repeat"}}
            gl={{toneMapping: NoToneMapping, precision: 'highp', antialias: true}}>
      <Scene />
      <Stats />
    </Canvas>
  );
}
