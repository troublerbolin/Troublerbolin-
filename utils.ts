import * as THREE from 'three';

// --- Geometry Factories ---

export const createStarGeometry = () => {
  const shape = new THREE.Shape();
  const outerRadius = 1;
  const innerRadius = 0.45;
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = (i / (points * 2)) * Math.PI * 2;
    
    // Fixed angle: 90 degrees (pointing up)
    const x = Math.cos(a + Math.PI / 2) * r;
    const y = Math.sin(a + Math.PI / 2) * r;
    
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
};

export const createCaneGeometry = () => {
  class CaneCurve extends THREE.Curve<THREE.Vector3> {
    getPoint(t: number) {
      if (t < 0.6) {
        return new THREE.Vector3(0, t * 1.66, 0); 
      } else {
        const angle = (t - 0.6) / 0.4 * Math.PI; 
        const r = 0.2; 
        const cx = r; 
        const cy = 1.0; 
        return new THREE.Vector3(cx - Math.cos(angle) * r, cy + Math.sin(angle) * r, 0);
      }
    }
  }
  return new THREE.TubeGeometry(new CaneCurve(), 32, 0.15, 8, false);
};

export const createBellBodyGeometry = () => {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const x = 0.5 * Math.pow(i / 10, 0.6) + 0.1; 
    const y = -0.8 + (i / 10) * 1.3;
    points.push(new THREE.Vector2(x, y));
  }
  points.push(new THREE.Vector2(0.4, -0.9));
  points.push(new THREE.Vector2(0, -0.9)); 
  return new THREE.LatheGeometry(points, 24);
};

// --- Shaders ---

export const SnowParticleMaterial = {
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#FFFFFF') } },
  vertexShader: `
    uniform float uTime;
    attribute float aRandom;
    attribute float aSize;
    void main() {
      vec3 pos = position;
      pos.y += sin(uTime + aRandom * 100.0) * 0.02;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (30.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;
      gl_FragColor = vec4(uColor, 1.0);
    }
  `
};

export const FoliageMaterial = {
  uniforms: { uTime: { value: 0 }, uProgress: { value: 0 } },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaos;
    attribute vec3 aTarget;
    attribute float aSize;
    varying float vAlpha;
    float ease(float t) { return t < .5 ? 4. * t * t * t : (t - 1.) * (2. * t - 2.) * (2. * t - 2.) + 1.; }
    void main() {
      float t = ease(uProgress);
      vec3 pos = mix(aChaos, aTarget, t);
      pos.x += sin(uTime * 2.0 + pos.y) * 0.1 * t;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (50.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      vAlpha = 0.5 + 0.5 * sin(uTime * 5.0 + aChaos.y);
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    void main() {
      if (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(0.0, 0.5, 0.2, vAlpha); 
    }
  `
};