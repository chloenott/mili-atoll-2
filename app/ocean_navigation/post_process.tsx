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

  vec2 gradient(sampler2D inputTexture, vec2 uv) {
    float step = 0.01;
    vec2 dx = vec2(step, 0.0);
    vec2 dy = vec2(0.0, step);
    float gradient_x = texture2D(inputTexture, uv + dx).b - texture2D(inputTexture, uv - dx).b;
    float gradient_y = texture2D(inputTexture, uv + dy).b - texture2D(inputTexture, uv - dy).b;
    return vec2(gradient_x, gradient_y);
  }

  void main() {
    vec2 currentPixelGradient = gradient(lowResScreen, vUv);

    for (float i = -2.; i < 3.; i++) {
      for (float j = -2.; j < 3.; j++) {
        vec2 uv = vUv + vec2(i/25., j/25.);
        vec2 wc1_gradient = gradient(wc1, uv);
        float weight = 1. - length(wc1_gradient - currentPixelGradient);
        gl_FragColor += texture2D(wc1, uv) * weight;

      }
    }
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
