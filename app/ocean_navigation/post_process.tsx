import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, Uniform, WebGLRenderTarget } from "three";

const vertexShader = ` 
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D initialScene;
  varying vec2 vUv;

  vec4 applyGaussianKernel(sampler2D inputTexture, vec2 uv) {
    vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
    mat3 gaussianKernel = mat3(
      1.0, 2.0, 1.0,
      2.0, 4.0, 2.0,
      1.0, 2.0, 1.0
    ) / 16.0;
    vec4 result = vec4(0.0);
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize;
            vec4 sampled = texture(inputTexture, uv + offset);
            result += sampled * gaussianKernel[i + 2][j + 2];
        }
    }
    return result;
}

  void main() {
    vec4 color = applyGaussianKernel(initialScene, vUv);
    gl_FragColor = color; //texture2D(initialScene, vUv);
  }
`

export function PostProcess() {
  const { gl, size } = useThree();

  const aspectRatio = size.width / size.height;
  const oc1 = useTexture('/images/oc1.jpg')
  const wc1 = useTexture('/images/wc1.jpg')

  const geometry = new PlaneGeometry(size.width/250, size.height/250);
  const material = new ShaderMaterial({
    uniforms: {
      initialScene: new Uniform(null),
      wc1: new Uniform(wc1),
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  const mesh = new Mesh(geometry, material);
  const initialScene = new WebGLRenderTarget(size.width, size.height);

  useFrame(({gl, scene, camera}) => {
    gl.setRenderTarget(initialScene);
    gl.render(scene, camera);
    material.uniforms.initialScene.value = initialScene.texture;

    gl.setRenderTarget(null);
    gl.render(mesh, camera);
  }, 1);

  return null
}
