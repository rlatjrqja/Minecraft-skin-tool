/**
 * Minecraft Skin Part Extractor
 * 
 * 64x64 마인크래프트 스킨 이미지를 분석하여 각 부위(파츠)를 자동으로 인식하고 분리하는 알고리즘.
 * 
 * 마인크래프트 스킨은 고정된 UV 레이아웃을 사용하므로,
 * 각 신체 부위의 정확한 픽셀 좌표를 알 수 있습니다.
 * 이를 기반으로 색상 분석을 결합하여 "헤어스타일", "눈", "상의" 등 
 * 의미적인 파츠 단위로 분리합니다.
 */

// ─── UV 영역 정의 (64x64 스킨 기준) ───
// 각 영역은 { x, y, w, h } 형태

/**
 * 부위별 UV 영역 정의
 * 마인크래프트 스킨의 각 면(Front/Back/Left/Right/Top/Bottom)에 대한 
 * 픽셀 좌표를 정의합니다.
 */
export const PART_REGIONS = {
  // ── 머리 (Head) ──
  head: {
    label: '머리',
    // 머리 전체 UV 영역 (모든 면)
    faces: {
      top:    { x: 8,  y: 0,  w: 8, h: 8 },
      bottom: { x: 16, y: 0,  w: 8, h: 8 },
      front:  { x: 8,  y: 8,  w: 8, h: 8 },
      back:   { x: 24, y: 8,  w: 8, h: 8 },
      right:  { x: 0,  y: 8,  w: 8, h: 8 },
      left:   { x: 16, y: 8,  w: 8, h: 8 },
    },
    // 머리 오버레이(2번째 레이어)
    overlay: {
      top:    { x: 40, y: 0,  w: 8, h: 8 },
      bottom: { x: 48, y: 0,  w: 8, h: 8 },
      front:  { x: 40, y: 8,  w: 8, h: 8 },
      back:   { x: 56, y: 8,  w: 8, h: 8 },
      right:  { x: 32, y: 8,  w: 8, h: 8 },
      left:   { x: 48, y: 8,  w: 8, h: 8 },
    },
  },

  // ── 상체 (Body/Torso) ──
  body: {
    label: '상의',
    faces: {
      top:    { x: 20, y: 16, w: 8, h: 4 },
      bottom: { x: 28, y: 16, w: 8, h: 4 },
      front:  { x: 20, y: 20, w: 8, h: 12 },
      back:   { x: 32, y: 20, w: 8, h: 12 },
      right:  { x: 16, y: 20, w: 4, h: 12 },
      left:   { x: 28, y: 20, w: 4, h: 12 },
    },
    overlay: {
      top:    { x: 20, y: 32, w: 8, h: 4 },
      bottom: { x: 28, y: 32, w: 8, h: 4 },
      front:  { x: 20, y: 36, w: 8, h: 12 },
      back:   { x: 32, y: 36, w: 8, h: 12 },
      right:  { x: 16, y: 36, w: 4, h: 12 },
      left:   { x: 28, y: 36, w: 4, h: 12 },
    },
  },

  // ── 오른팔 (Right Arm) ──
  rightArm: {
    label: '오른팔',
    faces: {
      top:    { x: 44, y: 16, w: 4, h: 4 },
      bottom: { x: 48, y: 16, w: 4, h: 4 },
      front:  { x: 44, y: 20, w: 4, h: 12 },
      back:   { x: 52, y: 20, w: 4, h: 12 },
      right:  { x: 40, y: 20, w: 4, h: 12 },
      left:   { x: 48, y: 20, w: 4, h: 12 },
    },
    overlay: {
      top:    { x: 44, y: 32, w: 4, h: 4 },
      bottom: { x: 48, y: 32, w: 4, h: 4 },
      front:  { x: 44, y: 36, w: 4, h: 12 },
      back:   { x: 52, y: 36, w: 4, h: 12 },
      right:  { x: 40, y: 36, w: 4, h: 12 },
      left:   { x: 48, y: 36, w: 4, h: 12 },
    },
  },

  // ── 왼팔 (Left Arm) ──
  leftArm: {
    label: '왼팔',
    faces: {
      top:    { x: 36, y: 48, w: 4, h: 4 },
      bottom: { x: 40, y: 48, w: 4, h: 4 },
      front:  { x: 36, y: 52, w: 4, h: 12 },
      back:   { x: 44, y: 52, w: 4, h: 12 },
      right:  { x: 32, y: 52, w: 4, h: 12 },
      left:   { x: 40, y: 52, w: 4, h: 12 },
    },
    overlay: {
      top:    { x: 52, y: 48, w: 4, h: 4 },
      bottom: { x: 56, y: 48, w: 4, h: 4 },
      front:  { x: 52, y: 52, w: 4, h: 12 },
      back:   { x: 60, y: 52, w: 4, h: 12 },
      right:  { x: 48, y: 52, w: 4, h: 12 },
      left:   { x: 56, y: 52, w: 4, h: 12 },
    },
  },

  // ── 오른다리 (Right Leg) ──
  rightLeg: {
    label: '오른다리',
    faces: {
      top:    { x: 4,  y: 16, w: 4, h: 4 },
      bottom: { x: 8,  y: 16, w: 4, h: 4 },
      front:  { x: 4,  y: 20, w: 4, h: 12 },
      back:   { x: 12, y: 20, w: 4, h: 12 },
      right:  { x: 0,  y: 20, w: 4, h: 12 },
      left:   { x: 8,  y: 20, w: 4, h: 12 },
    },
    overlay: {
      top:    { x: 4,  y: 32, w: 4, h: 4 },
      bottom: { x: 8,  y: 32, w: 4, h: 4 },
      front:  { x: 4,  y: 36, w: 4, h: 12 },
      back:   { x: 12, y: 36, w: 4, h: 12 },
      right:  { x: 0,  y: 36, w: 4, h: 12 },
      left:   { x: 8,  y: 36, w: 4, h: 12 },
    },
  },

  // ── 왼다리 (Left Leg) ──
  leftLeg: {
    label: '왼다리',
    faces: {
      top:    { x: 20, y: 48, w: 4, h: 4 },
      bottom: { x: 24, y: 48, w: 4, h: 4 },
      front:  { x: 20, y: 52, w: 4, h: 12 },
      back:   { x: 28, y: 52, w: 4, h: 12 },
      right:  { x: 16, y: 52, w: 4, h: 12 },
      left:   { x: 24, y: 52, w: 4, h: 12 },
    },
    overlay: {
      top:    { x: 4,  y: 48, w: 4, h: 4 },
      bottom: { x: 8,  y: 48, w: 4, h: 4 },
      front:  { x: 4,  y: 52, w: 4, h: 12 },
      back:   { x: 12, y: 52, w: 4, h: 12 },
      right:  { x: 0,  y: 52, w: 4, h: 12 },
      left:   { x: 8,  y: 52, w: 4, h: 12 },
    },
  },
};

