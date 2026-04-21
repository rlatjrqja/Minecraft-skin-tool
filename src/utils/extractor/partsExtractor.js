// ─── 파츠별 추출 함수들 ───
import { PART_REGIONS, SEMANTIC_PARTS } from './constants';
import { rgbToHex, colorDistance } from './colorUtils';
import { isRegionEmpty } from './canvasUtils';

export function extractHair(ctx, skinInfo, frontClassification) {
  const headFaces = PART_REGIONS.head.faces;
  const { skinColor } = skinInfo;
  const threshold = skinInfo.threshold;
  
  const hairCanvas = document.createElement('canvas');
  hairCanvas.width = 64;
  hairCanvas.height = 64;
  const hairCtx = hairCanvas.getContext('2d');
  
  let hairPixelCount = 0;
  let totalHeadPixels = 0;

  const front = headFaces.front;
  const frontData = ctx.getImageData(front.x, front.y, front.w, front.h);
  const newFrontData = hairCtx.createImageData(front.w, front.h);
  const { grid } = frontClassification;

  for (let y = 0; y < front.h; y++) {
    for (let x = 0; x < front.w; x++) {
      const idx = (y * front.w + x) * 4;
      totalHeadPixels++;
      if (grid[y][x] === 'hair') {
        newFrontData.data[idx] = frontData.data[idx];
        newFrontData.data[idx + 1] = frontData.data[idx + 1];
        newFrontData.data[idx + 2] = frontData.data[idx + 2];
        newFrontData.data[idx + 3] = frontData.data[idx + 3];
        hairPixelCount++;
      }
    }
  }
  hairCtx.putImageData(newFrontData, front.x, front.y);

  const topFace = headFaces.top;
  const topData = ctx.getImageData(topFace.x, topFace.y, topFace.w, topFace.h);
  const newTopData = hairCtx.createImageData(topFace.w, topFace.h);
  for (let i = 0; i < topData.data.length; i += 4) {
    if (topData.data[i + 3] === 0) continue;
    const hex = rgbToHex(topData.data[i], topData.data[i + 1], topData.data[i + 2]);
    const dist = colorDistance(hex, skinColor);
    if (dist > threshold * 0.5) {
      newTopData.data[i] = topData.data[i];
      newTopData.data[i + 1] = topData.data[i + 1];
      newTopData.data[i + 2] = topData.data[i + 2];
      newTopData.data[i + 3] = topData.data[i + 3];
      hairPixelCount++;
    }
    totalHeadPixels++;
  }
  hairCtx.putImageData(newTopData, topFace.x, topFace.y);

  const backFace = headFaces.back;
  const backData = ctx.getImageData(backFace.x, backFace.y, backFace.w, backFace.h);
  const newBackData = hairCtx.createImageData(backFace.w, backFace.h);
  for (let i = 0; i < backData.data.length; i += 4) {
    if (backData.data[i + 3] === 0) continue;
    const hex = rgbToHex(backData.data[i], backData.data[i + 1], backData.data[i + 2]);
    const dist = colorDistance(hex, skinColor);
    if (dist > threshold * 0.4) {
      newBackData.data[i] = backData.data[i];
      newBackData.data[i + 1] = backData.data[i + 1];
      newBackData.data[i + 2] = backData.data[i + 2];
      newBackData.data[i + 3] = backData.data[i + 3];
      hairPixelCount++;
    }
    totalHeadPixels++;
  }
  hairCtx.putImageData(newBackData, backFace.x, backFace.y);

  ['right', 'left'].forEach(side => {
    const face = headFaces[side];
    const sideData = ctx.getImageData(face.x, face.y, face.w, face.h);
    const newSideData = hairCtx.createImageData(face.w, face.h);

    for (let y = 0; y < face.h; y++) {
      for (let x = 0; x < face.w; x++) {
        const idx = (y * face.w + x) * 4;
        totalHeadPixels++;
        if (sideData.data[idx + 3] === 0) continue;

        const hex = rgbToHex(sideData.data[idx], sideData.data[idx + 1], sideData.data[idx + 2]);
        const dist = colorDistance(hex, skinColor);
        
        const rowWeight = 1.0 - (y / face.h) * 0.5;
        
        if (dist > threshold * rowWeight * 0.7) {
          newSideData.data[idx] = sideData.data[idx];
          newSideData.data[idx + 1] = sideData.data[idx + 1];
          newSideData.data[idx + 2] = sideData.data[idx + 2];
          newSideData.data[idx + 3] = sideData.data[idx + 3];
          hairPixelCount++;
        }
      }
    }
    hairCtx.putImageData(newSideData, face.x, face.y);
  });

  const headOverlay = PART_REGIONS.head.overlay;
  Object.values(headOverlay).forEach(face => {
    if (!isRegionEmpty(ctx, face)) {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      hairCtx.putImageData(imageData, face.x, face.y);
      
      const d = imageData.data;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] > 0) hairPixelCount++;
      }
    }
  });

  const confidence = totalHeadPixels > 0 ? Math.min(hairPixelCount / totalHeadPixels, 1.0) : 0;
  
  return {
    partId: 'hair',
    label: SEMANTIC_PARTS.hair.label,
    canvas: hairCanvas,
    confidence,
    info: {
      detectedSkinColor: skinColor,
      adaptiveThreshold: threshold,
      hairPixels: hairPixelCount,
      totalPixels: totalHeadPixels,
      hasOverlay: Object.values(headOverlay).some(face => !isRegionEmpty(ctx, face)),
    },
  };
}

