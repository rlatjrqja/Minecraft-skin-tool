// ─── 색상 분석 및 패턴 인식 ───
import { PART_REGIONS } from './constants';
import { rgbToHex, hexToRgb, colorDistance, isSkinShade } from './colorUtils';

export function analyzeRegionColors(ctx, region) {
  const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
  const data = imageData.data;
  const colors = new Map();
  let totalPixels = (region.w * region.h);
  let opaquePixels = 0;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) continue;

    opaquePixels++;
    const hex = rgbToHex(r, g, b);
    colors.set(hex, (colors.get(hex) || 0) + 1);
    totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
  }

  let dominantColor = '#000000';
  let maxCount = 0;
  for (const [color, count] of colors) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  }

  return {
    colors,
    dominantColor,
    totalPixels,
    opaquePixels,
    avgBrightness: opaquePixels > 0 ? totalBrightness / opaquePixels : 0,
  };
}

export function detectSkinColor(ctx) {
  const front = PART_REGIONS.head.faces.front;
  
  const chinRegion = { x: front.x, y: front.y + 6, w: front.w, h: 2 };
  const chinAnalysis = analyzeRegionColors(ctx, chinRegion);
  
  const sidePixels = [];
  const fullData = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  for (let row = 2; row < 8; row++) {
    const leftIdx = (row * front.w + 0) * 4;
    if (fullData[leftIdx + 3] > 0) {
      sidePixels.push(rgbToHex(fullData[leftIdx], fullData[leftIdx + 1], fullData[leftIdx + 2]));
    }
    const rightIdx = (row * front.w + (front.w - 1)) * 4;
    if (fullData[rightIdx + 3] > 0) {
      sidePixels.push(rgbToHex(fullData[rightIdx], fullData[rightIdx + 1], fullData[rightIdx + 2]));
    }
  }

  const rightFace = PART_REGIONS.head.faces.right;
  const rightBottom = analyzeRegionColors(ctx, { x: rightFace.x, y: rightFace.y + 5, w: rightFace.w, h: 3 });
  const leftFace = PART_REGIONS.head.faces.left;
  const leftBottom = analyzeRegionColors(ctx, { x: leftFace.x, y: leftFace.y + 5, w: leftFace.w, h: 3 });

  const votes = new Map();
  const addVotes = (color, weight) => {
    votes.set(color, (votes.get(color) || 0) + weight);
  };

  addVotes(chinAnalysis.dominantColor, 5);
  sidePixels.forEach(c => addVotes(c, 1));
  addVotes(rightBottom.dominantColor, 2);
  addVotes(leftBottom.dominantColor, 2);

  const colorGroups = [];
  for (const [color, weight] of votes) {
    let merged = false;
    for (const group of colorGroups) {
      if (colorDistance(color, group.representative) < 25) {
        group.total += weight;
        if (weight > group.maxWeight) {
          group.maxWeight = weight;
          group.representative = color;
        }
        merged = true;
        break;
      }
    }
    if (!merged) {
      colorGroups.push({ representative: color, total: weight, maxWeight: weight });
    }
  }

  colorGroups.sort((a, b) => b.total - a.total);
  let bestColor = chinAnalysis.dominantColor;
  if (colorGroups.length > 0) {
    bestColor = colorGroups[0].representative;
  }

  return {
    skinColor: bestColor,
    skinColorRgb: hexToRgb(bestColor),
    confidence: colorGroups.length > 0 ? Math.min(colorGroups[0].total / 15, 1.0) : 0,
  };
}

export function computeAdaptiveThreshold(ctx, skinColor) {
  const front = PART_REGIONS.head.faces.front;
  const data = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  
  const distances = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
    distances.push(colorDistance(hex, skinColor));
  }

  if (distances.length === 0) return 50;

  distances.sort((a, b) => a - b);

  let bestGap = 0;
  let bestThreshold = 50;

  for (let i = 1; i < distances.length; i++) {
    const gap = distances[i] - distances[i - 1];
    if (gap > bestGap && distances[i] > 12) {
      bestGap = gap;
      bestThreshold = (distances[i - 1] + distances[i]) / 2;
    }
  }

  return Math.max(18, Math.min(bestThreshold, 130));
}

export function clusterNonSkinPixels(grid, pixelColors, w, h) {
  const clusters = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== 'non-skin') continue;
      const color = pixelColors[y][x];
      if (!color) continue;

      let merged = false;
      for (const cluster of clusters) {
        if (colorDistance(color, cluster.color) < 40) {
          cluster.pixels.push({ x, y });
          cluster.avgRow = cluster.pixels.reduce((s, p) => s + p.y, 0) / cluster.pixels.length;
          merged = true;
          break;
        }
      }
      if (!merged) {
        clusters.push({ color, pixels: [{ x, y }], avgRow: y });
      }
    }
  }

  return clusters;
}

export function rgbToHslLocal(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
  
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
      h *= 360;
    }
    return { h, s, l };
}

