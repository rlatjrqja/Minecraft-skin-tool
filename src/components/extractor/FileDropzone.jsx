import React from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

export function FileDropzone({ fileInputRef, handleDrop, handleDragOver, handleFileSelect, status, errorMessage }) {
  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed rgba(102, 252, 241, 0.3)',
          borderRadius: '12px',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(102, 252, 241, 0.03)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(102, 252, 241, 0.6)';
          e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(102, 252, 241, 0.3)';
          e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.03)';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {status === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>분석 중...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Upload size={28} style={{ color: 'var(--primary)', opacity: 0.7 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              PNG 스킨 파일을 드래그하거나 클릭
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              64×64 또는 64×32 형식 지원
            </span>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 12px', borderRadius: '8px',
          backgroundColor: 'rgba(255, 80, 80, 0.15)',
          border: '1px solid rgba(255, 80, 80, 0.3)',
        }}>
          <AlertCircle size={16} style={{ color: '#ff5050', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: '#ff8080' }}>{errorMessage}</span>
        </div>
      )}
    </>
  );
}
