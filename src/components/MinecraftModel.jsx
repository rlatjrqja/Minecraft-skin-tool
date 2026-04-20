import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SKIN_UVS, applySkinUVs } from '../utils/skinUVs';

export function MinecraftModel({ texture, modelType = 'classic' }) {
  const materials = useMemo(() => {
    if (!texture) return null;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ 
      map: texture, 
      side: THREE.FrontSide, 
      transparent: true,
      alphaTest: 0.1 // Important for Layer 2 transparency
    });
  }, [texture]);

  const geos = useMemo(() => {
    const createGeo = (w, h, d, uvs, inflate = 0) => {
      const g = new THREE.BoxGeometry((w + inflate) / 16, (h + inflate) / 16, (d + inflate) / 16);
      applySkinUVs(g, uvs);
      return g;
    };

    const isSlim = modelType === 'slim';
    const inf = 0.5; // Inflation amount for Layer 2
    
    return {
      // Layer 1
      head: createGeo(8, 8, 8, SKIN_UVS.head),
      body: createGeo(8, 12, 4, SKIN_UVS.body),
      rightArm: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.rightArmSlim : SKIN_UVS.rightArm),
      leftArm: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.leftArmSlim : SKIN_UVS.leftArm),
      rightLeg: createGeo(4, 12, 4, SKIN_UVS.rightLeg),
      leftLeg: createGeo(4, 12, 4, SKIN_UVS.leftLeg),
      // Layer 2
      head2: createGeo(8, 8, 8, SKIN_UVS.head2, inf),
      body2: createGeo(8, 12, 4, SKIN_UVS.body2, inf),
      rightArm2: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.rightArmSlim2 : SKIN_UVS.rightArm2, inf),
      leftArm2: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.leftArmSlim2 : SKIN_UVS.leftArm2, inf),
      rightLeg2: createGeo(4, 12, 4, SKIN_UVS.rightLeg2, inf),
      leftLeg2: createGeo(4, 12, 4, SKIN_UVS.leftLeg2, inf),
    };
  }, [modelType]);

  if (!materials) return null;

  const isSlim = modelType === 'slim';
  const armOffsetX = isSlim ? 0.34375 : 0.375;

  return (
    <group position={[0, 0.5, 0]}> {/* Lift up a bit to center */}
      {/* Head */}
      <mesh geometry={geos.head} material={materials} position={[0, 1.5, 0]} />
      <mesh geometry={geos.head2} material={materials} position={[0, 1.5, 0]} />
      {/* Body */}
      <mesh geometry={geos.body} material={materials} position={[0, 0.875, 0]} />
      <mesh geometry={geos.body2} material={materials} position={[0, 0.875, 0]} />
      {/* Right Arm */}
      <mesh geometry={geos.rightArm} material={materials} position={[-armOffsetX, 0.875, 0]} />
      <mesh geometry={geos.rightArm2} material={materials} position={[-armOffsetX, 0.875, 0]} />
      {/* Left Arm */}
      <mesh geometry={geos.leftArm} material={materials} position={[armOffsetX, 0.875, 0]} />
      <mesh geometry={geos.leftArm2} material={materials} position={[armOffsetX, 0.875, 0]} />
      {/* Right Leg */}
      <mesh geometry={geos.rightLeg} material={materials} position={[-0.125, 0.125, 0]} />
      <mesh geometry={geos.rightLeg2} material={materials} position={[-0.125, 0.125, 0]} />
      {/* Left Leg */}
      <mesh geometry={geos.leftLeg} material={materials} position={[0.125, 0.125, 0]} />
      <mesh geometry={geos.leftLeg2} material={materials} position={[0.125, 0.125, 0]} />
    </group>
  );
}