export function extractEyes(ctx, skinInfo, frontClassification) {
  const front = PART_REGIONS.head.faces.front;
  const { grid } = frontClassification;
  
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 64;
  eyeCanvas.height = 64;
  const eyeCtx = eyeCanvas.getContext('2d');
  
  const frontData = ctx.getImageData(front.x, front.y, front.w, front.h);
  const newData = eyeCtx.createImageData(front.w, front.h);
  
  let eyePixelCount = 0;
  const eyeRowsDetected = [];

  for (let y = 0; y < front.h; y++) {
    for (let x = 0; x < front.w; x++) {
      const idx = (y * front.w + x) * 4;
      
      if (grid[y][x] === 'eye') {
        newData.data[idx] = frontData.data[idx];
        newData.data[idx + 1] = frontData.data[idx + 1];
        newData.data[idx + 2] = frontData.data[idx + 2];
        newData.data[idx + 3] = frontData.data[idx + 3];
        eyePixelCount++;
        if (!eyeRowsDetected.includes(y)) eyeRowsDetected.push(y);
      }
    }
  }
  
  eyeCtx.putImageData(newData, front.x, front.y);

  const eyeInfo = {
    eyePixels: eyePixelCount,
    detectedRows: eyeRowsDetected.map(y => y + front.y),
    rowCount: eyeRowsDetected.length,
  };

  if (eyeRowsDetected.length > 0) {
    let symScore = 0;
    eyeRowsDetected.forEach(y => {
      let matches = 0;
      for (let x = 0; x < 4; x++) {
        const mirrorX = 7 - x;
        if (grid[y][x] === grid[y][mirrorX]) matches++;
      }
      symScore += matches / 4;
    });
    eyeInfo.symmetryScore = symScore / eyeRowsDetected.length;
  }

  return {
    partId: 'eyes',
    label: SEMANTIC_PARTS.eyes.label,
    canvas: eyeCanvas,
    confidence: eyePixelCount > 0 ? Math.min(eyePixelCount / 16, 1.0) : 0,
    info: eyeInfo,
  };
}

