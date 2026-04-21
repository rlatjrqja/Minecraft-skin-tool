import { PART_REGIONS, SEMANTIC_PARTS } from './extractor/constants';
import { loadSkinToCanvas, partCanvasToDataURL, getCroppedPartCanvas, partCanvasToBlob, getExtractionPreview } from './extractor/canvasUtils';
import { analyzeRegionColors, detectSkinColor, computeAdaptiveThreshold, classifyHeadFrontPixels } from './extractor/analyzer';
import { 
  extractHair, extractEyes, extractMouth, extractTop, extractSleeves, extractBottom, extractShoes,
  extractHat, extractEyeAccessory, extractEarAccessory, extractShoulderAccessory, extractNecklace, extractArmAccessory, extractLegAccessory
} from './extractor/partsExtractor';

/**
 * 스킨 이미지를 분석하여 14개의 의미적 파츠를 추출합니다.
 */
export async function extractSkinParts(source) {
  const { canvas, ctx, isLegacy } = await loadSkinToCanvas(source);

  const fullAnalysis = analyzeRegionColors(ctx, { x: 0, y: 0, w: 64, h: 64 });
  const skinInfo = detectSkinColor(ctx);
  skinInfo.threshold = computeAdaptiveThreshold(ctx, skinInfo.skinColor);

  const frontClassification = classifyHeadFrontPixels(ctx, skinInfo.skinColor, skinInfo.threshold);

  const parts = [
    extractHair(ctx, skinInfo, frontClassification),
    extractEyes(ctx, skinInfo, frontClassification),
    extractMouth(ctx, skinInfo, frontClassification),
    extractTop(ctx),
    extractSleeves(ctx),
    extractBottom(ctx),
    extractShoes(ctx),
    extractHat(ctx),
    extractEyeAccessory(ctx),
    extractEarAccessory(ctx),
    extractShoulderAccessory(ctx),
    extractNecklace(ctx),
    extractArmAccessory(ctx),
    extractLegAccessory(ctx),
  ];

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

export {
  PART_REGIONS,
  SEMANTIC_PARTS,
  loadSkinToCanvas,
  partCanvasToDataURL,
  getCroppedPartCanvas,
  partCanvasToBlob,
  getExtractionPreview
};
