import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars as DreiStars } from '@react-three/drei';
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
  const size = isRealm ? 0.2 : 0.15;
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
    ref.current.rotation.y = t * 0.01;
  });

  const speed = reducedMotion ? 0.1 : 1;

  return (
    <group ref={ref}>
      <DreiStars 
        radius={100} 
        depth={50} 
        count={8000} 
        factor={isRealm ? 6 : 4} 
        saturation={0} 
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
    camera.position.x = Math.sin(t * 0.2) * 2;
    camera.position.y = Math.cos(t * 0.1) * 1;
    camera.lookAt(0, 0, 0);
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#020408' }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: false, stencil: false, depth: true }}
      >
        <color attach="background" args={['#020408']} />
        
        <ambientLight intensity={isRealm ? 0.8 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color={isRealm ? "#4a9eff" : "#e6b04e"} />
        
        {!reducedMotion && <SceneSetup />}
        
        <TwinklingStars isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <ArcaneEmbers count={isRealm ? 80 : 60} isRealm={isRealm} reducedMotion={reducedMotion} />
        
        <Float speed={reducedMotion ? 0.2 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
           <group position={[0, 10, -10]}>
             <mesh>
               <sphereGeometry args={[0.08, 16, 16]} />
               <meshBasicMaterial color={isRealm ? "#4a9eff" : "#e6b04e"} toneMapped={false} />
             </mesh>
           </group>
        </Float>

        <fog attach="fog" args={['#020408', 30, 90]} />
      </Canvas>
      
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'radial-gradient(circle at center, transparent 20%, rgba(2, 4, 8, 0.6) 100%)',
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
};
