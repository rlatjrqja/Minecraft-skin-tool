import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MinecraftModel } from './MinecraftModel';

export function ThreeViewer({ texture, modelType }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [1.5, 1.5, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} color="#66fcf1" />
        <Suspense fallback={null}>
          <MinecraftModel texture={texture} modelType={modelType} />
        </Suspense>
        <OrbitControls 
          enablePan={false} 
          minDistance={1.5} 
          maxDistance={5}
        />
      </Canvas>
    </div>
  );
}