export function detectEyePattern(grid, pixelColors, skinColor, w, h) {
  const eyePixels = new Set();

  for (let y = 2; y < 7; y++) {
    const nonSkinPixels = [];
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'non-skin' && pixelColors[y][x]) {
        nonSkinPixels.push({ x, color: pixelColors[y][x] });
      }
    }

    if (nonSkinPixels.length < 2 || nonSkinPixels.length > 7) continue;

    const leftPixels = nonSkinPixels.filter(p => p.x < 4);
    const rightPixels = nonSkinPixels.filter(p => p.x >= 4);

    if (leftPixels.length === 0 || rightPixels.length === 0) continue;

    const countDiff = Math.abs(leftPixels.length - rightPixels.length);
    if (countDiff > 2) continue;

    let hasContrastPair = false;
    const nonSkinHsls = nonSkinPixels.map(p => {
      const rgb = hexToRgb(p.color);
      return { ...p, hsl: rgbToHslLocal(rgb.r, rgb.g, rgb.b) };
    });

    for (let i = 0; i < nonSkinHsls.length; i++) {
      for (let j = i + 1; j < nonSkinHsls.length; j++) {
        const lumDiff = Math.abs(nonSkinHsls[i].hsl.l - nonSkinHsls[j].hsl.l);
        if (lumDiff > 0.3) {
          hasContrastPair = true;
          break;
        }
      }
      if (hasContrastPair) break;
    }

    const isBrightOrDark = nonSkinHsls.some(p => p.hsl.l > 0.85 || p.hsl.l < 0.15);
    
    if (hasContrastPair || isBrightOrDark || nonSkinPixels.length <= 4) {
      for (const p of nonSkinPixels) {
        eyePixels.add(`${p.x},${y}`);
      }
    }
  }

  return eyePixels;
}

export function floodFillHair(grid, pixelColors, w, h, eyePixels) {
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const hairSet = new Set();

  const seeds = [];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'non-skin' || grid[y][x] === 'hair') {
        seeds.push({ x, y });
      }
    }
  }

  const queue = [...seeds];
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    if (visited[y][x]) continue;
    visited[y][x] = true;

    if (eyePixels.has(`${x},${y}`)) continue;
    if (grid[y][x] === 'skin' || grid[y][x] === 'transparent') continue;

    hairSet.add(`${x},${y}`);

    const currentColor = pixelColors[y][x];
    const neighbors = [
      { x: x - 1, y }, { x: x + 1, y },
      { x, y: y - 1 }, { x, y: y + 1 },
    ];

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) continue;
      if (visited[n.y][n.x]) continue;
      if (grid[n.y][n.x] !== 'non-skin') continue;
      if (eyePixels.has(`${n.x},${n.y}`)) continue;

      const neighborColor = pixelColors[n.y][n.x];
      if (neighborColor && currentColor && colorDistance(neighborColor, currentColor) < 60) {
        queue.push(n);
      }
    }
  }

  return hairSet;
}

export function classifyHeadFrontPixels(ctx, skinColor, threshold) {
  const front = PART_REGIONS.head.faces.front;
  const data = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  const w = front.w; 
  const h = front.h; 

  const grid = Array.from({ length: h }, () => Array(w).fill('skin'));
  const pixelColors = Array.from({ length: h }, () => Array(w).fill(null));
  const distMap = Array.from({ length: h }, () => Array(w).fill(0));
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      
      if (a === 0) {
        grid[y][x] = 'transparent';
        continue;
      }

      const hex = rgbToHex(r, g, b);
      pixelColors[y][x] = hex;
      const dist = colorDistance(hex, skinColor);
      distMap[y][x] = dist;
      
      if (dist > threshold) {
        if (isSkinShade(hex, skinColor)) {
          grid[y][x] = 'skin';
        } else {
          grid[y][x] = 'non-skin';
        }
      }
    }
  }

  const clusters = clusterNonSkinPixels(grid, pixelColors, w, h);
  const eyePixels = detectEyePattern(grid, pixelColors, skinColor, w, h);
  const hairPixels = floodFillHair(grid, pixelColors, w, h, eyePixels);

  const eyeRowSet = new Set();
  const browPixels = new Set();
  
  for (let y = 0; y < h; y++) {
    let isEyeRow = false;
    for (let x = 0; x < w; x++) {
      if (eyePixels.has(`${x},${y}`)) { isEyeRow = true; break; }
    }
    if (isEyeRow) eyeRowSet.add(y);
  }

  for (const eyeRow of eyeRowSet) {
    const browRow = eyeRow - 1;
    if (browRow < 0) continue;
    let browCount = 0;
    for (let x = 0; x < w; x++) {
      if (grid[browRow][x] === 'non-skin' && !eyePixels.has(`${x},${browRow}`)) {
        browCount++;
      }
    }
    if (browCount >= 3 && browCount <= 7) {
      for (let x = 0; x < w; x++) {
        if (grid[browRow][x] === 'non-skin') {
          browPixels.add(`${x},${browRow}`);
        }
      }
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'skin' || grid[y][x] === 'transparent') continue;

      const key = `${x},${y}`;

      if (eyePixels.has(key)) {
        grid[y][x] = 'eye';
      } else if (browPixels.has(key)) {
        grid[y][x] = 'eye';
      } else if (hairPixels.has(key)) {
        grid[y][x] = 'hair';
      } else if (y <= 2) {
        grid[y][x] = 'hair';
      } else if (y >= 6) {
        if (x >= 2 && x <= 5) {
          const c = hexToRgb(pixelColors[y][x]);
          const s = hexToRgb(skinColor);
          if (c && s) {
            const cL = (c.r + c.g + c.b) / 3;
            const sL = (s.r + s.g + s.b) / 3;
            if (cL < sL) {
              grid[y][x] = 'mouth';
            } else {
              grid[y][x] = 'feature';
            }
          } else {
            grid[y][x] = 'feature';
          }
        } else {
          grid[y][x] = 'feature';
        }
      } else {
        const thisColor = pixelColors[y][x];
        let belongsToTopCluster = false;
        for (const cluster of clusters) {
          if (thisColor && colorDistance(thisColor, cluster.color) < 40) {
            if (cluster.avgRow < 3) belongsToTopCluster = true;
            break;
          }
        }
        grid[y][x] = belongsToTopCluster ? 'hair' : 'feature';
      }
    }
  }

  return { grid, pixelColors, distMap, eyeRowSet };
}