export function extractMouth(ctx, skinInfo, frontClassification) {
  const front = PART_REGIONS.head.faces.front;
  const { grid } = frontClassification;
  
  const mouthCanvas = document.createElement('canvas');
  mouthCanvas.width = 64;
  mouthCanvas.height = 64;
  const mouthCtx = mouthCanvas.getContext('2d');
  
  const frontData = ctx.getImageData(front.x, front.y, front.w, front.h);
  const newData = mouthCtx.createImageData(front.w, front.h);
  
  let pixelCount = 0;

  for (let y = 0; y < front.h; y++) {
    for (let x = 0; x < front.w; x++) {
      if (grid[y][x] === 'mouth') {
        const idx = (y * front.w + x) * 4;
        newData.data[idx] = frontData.data[idx];
        newData.data[idx + 1] = frontData.data[idx + 1];
        newData.data[idx + 2] = frontData.data[idx + 2];
        newData.data[idx + 3] = frontData.data[idx + 3];
        pixelCount++;
      }
    }
  }
  
  mouthCtx.putImageData(newData, front.x, front.y);

  return {
    partId: 'mouth',
    label: SEMANTIC_PARTS.mouth.label,
    canvas: mouthCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount },
  };
}

export function extractTop(ctx) {
  const bodyFaces = PART_REGIONS.body.faces;
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 64; topCanvas.height = 64;
  const topCtx = topCanvas.getContext('2d');
  
  let pixelCount = 0;
  Object.values(bodyFaces).forEach(face => {
    const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
    topCtx.putImageData(imageData, face.x, face.y);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) pixelCount++;
    }
  });

  return {
    partId: 'top',
    label: SEMANTIC_PARTS.top.label,
    canvas: topCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount },
  };
}

export function extractSleeves(ctx) {
  const sleeveCanvas = document.createElement('canvas');
  sleeveCanvas.width = 64; sleeveCanvas.height = 64;
  const sleeveCtx = sleeveCanvas.getContext('2d');

  let pixelCount = 0;
  ['rightArm', 'leftArm'].forEach(armKey => {
    const armFaces = PART_REGIONS[armKey].faces;
    Object.values(armFaces).forEach(face => {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      sleeveCtx.putImageData(imageData, face.x, face.y);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) pixelCount++;
      }
    });
  });
  
  return {
    partId: 'sleeves',
    label: SEMANTIC_PARTS.sleeves.label,
    canvas: sleeveCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount },
  };
}

export function extractBottom(ctx) {
  const bottomCanvas = document.createElement('canvas');
  bottomCanvas.width = 64; bottomCanvas.height = 64;
  const bottomCtx = bottomCanvas.getContext('2d');

  let pixelCount = 0;
  ['rightLeg', 'leftLeg'].forEach(legKey => {
    const legFaces = PART_REGIONS[legKey].faces;
    Object.values(legFaces).forEach(face => {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      bottomCtx.putImageData(imageData, face.x, face.y);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) pixelCount++;
      }
    });
  });

  return {
    partId: 'bottom',
    label: SEMANTIC_PARTS.bottom.label,
    canvas: bottomCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount },
  };
}

export function extractShoes(ctx) {
  const shoeCanvas = document.createElement('canvas');
  shoeCanvas.width = 64; shoeCanvas.height = 64;
  const shoeCtx = shoeCanvas.getContext('2d');

  let pixelCount = 0;
  const shoeHeight = 4;

  ['rightLeg', 'leftLeg'].forEach(legKey => {
    const legFaces = PART_REGIONS[legKey].faces;
    Object.entries(legFaces).forEach(([faceName, face]) => {
      if (faceName === 'bottom') {
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        shoeCtx.putImageData(imageData, face.x, face.y);
        pixelCount += face.w * face.h;
      } else if (faceName !== 'top' && face.h > 4) {
        const shoeY = face.y + face.h - shoeHeight;
        const imageData = ctx.getImageData(face.x, shoeY, face.w, shoeHeight);
        shoeCtx.putImageData(imageData, face.x, shoeY);
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) pixelCount++;
        }
      }
    });
  });

  return {
    partId: 'shoes',
    label: SEMANTIC_PARTS.shoes.label,
    canvas: shoeCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount },
  };
}

