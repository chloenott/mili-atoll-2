import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Mesh, PlaneGeometry, ShaderMaterial, Uniform, WebGLRenderTarget } from "three";

const vertexShader = ` 
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D lowResScreen;
  uniform sampler2D highResScreen;
  uniform sampler2D wc1;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(wc1, vUv);
    color += texture2D(lowResScreen, vUv);
    gl_FragColor = color;
  }
`

export function PostProcess() {
  const { gl, size } = useThree();

  const wc1 = useTexture('/images/wc1.jpeg')
  const geometry = new PlaneGeometry(size.width/250, size.height/250);
  const material = new ShaderMaterial({
    uniforms: {
      lowResScreen: new Uniform(null),
      highResScreen: new Uniform(null),
      wc1: new Uniform(wc1),
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  const mesh = new Mesh(geometry, material);
  const lowResScreenRenderTarget = new WebGLRenderTarget(size.width/10, size.height/10);
  const highResScreenRenderTarget = new WebGLRenderTarget(size.width, size.height);

  useFrame(({gl, scene, camera}) => {
    gl.setRenderTarget(lowResScreenRenderTarget);
    gl.render(scene, camera);
    material.uniforms.lowResScreen.value = lowResScreenRenderTarget.texture;

    gl.setRenderTarget(highResScreenRenderTarget);
    gl.render(scene, camera);
    material.uniforms.highResScreen.value = highResScreenRenderTarget.texture;

    gl.setRenderTarget(null);
    gl.render(mesh, camera);
  }, 1);

  return null
}