// ─── 의미적 파츠(Semantic Parts) 정의 ───
// 물리적 UV 영역을 "커스터마이징 가능한 부위"로 매핑합니다.

export const SEMANTIC_PARTS = {
  hair: {
    label: '헤어스타일',
    description: '머리카락 영역 (머리 상단 + 측면 상단부)',
    category: 'head',
  },
  eyes: {
    label: '눈 모양',
    description: '눈 영역 (머리 앞면 중간부)',
    category: 'head',
  },
  face: {
    label: '얼굴',
    description: '얼굴 피부 영역 (머리 앞면 하단부)',
    category: 'head',
  },
  top: {
    label: '상의',
    description: '상체 의상 영역',
    category: 'body',
  },
  sleeves: {
    label: '소매',
    description: '팔 상단부 의상 영역',
    category: 'arm',
  },
  gloves: {
    label: '장갑/손',
    description: '팔 하단부 (손/장갑) 영역',
    category: 'arm',
  },
  bottom: {
    label: '하의',
    description: '다리 의상 영역 (상반부)',
    category: 'legs',
  },
  shoes: {
    label: '신발',
    description: '다리 하단부 (신발) 영역',
    category: 'legs',
  },
  accessory: {
    label: '장신구',
    description: '오버레이 레이어에서 감지된 장신구',
    category: 'overlay',
  },
};


// ─── 유틸리티 함수 ───

/**
 * 이미지 파일(PNG)을 Canvas에 로드합니다.
 * @param {File|string} source - File 객체 또는 이미지 URL
 * @returns {Promise<{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}>}
 */
