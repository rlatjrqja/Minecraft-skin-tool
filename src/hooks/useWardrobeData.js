import { useMemo } from 'react';
import { getCustomOptionsForPart } from '../utils/partsStorage';

export const BASE_CATEGORIES = [
  { id: 'hair', label: '헤어스타일', icon: '💇', group: 'appearance', options: [{ id: 'base', name: '기본 헤어' }] },
  { id: 'eyes', label: '눈 모양', icon: '👁', group: 'appearance', options: [{ id: 'base', name: '기본 눈' }] },
  { id: 'mouth', label: '입모양', icon: '👄', group: 'appearance', options: [{ id: 'base', name: '기본 입' }] },
  { id: 'shirts', label: '상의', icon: '👕', group: 'appearance', options: [{ id: 'base', name: '기본 상의' }] },
  { id: 'sleeves', label: '소매', icon: '💪', group: 'appearance', options: [{ id: 'base', name: '기본 소매' }] },
  { id: 'pants', label: '하의', icon: '👖', group: 'appearance', options: [{ id: 'base', name: '기본 하의' }] },
  { id: 'shoes', label: '신발', icon: '👟', group: 'appearance', options: [{ id: 'base', name: '기본 신발' }] },
  { id: 'hat', label: '모자', icon: '🎩', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_eye', label: '눈장식', icon: '🕶', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_ear', label: '귀장식', icon: '👂', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_shoulder', label: '어깨장식', icon: '🎗', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'necklace', label: '목걸이', icon: '📿', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_arm', label: '팔 장식', icon: '⌚', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_leg', label: '다리장식', icon: '🐾', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
];

const staticParts = import.meta.glob('../assets/parts/**/*.png', { eager: true, query: '?url', import: 'default' });

const dirToCategoryId = {
  top: 'shirts',
  bottom: 'pants',
};

const dynamicOptionsMap = {};

Object.entries(staticParts).forEach(([filepath, url]) => {
  const match = filepath.match(/\.\.\/assets\/parts\/([^\/]+)\/([^\/]+)\.png$/);
  if (match) {
    let dirName = match[1];
    const fileName = match[2];

    const catId = dirToCategoryId[dirName] || dirName;

    if (!dynamicOptionsMap[catId]) {
      dynamicOptionsMap[catId] = [];
    }

    const readableName = fileName.replace(/[_-]/g, ' ');

    dynamicOptionsMap[catId].push({
      id: fileName,
      name: readableName,
      url: url
    });
  }
});

const defaultCategories = BASE_CATEGORIES.map(cat => {
  const newCat = { ...cat, options: [...cat.options] };
  if (dynamicOptionsMap[cat.id]) {
    newCat.options.push(...dynamicOptionsMap[cat.id]);
  }
  return newCat;
});

export function useMergedCategories(refreshKey) {
  return useMemo(() => {
    return defaultCategories.map(baseCat => {
      const customOpts = getCustomOptionsForPart(baseCat.id);
      return {
        ...baseCat,
        options: [...baseCat.options, ...customOpts],
      };
    });
  }, [refreshKey]);
}

export function getDefaultSelections() {
  const defaults = {};
  defaultCategories.forEach(cat => { defaults[cat.id] = 0; });
  return defaults;
}
