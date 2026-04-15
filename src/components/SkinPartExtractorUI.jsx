import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Download } from 'lucide-react';
import { extractSkinParts, getExtractionPreview } from '../utils/skinPartExtractor';

/**
 * 스킨 업로드 및 파츠 분해 결과를 보여주는 컴포넌트
 */
export function SkinPartExtractorUI({ onPartsExtracted }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [preview, setPreview] = useState(null); // 업로드된 스킨 미리보기
  const [extractionResult, setExtractionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // 원본 스킨 미리보기
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // 파츠 추출 실행
      const result = await extractSkinParts(file);
      const previewData = getExtractionPreview(result);

      setExtractionResult({ ...result, previewData });
      setStatus('success');

      // 부모 컴포넌트에 알림
      if (onPartsExtracted) {
        onPartsExtracted(result);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || '스킨 분석 중 오류가 발생했습니다.');
      console.error('Skin extraction error:', err);
    }
  }, [onPartsExtracted]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      // 인풋에 파일 세팅하고 핸들러 트리거
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        handleFileSelect({ target: { files: dt.files } });
      }
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDownloadPart = useCallback((croppedDataUrl, partId) => {
    const link = document.createElement('a');
    link.download = `skin_part_${partId}.png`;
    link.href = croppedDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '4px', color: 'var(--primary)' }}>
        🧩 스킨 파츠 분해
      </h3>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
        마인크래프트 스킨 파일을 업로드하면<br />부위별로 자동 분리합니다.
      </p>

      {/* 드래그 앤 드롭 영역 */}
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
          position: 'relative',
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
              PNG 스킨 파일을 드래그하거나 클릭하여 업로드
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              64×64 또는 64×32 형식 지원
            </span>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
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

      {/* 성공: 원본 미리보기 + 분석 결과 */}
      {status === 'success' && extractionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 원본 스킨 미리보기 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 12px', borderRadius: '8px',
            backgroundColor: 'rgba(102, 252, 241, 0.08)',
            border: '1px solid rgba(102, 252, 241, 0.15)',
          }}>
            <CheckCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              분석 완료 — {extractionResult.previewData.length}개 파츠 감지
            </span>
            {preview && (
              <img
                src={preview}
                alt="원본 스킨"
                style={{
                  width: '32px', height: '32px', marginLeft: 'auto',
                  imageRendering: 'pixelated', borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            )}
          </div>

          {/* 스킨 분석 통계 */}
          <div style={{
            padding: '8px 12px', borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            fontSize: '0.75rem', color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>총 색상 수</span>
              <span style={{ color: 'var(--primary)' }}>{extractionResult.skinAnalysis.colorCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>대표 색상</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '2px',
                  backgroundColor: extractionResult.skinAnalysis.dominantColor,
                  border: '1px solid rgba(255,255,255,0.2)',
                }} />
                <span style={{ fontFamily: 'monospace' }}>{extractionResult.skinAnalysis.dominantColor}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>스킨 포맷</span>
              <span>{extractionResult.skinAnalysis.isLegacy ? '레거시 (64×32)' : '표준 (64×64)'}</span>
            </div>
          </div>

          {/* 추출된 파츠 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              추출된 파츠
            </h4>
            
            {extractionResult.previewData.map((part) => (
              <div
                key={part.partId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)'}
              >
                {/* 파츠 미리보기 이미지 */}
                <img
                  src={part.croppedDataUrl}
                  alt={part.label}
                  style={{
                    width: '36px', height: '36px',
                    imageRendering: 'pixelated',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    objectFit: 'contain',
                  }}
                />

                {/* 파츠 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {part.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                    신뢰도: {part.confidence}
                  </div>
                </div>

                {/* 다운로드 버튼 */}
                <button
                  onClick={() => handleDownloadPart(part.croppedDataUrl, part.partId)}
                  className="btn-icon"
                  style={{ padding: '4px', opacity: 0.6 }}
                  title={`${part.label} 다운로드`}
                >
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
