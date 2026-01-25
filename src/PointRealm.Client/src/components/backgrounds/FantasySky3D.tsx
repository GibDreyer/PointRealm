import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Stars as DreiStars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// SPACE / VOID VIBE - Dense starfield with slow swirling nebula
// =============================================================================
function SpaceScene({ reducedMotion }: { reducedMotion: boolean }) {
  const nebulaRef = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    nebulaRef.current.rotation.z = t * 0.02;
    nebulaRef.current.rotation.y = t * 0.01;
  });

  return (
    <>
      <DreiStars radius={150} depth={80} count={18000} factor={8} saturation={0.9} fade speed={0.3} />
      
      {/* Distant Galaxy Clusters */}
      <group ref={nebulaRef}>
        <Sparkles count={200} scale={60} size={20} speed={0.2} opacity={0.15} color="#a78bfa" />
        <Sparkles count={100} scale={40} size={30} speed={0.1} opacity={0.1} color="#6366f1" />
        <Sparkles count={50} scale={80} size={50} speed={0.05} opacity={0.08} color="#ffffff" />
      </group>
      
      {/* Distant Pulsing Stars */}
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[15, 10, -40]}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <pointLight intensity={5} distance={30} color="#a78bfa" />
        </group>
      </Float>
      
      <Float speed={0.3} rotationIntensity={0.1} floatIntensity={0.3}>
        <group position={[-20, -5, -50]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#c4b5fd" toneMapped={false} />
          </mesh>
          <pointLight intensity={3} distance={20} color="#6366f1" />
        </group>
      </Float>
    </>
  );
}

// =============================================================================
// FOREST / GROVE VIBE - Floating fireflies, drifting leaves, mystical orbs
// =============================================================================
function ForestScene({ reducedMotion }: { reducedMotion: boolean }) {
  const fireflyCount = 150;
  const fireflyPositions = useMemo(() => {
    const p = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 60;
      p[i * 3 + 1] = (Math.random() - 0.5) * 40;
      p[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return p;
  }, []);

  const fireflyRef = useRef<THREE.Points>(null!);
  const leafRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    
    // Fireflies gentle sway
    fireflyRef.current.rotation.y = Math.sin(t * 0.1) * 0.2;
    fireflyRef.current.position.y = Math.sin(t * 0.3) * 0.5;
    
    // Falling leaves
    leafRef.current.children.forEach((leaf, i) => {
      leaf.position.y -= 0.02;
      leaf.position.x += Math.sin(t + i) * 0.005;
      leaf.rotation.z += 0.01;
      if (leaf.position.y < -20) leaf.position.y = 20;
    });
  });

  return (
    <>
      <DreiStars radius={100} depth={50} count={2000} factor={3} saturation={0.1} fade speed={0.2} />
      
      {/* Fireflies */}
      <Points ref={fireflyRef} positions={fireflyPositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#fbbf24"
          size={0.15}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Larger Glowing Orbs */}
      <Sparkles count={40} scale={30} size={15} speed={0.3} opacity={0.2} color="#10b981" />
      <Sparkles count={20} scale={50} size={25} speed={0.1} opacity={0.1} color="#fbbf24" />
      
      {/* Falling Leaves (simplified as small meshes) */}
      <group ref={leafRef}>
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 50,
              Math.random() * 40 - 20,
              (Math.random() - 0.5) * 30
            ]}
            rotation={[Math.random() * Math.PI, 0, Math.random() * Math.PI]}
          >
            <planeGeometry args={[0.3, 0.15]} />
            <meshBasicMaterial color="#86efac" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      
      {/* Mystical Grove Light */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <group position={[0, 8, -20]}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#10b981" toneMapped={false} transparent opacity={0.8} />
          </mesh>
          <pointLight intensity={8} distance={40} color="#10b981" />
        </group>
      </Float>
    </>
  );
}

