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
  // --- 캐릭터 외형 (Character Appearance) ---
  hair: {
    label: '헤어스타일',
    description: '머리카락 영역 (머리 상단 + 측면 상단부)',
    category: 'appearance',
  },
  eyes: {
    label: '눈 모양',
    description: '눈 영역 (머리 앞면)',
    category: 'appearance',
  },
  mouth: {
    label: '입모양',
    description: '입 영역 (머리 앞면 하단 중앙)',
    category: 'appearance',
  },
  top: {
    label: '상의',
    description: '상체 의상 영역',
    category: 'appearance',
  },
  sleeves: {
    label: '소매',
    description: '팔 의상 영역',
    category: 'appearance',
  },
  bottom: {
    label: '하의',
    description: '다리 상단부 의상 영역',
    category: 'appearance',
  },
  shoes: {
    label: '신발',
    description: '다리 하단부 의상 영역',
    category: 'appearance',
  },
  
  // --- 장신구 (Accessories) ---
  hat: {
    label: '모자',
    description: '머리 장식 (Head Overlay 레이어 상단/전체)',
    category: 'accessory',
  },
  eye_accessory: {
    label: '눈장식',
    description: '안경 등 눈 부근 장식 (Head Overlay 레이어 앞면)',
    category: 'accessory',
  },
  ear_accessory: {
    label: '귀장식',
    description: '귀걸이 등 귀 부근 장식 (Head Overlay 측면)',
    category: 'accessory',
  },
  shoulder_accessory: {
    label: '어깨장식',
    description: '어깨 장식 (Body Overlay/Arm Overlay 상단)',
    category: 'accessory',
  },
  necklace: {
    label: '목걸이',
    description: '목걸이/스카프 (Body Overlay 가슴 영역)',
    category: 'accessory',
  },
  arm_accessory: {
    label: '팔 장식',
    description: '팔/손목 장식 (Arm Overlay 레이어 전체)',
    category: 'accessory',
  },
  leg_accessory: {
    label: '다리장식',
    description: '다리 장식 (Leg Overlay 레이어 전체)',
    category: 'accessory',
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


// ─── 개선된 색상 분석 헬퍼 ───

/**
 * RGB를 HSL로 변환합니다.
 * H: 0~360, S: 0~1, L: 0~1
 */
function rgbToHsl(r, g, b) {
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

/**
 * 인지적(perceptual) 색상 거리를 계산합니다.
 * 단순 RGB 유클리드 대신, 밝기(L) 차이와 색조(H) 차이를 가중 결합합니다.
 * 같은 색조의 밝기 변화(그림자/하이라이트)에 관대하고,
 * 다른 색조의 색상 변화에는 민감하게 반응합니다.
 */
function perceptualDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return Infinity;

  const hsl1 = rgbToHsl(c1.r, c1.g, c1.b);
  const hsl2 = rgbToHsl(c2.r, c2.g, c2.b);

  // 색조 차이 (원형 거리)
  let hueDiff = Math.abs(hsl1.h - hsl2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  hueDiff /= 180; // 0~1 정규화

  // 채도 차이
  const satDiff = Math.abs(hsl1.s - hsl2.s);

  // 밝기 차이
  const lumDiff = Math.abs(hsl1.l - hsl2.l);

  // RGB 유클리드 (기본)
  const rgbDist = Math.sqrt(
    (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2
  );

  // 가중 결합: 색조 차이가 작으면 밝기 차이만으로는 거리 낮게 유지
  // 색조 차이가 크면 강하게 패널티
  const hueWeight = hueDiff < 0.1 ? 0.3 : 1.5; // 같은 색조면 가중치 낮음
  const adjustedDist = rgbDist * (0.5 + hueDiff * hueWeight);

  return Math.max(adjustedDist, rgbDist * 0.4); // 최소한 RGB의 40%는 유지
}

/**
 * 두 색상이 같은 피부의 음영(그림자/하이라이트)인지 판단합니다.
 */
function isSkinShade(hex, skinColor) {
  const c = hexToRgb(hex);
  const s = hexToRgb(skinColor);
  if (!c || !s) return false;

  const hsl = rgbToHsl(c.r, c.g, c.b);
  const skinHsl = rgbToHsl(s.r, s.g, s.b);

  // 색조 차이
  let hueDiff = Math.abs(hsl.h - skinHsl.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  // 같은 색조(20도 이내) + 채도 유사(0.3 이내) + 밝기만 다름(0.35 이내)
  return hueDiff < 20 && Math.abs(hsl.s - skinHsl.s) < 0.3 && Math.abs(hsl.l - skinHsl.l) < 0.35;
}


// ─── 피부색 감지 (기존 유지) ───

/**
 * 얼굴 앞면에서 피부색을 정밀하게 감지합니다.
 */
function detectSkinColor(ctx) {
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

/**
 * 적응형 임계값 계산 (개선됨: perceptualDistance 사용)
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

  if (distances.length === 0) return 50;

  distances.sort((a, b) => a - b);

  // bimodal 분포의 가장 큰 간격 찾기
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


// ─── 비피부 픽셀 클러스터링 ───

/**
 * 비피부 픽셀들을 색상 유사도로 클러스터링합니다.
 * 같은 "재질"(머리카락, 눈 흰자, 동공 등)끼리 그룹화합니다.
 */
function clusterNonSkinPixels(grid, pixelColors, w, h) {
  const clusters = []; // { color, pixels: [{x,y}], avgRow }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== 'non-skin') continue;
      const color = pixelColors[y][x];
      if (!color) continue;

      // 기존 클러스터 중 색상이 유사한 것에 병합
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


// ─── 눈 패턴 감지 (대폭 개선) ───

/**
 * 앞면에서 고대비 픽셀 쌍(흰자+동공)을 탐지합니다.
 * 눈은 보통 밝은색(흰자) 옆에 어두운색(동공/홍채)이 있는 패턴입니다.
 * 좌우 대칭으로 쌍이 존재하면 눈일 확률이 높습니다.
 */
function detectEyePattern(grid, pixelColors, skinColor, w, h) {
  const eyePixels = new Set(); // "x,y" 문자열

  // 각 행에 대해 눈 패턴 탐지
  for (let y = 2; y < 7; y++) { // 행 2~6
    const nonSkinPixels = [];
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'non-skin' && pixelColors[y][x]) {
        nonSkinPixels.push({ x, color: pixelColors[y][x] });
      }
    }

    if (nonSkinPixels.length < 2 || nonSkinPixels.length > 7) continue;

    // 좌절반(x<4)과 우절반(x>=4)에 비피부가 각각 있는지
    const leftPixels = nonSkinPixels.filter(p => p.x < 4);
    const rightPixels = nonSkinPixels.filter(p => p.x >= 4);

    if (leftPixels.length === 0 || rightPixels.length === 0) continue;

    // 대칭성: 좌우가 비슷한 개수
    const countDiff = Math.abs(leftPixels.length - rightPixels.length);
    if (countDiff > 2) continue;

    // 고대비 검사: 행 내 비피부 픽셀 중 밝기 차이가 큰 쌍이 있는지
    let hasContrastPair = false;
    const nonSkinHsls = nonSkinPixels.map(p => {
      const rgb = hexToRgb(p.color);
      return { ...p, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };
    });

    for (let i = 0; i < nonSkinHsls.length; i++) {
      for (let j = i + 1; j < nonSkinHsls.length; j++) {
        const lumDiff = Math.abs(nonSkinHsls[i].hsl.l - nonSkinHsls[j].hsl.l);
        if (lumDiff > 0.3) { // 밝기 차이가 큰 쌍 존재
          hasContrastPair = true;
          break;
        }
      }
      if (hasContrastPair) break;
    }

    // 눈 조건: 피부색과 확실히 다른 비피부 + 좌우 대칭 + (고대비 또는 매우 어두운/밝은 색)
    const isBrightOrDark = nonSkinHsls.some(p => p.hsl.l > 0.85 || p.hsl.l < 0.15);
    
    if (hasContrastPair || isBrightOrDark || nonSkinPixels.length <= 4) {
      for (const p of nonSkinPixels) {
        eyePixels.add(`${p.x},${y}`);
      }
    }
  }

  return eyePixels;
}


// ─── 플러드 필 기반 헤어 확장 ───

/**
 * 확실한 헤어 픽셀(상단 행)에서 시작하여 인접한 비피부 픽셀로 확장합니다.
 * 이를 통해 앞머리가 눈 위까지 내려오거나 측면으로 뻗은 헤어스타일을 포착합니다.
 */
function floodFillHair(grid, pixelColors, w, h, eyePixels) {
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const hairSet = new Set();

  // 씨앗 픽셀: 상단 2행의 비피부 또는 이미 hair로 분류된 픽셀
  const seeds = [];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'non-skin' || grid[y][x] === 'hair') {
        seeds.push({ x, y });
      }
    }
  }

  // BFS 플러드 필
  const queue = [...seeds];
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    if (visited[y][x]) continue;
    visited[y][x] = true;

    // 눈으로 감지된 픽셀은 건너뜀
    if (eyePixels.has(`${x},${y}`)) continue;
    // 피부 또는 투명이면 건너뜀
    if (grid[y][x] === 'skin' || grid[y][x] === 'transparent') continue;

    // 현재 픽셀이 비피부이면 헤어로 마킹
    hairSet.add(`${x},${y}`);

    // 인접한 비피부 픽셀로 색상이 유사하면 확장
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

      // 인접 픽셀이 현재 헤어 색과 유사하면 확장
      const neighborColor = pixelColors[n.y][n.x];
      if (neighborColor && currentColor && colorDistance(neighborColor, currentColor) < 60) {
        queue.push(n);
      }
    }
  }

  return hairSet;
}


