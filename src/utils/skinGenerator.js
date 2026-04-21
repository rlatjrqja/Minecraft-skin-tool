import { SKIN_UVS } from './skinUVs';

export function drawDefaultSkin(ctx, type) {
  drawBaseNakedSkin(ctx, type);
  ['hair', 'eyes', 'shirts', 'sleeves', 'pants', 'shoes'].forEach(partId => {
    drawDefaultPart(ctx, type, partId);
  });
}

export function drawBaseNakedSkin(ctx, type, skinTone) {
  // Clear the 64x64 canvas
  ctx.clearRect(0, 0, 64, 64);
  
  const isSteve = type === 'classic';
  const defaultSkin = isSteve ? '#b9856f' : '#f4cfbb';
  const color = skinTone || defaultSkin;

  const fillBoxes = (c, boxes) => {
    ctx.fillStyle = c;
    boxes.forEach(([x, y, w, h]) => {
      ctx.fillRect(x, y, w, h);
    });
  };

  // Draw Head
  fillBoxes(color, SKIN_UVS.head);
  // Draw Body
  fillBoxes(color, SKIN_UVS.body);
  // Draw Arms
  fillBoxes(color, isSteve ? SKIN_UVS.rightArm : SKIN_UVS.rightArmSlim);
  fillBoxes(color, isSteve ? SKIN_UVS.leftArm : SKIN_UVS.leftArmSlim);
  // Draw Legs
  fillBoxes(color, SKIN_UVS.rightLeg);
  fillBoxes(color, SKIN_UVS.leftLeg);
}

export function drawDefaultPart(ctx, type, partId) {
  const isSteve = type === 'classic';
  const hair = isSteve ? '#3d2516' : '#d28022';
  const shirt = isSteve ? '#00baba' : '#578641';
  const pants = isSteve ? '#282b78' : '#4d3b28';
  const shoes = isSteve ? '#6c6c6c' : '#8e8e8e';

  const fillBoxes = (color, boxes) => {
    ctx.fillStyle = color;
    boxes.forEach(([x, y, w, h]) => {
      ctx.fillRect(x, y, w, h);
    });
  };

  switch (partId) {
    case 'hair':
      ctx.fillStyle = hair;
      ctx.fillRect(8, 0, 8, 8); // Top of head
      // Hair on sides: top 2 pixels (bangs and sides)
      ctx.fillRect(0, 8, 8, 2);  // Right side
      ctx.fillRect(16, 8, 8, 2); // Left side
      ctx.fillRect(24, 8, 8, 2); // Back side
      ctx.fillRect(8, 8, 8, 2);  // Front side (bangs)
      break;

    case 'eyes':
      ctx.fillStyle = '#ffffff'; 
      ctx.fillRect(9, 12, 1, 1); // Right eye sclera
      ctx.fillRect(14, 12, 1, 1); // Left eye sclera
      ctx.fillStyle = '#4040ff'; // Iris
      ctx.fillRect(10, 12, 1, 1);
      ctx.fillRect(13, 12, 1, 1);
      break;

    case 'shirts':
      fillBoxes(shirt, SKIN_UVS.body);
      break;

    case 'sleeves':
      ctx.fillStyle = shirt;
      const drawSleeve = ([x, y, w, h], idx) => {
        if (idx === 2) ctx.fillRect(x, y, w, h); // Top arm face
        else if (idx !== 3) ctx.fillRect(x, y, w, Math.floor(h / 2)); // Half sleeve on sides
      };
      const rArm = isSteve ? SKIN_UVS.rightArm : SKIN_UVS.rightArmSlim;
      const lArm = isSteve ? SKIN_UVS.leftArm : SKIN_UVS.leftArmSlim;
      rArm.forEach(drawSleeve);
      lArm.forEach(drawSleeve);
      break;

    case 'pants':
      fillBoxes(pants, SKIN_UVS.rightLeg);
      fillBoxes(pants, SKIN_UVS.leftLeg);
      break;

    case 'shoes':
      ctx.fillStyle = shoes;
      const drawShoe = ([x, y, w, h], idx) => {
        if (idx === 3) ctx.fillRect(x, y, w, h); // Bottom leg face
        else if (idx !== 2) ctx.fillRect(x, y + h - 4, w, 4); // Bottom 4 pixels
      };
      SKIN_UVS.rightLeg.forEach(drawShoe);
      SKIN_UVS.leftLeg.forEach(drawShoe);
      break;

    default:
      break;
  }
}

export function drawGridOverlay(ctx, modelType) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);

  // Scale the stroke since the grid canvas is typically much higher resolution than 64x64
  // Example: if canvas is 512x512, scale is 8.
  const scaleX = width / 64;
  const scaleY = height / 64;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; // Semi-transparent white
  ctx.lineWidth = 1;

  const strokeFaces = (faces) => {
    for (const [x, y, w, h] of faces) {
      if (!x && x !== 0) continue; // Safety check
      ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);
    }
  };

  // Base components
  strokeFaces(SKIN_UVS.head);
  strokeFaces(SKIN_UVS.body);
  strokeFaces(SKIN_UVS.rightLeg);
  strokeFaces(SKIN_UVS.leftLeg);

  if (modelType === 'classic') {
    strokeFaces(SKIN_UVS.rightArm);
    strokeFaces(SKIN_UVS.leftArm);
  } else {
    strokeFaces(SKIN_UVS.rightArmSlim);
    strokeFaces(SKIN_UVS.leftArmSlim);
  }
}
