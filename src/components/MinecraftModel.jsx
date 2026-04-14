import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SKIN_UVS, applySkinUVs } from '../utils/skinUVs';

export function MinecraftModel({ texture, modelType = 'classic' }) {
  const materials = useMemo(() => {
    if (!texture) return null;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: texture, side: THREE.FrontSide, transparent: true });
  }, [texture]);

  const geos = useMemo(() => {
    // Proportions: 1 pixel = 1 unit? Let's use standard units (pixels / 16)
    // Head: 8x8x8 -> 0.5x0.5x0.5
    // Body: 8x12x4 -> 0.5x0.75x0.25
    const createGeo = (w, h, d, uvs) => {
      const g = new THREE.BoxGeometry(w / 16, h / 16, d / 16);
      applySkinUVs(g, uvs);
      return g;
    };

    const isSlim = modelType === 'slim';
    
    return {
      head: createGeo(8, 8, 8, SKIN_UVS.head),
      body: createGeo(8, 12, 4, SKIN_UVS.body),
      rightArm: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.rightArmSlim : SKIN_UVS.rightArm),
      leftArm: createGeo(isSlim ? 3 : 4, 12, 4, isSlim ? SKIN_UVS.leftArmSlim : SKIN_UVS.leftArm),
      rightLeg: createGeo(4, 12, 4, SKIN_UVS.rightLeg),
      leftLeg: createGeo(4, 12, 4, SKIN_UVS.leftLeg),
    };
  }, [modelType]);

  if (!materials) return null;

  const isSlim = modelType === 'slim';
  const armOffsetX = isSlim ? 0.34375 : 0.375;

  return (
    <group position={[0, 0.5, 0]}> {/* Lift up a bit to center */}
      {/* Head */}
      <mesh geometry={geos.head} material={materials} position={[0, 1.5, 0]} />
      {/* Body */}
      <mesh geometry={geos.body} material={materials} position={[0, 0.875, 0]} />
      {/* Right Arm */}
      <mesh geometry={geos.rightArm} material={materials} position={[-armOffsetX, 0.875, 0]} />
      {/* Left Arm */}
      <mesh geometry={geos.leftArm} material={materials} position={[armOffsetX, 0.875, 0]} />
      {/* Right Leg */}
      <mesh geometry={geos.rightLeg} material={materials} position={[-0.125, 0.125, 0]} />
      {/* Left Leg */}
      <mesh geometry={geos.leftLeg} material={materials} position={[0.125, 0.125, 0]} />
    </group>
  );
}
