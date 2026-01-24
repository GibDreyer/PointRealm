import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars as DreiStars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- Sub-component Interfaces ---

interface DynamicSubProps {
  isRealm?: boolean;
  reducedMotion?: boolean;
}

interface ArcaneEmbersProps extends DynamicSubProps {
  count?: number;
}

// --- Components ---

/**
 * Swirling Arcane Nebula - soft glowing clouds of cosmic energy
 */
function ArcaneNebula({ isRealm, reducedMotion }: DynamicSubProps) {
  const count = isRealm ? 120 : 80;
  const color = isRealm ? "#06b6d4" : "#e6b04e";
  
  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <Sparkles 
        count={count}
        scale={25}
        size={isRealm ? 12 : 8}
        speed={reducedMotion ? 0.1 : 0.4}
        opacity={0.15}
        color={color}
      />
      <Sparkles 
        count={Math.floor(count / 2)}
        scale={15}
        size={isRealm ? 20 : 12}
        speed={reducedMotion ? 0.05 : 0.2}
        opacity={0.1}
        color={isRealm ? "#ffffff" : "#ffbd44"}
      />
    </group>
  );
}

/**
 * Magical Sigils/Runes drifting in space
 */
function MagicSigils({ isRealm, reducedMotion }: DynamicSubProps) {
  const count = 4;
  const ref = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.z = t * 0.05;
    ref.current.children.forEach((sigil, i) => {
      sigil.position.y += Math.sin(t + i) * 0.002;
      sigil.rotation.y += 0.01;
    });
  });

  const sigilColor = isRealm ? "#67e8f9" : "#fbbf24";

  return (
    <group ref={ref}>
      {Array.from({ length: count }).map((_, i) => (
        <group 
          key={i} 
          position={[
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 5
          ]}
        >
          <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial 
              color={sigilColor} 
              transparent 
              opacity={0.4} 
              wireframe
            />
          </mesh>
          <pointLight intensity={1.5} distance={5} color={sigilColor} />
        </group>
      ))}
    </group>
  );
}

/**
 * Floating glowing embers that drift toward the camera
 */
function ArcaneEmbers({ count = 60, isRealm, reducedMotion }: ArcaneEmbersProps) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * 50;
        p[i * 3 + 1] = (Math.random() - 0.5) * 50;
        p[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);
  
  const color = isRealm ? "#4a9eff" : "#e6b04e"; 
  const size = isRealm ? 0.25 : 0.2;
  const moveSpeed = reducedMotion ? 0.005 : 0.05;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * moveSpeed;
    ref.current.rotation.x = t * (moveSpeed * 0.4);
    ref.current.position.y = Math.sin(t * 0.5) * 0.3;
  });

  return (
    <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

/**
 * A dense field of smaller stars that pulse and twinkle
 */
function TwinklingStars({ isRealm, reducedMotion }: DynamicSubProps) {
  const ref = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.005;
  });

  const speed = reducedMotion ? 0.1 : 1.5;

  return (
    <group ref={ref}>
      <DreiStars 
        radius={120} 
        depth={60} 
        count={10000} 
        factor={isRealm ? 7 : 5} 
        saturation={isRealm ? 0.5 : 0} 
        fade 
        speed={speed} 
      />
    </group>
  );
}

/**
 * Camera controller for soft drift
 */
function SceneSetup() {
  const { camera } = useThree();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.15) * 3;
    camera.position.y = Math.cos(t * 0.1) * 1.5;
    camera.lookAt(0, 0, -10);
  });

  return null;
}

// --- Main Export ---

interface FantasySky3DProps {
  variant?: 'default' | 'realm';
  reducedMotion?: boolean;
}

export const FantasySky3D: React.FC<FantasySky3DProps> = ({ 
  variant = 'default',
  reducedMotion = false 
}) => {
  const isRealm = variant === 'realm';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#010204' }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: false, stencil: false, depth: true }}
      >
        <color attach="background" args={['#010204']} />
        
        <ambientLight intensity={isRealm ? 0.4 : 0.3} />
        <pointLight position={[10, 10, 10]} intensity={2} color={isRealm ? "#06b6d4" : "#e6b04e"} />
        <pointLight position={[-10, -10, -10]} intensity={1} color={isRealm ? "#7c3aed" : "#ff4500"} />
        
        {!reducedMotion && <SceneSetup />}
        
        <TwinklingStars isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <ArcaneNebula isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <MagicSigils isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <ArcaneEmbers count={isRealm ? 100 : 70} isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <Float speed={reducedMotion ? 0.1 : 1.5} rotationIntensity={1} floatIntensity={1}>
           <group position={[0, 5, -15]}>
             <mesh>
               <sphereGeometry args={[0.12, 16, 16]} />
               <meshBasicMaterial color={isRealm ? "#ffffff" : "#ffd700"} toneMapped={false} />
             </mesh>
             <pointLight intensity={3} distance={20} color={isRealm ? "#67e8f9" : "#fbbf24"} />
           </group>
        </Float>

        <fog attach="fog" args={['#010204', 20, 100]} />
      </Canvas>
    </div>
  );
};
