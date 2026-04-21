import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCustomSkin, getSavedSkinNames } from '../utils/partsStorage';
import { useMergedCategories, getDefaultSelections } from '../hooks/useWardrobeData';
import { WardrobeCategory } from './wardrobe/WardrobeCategory';

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
      if (opt?.url || opt?.dataUrl) {
        selectedIds[`${cat.id}_dataUrl`] = opt.url || opt.dataUrl;
      }
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
          {appearanceCats.map(cat => (
            <WardrobeCategory 
              key={cat.id} cat={cat} selections={selections} colors={colors}
              handlePrev={handlePrev} handleNext={handleNext} setColors={setColors} 
            />
          ))}
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
          {accessoryCats.map(cat => (
             <WardrobeCategory 
               key={cat.id} cat={cat} selections={selections} colors={colors}
               handlePrev={handlePrev} handleNext={handleNext} setColors={setColors} 
            />
          ))}
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
                  setSelections(getDefaultSelections());
                  setColors({});
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
