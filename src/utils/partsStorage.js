/**
 * 추출된 스킨 파츠를 localStorage에 저장/로드하는 유틸리티
 * 
 * 저장 구조:
 * localStorage['mc_skin_parts'] = JSON {
 *   [skinName]: {
 *     [partId]: { name, dataUrl (64x64), croppedDataUrl, timestamp }
 *   }
 * }
 */

const STORAGE_KEY = 'mc_skin_parts';

/**
 * 저장소에서 모든 커스텀 파츠를 로드합니다.
 * @returns {Object} { [skinName]: { [partId]: { name, dataUrl, croppedDataUrl, timestamp } } }
 */
export function loadAllCustomParts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * 특정 파츠 카테고리에 해당하는 모든 커스텀 옵션을 반환합니다.
 * 워드로브에서 사용할 수 있는 형태로 변환합니다.
 * @param {string} partId - 파츠 ID (hair, eyes, top, sleeves, bottom, shoes, accessory)
 * @returns {Array<{ id: string, name: string, dataUrl: string, croppedDataUrl: string, isCustom: true }>}
 */
export function getCustomOptionsForPart(partId) {
  const allParts = loadAllCustomParts();
  const options = [];

  Object.entries(allParts).forEach(([skinName, parts]) => {
    if (parts[partId]) {
      options.push({
        id: `custom_${skinName}_${partId}`,
        name: `${skinName}`,
        dataUrl: parts[partId].dataUrl,
        croppedDataUrl: parts[partId].croppedDataUrl,
        isCustom: true,
        skinName,
      });
    }
  });

  return options;
}

/**
 * 추출된 파츠들을 저장합니다.
 * @param {string} skinName - 스킨 이름 (파일명 등)
 * @param {Array<{ partId, dataUrl, croppedDataUrl }>} parts - 추출된 파츠 배열
 */
export function saveExtractedParts(skinName, parts) {
  const allParts = loadAllCustomParts();
  
  allParts[skinName] = {};
  parts.forEach(part => {
    allParts[skinName][part.partId] = {
      name: part.label,
      dataUrl: part.dataUrl,
      croppedDataUrl: part.croppedDataUrl,
      timestamp: Date.now(),
    };
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allParts));
    return true;
  } catch (e) {
    console.error('파츠 저장 실패 (용량 초과 가능):', e);
    return false;
  }
}

/**
 * 특정 스킨의 모든 파츠를 삭제합니다.
 * @param {string} skinName
 */
export function deleteCustomSkin(skinName) {
  const allParts = loadAllCustomParts();
  delete allParts[skinName];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allParts));
}

/**
 * 모든 커스텀 파츠를 삭제합니다.
 */
export function clearAllCustomParts() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 저장된 스킨 이름 목록을 반환합니다.
 * @returns {string[]}
 */
export function getSavedSkinNames() {
  const allParts = loadAllCustomParts();
  return Object.keys(allParts);
}
