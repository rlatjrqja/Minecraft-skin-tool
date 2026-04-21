import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function WardrobeCategory({ cat, selections, colors, handlePrev, handleNext, setColors }) {
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
}
