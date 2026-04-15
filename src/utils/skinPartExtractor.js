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


// ─── 메인 파츠 추출 알고리즘 ───

/**
 * 머리 영역에서 헤어스타일을 추출합니다.
 * 전략: 피부색이 아닌 픽셀을 "머리카락"으로 분류
 * 
 * @param {CanvasRenderingContext2D} ctx - 소스 스킨 캔버스
 * @returns {{ canvas: HTMLCanvasElement, confidence: number, info: object }}
 */
function extractHair(ctx) {
  const headFaces = PART_REGIONS.head.faces;
  
  // 1. 먼저 얼굴 앞면에서 피부색을 감지
  const faceAnalysis = analyzeRegionColors(ctx, headFaces.front);
  const skinColor = faceAnalysis.dominantColor;
  
  // 2. 머리카락 = 머리 전체 영역 중 피부색이 아닌 영역
  const hairCanvas = document.createElement('canvas');
  hairCanvas.width = 64;
  hairCanvas.height = 64;
  const hairCtx = hairCanvas.getContext('2d');
  
  let hairPixelCount = 0;
  let totalHeadPixels = 0;

  // 모든 머리 면을 순회하며 비피부색 픽셀을 추출
  Object.values(headFaces).forEach(face => {
    const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
    const newData = hairCtx.createImageData(face.w, face.h);
    const src = imageData.data;
    const dst = newData.data;

    for (let i = 0; i < src.length; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2], a = src[i + 3];
      totalHeadPixels++;
      
      if (a === 0) continue;
      
      const pixelHex = rgbToHex(r, g, b);
      const distToSkin = colorDistance(pixelHex, skinColor);
      
      // 피부색과 충분히 다른 색상 → 머리카락 또는 장식
      if (distToSkin > 60) {
        dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = a;
        hairPixelCount++;
      }
    }

    hairCtx.putImageData(newData, face.x, face.y);
  });

  // 오버레이 레이어도 확인 (모자/헬멧 등)
  const headOverlay = PART_REGIONS.head.overlay;
  Object.values(headOverlay).forEach(face => {
    if (!isRegionEmpty(ctx, face)) {
      const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
      hairCtx.putImageData(imageData, face.x, face.y);
      hairPixelCount += face.w * face.h; // 오버레이가 있으면 장식으로 취급
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
      hairPixels: hairPixelCount,
      totalPixels: totalHeadPixels,
      hasOverlay: Object.values(headOverlay).some(face => !isRegionEmpty(ctx, face)),
    },
  };
}

/**
 * 눈 영역을 추출합니다.
 * 전략: 머리 앞면(8,8 ~ 16,16)의 중간 행(y=11~14)에서 흰색/밝은색 + 어두운색 패턴을 감지
 */
function extractEyes(ctx) {
  const frontFace = PART_REGIONS.head.faces.front; // {x:8, y:8, w:8, h:8}
  
  // 눈은 보통 머리 앞면의 y=11~14 (UV 기준 y=11~14) 범위에 위치
  const eyeRegion = { x: frontFace.x, y: 11, w: frontFace.w, h: 3 };
  
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 64;
  eyeCanvas.height = 64;
  const eyeCtx = eyeCanvas.getContext('2d');
  
  const imageData = ctx.getImageData(eyeRegion.x, eyeRegion.y, eyeRegion.w, eyeRegion.h);
  const faceAnalysis = analyzeRegionColors(ctx, frontFace);
  const skinColor = faceAnalysis.dominantColor;
  
  const newData = eyeCtx.createImageData(eyeRegion.w, eyeRegion.h);
  const src = imageData.data;
  const dst = newData.data;
  
  let eyePixelCount = 0;
  
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i + 1], b = src[i + 2], a = src[i + 3];
    if (a === 0) continue;
    
    const pixelHex = rgbToHex(r, g, b);
    const distToSkin = colorDistance(pixelHex, skinColor);
    
    // 피부색과 다른 픽셀 → 눈 영역
    if (distToSkin > 40) {
      dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = a;
      eyePixelCount++;
    }
  }
  
  eyeCtx.putImageData(newData, eyeRegion.x, eyeRegion.y);
  
  return {
    partId: 'eyes',
    label: SEMANTIC_PARTS.eyes.label,
    canvas: eyeCanvas,
    confidence: eyePixelCount > 0 ? Math.min(eyePixelCount / (eyeRegion.w * eyeRegion.h), 1.0) : 0,
    info: {
      eyePixels: eyePixelCount,
      region: eyeRegion,
    },
  };
}