export function extractOverlayRegion(ctx, canvasCtx, faces, filterFn = null) {
  let pixelCount = 0;
  faces.forEach(face => {
    if (isRegionEmpty(ctx, face)) return;
    const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
    const data = imageData.data;
    const newData = canvasCtx.createImageData(face.w, face.h);
    for (let y = 0; y < face.h; y++) {
      for (let x = 0; x < face.w; x++) {
        const idx = (y * face.w + x) * 4;
        const a = data[idx + 3];
        if (a > 0 && (!filterFn || filterFn(x, y, face))) {
          newData.data[idx] = data[idx];
          newData.data[idx + 1] = data[idx + 1];
          newData.data[idx + 2] = data[idx + 2];
          newData.data[idx + 3] = data[idx + 3];
          pixelCount++;
        }
      }
    }
    canvasCtx.putImageData(newData, face.x, face.y);
  });
  return pixelCount;
}

export function extractHat(ctx) {
  const hatCanvas = document.createElement('canvas');
  hatCanvas.width = 64; hatCanvas.height = 64;
  const hatCtx = hatCanvas.getContext('2d');
  const overlay = PART_REGIONS.head.overlay;

  const faces = [overlay.top, overlay.back];
  let pixelCount = extractOverlayRegion(ctx, hatCtx, faces, null);
  
  const sideFaces = [overlay.front, overlay.right, overlay.left];
  pixelCount += extractOverlayRegion(ctx, hatCtx, sideFaces, (x, y) => y < 4);

  return {
    partId: 'hat', label: SEMANTIC_PARTS.hat.label, canvas: hatCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractEyeAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  
  let pixelCount = extractOverlayRegion(ctx, cCtx, [PART_REGIONS.head.overlay.front], (x, y) => y >= 4 && y <= 6);
  
  return {
    partId: 'eye_accessory', label: SEMANTIC_PARTS.eye_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractEarAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  const overlay = PART_REGIONS.head.overlay;
  
  let pixelCount = extractOverlayRegion(ctx, cCtx, [overlay.right, overlay.left], (x, y) => y >= 4);
  
  return {
    partId: 'ear_accessory', label: SEMANTIC_PARTS.ear_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractShoulderAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  let pixelCount = 0;
  
  pixelCount += extractOverlayRegion(ctx, cCtx, [PART_REGIONS.body.overlay.front, PART_REGIONS.body.overlay.back], (x, y) => y < 2);
  pixelCount += extractOverlayRegion(ctx, cCtx, [PART_REGIONS.rightArm.overlay.top, PART_REGIONS.leftArm.overlay.top]);
  
  return {
    partId: 'shoulder_accessory', label: SEMANTIC_PARTS.shoulder_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractNecklace(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  
  let pixelCount = extractOverlayRegion(ctx, cCtx, [PART_REGIONS.body.overlay.front], (x, y) => {
    return y >= 1 && y <= 4 && x >= 2 && x <= 5;
  });
  
  return {
    partId: 'necklace', label: SEMANTIC_PARTS.necklace.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractArmAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  let pixelCount = 0;
  
  ['rightArm', 'leftArm'].forEach(armKey => {
    const overlay = PART_REGIONS[armKey].overlay;
    const faces = Object.entries(overlay).filter(([k]) => k !== 'top').map(([, f]) => f);
    pixelCount += extractOverlayRegion(ctx, cCtx, faces);
  });
  
  return {
    partId: 'arm_accessory', label: SEMANTIC_PARTS.arm_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

export function extractLegAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  let pixelCount = 0;
  
  ['rightLeg', 'leftLeg'].forEach(legKey => {
    const overlay = PART_REGIONS[legKey].overlay;
    pixelCount += extractOverlayRegion(ctx, cCtx, Object.values(overlay));
  });
  
  return {
    partId: 'leg_accessory', label: SEMANTIC_PARTS.leg_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}
