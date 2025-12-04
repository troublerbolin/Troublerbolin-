import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { createBellBodyGeometry, createCaneGeometry, createStarGeometry, SnowParticleMaterial } from '../utils';

// --- Helper for Textures ---
const useStripedTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFF'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#C41E3A';
    ctx.beginPath();
    for (let i = -128; i < 256; i += 32) {
        ctx.moveTo(i, 0); ctx.lineTo(i + 20, 128); ctx.lineTo(i + 45, 128); ctx.lineTo(i + 25, 0);
    }
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }, []);
};

// --- Sparkle Cap (Snow on top of items) ---
export function SparkleCap({ radius, count = 80 }: { radius: number, count?: number }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { positions, randoms, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const sz = new Float32Array(count);
    for(let i=0; i<count; i++) {
      const u = Math.random(); const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(1 - v * 0.35); 
      const r = radius + 0.01; 
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.cos(phi);
      pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      rnd[i] = Math.random(); sz[i] = Math.random() * 0.4 + 0.3;
    }
    return { positions: pos, randoms: rnd, sizes: sz };
  }, [radius, count]);

  useFrame((state) => { if(shaderRef.current) shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime; });
  return (
    <group>
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
                <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
            </bufferGeometry>
            {/* @ts-ignore */}
            <shaderMaterial ref={shaderRef} args={[SnowParticleMaterial]} transparent depthWrite={false} />
        </points>
        <mesh position={[0, radius * 0.85, 0]}><sphereGeometry args={[radius * 0.6, 16, 8, 0, Math.PI*2, 0, Math.PI*0.3]} /><meshBasicMaterial color="#FFF" /></mesh>
    </group>
  )
}

// --- Gift Box ---
export function GiftBox({ color, ribbonColor, ratio = 1 }: { color: string, ribbonColor: string, ratio?: number }) {
  const width = 0.6;
  const height = 0.6 * ratio;
  const depth = 0.6;
  
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} envMapIntensity={1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + 0.02, height + 0.02, depth * 0.2]} />
        <meshStandardMaterial color={ribbonColor} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width * 0.2, height + 0.02, depth + 0.02]} />
        <meshStandardMaterial color={ribbonColor} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, height/2, 0]} rotation={[0,0,0.5]} scale={[0.2, 0.2, 0.2]}>
        <torusGeometry args={[0.5, 0.2, 8, 16]} />
        <meshStandardMaterial color={ribbonColor} metalness={0.6} />
      </mesh>
      <mesh position={[0, height/2, 0]} rotation={[0,0,-0.5]} scale={[0.2, 0.2, 0.2]}>
        <torusGeometry args={[0.5, 0.2, 8, 16]} />
        <meshStandardMaterial color={ribbonColor} metalness={0.6} />
      </mesh>
    </group>
  );
}

// --- Complex Bell ---
export function ComplexBell() {
  const bodyGeo = useMemo(() => createBellBodyGeometry(), []);
  return (
    <group scale={[0.4, 0.4, 0.4]}>
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color="#FFD700" metalness={1.0} roughness={0.15} envMapIntensity={3.0} />
      </mesh>
      <group position={[0, 0.4, 0]} rotation={[0.2, 0, 0]}>
         <mesh position={[0, 0, 0.15]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color={CONFIG.colors.red} roughness={0.3} /></mesh>
         <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.5]}><torusGeometry args={[0.15, 0.06, 8, 16]} /><meshStandardMaterial color={CONFIG.colors.red} roughness={0.3} /></mesh>
         <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.5]}><torusGeometry args={[0.15, 0.06, 8, 16]} /><meshStandardMaterial color={CONFIG.colors.red} roughness={0.3} /></mesh>
      </group>
      <group position={[0, 0.5, -0.1]}>
         <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.5]}><sphereGeometry args={[0.25]} /><meshStandardMaterial color={CONFIG.colors.green} roughness={0.5} /><group scale={[1, 0.2, 0.5]} /></mesh>
         <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.5]}><sphereGeometry args={[0.25]} /><meshStandardMaterial color={CONFIG.colors.green} roughness={0.5} /><group scale={[1, 0.2, 0.5]} /></mesh>
      </group>
      <mesh position={[0, -0.8, 0]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="#333" /></mesh>
      <group position={[0, 0.5, 0]} scale={[0.5, 0.5, 0.5]}><SparkleCap radius={0.5} count={30} /></group>
    </group>
  );
}

// --- Metal Ball ---
export function MetalBall({ color }: { color: string }) {
  return (
    <group>
      <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshStandardMaterial color={color} metalness={1.0} roughness={0.12} envMapIntensity={3.5} /></mesh>
      <SparkleCap radius={0.5} />
    </group>
  );
}

// --- Candy Cane ---
export function RealCandyCane({ randRotation }: { randRotation: THREE.Euler }) {
  const geo = useMemo(() => createCaneGeometry(), []);
  const tex = useStripedTexture();
  return (
    <group rotation={randRotation}> 
      <mesh geometry={geo}><meshStandardMaterial map={tex} roughness={0.4} metalness={0.2} /></mesh>
    </group>
  );
}

// --- Real Star ---
export function RealStar() {
  const geo = useMemo(() => createStarGeometry(), []);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.4;
      ref.current.position.y = 7.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });
  return (
    <group ref={ref} position={[0, 7.8, 0]} scale={[1, 1, 1]}>
      <mesh geometry={geo}><meshStandardMaterial color={CONFIG.colors.gold} emissive={CONFIG.colors.gold} emissiveIntensity={4.0} toneMapped={false} /></mesh>
      <pointLight intensity={30} color="#FFD700" distance={10} decay={2} />
    </group>
  );
}