export function loadSkinToCanvas(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 유효성 검사: 마인크래프트 스킨은 64x64 (또는 64x32 레거시)
      if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) {
        reject(new Error(`유효하지 않은 스킨 크기입니다: ${img.width}x${img.height}. 64x64 또는 64x32 형식만 지원됩니다.`));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      // 64x32 레거시 스킨인 경우 상단에만 그리고 하단은 비워둠
      ctx.drawImage(img, 0, 0);

      resolve({ canvas, ctx, isLegacy: img.height === 32 });
    };

    img.onerror = () => reject(new Error('스킨 이미지를 로드할 수 없습니다.'));

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * 특정 영역의 픽셀 데이터를 추출하여 새 Canvas에 그립니다.
 * @param {CanvasRenderingContext2D} srcCtx - 소스 캔버스 컨텍스트
 * @param {{x: number, y: number, w: number, h: number}} region - 추출할 영역
 * @returns {ImageData}
 */
function extractRegionPixels(srcCtx, region) {
  return srcCtx.getImageData(region.x, region.y, region.w, region.h);
}

/**
 * 영역이 완전히 투명한지 확인합니다.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {{x, y, w, h}} region 
 * @returns {boolean}
 */
function isRegionEmpty(ctx, region) {
  const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return false; // 알파가 0이 아닌 픽셀 발견
  }
  return true;
}

/**
 * 영역 내 픽셀 색상들의 통계를 분석합니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x, y, w, h}} region
 * @returns {{ colors: Map<string, number>, dominantColor: string, totalPixels: number, opaquePixels: number, avgBrightness: number }}
 */
function analyzeRegionColors(ctx, region) {
  const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
  const data = imageData.data;
  const colors = new Map(); // 색상(hex) -> 빈도
  let totalPixels = (region.w * region.h);
  let opaquePixels = 0;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) continue; // 투명 픽셀 무시

    opaquePixels++;
    const hex = rgbToHex(r, g, b);
    colors.set(hex, (colors.get(hex) || 0) + 1);
    totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114); // 밝기(luminance)
  }

  // 가장 많이 사용된 색상 찾기
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

/**
 * RGB 값을 hex 문자열로 변환합니다.
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * hex 문자열을 RGB 객체로 변환합니다.
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * 두 색상 간의 유클리드 거리를 계산합니다.
 * 색상 유사도 판별에 사용됩니다.
 */
function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return Infinity;
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * 피부색 범위에 해당하는지 판단합니다.
 * 마인크래프트 스킨의 일반적인 피부 톤 범위를 기반으로 합니다.
 */
function isSkinTone(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const { r, g, b } = rgb;
  // 피부색 휴리스틱: R이 가장 높고, G/B가 특정 비율 내에 있는 경우
  // 다양한 피부 톤(밝은/어두운)을 포괄
  const isBrightSkin = r > 150 && g > 80 && b > 50 && r > g && r > b && (r - b) > 20;
  const isDarkSkin = r > 60 && g > 30 && b > 15 && r > g && g > b && (r - b) > 10 && r < 200;
  
  return isBrightSkin || isDarkSkin;
}


// ─── 개선된 헬퍼 함수 ───

/**
 * 얼굴 앞면에서 피부색을 정밀하게 감지합니다.
 * 전략: 앞면의 하단 2행(턱/입 영역)은 거의 항상 피부색이므로 여기서 샘플링합니다.
 * 추가로 좌/우 측면 하단도 교차 검증합니다.
 */
