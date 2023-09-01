import { createPortal, useFrame } from "@react-three/fiber";
import { OrthographicCamera, Text}  from "@react-three/drei";
import { useMemo, useRef } from "react";
import { Color, Scene, WebGLRenderTarget, RGBAFormat, AddOperation, MeshBasicMaterial, Mesh } from "three";

export function NortherlyText() {
  const textMeshRef = useRef<Mesh>(null)
  const cam = useRef(null!)
  const [scene, target] = useMemo(() => {
    const scene = new Scene()
    scene.background = null
    const target = new WebGLRenderTarget(2048, 2048, { format: RGBAFormat, stencilBuffer: false })
    target.samples = 8
    return [scene, target]
  }, [])
  
  useFrame(state => {
    state.gl.setRenderTarget(target)
    state.gl.render(scene, cam.current)
    state.gl.setRenderTarget(null)
    if (textMeshRef.current) textMeshRef.current.rotateY(0.0)
  })

  return (
    <>
      <OrthographicCamera ref={cam} position={[0, 0, 10]} zoom={10} />
      <ambientLight intensity={0.5} />
      {createPortal(
        <Text color="white" fontSize={1.96} lineHeight={1} letterSpacing={0.0} textAlign="left" font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff" anchorX="center" anchorY="middle">
          Tradewind Swells - Rilib - Tradewind Swells - Rilib - Tradewind Swells - Tradewind Swells - Rilib - Tradewind Swells - Rilib - Tradewind Swells - Rilib -
        </Text>
      , scene)}
      <mesh ref={textMeshRef} position={[0,0,0]} rotation={[Math.PI/3,0,Math.PI/30]}>
        <sphereGeometry attach="geometry" args={[2.2, 64, 64]} />
        <meshBasicMaterial attach="material" map={target.texture} transparent />
      </mesh>
    </>
  );
}