import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { CONFIG } from '../constants';
import { FoliageMaterial } from '../utils';

// --- Falling Snow ---
export function FallingSnow() {
  const count = CONFIG.counts.snowflakes;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 40,
      speed: 0.5 + Math.random() * 1.5,
      factor: Math.random()
  })), [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.y -= p.speed * delta;
      if (p.y < -25) p.y = 25;
      dummy.position.set(
        p.x + Math.sin(state.clock.elapsedTime + p.factor) * 2,
        p.y,
        p.z + Math.cos(state.clock.elapsedTime * p.factor) * 2
      );
      dummy.scale.setScalar(0.08); 
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#FFF" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// --- Foliage (Tree Needles) ---
export function Foliage({ state }: { state: number }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { positions, chaos, sizes } = useMemo(() => {
    const pos = [], ch = [], sz = [];
    for (let i = 0; i < CONFIG.counts.foliage; i++) {
      const p = Math.pow(Math.random(), 0.7);
      const y = -7 + 14 * (1 - p);
      const r = 5.5 * p;
      const angle = Math.random() * Math.PI * 2;
      pos.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const cr = 25 * Math.cbrt(Math.random());
      const cTheta = Math.random() * Math.PI * 2;
      const cPhi = Math.acos(2 * Math.random() - 1);
      ch.push(cr * Math.sin(cPhi) * Math.cos(cTheta), cr * Math.sin(cPhi) * Math.sin(cTheta), cr * Math.cos(cPhi));
      sz.push(Math.random() * 0.15 + 0.1);
    }
    return { positions: new Float32Array(pos), chaos: new Float32Array(ch), sizes: new Float32Array(sz) };
  }, []);

  useFrame((stateObj, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = stateObj.clock.elapsedTime;
      easing.damp(shaderRef.current.uniforms.uProgress, 'value', state, 0.5, delta);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={CONFIG.counts.foliage} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={CONFIG.counts.foliage} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaos" count={CONFIG.counts.foliage} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={CONFIG.counts.foliage} array={sizes} itemSize={1} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <shaderMaterial ref={shaderRef} args={[FoliageMaterial]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}