function detectSkinColor(ctx) {
  const front = PART_REGIONS.head.faces.front; // {x:8, y:8, w:8, h:8}
  
  // 1차: 앞면 하단 2행 (y=14~15, UV에서 턱/입 영역)
  const chinRegion = { x: front.x, y: front.y + 6, w: front.w, h: 2 };
  const chinAnalysis = analyzeRegionColors(ctx, chinRegion);
  
  // 2차: 앞면 양쪽 끝 세로줄 (x=8, x=15, y=10~15) - 보통 피부
  const sidePixels = [];
  const fullData = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  for (let row = 2; row < 8; row++) {
    // 좌측 끝 (x=0 in local)
    const leftIdx = (row * front.w + 0) * 4;
    if (fullData[leftIdx + 3] > 0) {
      sidePixels.push(rgbToHex(fullData[leftIdx], fullData[leftIdx + 1], fullData[leftIdx + 2]));
    }
    // 우측 끝 (x=7 in local)
    const rightIdx = (row * front.w + (front.w - 1)) * 4;
    if (fullData[rightIdx + 3] > 0) {
      sidePixels.push(rgbToHex(fullData[rightIdx], fullData[rightIdx + 1], fullData[rightIdx + 2]));
    }
  }

  // 3차: 좌/우 측면의 하단 영역
  const rightFace = PART_REGIONS.head.faces.right;
  const rightBottom = analyzeRegionColors(ctx, { x: rightFace.x, y: rightFace.y + 5, w: rightFace.w, h: 3 });
  const leftFace = PART_REGIONS.head.faces.left;
  const leftBottom = analyzeRegionColors(ctx, { x: leftFace.x, y: leftFace.y + 5, w: leftFace.w, h: 3 });

  // 후보 색상 수집 및 투표
  const votes = new Map();
  const addVotes = (color, weight) => {
    votes.set(color, (votes.get(color) || 0) + weight);
  };

  addVotes(chinAnalysis.dominantColor, 5);
  sidePixels.forEach(c => addVotes(c, 1));
  addVotes(rightBottom.dominantColor, 2);
  addVotes(leftBottom.dominantColor, 2);

  // 가장 많은 표를 얻은 색상 = 피부색
  let bestColor = chinAnalysis.dominantColor;
  let bestVotes = 0;

  // 유사한 색상끼리 그룹핑 (거리 25 이내)
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
  if (colorGroups.length > 0) {
    bestColor = colorGroups[0].representative;
  }

  return {
    skinColor: bestColor,
    skinColorRgb: hexToRgb(bestColor),
    confidence: colorGroups.length > 0 ? Math.min(colorGroups[0].total / 15, 1.0) : 0,
  };
}

/**
 * 피부색과 비피부색을 최적으로 분리하는 적응형 임계값을 계산합니다.
 * 오츠(Otsu) 방식 변형: 머리 앞면의 모든 픽셀을 피부 거리로 정렬한 뒤 최적 분리점을 찾음.
 */
function computeAdaptiveThreshold(ctx, skinColor) {
  const front = PART_REGIONS.head.faces.front;
  const data = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  
  const distances = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
    distances.push(colorDistance(hex, skinColor));
  }

  if (distances.length === 0) return 60; // fallback

  distances.sort((a, b) => a - b);

  // 간격이 가장 큰 곳을 분리점으로 선택 (bimodal 분포의 골)
  let bestGap = 0;
  let bestThreshold = 60;

  for (let i = 1; i < distances.length; i++) {
    const gap = distances[i] - distances[i - 1];
    if (gap > bestGap && distances[i] > 15) { // 최소 15 이상에서만
      bestGap = gap;
      bestThreshold = (distances[i - 1] + distances[i]) / 2;
    }
  }

  // 합리적 범위로 클램프
  return Math.max(20, Math.min(bestThreshold, 120));
}

/**
 * 머리 앞면의 픽셀을 행 단위로 분석합니다.
 * 각 행의 비피부색 패턴을 기반으로 헤어/눈/코/입 영역을 추정합니다.
 * 
 * 반환값: 8x8 그리드의 각 픽셀에 대한 분류 맵
 *   'skin' = 피부, 'hair' = 머리카락, 'eye' = 눈, 'feature' = 코/입 등
 */
