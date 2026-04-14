import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CATEGORIES = [
  { id: 'head', label: '얼굴', options: [{id: 'base', name: '기본 얼굴'}, {id: 'creeper', name: '크리퍼 얼굴'}] },
  { id: 'eyes', label: '눈장식', options: [{id: 'base', name: '기본 눈장식'}, {id: 'sunglasses', name: '선글라스'}] },
  { id: 'top', label: '상의', options: [{id: 'base', name: '기본 상의'}, {id: 'suit', name: '정장 자켓'}] },
  { id: 'arm', label: '팔 장식', options: [{id: 'base', name: '기본 팔 장식'}, {id: 'gauntlet', name: '타노스 건틀렛'}] },
  { id: 'pants', label: '바지', options: [{id: 'base', name: '기본 바지'}, {id: 'black_pants', name: '검은색 바지'}] }
];

export function Wardrobe({ onChange }) {
  const [selections, setSelections] = useState({
    head: 0,
    eyes: 0,
    top: 0,
    arm: 0,
    pants: 0
  });

  // Notify parent whenever selections change
  useEffect(() => {
    const selectedIds = {};
    CATEGORIES.forEach(cat => {
      selectedIds[cat.id] = cat.options[selections[cat.id]].id;
    });
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
    <div className="wardrobe-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '8px', color: 'var(--primary)' }}>캐릭터 외형 커스텀</h3>
      
      {CATEGORIES.map(cat => {
        const currentOption = cat.options[selections[cat.id]];
        
        return (
          <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cat.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '8px' }}>
              <button className="btn-icon" onClick={() => handlePrev(cat.id)} style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <ChevronLeft size={20} />
              </button>
              
              <span style={{ fontWeight: '500', width: '120px', textAlign: 'center', userSelect: 'none' }}>
                {currentOption.name}
              </span>
              
              <button className="btn-icon" onClick={() => handleNext(cat.id)} style={{ padding: '6px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
