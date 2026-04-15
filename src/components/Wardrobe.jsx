import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getCustomOptionsForPart, deleteCustomSkin, getSavedSkinNames } from '../utils/partsStorage';

// 기본(내장) 카테고리 정의
export const BASE_CATEGORIES = [
  { id: 'hair',      label: '헤어스타일', icon: '💇', options: [{id: 'base', name: '기본 헤어'}] },
  { id: 'eyes',      label: '눈 모양',    icon: '👁', options: [{id: 'base', name: '기본 눈'}, {id: 'sunglasses', name: '선글라스'}] },
  { id: 'head',      label: '얼굴',      icon: '😊', options: [{id: 'base', name: '기본 얼굴'}, {id: 'creeper', name: '크리퍼 얼굴'}] },
  { id: 'top',       label: '상의',      icon: '👕', options: [{id: 'base', name: '기본 상의'}, {id: 'suit', name: '정장 자켓'}] },
  { id: 'sleeves',   label: '소매/팔',    icon: '💪', options: [{id: 'base', name: '기본 소매'}, {id: 'gauntlet', name: '타노스 건틀렛'}] },
  { id: 'bottom',    label: '하의',      icon: '👖', options: [{id: 'base', name: '기본 하의'}, {id: 'black_pants', name: '검은색 바지'}] },
  { id: 'shoes',     label: '신발',      icon: '👟', options: [{id: 'base', name: '기본 신발'}] },
  { id: 'accessory', label: '장신구',    icon: '✨', options: [{id: 'base', name: '없음'}] },
];

/**
 * 기본 카테고리 + localStorage의 커스텀 파츠를 병합한 카테고리 목록을 반환합니다.
 * @param {number} refreshKey - 강제 갱신을 위한 키 (값 변경 시 재계산)
 * @returns {Array} 병합된 카테고리 배열
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

// 각 카테고리 ID의 기본 인덱스를 생성하는 헬퍼
export function getDefaultSelections() {
  const defaults = {};
  BASE_CATEGORIES.forEach(cat => { defaults[cat.id] = 0; });
  return defaults;
}

export function Wardrobe({ onChange, refreshKey = 0 }) {
  const categories = useMergedCategories(refreshKey);
  const [selections, setSelections] = useState(getDefaultSelections);

  // selections 인덱스가 옵션 범위를 초과하지 않도록 보정
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

  // Notify parent whenever selections change
  useEffect(() => {
    const selectedIds = {};
    categories.forEach(cat => {
      const idx = selections[cat.id] ?? 0;
      const opt = cat.options[idx];
      selectedIds[cat.id] = opt?.id ?? 'base';
      // 커스텀 파츠인 경우 dataUrl도 함께 전달
      if (opt?.isCustom && opt?.dataUrl) {
        selectedIds[`${cat.id}_dataUrl`] = opt.dataUrl;
      }
    });
    onChange(selectedIds);
  }, [selections, categories, onChange]);

  const handlePrev = (catId) => {
    setSelections(prev => {
      const cat = categories.find(c => c.id === catId);
      const curIdx = prev[catId];
      const newIdx = curIdx === 0 ? cat.options.length - 1 : curIdx - 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  const handleNext = (catId) => {
    setSelections(prev => {
      const cat = categories.find(c => c.id === catId);
      const curIdx = prev[catId];
      const newIdx = curIdx === cat.options.length - 1 ? 0 : curIdx + 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  return (
    <div className="wardrobe-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '4px', color: 'var(--primary)' }}>캐릭터 외형 커스텀</h3>
      
      {categories.map(cat => {
        const currentOption = cat.options[selections[cat.id]] || cat.options[0];
        const hasMultipleOptions = cat.options.length > 1;
        const isCustomOption = currentOption?.isCustom;
        
        return (
          <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{cat.icon}</span> {cat.label}
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.5 }}>
                {cat.options.length}종
              </span>
            </span>
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
      })}

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
