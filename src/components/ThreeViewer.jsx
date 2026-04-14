import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MinecraftModel } from './MinecraftModel';

export function ThreeViewer({ texture, modelType, activeTool, rotateSpeed = 1, panSpeed = 1 }) {
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
          enablePan={true} 
          enableDamping={false}
          minDistance={1.5} 
          maxDistance={5}
          rotateSpeed={rotateSpeed}
          panSpeed={panSpeed}
          mouseButtons={{
            LEFT: activeTool === 'hand' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: activeTool === 'hand' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
          }}
        />
      </Canvas>
    </div>
  );
}
