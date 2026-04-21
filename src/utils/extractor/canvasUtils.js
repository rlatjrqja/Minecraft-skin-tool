// ─── 유틸리티 함수: 캔버스 및 파일 처리 ───

export function loadSkinToCanvas(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) {
        reject(new Error(`유효하지 않은 스킨 크기입니다: ${img.width}x${img.height}. 64x64 또는 64x32 형식만 지원됩니다.`));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

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

export function extractRegionPixels(srcCtx, region) {
  return srcCtx.getImageData(region.x, region.y, region.w, region.h);
}

export function isRegionEmpty(ctx, region) {
  const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return false;
  }
  return true;
}

export function partCanvasToDataURL(partCanvas) {
  return partCanvas.toDataURL('image/png');
}

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

export function partCanvasToBlob(partCanvas) {
  return new Promise((resolve) => {
    partCanvas.toBlob(resolve, 'image/png');
  });
}

export function getExtractionPreview(result) {
  return result.parts.map(part => {
    const cropped = getCroppedPartCanvas(part.canvas);
    return {
      partId: part.partId,
      label: part.label,
      confidence: `${(part.confidence * 100).toFixed(1)}%`,
      dataUrl: partCanvasToDataURL(part.canvas),
      croppedDataUrl: partCanvasToDataURL(cropped.canvas),
      bounds: cropped.bounds,
      info: part.info,
    };
  });
}
