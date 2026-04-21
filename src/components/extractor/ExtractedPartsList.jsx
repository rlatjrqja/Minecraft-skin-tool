import React from 'react';
import { Download } from 'lucide-react';
import { createPortal } from 'react-dom';

export function ExtractedPartsList({ isPortal, extractionResult, startEditingPart, handleDownloadPart, portalTarget }) {
  const listContent = (
    <div style={{ display: 'grid', gridTemplateColumns: isPortal ? '1fr' : '1fr 1fr', gap: isPortal ? '8px' : '6px' }}>
      {extractionResult.previewData.map((part) => (
        <div
          key={part.partId}
          style={{
            display: 'flex', alignItems: 'center', gap: isPortal ? '10px' : '6px',
            padding: isPortal ? '10px' : '6px', borderRadius: '6px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <img
            src={part.croppedDataUrl}
            alt={part.label}
            style={{
              width: isPortal ? '32px' : '24px', height: isPortal ? '32px' : '24px',
              imageRendering: 'pixelated',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              objectFit: 'contain',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isPortal ? '0.85rem' : '0.75rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {part.label}
            </div>
            <div style={{ fontSize: isPortal ? '0.7rem' : '0.6rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
              신뢰도: {part.confidence}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); startEditingPart(part.partId); }}
            style={{ 
              padding: isPortal ? '6px 12px' : '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(102, 252, 241, 0.1)', 
              color: '#66fcf1', fontSize: isPortal ? '0.75rem' : '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', 
              cursor: 'pointer', border: '1px solid rgba(102, 252, 241, 0.3)', transition: 'all 0.2s' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.1)'}
          >
            ✏️ 편집
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownloadPart(part.dataUrl, part.partId); }}
            className="btn-icon"
            style={{ padding: '4px', opacity: 0.6 }}
            title={`${part.label} (64x64 원본) 다운로드`}
          >
            <Download size={isPortal ? 16 : 12} />
          </button>
        </div>
      ))}
    </div>
  );

  if (isPortal && portalTarget) {
    return createPortal(listContent, portalTarget);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <h4 style={{ margin: '4px 0', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
        추출된 파츠 ({extractionResult.previewData.length}개)
      </h4>
      {listContent}
    </div>
  );
}
