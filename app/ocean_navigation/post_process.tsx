import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, RenderPass, ShaderPass } from "postprocessing";
import { ShaderMaterial, Uniform } from "three";

const vertexShader = ` 
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D inputBuffer;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(inputBuffer, vUv);
    gl_FragColor = color;
  }
`

export function PostProcess() {
  const { gl, scene, camera, size } = useThree();
  const material = new ShaderMaterial({
    uniforms: {
      inputBuffer: new Uniform(null),
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const effectComposer = new EffectComposer(gl);
  effectComposer.addPass(new RenderPass(scene, camera));
  effectComposer.addPass(new ShaderPass(material, "inputBuffer"));
  effectComposer.setSize(size.width, size.height);
  
  useFrame(() => {
    //effectComposer.render();
  });

  return null
}
