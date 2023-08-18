'use client'

import { useEffect, useMemo } from 'react'

const vertexShader = `  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  void main() {
    gl_FragColor = vec4(1.,1.,1.,1.);
  }
`

export function Scene() {
  const material = useMemo(() => ({
    uniforms: {
    },
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
  }), [])

  useEffect(() => {
  }, [])

  return (
    <></>
  );
}