function classifyHeadFrontPixels(ctx, skinColor, threshold) {
  const front = PART_REGIONS.head.faces.front;
  const data = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  const w = front.w; // 8
  const h = front.h; // 8

  // 1단계: 각 픽셀을 피부/비피부로 1차 분류
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
        grid[y][x] = 'non-skin';
      }
    }
  }

  // 2단계: 행 패턴 분석으로 의미 부여
  // 머리 앞면 8행의 일반적인 구조:
  //   행 0-1: 이마/앞머리 (높은 확률로 헤어)
  //   행 2-3: 이마~눈 위 전환 영역
  //   행 4-5: 눈 영역 (주요 인식 대상)
  //   행 6-7: 코/입/턱 (대부분 피부)

  // 각 행의 비피부 픽셀 수 계산
  const rowNonSkinCount = [];
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'non-skin') count++;
    }
    rowNonSkinCount.push(count);
  }

  // 눈 행 탐지: 비피부 픽셀이 2~6개인 행 중, 좌우 대칭성이 있는 행
  let eyeRows = [];
  for (let y = 2; y < 7; y++) { // 행 2~6에서만 찾음
    if (rowNonSkinCount[y] >= 2 && rowNonSkinCount[y] <= 6) {
      // 대칭성 검사: 좌측(x=0~3)과 우측(x=4~7)에 비슷한 패턴
      let leftNS = 0, rightNS = 0;
      for (let x = 0; x < 4; x++) { if (grid[y][x] === 'non-skin') leftNS++; }
      for (let x = 4; x < 8; x++) { if (grid[y][x] === 'non-skin') rightNS++; }
      
      const symmetryScore = 1 - Math.abs(leftNS - rightNS) / Math.max(leftNS + rightNS, 1);
      
      if (symmetryScore >= 0.3) { // 약간의 대칭이라도 있으면
        eyeRows.push({ y, symmetryScore, nonSkinCount: rowNonSkinCount[y] });
      }
    }
  }

  // 눈 행이 여러 개면 연속된 1~3행을 선택 (보통 눈은 1~2행 차지)
  let bestEyeBlock = [];
  if (eyeRows.length > 0) {
    // 연속된 행 블록 찾기
    let currentBlock = [eyeRows[0]];
    for (let i = 1; i < eyeRows.length; i++) {
      if (eyeRows[i].y - eyeRows[i - 1].y <= 1) {
        currentBlock.push(eyeRows[i]);
      } else {
        if (currentBlock.length > bestEyeBlock.length) bestEyeBlock = currentBlock;
        currentBlock = [eyeRows[i]];
      }
    }
    if (currentBlock.length > bestEyeBlock.length) bestEyeBlock = currentBlock;
    
    // 최대 3행까지만
    if (bestEyeBlock.length > 3) {
      // 대칭 점수 상위 3개 선택
      bestEyeBlock.sort((a, b) => b.symmetryScore - a.symmetryScore);
      bestEyeBlock = bestEyeBlock.slice(0, 3);
    }
  }

  const eyeRowSet = new Set(bestEyeBlock.map(e => e.y));

  // 3단계: 최종 분류
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'skin' || grid[y][x] === 'transparent') continue;

      if (eyeRowSet.has(y)) {
        grid[y][x] = 'eye';
      } else if (y <= 3) {
        // 상단 4행의 비피부 = 머리카락 (행 전체가 비피부이거나 대부분)
        grid[y][x] = 'hair';
      } else if (y >= 6) {
        // 하단 2행의 비피부 = 코/입 등 얼굴 특징 (눈이 아닌 경우)
        grid[y][x] = 'feature';
      } else {
        // 중간 영역의 비피부 중 눈이 아닌 것 = 머리카락 또는 장식
        // 위쪽 행에 헤어가 많으면 헤어로, 아니면 특징으로
        const aboveHairCount = y > 0 ? grid[y - 1].filter(c => c === 'hair').length : 0;
        grid[y][x] = aboveHairCount >= 3 ? 'hair' : 'feature';
      }
    }
  }

  return { grid, pixelColors, distMap, eyeRowSet };
}


// ─── 메인 파츠 추출 알고리즘 (개선된 버전) ───

/**
 * 머리 영역에서 헤어스타일을 추출합니다.
 * 개선: 적응형 임계값 + 행별 분류 + 연결 성분 기반
 */
