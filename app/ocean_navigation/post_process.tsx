import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { FloatType, Mesh, NearestFilter, PlaneGeometry, RedFormat, ShaderMaterial, Texture, Uniform, UnsignedByteType, WebGLRenderTarget } from "three";
import { texture } from "three/examples/jsm/nodes/Nodes.js";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D initialScene;
  uniform sampler2D wcTile;
  uniform sampler2D wcEdge;
  varying vec2 vUv;

  float applyGaussianKernel(sampler2D inputTexture, vec2 uv) {
    vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
    mat3 kernel = mat3(
      1.0, 2.0, 1.0,
      2.0, 4.0, 2.0,
      1.0, 2.0, 1.0
    ) / 16.0;
    float result = 0.;
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize;
            float sampled = texture(inputTexture, uv + offset).x;
            result += sampled * kernel[i + 2][j + 2];
        }
    }
    return result;
  }

  float applyEdgeDetectionKernel(sampler2D inputTexture, vec2 uv) {
    vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
    mat3 kernel = mat3(
      -1.0, -1.0, -1.0,
      -1.0,  8.0, -1.0,
      -1.0, -1.0, -1.0
  );
    float result = 0.;
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize;
            float sampled = texture(inputTexture, uv + offset).x;
            result += sampled * kernel[i + 2][j + 2];
        }
    }
    return result;
  }

  vec3 hsvToRgb(vec3 hsv) {
    vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return hsv.z * mix(vec3(1.0), rgb, hsv.y);
  }

  vec4 getEdgeDirection(sampler2D inputTexture, vec2 uv) {
    vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
    float gradientX = texture2D(inputTexture, vec2(uv.x+texelSize.x,uv.y)).x - texture2D(inputTexture, vec2(uv.x-texelSize.x,uv.y)).x;
    float gradientY = texture2D(inputTexture, vec2(uv.x,uv.y+texelSize.y)).x - texture2D(inputTexture, vec2(uv.x,uv.y-texelSize.y)).x;
    vec2 gradient = normalize(vec2(gradientX, gradientY));
    float angle = atan(gradient.y, gradient.x);
    vec4 color = vec4(hsvToRgb(vec3(angle/6.28, 1.0, 1.0)), 1.0);
    return color;
  }

  vec4 blendScreen(vec4 baseColor, vec4 blendColor) {
    return vec4(1.0) - (vec4(1.0) - baseColor) * (vec4(1.0) - blendColor);
  }

  void main() {
    float intensity = applyEdgeDetectionKernel(initialScene, vUv);
    vec4 angle = getEdgeDirection(initialScene, vUv);
    gl_FragColor = 5.*vec4(texture2D(initialScene, vUv).xxx,1.);
    //vec4 color = intensity*vec4(texture2D(wcEdge, scaledUv).xxx,1.);
    //gl_FragColor = color;
  }
`

export function PostProcess() {
  const { gl, size } = useThree();

  const pixelRatio = devicePixelRatio;
  const initTexture = new Texture();
  const wcTile = useTexture('/images/wc-tile.webp');
  const wcEdge = useTexture('/images/wc-edge.webp');

  const geometry = new PlaneGeometry(size.width/250, size.height/250);
  const material = new ShaderMaterial({
    uniforms: {
      initialScene: {value: initTexture},
      wcTile: {value: wcTile},
      wcEdge: {value: wcEdge},
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  const mesh = new Mesh(geometry, material);
  const initialScene = new WebGLRenderTarget(size.width*pixelRatio*4, size.height*4)
  initialScene.texture.format = RedFormat;

  useFrame(({gl, scene, camera}) => {
    gl.setRenderTarget(initialScene);
    gl.render(scene, camera);
    material.uniforms.initialScene.value = initialScene.texture;

    gl.setRenderTarget(null);
    gl.render(mesh, camera);
  }, 1);

  return null
}
