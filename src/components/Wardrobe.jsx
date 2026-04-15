import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CATEGORIES = [
  { id: 'hair',      label: '헤어스타일', icon: '💇', options: [{id: 'base', name: '기본 헤어'}] },
  { id: 'eyes',      label: '눈 모양',    icon: '👁', options: [{id: 'base', name: '기본 눈'}, {id: 'sunglasses', name: '선글라스'}] },
  { id: 'head',      label: '얼굴',      icon: '😊', options: [{id: 'base', name: '기본 얼굴'}, {id: 'creeper', name: '크리퍼 얼굴'}] },
  { id: 'top',       label: '상의',      icon: '👕', options: [{id: 'base', name: '기본 상의'}, {id: 'suit', name: '정장 자켓'}] },
  { id: 'sleeves',   label: '소매/팔',    icon: '💪', options: [{id: 'base', name: '기본 소매'}, {id: 'gauntlet', name: '타노스 건틀렛'}] },
  { id: 'bottom',    label: '하의',      icon: '👖', options: [{id: 'base', name: '기본 하의'}, {id: 'black_pants', name: '검은색 바지'}] },
  { id: 'shoes',     label: '신발',      icon: '👟', options: [{id: 'base', name: '기본 신발'}] },
  { id: 'accessory', label: '장신구',    icon: '✨', options: [{id: 'base', name: '없음'}] },
];

// 각 카테고리 ID의 기본 인덱스를 생성하는 헬퍼
export function getDefaultSelections() {
  const defaults = {};
  CATEGORIES.forEach(cat => { defaults[cat.id] = 0; });
  return defaults;
}

// 각 카테고리의 현재 선택된 option ID를 반환
export function getSelectedIds(selections) {
  const selectedIds = {};
  CATEGORIES.forEach(cat => {
    const idx = selections[cat.id] ?? 0;
    selectedIds[cat.id] = cat.options[idx]?.id ?? 'base';
  });
  return selectedIds;
}

export function Wardrobe({ onChange }) {
  const [selections, setSelections] = useState(getDefaultSelections);

  // Notify parent whenever selections change
  useEffect(() => {
    const selectedIds = getSelectedIds(selections);
    onChange(selectedIds);
  }, [selections, onChange]);

  const handlePrev = (catId) => {
    setSelections(prev => {
      const cat = CATEGORIES.find(c => c.id === catId);
      const curIdx = prev[catId];
      const newIdx = curIdx === 0 ? cat.options.length - 1 : curIdx - 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  const handleNext = (catId) => {
    setSelections(prev => {
      const cat = CATEGORIES.find(c => c.id === catId);
      const curIdx = prev[catId];
      const newIdx = curIdx === cat.options.length - 1 ? 0 : curIdx + 1;
      return { ...prev, [catId]: newIdx };
    });
  };

  return (
    <div className="wardrobe-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '4px', color: 'var(--primary)' }}>캐릭터 외형 커스텀</h3>
      
      {CATEGORIES.map(cat => {
        const currentOption = cat.options[selections[cat.id]];
        const hasMultipleOptions = cat.options.length > 1;
        
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
            }}>
              <button 
                className="btn-icon" 
                onClick={() => handlePrev(cat.id)} 
                style={{ padding: '5px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                disabled={!hasMultipleOptions}
              >
                <ChevronLeft size={18} />
              </button>
              
              <span style={{ fontWeight: '500', flex: 1, textAlign: 'center', userSelect: 'none', fontSize: '0.85rem' }}>
                {currentOption.name}
              </span>
              
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
    </div>
  );
}