function extractHair(ctx, skinInfo, frontClassification) {
  const headFaces = PART_REGIONS.head.faces;
  const { skinColor } = skinInfo;
  const threshold = skinInfo.threshold;
  
  const hairCanvas = document.createElement('canvas');
  hairCanvas.width = 64;
  hairCanvas.height = 64;
  const hairCtx = hairCanvas.getContext('2d');
  
  let hairPixelCount = 0;
  let totalHeadPixels = 0;

  // ── 앞면: 분류 결과에서 'hair'로 분류된 픽셀만 추출 ──
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

  // ── 위면(top face): 전체가 보통 머리카락 ──
  const topFace = headFaces.top;
  const topData = ctx.getImageData(topFace.x, topFace.y, topFace.w, topFace.h);
  const newTopData = hairCtx.createImageData(topFace.w, topFace.h);
  for (let i = 0; i < topData.data.length; i += 4) {
    if (topData.data[i + 3] === 0) continue;
    const hex = rgbToHex(topData.data[i], topData.data[i + 1], topData.data[i + 2]);
    const dist = colorDistance(hex, skinColor);
    // 위면에서 피부색이 아닌 것 = 머리카락 (머리 꼭대기)
    // 비피부이거나, 임계값의 절반 이상이면 머리카락으로
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

  // ── 뒷면(back face): 대부분 머리카락 ──
  const backFace = headFaces.back;
  const backData = ctx.getImageData(backFace.x, backFace.y, backFace.w, backFace.h);
  const newBackData = hairCtx.createImageData(backFace.w, backFace.h);
  for (let i = 0; i < backData.data.length; i += 4) {
    if (backData.data[i + 3] === 0) continue;
    const hex = rgbToHex(backData.data[i], backData.data[i + 1], backData.data[i + 2]);
    const dist = colorDistance(hex, skinColor);
    if (dist > threshold * 0.4) { // 뒷면은 더 관대하게
      newBackData.data[i] = backData.data[i];
      newBackData.data[i + 1] = backData.data[i + 1];
      newBackData.data[i + 2] = backData.data[i + 2];
      newBackData.data[i + 3] = backData.data[i + 3];
      hairPixelCount++;
    }
    totalHeadPixels++;
  }
  hairCtx.putImageData(newBackData, backFace.x, backFace.y);

  // ── 좌/우 측면: 상단부는 머리카락, 하단부는 피부 ──
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
        
        // 상단일수록 머리카락일 확률 높음 (가중치 적용)
        const rowWeight = 1.0 - (y / face.h) * 0.5; // 상단=1.0, 하단=0.5
        
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

  // ── 오버레이 레이어 (모자/헬멧) ──
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

/**
 * 눈 영역을 추출합니다.
 * 개선: 고정 행이 아닌 전체 앞면에서 대칭 패턴 탐색
 */
function extractEyes(ctx, skinInfo, frontClassification) {
  const front = PART_REGIONS.head.faces.front;
  const { grid, pixelColors } = frontClassification;
  
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

  // 눈 패턴 분석 정보
  const eyeInfo = {
    eyePixels: eyePixelCount,
    detectedRows: eyeRowsDetected.map(y => y + front.y),
    rowCount: eyeRowsDetected.length,
  };

  // 대칭성 점수 계산
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
    confidence: eyePixelCount > 0 ? Math.min(eyePixelCount / 16, 1.0) : 0, // 16: 눈 최대 예상 크기
    info: eyeInfo,
  };
}

/**
 * 상의(Top/Shirt)를 추출합니다.
 * Body UV 영역 전체를 있는 그대로 추출합니다.
 */
function extractTop(ctx) {
  const bodyFaces = PART_REGIONS.body.faces;
  const bodyOverlay = PART_REGIONS.body.overlay;
  
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 64;
  topCanvas.height = 64;
  const topCtx = topCanvas.getContext('2d');
  
  let pixelCount = 0;

  // 몸통 메인 레이어 전체 복사
  Object.values(bodyFaces).forEach(face => {
    const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
    topCtx.putImageData(imageData, face.x, face.y);
    
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) pixelCount++;
    }
  });

  // 몸통 오버레이
  Object.values(bodyOverlay).forEach(face => {
    if (!isRegionEmpty(ctx, face)) {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      topCtx.putImageData(imageData, face.x, face.y);
    }
  });

  const totalTopPixels = Object.values(bodyFaces).reduce((sum, f) => sum + f.w * f.h, 0);

  return {
    partId: 'top',
    label: SEMANTIC_PARTS.top.label,
    canvas: topCanvas,
    confidence: pixelCount / totalTopPixels,
    info: {
      opaquePixels: pixelCount,
      hasOverlay: Object.values(bodyOverlay).some(face => !isRegionEmpty(ctx, face)),
    },
  };
}

/**
 * 소매(Sleeves/Arms)를 추출합니다.
 * 양팔 전체 UV 영역을 추출합니다 (상반부만 자르지 않음).
 */
