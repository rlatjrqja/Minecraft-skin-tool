import React from 'react';
import { Glasses, Shirt, Shield, Zap } from 'lucide-react';

export function Wardrobe({ applyPart }) {
  return (
    <div className="wardrobe-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        클릭 한 번으로 파츠를 스킨에 덧씌우세요! (MVP 데모용 파츠입니다)
      </p>
      <div className="tool-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button className="btn-primary" onClick={() => applyPart('sunglasses')} style={{ background: '#333', color: '#fff' }}>
          <Glasses size={18} /> 선글라스
        </button>
        <button className="btn-primary" onClick={() => applyPart('suit')} style={{ background: '#111', color: '#fff' }}>
          <Shirt size={18} /> 정장 자켓
        </button>
        <button className="btn-primary" onClick={() => applyPart('creeper')} style={{ background: '#3db93d', color: '#fff' }}>
          <Shield size={18} /> 크리퍼 얼굴
        </button>
        <button className="btn-primary" onClick={() => applyPart('golden_belt')} style={{ background: '#ffd700', color: '#111' }}>
          <Zap size={18} /> 타노스 건틀렛
        </button>
      </div>
    </div>
  );
}
