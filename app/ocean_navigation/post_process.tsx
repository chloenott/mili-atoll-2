import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, RenderPass, ShaderPass } from "postprocessing";
import { Material, ShaderMaterial } from "three";


const vertexShader = `  
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  void main() {
    gl_FragColor = vec4(1.,1.,1.,1.);
  }
`

export function PostProcess() {
  const { gl, scene, camera, size } = useThree();
  const material = new ShaderMaterial({
    uniforms: {
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const effectComposer = new EffectComposer(gl);
  effectComposer.addPass(new RenderPass(scene, camera));
  effectComposer.addPass(new ShaderPass(material));
  effectComposer.setSize(size.width, size.height);
  
  useFrame(() => {
    effectComposer.render();
  });

  return null
}
