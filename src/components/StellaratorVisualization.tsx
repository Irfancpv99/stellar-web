import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface CoilProps {
  coilCount: number;
  magneticFieldStrength: number;
}

function StellaratorCoils({ coilCount, magneticFieldStrength }: CoilProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate slow rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  // Generate coil positions around the torus
  const coils = useMemo(() => {
    const coilsArray = [];
    const majorRadius = 3; // Main torus radius
    const minorRadius = 1; // Tube radius
    
    for (let i = 0; i < coilCount; i++) {
      const angle = (i / coilCount) * Math.PI * 2;
      // Add stellarator twist - coils are tilted
      const twist = Math.sin(angle * 5) * 0.3;
      
      coilsArray.push({
        position: [
          Math.cos(angle) * majorRadius,
          0,
          Math.sin(angle) * majorRadius,
        ] as [number, number, number],
        rotation: [
          twist,
          angle + Math.PI / 2,
          Math.cos(angle * 5) * 0.2,
        ] as [number, number, number],
      });
    }
    return coilsArray;
  }, [coilCount]);

  // Color intensity based on magnetic field
  const coilColor = useMemo(() => {
    const intensity = Math.min(magneticFieldStrength / 15, 1);
    return new THREE.Color().setHSL(0.6 - intensity * 0.3, 0.8, 0.5);
  }, [magneticFieldStrength]);

  return (
    <group ref={groupRef}>
      {/* Main plasma torus */}
      <mesh>
        <torusGeometry args={[3, 0.8, 32, 100]} />
        <meshStandardMaterial
          color="#ff6b35"
          emissive="#ff4500"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Coils */}
      {coils.map((coil, index) => (
        <group key={index} position={coil.position} rotation={coil.rotation}>
          <mesh>
            <torusGeometry args={[1.2, 0.08, 16, 32]} />
            <meshStandardMaterial
              color={coilColor}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Magnetic field lines (simplified) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`field-${i}`}
            position={[Math.cos(angle) * 3, 0, Math.sin(angle) * 3]}
            rotation={[0, angle, 0]}
          >
            <torusGeometry args={[0.9, 0.02, 8, 32]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

interface StellaratorVisualizationProps {
  coilCount?: number;
  magneticFieldStrength?: number;
  className?: string;
}

export function StellaratorVisualization({
  coilCount = 50,
  magneticFieldStrength = 5.5,
  className = '',
}: StellaratorVisualizationProps) {
  // Clamp values for visualization
  const displayCoilCount = Math.min(Math.max(coilCount, 10), 60);
  
  return (
    <div className={`relative w-full h-[400px] rounded-lg overflow-hidden bg-background/50 border border-border ${className}`}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 4, 8]} fov={50} />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#6366f1" />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#ff6b35" />
        
        {/* Stars background */}
        <mesh>
          <sphereGeometry args={[50, 32, 32]} />
          <meshBasicMaterial color="#0a0a12" side={THREE.BackSide} />
        </mesh>
        
        <StellaratorCoils
          coilCount={displayCoilCount}
          magneticFieldStrength={magneticFieldStrength}
        />
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
      <div className="absolute top-3 right-3 text-xs font-mono text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        {displayCoilCount} coils • {magneticFieldStrength} T
      </div>
    </div>
  );
}
