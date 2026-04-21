import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getCustomOptionsForPart, deleteCustomSkin, getSavedSkinNames } from '../utils/partsStorage';

export const BASE_CATEGORIES = [
  { id: 'hair', label: '헤어스타일', icon: '💇', group: 'appearance', options: [{ id: 'base', name: '기본 헤어' }] },
  { id: 'eyes', label: '눈 모양', icon: '👁', group: 'appearance', options: [{ id: 'base', name: '기본 눈' }] },
  { id: 'mouth', label: '입모양', icon: '👄', group: 'appearance', options: [{ id: 'base', name: '기본 입' }] },
  { id: 'shirts', label: '상의', icon: '👕', group: 'appearance', options: [{ id: 'base', name: '기본 상의' }] },
  { id: 'sleeves', label: '소매', icon: '💪', group: 'appearance', options: [{ id: 'base', name: '기본 소매' }] },
  { id: 'pants', label: '하의', icon: '👖', group: 'appearance', options: [{ id: 'base', name: '기본 하의' }] },
  { id: 'shoes', label: '신발', icon: '👟', group: 'appearance', options: [{ id: 'base', name: '기본 신발' }] },
  // --- 장신구 ---
  { id: 'hat', label: '모자', icon: '🎩', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_eye', label: '눈장식', icon: '🕶', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_ear', label: '귀장식', icon: '👂', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_shoulder', label: '어깨장식', icon: '🎗', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'necklace', label: '목걸이', icon: '📿', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_arm', label: '팔 장식', icon: '⌚', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
  { id: 'accessory_leg', label: '다리장식', icon: '🐾', group: 'accessory', options: [{ id: 'base', name: '없음' }] },
];

/**
 * 1. 동적 파츠 옵션 스캔: src/assets/parts 하위의 모든 png 파일을 로드합니다.
 */
const staticParts = import.meta.glob('../assets/parts/**/*.png', { eager: true, query: '?url', import: 'default' });

// 이제 폴더명(shirts, pants) 자체가 id와 동일하므로, 특별한 디렉토리 치환을 제거하거나 최소화합니다.
const dirToCategoryId = {
  // 이전 호환성(top/bottom 이름으로 남아있는 폴더가 있다면 shirts/pants로 매핑)
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

    // 파일명에 있는 _,- 등을 공백으로 치환하여 표시할 이름으로 사용
    const readableName = fileName.replace(/[_-]/g, ' ');

    dynamicOptionsMap[catId].push({
      id: fileName,
      name: readableName,
      url: url
    });
  }
});

// 자동 로드된 옵션을 BASE_CATEGORIES에 반영
BASE_CATEGORIES.forEach(cat => {
  if (dynamicOptionsMap[cat.id]) {
    cat.options.push(...dynamicOptionsMap[cat.id]);
  }
});


/**
 * 기본 카테고리 + localStorage의 커스텀 파츠를 병합한 카테고리 목록을 반환합니다.
 */