function extractSleeves(ctx) {
  const sleeveCanvas = document.createElement('canvas');
  sleeveCanvas.width = 64;
  sleeveCanvas.height = 64;
  const sleeveCtx = sleeveCanvas.getContext('2d');

  let pixelCount = 0;

  ['rightArm', 'leftArm'].forEach(armKey => {
    const armFaces = PART_REGIONS[armKey].faces;
    const armOverlay = PART_REGIONS[armKey].overlay;

    // 전체 팔 UV 복사
    Object.values(armFaces).forEach(face => {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      sleeveCtx.putImageData(imageData, face.x, face.y);

      const data = imageData.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) pixelCount++;
      }
    });

    // 오버레이
    Object.values(armOverlay).forEach(face => {
      if (!isRegionEmpty(ctx, face)) {
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        sleeveCtx.putImageData(imageData, face.x, face.y);
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

/**
 * 하의(Bottom/Pants)를 추출합니다.
 * 양다리 전체 UV 영역을 추출합니다.
 */
function extractBottom(ctx) {
  const bottomCanvas = document.createElement('canvas');
  bottomCanvas.width = 64;
  bottomCanvas.height = 64;
  const bottomCtx = bottomCanvas.getContext('2d');

  let pixelCount = 0;

  ['rightLeg', 'leftLeg'].forEach(legKey => {
    const legFaces = PART_REGIONS[legKey].faces;
    const legOverlay = PART_REGIONS[legKey].overlay;

    // 전체 다리 UV 복사
    Object.values(legFaces).forEach(face => {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      bottomCtx.putImageData(imageData, face.x, face.y);

      const data = imageData.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) pixelCount++;
      }
    });

    // 오버레이
    Object.values(legOverlay).forEach(face => {
      if (!isRegionEmpty(ctx, face)) {
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        bottomCtx.putImageData(imageData, face.x, face.y);
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

/**
 * 신발(Shoes)을 추출합니다.
 * 양다리 하단부만 따로 추출합니다 (다리 측면 하단 4px + 바닥면).
 */
function extractShoes(ctx) {
  const shoeCanvas = document.createElement('canvas');
  shoeCanvas.width = 64;
  shoeCanvas.height = 64;
  const shoeCtx = shoeCanvas.getContext('2d');

  let pixelCount = 0;
  const shoeHeight = 4;

  ['rightLeg', 'leftLeg'].forEach(legKey => {
    const legFaces = PART_REGIONS[legKey].faces;

    Object.entries(legFaces).forEach(([faceName, face]) => {
      if (faceName === 'bottom') {
        // 바닥면 전체
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        shoeCtx.putImageData(imageData, face.x, face.y);
        pixelCount += face.w * face.h;
      } else if (faceName !== 'top' && face.h > 4) {
        // 측면: 하단 4픽셀만
        const shoeY = face.y + face.h - shoeHeight;
        const imageData = ctx.getImageData(face.x, shoeY, face.w, shoeHeight);
        shoeCtx.putImageData(imageData, face.x, shoeY);
        
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) pixelCount++;
        }
      }
    });
  });

  return {
    partId: 'shoes',
    label: SEMANTIC_PARTS.shoes.label,
    canvas: shoeCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0,
    info: { opaquePixels: pixelCount, shoeHeight },
  };
}

/**
 * 오버레이/장신구(Accessories)를 추출합니다.
 * 모든 2번째 레이어(overlay)에서 비어있지 않은 영역을 감지합니다.
 */
function extractAccessories(ctx) {
  const accCanvas = document.createElement('canvas');
  accCanvas.width = 64;
  accCanvas.height = 64;
  const accCtx = accCanvas.getContext('2d');

  let pixelCount = 0;
  const detectedParts = [];

  Object.entries(PART_REGIONS).forEach(([partKey, partDef]) => {
    if (!partDef.overlay) return;

    Object.entries(partDef.overlay).forEach(([faceName, face]) => {
      if (!isRegionEmpty(ctx, face)) {
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        accCtx.putImageData(imageData, face.x, face.y);
        
        const data = imageData.data;
        let facePixels = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) facePixels++;
        }
        pixelCount += facePixels;
        detectedParts.push(`${partDef.label}-${faceName}`);
      }
    });
  });

  return {
    partId: 'accessory',
    label: SEMANTIC_PARTS.accessory.label,
    canvas: accCanvas,
    confidence: pixelCount > 0 ? Math.min(pixelCount / 100, 1.0) : 0,
    info: {
      opaquePixels: pixelCount,
      detectedOverlayAreas: detectedParts,
    },
  };
}


// ─── 메인 추출 함수 ───

/**
 * 스킨 이미지를 분석하여 모든 의미적 파츠를 추출합니다.
 * 
 * @param {File|string} source - 스킨 파일(File 객체) 또는 이미지 URL
 * @returns {Promise<{ parts: Array<ExtractedPart>, skinAnalysis: object }>}
 * 
 * @typedef {Object} ExtractedPart
 * @property {string} partId - 파츠 식별자 (hair, eyes, top, sleeves, bottom, shoes, accessory)
 * @property {string} label - 한국어 레이블
 * @property {HTMLCanvasElement} canvas - 해당 파츠만 그려진 64x64 캔버스
 * @property {number} confidence - 인식 신뢰도 (0~1)
 * @property {object} info - 추가 분석 정보
 */
export async function extractSkinParts(source) {
  // 1. 스킨 로드
  const { canvas, ctx, isLegacy } = await loadSkinToCanvas(source);

  // 2. 전체 스킨 분석
  const fullAnalysis = analyzeRegionColors(ctx, { x: 0, y: 0, w: 64, h: 64 });

  // 3. 스마트 피부색 감지
  const skinInfo = detectSkinColor(ctx);
  
  // 4. 적응형 임계값 계산
  skinInfo.threshold = computeAdaptiveThreshold(ctx, skinInfo.skinColor);

  // 5. 머리 앞면 픽셀 분류 (한 번만 계산하여 hair/eyes 공유)
  const frontClassification = classifyHeadFrontPixels(ctx, skinInfo.skinColor, skinInfo.threshold);

  // 6. 각 파츠 추출
  const parts = [
    extractHair(ctx, skinInfo, frontClassification),
    extractEyes(ctx, skinInfo, frontClassification),
    extractTop(ctx),
    extractSleeves(ctx),
    extractBottom(ctx),
    extractShoes(ctx),
    extractAccessories(ctx),
  ];

  // 7. 신뢰도 기준으로 정렬 (높은 순)
  parts.sort((a, b) => b.confidence - a.confidence);

  return {
    parts,
    skinAnalysis: {
      isLegacy,
      totalOpaquePixels: fullAnalysis.opaquePixels,
      dominantColor: fullAnalysis.dominantColor,
      avgBrightness: fullAnalysis.avgBrightness,
      colorCount: fullAnalysis.colors.size,
      detectedSkinColor: skinInfo.skinColor,
      skinColorConfidence: skinInfo.confidence,
      adaptiveThreshold: skinInfo.threshold,
    },
  };
}


/**
 * 추출된 파츠를 PNG Data URL로 변환합니다.
 * @param {HTMLCanvasElement} partCanvas
 * @returns {string} data URL (image/png)
 */
export function partCanvasToDataURL(partCanvas) {
  return partCanvas.toDataURL('image/png');
}

/**
 * 파츠 캔버스에서 비어있지 않은 영역(바운딩 박스)만 크롭합니다.
 * 미리보기와 다운로드 시 투명 영역을 제거하여 깔끔한 결과를 줍니다.
 * @param {HTMLCanvasElement} partCanvas - 64x64 파츠 캔버스
 * @returns {{ canvas: HTMLCanvasElement, bounds: {x, y, w, h} }}
 */
export function getCroppedPartCanvas(partCanvas) {
  const ctx = partCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, 64, 64);
  const data = imageData.data;

  let minX = 64, minY = 64, maxX = 0, maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const alpha = data[(y * 64 + x) * 4 + 3];
      if (alpha > 0) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) {
    // 비어있는 캔버스 → 1x1 투명 반환
    const empty = document.createElement('canvas');
    empty.width = 1;
    empty.height = 1;
    return { canvas: empty, bounds: { x: 0, y: 0, w: 1, h: 1 } };
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(partCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return { canvas: croppedCanvas, bounds: { x: minX, y: minY, w: cropW, h: cropH } };
}

/**
 * 추출된 파츠를 다운로드 가능한 Blob으로 변환합니다.
 * @param {HTMLCanvasElement} partCanvas
 * @returns {Promise<Blob>}
 */
export function partCanvasToBlob(partCanvas) {
  return new Promise((resolve) => {
    partCanvas.toBlob(resolve, 'image/png');
  });
}

/**
 * 추출 결과를 시각적으로 미리보기 할 수 있는 정보를 반환합니다.
 * @param {{ parts: Array, skinAnalysis: object }} result - extractSkinParts 결과
 * @returns {Array<{ partId: string, label: string, confidence: string, dataUrl: string, croppedDataUrl: string, info: object }>}
 */
export function getExtractionPreview(result) {
  return result.parts.map(part => {
    const cropped = getCroppedPartCanvas(part.canvas);
    return {
      partId: part.partId,
      label: part.label,
      confidence: `${(part.confidence * 100).toFixed(1)}%`,
      dataUrl: partCanvasToDataURL(part.canvas),           // 64x64 전체 (스킨 적용용)
      croppedDataUrl: partCanvasToDataURL(cropped.canvas),  // 크롭된 미리보기/다운로드용
      bounds: cropped.bounds,
      info: part.info,
    };
  });
}