/**
 * 상의(Top/Shirt)를 추출합니다.
 * Body UV 영역 전체를 추출합니다.
 */
function extractTop(ctx) {
  const bodyFaces = PART_REGIONS.body.faces;
  const bodyOverlay = PART_REGIONS.body.overlay;
  
  const topCanvas = document.createElement('canvas');
  topCanvas.width = 64;
  topCanvas.height = 64;
  const topCtx = topCanvas.getContext('2d');
  
  let pixelCount = 0;

  // 몸통 메인 레이어
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
 * 소매(Sleeves)를 추출합니다.
 * 양팔의 상반부(상의 소매 부분)를 추출합니다.
 */
function extractSleeves(ctx) {
  const sleeveCanvas = document.createElement('canvas');
  sleeveCanvas.width = 64;
  sleeveCanvas.height = 64;
  const sleeveCtx = sleeveCanvas.getContext('2d');

  let pixelCount = 0;

  // 오른팔, 왼팔의 모든 면을 추출
  ['rightArm', 'leftArm'].forEach(armKey => {
    const armFaces = PART_REGIONS[armKey].faces;
    const armOverlay = PART_REGIONS[armKey].overlay;

    Object.values(armFaces).forEach(face => {
      // 상단 절반만 (소매)
      const sleeveRegion = { ...face, h: Math.ceil(face.h / 2) };
      if (face.h <= 4) {
        // top/bottom 면은 전체 포함
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        sleeveCtx.putImageData(imageData, face.x, face.y);
      } else {
        const imageData = ctx.getImageData(sleeveRegion.x, sleeveRegion.y, sleeveRegion.w, sleeveRegion.h);
        sleeveCtx.putImageData(imageData, sleeveRegion.x, sleeveRegion.y);
      }

      const data = ctx.getImageData(face.x, face.y, face.w, face.h).data;
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
 * 양다리의 상반부(바지 부분)를 추출합니다.
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

    Object.entries(legFaces).forEach(([faceName, face]) => {
      if (faceName === 'top' || faceName === 'bottom') {
        // top/bottom 면은 전체 포함
        const imageData = ctx.getImageData(face.x, face.y, face.w, face.h);
        bottomCtx.putImageData(imageData, face.x, face.y);
      } else {
        // 측면: 상반부만 (바지 부분)
        const pantsH = Math.ceil(face.h * 2 / 3); // 상위 2/3 = 바지
        const pantsRegion = { x: face.x, y: face.y, w: face.w, h: pantsH };
        const imageData = ctx.getImageData(pantsRegion.x, pantsRegion.y, pantsRegion.w, pantsRegion.h);
        bottomCtx.putImageData(imageData, pantsRegion.x, pantsRegion.y);
      }

      const data = ctx.getImageData(face.x, face.y, face.w, face.h).data;
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
 * 양다리의 하단부(실제 신발 영역)를 추출합니다.
 */
function extractShoes(ctx) {
  const shoeCanvas = document.createElement('canvas');
  shoeCanvas.width = 64;
  shoeCanvas.height = 64;
  const shoeCtx = shoeCanvas.getContext('2d');

  let pixelCount = 0;
  const shoeHeight = 4; // 하단 4픽셀 = 신발

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
        const shoeRegion = { x: face.x, y: shoeY, w: face.w, h: shoeHeight };
        const imageData = ctx.getImageData(shoeRegion.x, shoeRegion.y, shoeRegion.w, shoeRegion.h);
        shoeCtx.putImageData(imageData, shoeRegion.x, shoeRegion.y);
        
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
 * @property {string} partId - 파츠 식별자 (hair, eyes, face, top, sleeves, gloves, bottom, shoes, accessory)
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

  // 3. 각 파츠 추출
  const parts = [
    extractHair(ctx),
    extractEyes(ctx),
    extractTop(ctx),
    extractSleeves(ctx),
    extractBottom(ctx),
    extractShoes(ctx),
    extractAccessories(ctx),
  ];

  // 4. 신뢰도 기준으로 정렬 (높은 순)
  parts.sort((a, b) => b.confidence - a.confidence);

  return {
    parts,
    skinAnalysis: {
      isLegacy,
      totalOpaquePixels: fullAnalysis.opaquePixels,
      dominantColor: fullAnalysis.dominantColor,
      avgBrightness: fullAnalysis.avgBrightness,
      colorCount: fullAnalysis.colors.size,
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