function useMergedCategories(refreshKey) {
  return useMemo(() => {
    return BASE_CATEGORIES.map(baseCat => {
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
  BASE_CATEGORIES.forEach(cat => { defaults[cat.id] = 0; });
  return defaults;
}

export function Wardrobe({ onChange, refreshKey = 0 }) {
  const categories = useMergedCategories(refreshKey);
  const [selections, setSelections] = useState(getDefaultSelections);
  const [colors, setColors] = useState({});
  const [skinTone, setSkinTone] = useState('');

  useEffect(() => {
    setSelections(prev => {
      const fixed = { ...prev };
      let changed = false;
      categories.forEach(cat => {
        if (fixed[cat.id] >= cat.options.length) {
          fixed[cat.id] = 0;
          changed = true;
        }
      });
      return changed ? fixed : prev;
    });
  }, [categories]);

  useEffect(() => {
    const selectedIds = {};
    if (skinTone) {
      selectedIds.skinTone = skinTone;
    }
    categories.forEach(cat => {
      const idx = selections[cat.id] ?? 0;
      const opt = cat.options[idx];
      selectedIds[cat.id] = opt?.id ?? 'base';
      // url (public 디렉토리 정적 파일) 혹은 dataUrl (커스텀 Base64) 정보가 있으면 _dataUrl 키로 전달합니다.
      if (opt?.url || opt?.dataUrl) {
        selectedIds[`${cat.id}_dataUrl`] = opt.url || opt.dataUrl;
      }
      // 컬러 필터가 설정되어 있으면 같이 전달
      if (colors[cat.id]) {
        selectedIds[`${cat.id}_color`] = colors[cat.id];
      }
    });
    onChange(selectedIds);
  }, [selections, colors, skinTone, categories, onChange]);

  const handlePrev = (catId) => {
    setSelections(prev => {
      const cat = categories.find(c => c.id === catId);
      const curIdx = prev[catId] || 0;
      const newIdx = curIdx === 0 ? cat.options.length - 1 : curIdx - 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  const handleNext = (catId) => {
    setSelections(prev => {
      const cat = categories.find(c => c.id === catId);
      const curIdx = prev[catId] || 0;
      const newIdx = curIdx === cat.options.length - 1 ? 0 : curIdx + 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  const appearanceCats = categories.filter(c => c.group === 'appearance');
  const accessoryCats = categories.filter(c => c.group === 'accessory');

  const renderCategory = (cat) => {
    const currentOption = cat.options[selections[cat.id] || 0] || cat.options[0];
    const hasMultipleOptions = cat.options.length > 1;
    const isCustomOption = currentOption?.isCustom;

    return (
      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{cat.icon}</span> {cat.label}
            <span style={{ marginLeft: '4px', fontSize: '0.7rem', opacity: 0.5 }}>
              {cat.options.length}종
            </span>
          </span>
          {/* Color Picker & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {colors[cat.id] && (
              <button
                className="btn-icon"
                onClick={() => setColors(prev => { const n = { ...prev }; delete n[cat.id]; return n; })}
                style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.8 }}
                title="색상 초기화"
              >
                초기화
              </button>
            )}
            <div
              style={{
                width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer'
              }}
              title="컬러 필터 적용"
            >
              <input
                type="color"
                value={colors[cat.id] || '#ffffff'}
                onChange={(e) => setColors(prev => ({ ...prev, [cat.id]: e.target.value }))}
                style={{
                  position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                  cursor: 'pointer', padding: 0, margin: 0, border: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: hasMultipleOptions ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)',
          padding: '5px 8px', borderRadius: '8px',
          opacity: hasMultipleOptions ? 1 : 0.6,
          border: isCustomOption ? '1px solid rgba(102, 252, 241, 0.25)' : '1px solid transparent',
        }}>
          <button
            className="btn-icon"
            onClick={() => handlePrev(cat.id)}
            style={{ padding: '5px', backgroundColor: 'rgba(255,255,255,0.05)' }}
            disabled={!hasMultipleOptions}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ flex: 1, textAlign: 'center', userSelect: 'none', minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentOption.name}
            </div>
            {isCustomOption && (
              <div style={{ fontSize: '0.65rem', color: 'var(--primary)', opacity: 0.8, marginTop: '1px' }}>
                ✦ 추출된 파츠
              </div>
            )}
          </div>

          <button
            className="btn-icon"
            onClick={() => handleNext(cat.id)}
            style={{ padding: '5px', backgroundColor: 'rgba(255,255,255,0.05)' }}
            disabled={!hasMultipleOptions}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="wardrobe-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>

      {/* 피부색 섹션 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1rem' }}>피부색 (Skin Tone)</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer'
            }}>
              <input
                type="color"
                value={skinTone || '#b9856f'}
                onChange={(e) => setSkinTone(e.target.value)}
                style={{
                  position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                  cursor: 'pointer', padding: 0, margin: 0, border: 'none'
                }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {skinTone ? '사용자 지정 피부색' : '기본 피부색'}
            </span>
          </div>
          {skinTone && (
            <button
              className="btn-icon"
              onClick={() => setSkinTone('')}
              style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.8 }}
              title="피부색 초기화"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 캐릭터 외형 섹션 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1rem' }}>캐릭터 외형</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>기본형</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {appearanceCats.map(renderCategory)}
        </div>
      </div>

      {/* 장신구 섹션 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1rem' }}>장신구</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>오버레이</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {accessoryCats.map(renderCategory)}
        </div>
      </div>

      {/* 저장된 커스텀 스킨 관리 */}
      {getSavedSkinNames().length > 0 && (
        <div style={{
          marginTop: '8px', padding: '10px', borderRadius: '8px',
          backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', opacity: 0.7 }}>
            저장된 스킨 파츠
          </div>
          {getSavedSkinNames().map(name => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 6px', borderRadius: '4px', marginBottom: '2px',
              fontSize: '0.78rem', color: 'var(--text-secondary)',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                📦 {name}
              </span>
              <button
                className="btn-icon"
                onClick={() => {
                  deleteCustomSkin(name);
                  // 삭제 후 선택 초기화
                  setSelections(getDefaultSelections());
                  setColors({});
                  // force re-render via parent
                  onChange({ _deleted: name });
                }}
                style={{ padding: '3px', opacity: 0.5 }}
                title="이 스킨 파츠 삭제"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
