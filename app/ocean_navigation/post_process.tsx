import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, ClampToEdgeWrapping, Float32BufferAttribute, LinearFilter, Mesh, NearestFilter, PlaneGeometry, RepeatWrapping, ShaderMaterial, Uniform, WebGLRenderTarget, WrapAroundEnding } from "three";
import OceanNavigation from "./page";

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
  uniform sampler2D lowResOc1;
  uniform sampler2D wc1;
  varying vec2 vUv;

  vec3 gradient(sampler2D inputTexture, vec2 uv, float step) {
    vec2 dx = vec2(step, 0.0);
    vec2 dy = vec2(0.0, step);
    float gradient_x = texture2D(inputTexture, uv + dx).b - texture2D(inputTexture, uv - dx).b;
    float gradient_y = texture2D(inputTexture, uv + dy).b - texture2D(inputTexture, uv - dy).b;
    float gradient_z = 1.*texture2D(inputTexture, uv).b;
    return vec3(gradient_x, gradient_y, gradient_z);
  }

  vec4 screenBlend(vec4 base, vec4 blend) {
    return 1.0 - (1.0 - blend) * (1.0 - base);
  }

  void main() {
    float kernelSize = 0.02;
    vec3 currentPixelGradient = gradient(lowResScreen, vUv, kernelSize);
    float searchRadiusIncrements = 0.02;

    float bestScore = 10000.;
    vec2 bestScoreUv = vUv;
    for (float i = -3.; i < 4.; i++) {
      for (float j = -3.; j < 4.; j++) {
        vec2 uv2 = clamp(vUv + vec2(i*searchRadiusIncrements, j*searchRadiusIncrements), 0., 1.);
        vec3 oc1_gradient = gradient(lowResOc1, uv2, kernelSize);
        float score_LowerIsBetter = abs(oc1_gradient.x-currentPixelGradient.x) + abs(oc1_gradient.y-currentPixelGradient.y) + abs(oc1_gradient.z-currentPixelGradient.z);
        if (score_LowerIsBetter < bestScore) {
          bestScore = score_LowerIsBetter;
          bestScoreUv = uv2;
        }
      }
    }
    
    gl_FragColor = screenBlend(0.5*texture2D(highResScreen, vUv), texture2D(wc1, bestScoreUv));
    //gl_FragColor = texture2D(wc1, bestScoreUv);
    //gl_FragColor = texture2D(lowResOc1, vUv);

  }
`

const vertexShaderLowResOc1 = ` 
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShaderLowResOc1 = `
  uniform sampler2D oc1;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(oc1, vUv);
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
      lowResScreen: new Uniform(null),
      highResScreen: new Uniform(null),
      lowResOc1: new Uniform(null),
      wc1: new Uniform(wc1),
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });
  const mesh = new Mesh(geometry, material);

  const lowResOcGeometry = new PlaneGeometry(size.width/250, size.height/250);
  const lowResOcMaterial = new ShaderMaterial({
    uniforms: {
      oc1: new Uniform(oc1),
    },
    vertexShader: vertexShaderLowResOc1,
    fragmentShader: fragmentShaderLowResOc1,
  });
  const lowResOcMesh = new Mesh(lowResOcGeometry, lowResOcMaterial);

  const lowResScreenRenderTarget = new WebGLRenderTarget(50, 50);
  lowResScreenRenderTarget.texture.minFilter = NearestFilter;
  lowResScreenRenderTarget.texture.magFilter = NearestFilter;
  lowResScreenRenderTarget.texture.generateMipmaps = false;
  const lowResOC1RenderTarget = new WebGLRenderTarget(50, 50);
  lowResOC1RenderTarget.texture.minFilter = NearestFilter;
  lowResOC1RenderTarget.texture.magFilter = NearestFilter;
  lowResScreenRenderTarget.texture.generateMipmaps = false;
  const highResScreenRenderTarget = new WebGLRenderTarget(size.width, size.height);

  useFrame(({gl, scene, camera}) => {
    gl.setRenderTarget(highResScreenRenderTarget);
    gl.render(scene, camera);
    material.uniforms.highResScreen.value = highResScreenRenderTarget.texture;

    gl.setRenderTarget(lowResOC1RenderTarget);
    gl.render(lowResOcMesh, camera);
    material.uniforms.lowResOc1.value = lowResOC1RenderTarget.texture;

    gl.setRenderTarget(lowResScreenRenderTarget);
    gl.render(scene, camera);
    material.uniforms.lowResScreen.value = lowResScreenRenderTarget.texture;

    gl.setRenderTarget(null);
    gl.render(mesh, camera);
  }, 1);

  return null
}