// =============================================================================
// WATER / ABYSS VIBE - Rising bubbles, caustic light rays, gentle current
// =============================================================================
function WaterScene({ reducedMotion }: { reducedMotion: boolean }) {
  const bubbleCount = 120;
  const bubblePositions = useMemo(() => {
    const p = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = Math.random() * 60 - 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return p;
  }, []);

  const bubbleRef = useRef<THREE.Points>(null!);
  const causticRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    
    // Bubbles rise
    bubbleRef.current.position.y = (t * 2) % 60 - 30;
    bubbleRef.current.position.x = Math.sin(t * 0.2) * 2;
    
    // Caustic light sway
    causticRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    causticRef.current.rotation.z = Math.cos(t * 0.2) * 0.1;
  });

  return (
    <>
      <DreiStars radius={80} depth={40} count={1000} factor={2} saturation={0.1} fade speed={0.1} />
      
      {/* Rising Bubbles */}
      <Points ref={bubbleRef} positions={bubblePositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.12}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Larger Bubble Orbs */}
      <Sparkles count={60} scale={40} size={8} speed={0.5} opacity={0.3} color="#0ea5e9" />
      <Sparkles count={30} scale={60} size={12} speed={0.2} opacity={0.15} color="#06b6d4" />
      
      {/* Caustic Light Rays */}
      <group ref={causticRef} position={[0, 15, -10]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={i}
            position={[(i - 4) * 5, 0, 0]}
            rotation={[0, 0, Math.PI / 6 * (i % 2 === 0 ? 1 : -1)]}
          >
            <planeGeometry args={[0.5, 40]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.05} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <pointLight intensity={3} distance={50} color="#0ea5e9" />
      </group>
      
      {/* Deep Light Source */}
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[0, -10, -30]}>
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#06b6d4" toneMapped={false} transparent opacity={0.4} />
          </mesh>
          <pointLight intensity={10} distance={60} color="#06b6d4" />
        </group>
      </Float>
    </>
  );
}

// =============================================================================
// FIRE / INFERNAL VIBE - Rising embers, lava glow, heat shimmer
// =============================================================================
function FireScene({ reducedMotion }: { reducedMotion: boolean }) {
  const emberCount = 200;
  const emberPositions = useMemo(() => {
    const p = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 60;
      p[i * 3 + 1] = Math.random() * 60 - 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return p;
  }, []);

  const emberRef = useRef<THREE.Points>(null!);
  const flameRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    
    // Embers rise fast
    emberRef.current.position.y = (t * 5) % 60 - 30;
    emberRef.current.position.x = Math.sin(t * 0.5) * 3;
    
    // Flames flicker
    flameRef.current.children.forEach((flame, i) => {
      flame.scale.y = 1 + Math.sin(t * 5 + i) * 0.3;
      flame.position.y = Math.sin(t * 3 + i) * 0.2;
    });
  });

  return (
    <>
      <DreiStars radius={80} depth={40} count={1500} factor={3} saturation={0} fade speed={0.5} />
      
      {/* Rising Embers */}
      <Points ref={emberRef} positions={emberPositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#f59e0b"
          size={0.2}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Hot Sparks */}
      <Sparkles count={100} scale={40} size={6} speed={1} opacity={0.4} color="#ef4444" />
      <Sparkles count={50} scale={30} size={10} speed={0.8} opacity={0.3} color="#f59e0b" />
      
      {/* Lava Glow Pillars */}
      <group ref={flameRef}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={i}
            position={[(i - 3) * 8, -15, -20]}
          >
            <cylinderGeometry args={[0.5, 1.5, 15, 8]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
          </mesh>
        ))}
      </group>
      
      {/* Core Infernal Light */}
      <group position={[0, -20, -25]}>
        <mesh>
          <sphereGeometry args={[3, 16, 16]} />
          <meshBasicMaterial color="#ef4444" toneMapped={false} transparent opacity={0.3} />
        </mesh>
        <pointLight intensity={15} distance={80} color="#f97316" />
        <pointLight intensity={8} distance={40} color="#ef4444" />
      </group>
    </>
  );
}

