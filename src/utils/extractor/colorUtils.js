// ─── 유틸리티 함수: 색상 관련 ───

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return Infinity;
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

export function rgbToHsl(r, g, b) {
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

export function perceptualDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return Infinity;

  const hsl1 = rgbToHsl(c1.r, c1.g, c1.b);
  const hsl2 = rgbToHsl(c2.r, c2.g, c2.b);

  let hueDiff = Math.abs(hsl1.h - hsl2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  hueDiff /= 180;

  // RGB 유클리드 (기본)
  const rgbDist = Math.sqrt(
    (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2
  );

  const hueWeight = hueDiff < 0.1 ? 0.3 : 1.5;
  const adjustedDist = rgbDist * (0.5 + hueDiff * hueWeight);

  return Math.max(adjustedDist, rgbDist * 0.4);
}

export function isSkinTone(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const { r, g, b } = rgb;
  const isBrightSkin = r > 150 && g > 80 && b > 50 && r > g && r > b && (r - b) > 20;
  const isDarkSkin = r > 60 && g > 30 && b > 15 && r > g && g > b && (r - b) > 10 && r < 200;
  
  return isBrightSkin || isDarkSkin;
}

export function isSkinShade(hex, skinColor) {
  const c = hexToRgb(hex);
  const s = hexToRgb(skinColor);
  if (!c || !s) return false;

  const hsl = rgbToHsl(c.r, c.g, c.b);
  const skinHsl = rgbToHsl(s.r, s.g, s.b);

  let hueDiff = Math.abs(hsl.h - skinHsl.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  return hueDiff < 20 && Math.abs(hsl.s - skinHsl.s) < 0.3 && Math.abs(hsl.l - skinHsl.l) < 0.35;
}
