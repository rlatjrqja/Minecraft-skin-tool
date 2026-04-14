// UV mapping for 64x64 Minecraft Skin (Steve Model)
// Format for each face: [x, y, width, height] in pixels.
// Order of faces in Three.js BoxGeometry: Right, Left, Top, Bottom, Front, Back

export const SKIN_UVS = {
  head: [
    [0, 8, 8, 8],    // Right
    [16, 8, 8, 8],   // Left
    [8, 0, 8, 8],    // Top
    [16, 0, 8, 8],   // Bottom
    [8, 8, 8, 8],    // Front
    [24, 8, 8, 8]    // Back
  ],
  body: [
    [16, 20, 4, 12], // Right
    [28, 20, 4, 12], // Left
    [20, 16, 8, 4],  // Top
    [28, 16, 8, 4],  // Bottom
    [20, 20, 8, 12], // Front
    [32, 20, 8, 12]  // Back
  ],
  rightArm: [
    [40, 20, 4, 12], // Right
    [48, 20, 4, 12], // Left
    [44, 16, 4, 4],  // Top
    [48, 16, 4, 4],  // Bottom
    [44, 20, 4, 12], // Front
    [52, 20, 4, 12]  // Back
  ],
  rightArmSlim: [
    [40, 20, 4, 12], // Right
    [47, 20, 4, 12], // Left
    [44, 16, 3, 4],  // Top
    [47, 16, 3, 4],  // Bottom
    [44, 20, 3, 12], // Front
    [51, 20, 3, 12]  // Back
  ],
  leftArm: [
    [32, 52, 4, 12], // Right
    [40, 52, 4, 12], // Left
    [36, 48, 4, 4],  // Top
    [40, 48, 4, 4],  // Bottom
    [36, 52, 4, 12], // Front
    [44, 52, 4, 12]  // Back
  ],
  leftArmSlim: [
    [32, 52, 4, 12], // Right
    [39, 52, 4, 12], // Left
    [36, 48, 3, 4],  // Top
    [39, 48, 3, 4],  // Bottom
    [36, 52, 3, 12], // Front
    [43, 52, 3, 12]  // Back
  ],
  rightLeg: [
    [0, 20, 4, 12],  // Right
    [8, 20, 4, 12],  // Left
    [4, 16, 4, 4],   // Top
    [8, 16, 4, 4],   // Bottom
    [4, 20, 4, 12],  // Front
    [12, 20, 4, 12]  // Back
  ],
  leftLeg: [
    [16, 52, 4, 12], // Right
    [24, 52, 4, 12], // Left
    [20, 48, 4, 4],  // Top
    [24, 48, 4, 4],  // Bottom
    [20, 52, 4, 12], // Front
    [28, 52, 4, 12]  // Back
  ]
};

export function applySkinUVs(geometry, uvsArray) {
  const uvAttribute = geometry.attributes.uv;
  for (let i = 0; i < 6; i++) {
    const coords = uvsArray[i];
    if (!coords) continue;
    const [x, y, w, h] = coords;
    
    // Convert pixel coords to WebGL UV [0,1]
    const minX = x / 64;
    const maxX = (x + w) / 64;
    const minY = 1 - (y + h) / 64;
    const maxY = 1 - y / 64;

    const idx = i * 4;
    // BoxGeometry vertex order for each face: 
    // 0: top-left (minX, maxY) -> wait, threejs standard is slightly different
    // Let's specify explicitly based on standard BoxGeometry:
    // 0: max X, max Y
    // 1: min X, max Y
    // 2: max X, min Y
    // 3: min X, min Y

    // Actually, to make sure it aligns with Minecraft skins:
    uvAttribute.setXY(idx + 0, minX, maxY); // top-left
    uvAttribute.setXY(idx + 1, maxX, maxY); // top-right
    uvAttribute.setXY(idx + 2, minX, minY); // bottom-left
    uvAttribute.setXY(idx + 3, maxX, minY); // bottom-right
  }
  uvAttribute.needsUpdate = true;
}