// =============================================================================
// ARCANE / DEFAULT VIBE - Magical sigils, swirling energy, mystical orbs
// =============================================================================
function ArcaneScene({ reducedMotion, primaryColor }: { reducedMotion: boolean, primaryColor: string }) {
  const sigilRef = useRef<THREE.Group>(null!);
  const orbRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    
    sigilRef.current.rotation.z = t * 0.05;
    sigilRef.current.children.forEach((sigil, i) => {
      sigil.position.y += Math.sin(t + i) * 0.002;
      sigil.rotation.y += 0.01;
    });
    
    orbRef.current.rotation.y = t * 0.1;
  });

  return (
    <>
      <DreiStars radius={120} depth={60} count={8000} factor={6} saturation={0.5} fade speed={0.8} />
      
      {/* Swirling Energy Nebula */}
      <Sparkles count={150} scale={30} size={12} speed={0.4} opacity={0.2} color={primaryColor} />
      <Sparkles count={80} scale={50} size={20} speed={0.2} opacity={0.1} color="#e6b04e" />
      
      {/* Floating Sigils */}
      <group ref={sigilRef}>
        {Array.from({ length: 6 }).map((_, i) => (
          <group
            key={i}
            position={[
              (Math.random() - 0.5) * 40,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 20 - 10
            ]}
          >
            <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
              <octahedronGeometry args={[0.3, 0]} />
              <meshBasicMaterial color={primaryColor} transparent opacity={0.5} wireframe />
            </mesh>
            <pointLight intensity={2} distance={8} color={primaryColor} />
          </group>
        ))}
      </group>
      
      {/* Orbiting Mystical Orbs */}
      <group ref={orbRef}>
        <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
          <group position={[8, 5, -15]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <pointLight intensity={4} distance={25} color={primaryColor} />
          </group>
        </Float>
        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.8}>
          <group position={[-10, -3, -20]}>
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#ffd700" toneMapped={false} />
            </mesh>
            <pointLight intensity={3} distance={20} color="#e6b04e" />
          </group>
        </Float>
      </group>
    </>
  );
}

// =============================================================================
// CAMERA CONTROLLER
// =============================================================================
function SceneSetup({ vibe }: { vibe: string }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (vibe === 'fire') {
      camera.position.x = Math.sin(t * 2) * 0.3 + Math.sin(t * 7) * 0.05;
      camera.position.y = Math.cos(t * 1.5) * 0.3 + Math.cos(t * 5) * 0.05;
    } else if (vibe === 'water') {
      camera.position.x = Math.sin(t * 0.08) * 5;
      camera.position.y = Math.cos(t * 0.06) * 3;
    } else if (vibe === 'forest') {
      camera.position.x = Math.sin(t * 0.12) * 2;
      camera.position.y = Math.cos(t * 0.1) * 1 + Math.sin(t * 0.3) * 0.5;
    } else if (vibe === 'space') {
      camera.position.x = Math.sin(t * 0.05) * 4;
      camera.position.y = Math.cos(t * 0.04) * 2;
    } else {
      camera.position.x = Math.sin(t * 0.15) * 3;
      camera.position.y = Math.cos(t * 0.1) * 1.5;
    }

    camera.lookAt(0, 0, -10);
  });

  return null;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================
interface FantasySky3DProps {
  variant?: 'default' | 'realm';
  reducedMotion?: boolean;
  vibe?: 'space' | 'forest' | 'water' | 'fire' | 'arcane';
  primaryColor?: string;
}

export const FantasySky3D: React.FC<FantasySky3DProps> = ({
  variant = 'default',
  reducedMotion = false,
  vibe = 'arcane',
  primaryColor = '#4a9eff'
}) => {
  const bgColors: Record<string, string> = {
    arcane: '#010204',
    space: '#020108',
    forest: '#020804',
    water: '#01080c',
    fire: '#080101'
  };

  const fogColors: Record<string, string> = {
    arcane: '#010204',
    space: '#020108',
    forest: '#020804',
    water: '#01080c',
    fire: '#080101'
  };

  const bgColor = bgColors[vibe] || '#010204';
  const fogColor = fogColors[vibe] || '#010204';
  const isRealm = variant === 'realm';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: bgColor }}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: false, stencil: false, depth: true }}
      >
        <color attach="background" args={[bgColor]} />

        <ambientLight intensity={isRealm ? 0.4 : 0.25} />

        {!reducedMotion && <SceneSetup vibe={vibe} />}

        {vibe === 'space' && <SpaceScene reducedMotion={reducedMotion} />}
        {vibe === 'forest' && <ForestScene reducedMotion={reducedMotion} />}
        {vibe === 'water' && <WaterScene reducedMotion={reducedMotion} />}
        {vibe === 'fire' && <FireScene reducedMotion={reducedMotion} />}
        {vibe === 'arcane' && <ArcaneScene reducedMotion={reducedMotion} primaryColor={primaryColor} />}

        <fog attach="fog" args={[fogColor, 25, 120]} />
      </Canvas>
    </div>
  );
};
