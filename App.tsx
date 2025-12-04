import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { easing } from 'maath';
import { CONFIG } from './constants';
import { ComplexBell, GiftBox, MetalBall, RealCandyCane, RealStar } from './components/Decorations';
import { FallingSnow, Foliage } from './components/Environment';

// --- Decoration Logic ---

function DecorationSystem({ state }: { state: number }) {
  const items = useMemo(() => {
    return new Array(CONFIG.counts.items).fill(0).map((_, i) => {
      const typeRand = Math.random();
      
      let type = 'red_ball';
      if (typeRand > 0.85) type = 'gift';     
      else if (typeRand > 0.70) type = 'cane'; 
      else if (typeRand > 0.55) type = 'bell'; 
      else if (typeRand > 0.30) type = 'gold_ball'; 

      const p = Math.pow(Math.random(), 0.6); 
      const y = -7 + 14 * (1 - p);
      
      let baseR = 5.8; // 45 degree cone

      let rFactor = baseR;
      if (type === 'cane') rFactor = baseR - 1.0; 
      if (type === 'gift') rFactor = baseR - 0.5;

      const r = rFactor * p; 
      const angle = Math.random() * Math.PI * 2;
      const target = [Math.cos(angle) * r, y, Math.sin(angle) * r];

      const cr = 20 + Math.random() * 10;
      const cTheta = Math.random() * Math.PI * 2;
      const cPhi = Math.acos(2 * Math.random() - 1);
      const chaos = [cr * Math.sin(cPhi) * Math.cos(cTheta), cr * Math.sin(cPhi) * Math.sin(cTheta), cr * Math.cos(cPhi)];

      const randRot = new THREE.Euler(
        Math.random() * 0.5, 
        Math.random() * Math.PI * 2, 
        (Math.random() - 0.5) * 0.5
      );

      let scale = Math.random() * 0.2 + 0.7;
      let giftRatio = 1;
      let giftColor = CONFIG.colors.green; 
      let ribbonColor = CONFIG.colors.gold;

      if (type === 'gift') {
          scale *= 0.8; 
          const colRnd = Math.random();
          if (colRnd > 0.3) {
             giftColor = Math.random() > 0.5 ? CONFIG.colors.green : CONFIG.colors.lightGreen;
             ribbonColor = CONFIG.colors.red;
          } else if (colRnd > 0.15) {
             giftColor = CONFIG.colors.red;
             ribbonColor = CONFIG.colors.gold;
          } else {
             giftColor = CONFIG.colors.gold;
             ribbonColor = CONFIG.colors.red;
          }
          if (Math.random() > 0.5) giftRatio = 1.4; 
      }
      
      if (type === 'cane') scale = 1.0; 

      return { id: i, type, target, chaos, randRot, scale, giftColor, ribbonColor, giftRatio };
    });
  }, []);

  return (
    <group>
      {items.map((item) => (
        <DecorationItem key={item.id} item={item} state={state} />
      ))}
    </group>
  );
}

function DecorationItem({ item, state }: any) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((stateObj, delta) => {
    if(!ref.current) return;
    const targetVec = state > 0.5 ? new THREE.Vector3(...item.target) : new THREE.Vector3(...item.chaos);
    easing.damp3(ref.current.position, targetVec, 0.5, delta);
    
    if (state > 0.5) {
       if(item.type === 'cane') {
         // Canes don't spin as much
       } else if (item.type === 'gift') {
           ref.current.rotation.y = item.randRot.y + Math.sin(stateObj.clock.elapsedTime + item.id) * 0.1;
       } else {
           ref.current.rotation.y += delta * 0.8;
       }
       ref.current.position.y += Math.sin(stateObj.clock.elapsedTime * 2 + item.id) * 0.005;
    } else {
       ref.current.rotation.x += delta; ref.current.rotation.z += delta;
    }
  });

  return (
    <group ref={ref} position={item.chaos} scale={item.scale} rotation={item.randRot}>
       {item.type === 'red_ball' && <MetalBall color={CONFIG.colors.red} />}
       {item.type === 'gold_ball' && <MetalBall color={CONFIG.colors.gold} />}
       {item.type === 'cane' && <RealCandyCane randRotation={new THREE.Euler(0,0,0)} />}
       {item.type === 'bell' && <ComplexBell />}
       {item.type === 'gift' && <GiftBox color={item.giftColor} ribbonColor={item.ribbonColor} ratio={item.giftRatio} />}
    </group>
  );
}

// --- Main Scene ---

function Scene({ isPressed, mousePos }: { isPressed: boolean, mousePos: React.MutableRefObject<any> }) {
  const [targetState, setTargetState] = useState(0);
  useEffect(() => { setTargetState(isPressed ? 1 : 0); }, [isPressed]);

  useFrame((state) => {
    const mx = (mousePos.current.x / window.innerWidth) * 2 - 1;
    const my = -(mousePos.current.y / window.innerHeight) * 2 + 1;
    const targetX = mx * 10;
    const targetY = my * 8;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.lookAt(0, -1, 0); 
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 32]} fov={35} />
      <color attach="background" args={[CONFIG.colors.bg]} />
      
      <Environment preset="warehouse" background={false} /> 

      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 20]} angle={0.5} intensity={50} color="#FFD700" castShadow />
      <pointLight position={[-10, -5, 10]} intensity={20} color="#E0FFFF" />
      
      <FallingSnow />

      <group position={[0, -2, 0]}>
        <RealStar />
        <Foliage state={targetState} />
        <DecorationSystem state={targetState} />
      </group>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.8} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

// --- App Component ---

export default function App() {
  const [isPressed, setIsPressed] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black"
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseMove={(e) => { mousePos.current = { x: e.clientX, y: e.clientY }; }}
    >
      <div className="absolute z-10 w-full p-10 pointer-events-none text-[#FFD700] font-serif select-none flex flex-col items-center justify-start pt-20 text-center">
        <h1 className="text-4xl md:text-7xl m-0 tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
          MERRY CHRISTMAS
        </h1>
        <p className="mt-4 opacity-80 tracking-[0.1em] text-sm md:text-base animate-pulse">
          {isPressed ? "Interactive 3D Installation" : "Hold to Assemble"}
        </p>
      </div>

      <Canvas 
        dpr={[1, 1.5]} 
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <Suspense fallback={null}>
          <Scene isPressed={isPressed} mousePos={mousePos} />
        </Suspense>
      </Canvas>
    </div>
  );
}