// ─── 메인 분류 함수 (대폭 개선) ───

/**
 * 머리 앞면의 픽셀을 분류합니다.
 * 개선점:
 *  - HSL 기반 pifu 음영 허용
 *  - 비피부 픽셀 클러스터링
 *  - 고대비 눈 패턴 탐지
 *  - 플러드 필 기반 헤어 확장
 *  - 눈썹 감지 (눈 바로 위의 가로 라인)
 */
function classifyHeadFrontPixels(ctx, skinColor, threshold) {
  const front = PART_REGIONS.head.faces.front;
  const data = ctx.getImageData(front.x, front.y, front.w, front.h).data;
  const w = front.w; // 8
  const h = front.h; // 8

  // 1단계: 각 픽셀을 피부/비피부로 분류 (피부 음영 허용)
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
        // 피부 음영 체크: 같은 색조의 밝기만 다른 경우 피부로 유지
        if (isSkinShade(hex, skinColor)) {
          grid[y][x] = 'skin'; // 음영이므로 피부
        } else {
          grid[y][x] = 'non-skin';
        }
      }
    }
  }

  // 2단계: 비피부 픽셀 클러스터링
  const clusters = clusterNonSkinPixels(grid, pixelColors, w, h);

  // 3단계: 눈 패턴 감지 (고대비 쌍 + 대칭)
  const eyePixels = detectEyePattern(grid, pixelColors, skinColor, w, h);

  // 4단계: 플러드 필 기반 헤어 확장
  const hairPixels = floodFillHair(grid, pixelColors, w, h, eyePixels);

  // 5단계: 눈썹 감지 — 눈 행 바로 위에 있는 가로선 패턴
  const eyeRowSet = new Set();
  const browPixels = new Set();
  
  // 눈 행 찾기
  for (let y = 0; y < h; y++) {
    let isEyeRow = false;
    for (let x = 0; x < w; x++) {
      if (eyePixels.has(`${x},${y}`)) { isEyeRow = true; break; }
    }
    if (isEyeRow) eyeRowSet.add(y);
  }

  // 눈 바로 위 행에 비피부가 넓게 퍼져있으면 눈썹
  for (const eyeRow of eyeRowSet) {
    const browRow = eyeRow - 1;
    if (browRow < 0) continue;
    let browCount = 0;
    for (let x = 0; x < w; x++) {
      if (grid[browRow][x] === 'non-skin' && !eyePixels.has(`${x},${browRow}`)) {
        browCount++;
      }
    }
    // 눈썹: 비피부가 3개 이상이고, 헤어 연결이 아닌 경우
    if (browCount >= 3 && browCount <= 7) {
      for (let x = 0; x < w; x++) {
        if (grid[browRow][x] === 'non-skin') {
          browPixels.add(`${x},${browRow}`);
        }
      }
    }
  }

  // 6단계: 최종 분류 조합
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 'skin' || grid[y][x] === 'transparent') continue;

      const key = `${x},${y}`;

      if (eyePixels.has(key)) {
        grid[y][x] = 'eye';
      } else if (browPixels.has(key)) {
        grid[y][x] = 'eye'; // 눈썹도 눈 영역에 포함
      } else if (hairPixels.has(key)) {
        grid[y][x] = 'hair';
      } else if (y <= 2) {
        grid[y][x] = 'hair'; // 상단 3행의 남은 비피부 = 헤어
      } else if (y >= 6) {
        // 입모양 판별: 하단 2행(y=6,7) 중앙(x=2~5)에서 피부보다 어두운 픽셀
        if (x >= 2 && x <= 5) {
          const c = hexToRgb(pixelColors[y][x]);
          const s = hexToRgb(skinColor);
          if (c && s) {
            const cL = (c.r + c.g + c.b) / 3;
            const sL = (s.r + s.g + s.b) / 3;
            if (cL < sL) { // 피부보다 어두우면 입으로 판정
              grid[y][x] = 'mouth';
            } else {
              grid[y][x] = 'feature';
            }
          } else {
            grid[y][x] = 'feature';
          }
        } else {
          grid[y][x] = 'feature'; // 사이드 특징
        }
      } else {
        // 중간 영역: 클러스터 분석
        // 이 픽셀이 속한 클러스터의 평균 행 위치로 판단
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
 * 입모양(Mouth) 영역을 추출합니다.
 */
function extractMouth(ctx, skinInfo, frontClassification) {
  const front = PART_REGIONS.head.faces.front;
  const { grid, pixelColors } = frontClassification;
  
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

/**
 * 상의(Top/Shirt)를 추출합니다. (Layer 1 만)
 */
function extractTop(ctx) {
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

/**
 * 소매(Sleeves)를 추출합니다. (Layer 1 만)
 */
function extractSleeves(ctx) {
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

/**
 * 하의(Bottom/Pants)를 추출합니다. (Layer 1 만)
 */
function extractBottom(ctx) {
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

/**
 * 신발(Shoes)을 추출합니다. (Layer 1 하단부)
 */
function extractShoes(ctx) {
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
        // 하단 4px만 추출
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

// ─── 장신구 (Accessories: Primarily Layer 2) ───

/**
 * 특정 영역(faces Array 또는 parts) 정보를 받아 캔버스에 복사하고 검출 픽셀 수를 반환하는 유틸
 */
function extractOverlayRegion(ctx, canvasCtx, faces, filterFn = null) {
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

/**
 * 모자(Hat): Head Overlay 상단부 및 뒤/옆면 윗부분
 */
function extractHat(ctx) {
  const hatCanvas = document.createElement('canvas');
  hatCanvas.width = 64; hatCanvas.height = 64;
  const hatCtx = hatCanvas.getContext('2d');
  const overlay = PART_REGIONS.head.overlay;

  // Top, Back 전체, Front/Right/Left는 눈높이(y=4) 미만
  const faces = [overlay.top, overlay.back];
  let pixelCount = extractOverlayRegion(ctx, hatCtx, faces, null);
  
  const sideFaces = [overlay.front, overlay.right, overlay.left];
  pixelCount += extractOverlayRegion(ctx, hatCtx, sideFaces, (x, y) => y < 4);

  return {
    partId: 'hat', label: SEMANTIC_PARTS.hat.label, canvas: hatCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

/**
 * 눈장식(Eye Accessory): Head Overlay 앞면 중앙부 (보통 y=3~5 부근)
 */
function extractEyeAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  
  let pixelCount = extractOverlayRegion(ctx, cCtx, [PART_REGIONS.head.overlay.front], (x, y) => y >= 4 && y <= 6);
  
  return {
    partId: 'eye_accessory', label: SEMANTIC_PARTS.eye_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

/**
 * 귀장식(Ear Accessory): Head Overlay 좌/우측면 중앙/하단부
 */
function extractEarAccessory(ctx) {
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

/**
 * 어깨장식(Shoulder Accessory): Body Overlay 상단 및 Arm Overlay 상단면
 */
function extractShoulderAccessory(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  let pixelCount = 0;
  
  // Body Overlay 앞뒤 상단 2행
  pixelCount += extractOverlayRegion(ctx, cCtx, [PART_REGIONS.body.overlay.front, PART_REGIONS.body.overlay.back], (x, y) => y < 2);
  // Arm Overlay top면
  pixelCount += extractOverlayRegion(ctx, cCtx, [PART_REGIONS.rightArm.overlay.top, PART_REGIONS.leftArm.overlay.top]);
  
  return {
    partId: 'shoulder_accessory', label: SEMANTIC_PARTS.shoulder_accessory.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

/**
 * 목걸이(Necklace): Body Overlay 앞면 (y=1~4 중앙)
 */
function extractNecklace(ctx) {
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 64; cCanvas.height = 64;
  const cCtx = cCanvas.getContext('2d');
  
  let pixelCount = extractOverlayRegion(ctx, cCtx, [PART_REGIONS.body.overlay.front], (x, y) => {
    // 앞면 중앙가슴 영역
    return y >= 1 && y <= 4 && x >= 2 && x <= 5;
  });
  
  return {
    partId: 'necklace', label: SEMANTIC_PARTS.necklace.label, canvas: cCanvas,
    confidence: pixelCount > 0 ? 1.0 : 0, info: { opaquePixels: pixelCount },
  };
}

/**
 * 팔 장식(Arm Accessory): Arm Overlay 전체 (top 제외)
 */
function extractArmAccessory(ctx) {
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

/**
 * 다리장식(Leg Accessory): Leg Overlay 전체
 */
function extractLegAccessory(ctx) {
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


// ─── 메인 추출 함수 ───

/**
 * 스킨 이미지를 분석하여 14개의 의미적 파츠를 추출합니다.
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

  // 5. 머리 앞면 픽셀 분류
  const frontClassification = classifyHeadFrontPixels(ctx, skinInfo.skinColor, skinInfo.threshold);

  // 6. 각 파츠 일괄 추출 (14종)
  const parts = [
    // 외형 (Appearance)
    extractHair(ctx, skinInfo, frontClassification),
    extractEyes(ctx, skinInfo, frontClassification),
    extractMouth(ctx, skinInfo, frontClassification),
    extractTop(ctx),
    extractSleeves(ctx),
    extractBottom(ctx),
    extractShoes(ctx),
    // 장신구 (Accessories)
    extractHat(ctx),
    extractEyeAccessory(ctx),
    extractEarAccessory(ctx),
    extractShoulderAccessory(ctx),
    extractNecklace(ctx),
    extractArmAccessory(ctx),
    extractLegAccessory(ctx),
  ];

  // 7. 빈 파츠 필터링 & 신뢰도 정렬
  // 빈 캔버스가 들어가는 것을 방지하진 않지만, 의미있는 통계 유지를 위해 남겨둠.
  // 실제 UI에서 픽셀이 없는 장식은 걸러질 수 있습니다.
  parts.sort((a, b) => b.confidence - a.confidence);

  return {
    parts,
    skinCanvas: canvas,
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
