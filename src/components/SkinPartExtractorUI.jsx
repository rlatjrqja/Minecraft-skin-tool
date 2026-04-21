import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Loader2, CheckCircle, AlertCircle, Download, Plus, ArrowRight } from 'lucide-react';
import { extractSkinParts, getExtractionPreview } from '../utils/skinPartExtractor';
import { saveExtractedParts } from '../utils/partsStorage';
import { PartEditor } from './PartEditor';

/**
 * data URL을 Blob으로 변환합니다.
 */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * 스킨 업로드 → 파츠 분해 → 워드로브에 자동 추가하는 컴포넌트
 */
export function SkinPartExtractorUI({ onPartsExtracted, onSwitchToWardrobe, openPartEditor, closePartEditor, portalTarget }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [editingPartId, setEditingPartId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedSkinName, setSavedSkinName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setErrorMessage('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // 파츠 추출 실행
      const result = await extractSkinParts(file);
      const previewData = getExtractionPreview(result);

      // 전체 결과 저장
      setExtractionResult({ ...result, previewData });

      // 파일명에서 확장자를 제거하여 스킨 이름으로 사용
      const skinName = file.name.replace(/\.[^.]+$/, '') || `skin_${Date.now()}`;
      setSavedSkinName(skinName);

      const saved = saveExtractedParts(skinName, previewData);
      setStatus('success');

      if (onPartsExtracted) {
        onPartsExtracted(result, skinName);
      }

      if (!saved) {
        setErrorMessage('파츠 저장에 실패했습니다 (저장 공간 부족 가능).');
      }

    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || '스킨 분석 중 오류가 발생했습니다.');
      console.error('Skin extraction error:', err);
    }
  }, [onPartsExtracted]);

  // PartEditor 편집 완료 후 대시보드 복귀
  const handleEditorClose = useCallback(() => {
    setStatus('loading');
    setEditingPartId(null);
    
    // UI 렌더링 딜레이를 위해 약간 지연
    setTimeout(() => {
      try {
        // 이미 캔버스가 업데이트 되었으므로 previewData만 재생성
        const previewData = getExtractionPreview(extractionResult);
        setExtractionResult(prev => ({ ...prev, previewData }));

        const saved = saveExtractedParts(savedSkinName, previewData);
        setStatus('success');

        if (onPartsExtracted) {
          onPartsExtracted(extractionResult, savedSkinName);
        }

        if (!saved) {
          setErrorMessage('파츠 저장에 실패했습니다 (저장 공간 부족 가능).');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('결과 업데이트 중 오류가 발생했습니다.');
        console.error(err);
      }
    }, 50);
  }, [extractionResult, savedSkinName, onPartsExtracted]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
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

  // Blob URL 방식으로 다운로드 (파일명 정상 적용)
  const handleDownloadPart = useCallback((croppedDataUrl, partId) => {
    const blob = dataUrlToBlob(croppedDataUrl);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `skin_part_${partId}.png`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, []);

  const startEditingPart = (partId) => {
    setEditingPartId(partId);
    if (!openPartEditor || !extractionResult) return;
    
    const editingPart = extractionResult.parts.find(p => p.partId === partId);
    openPartEditor({
      part: editingPart,
      skinCanvas: extractionResult.skinCanvas,
      onComplete: () => {
        handleEditorClose();
        if (closePartEditor) closePartEditor();
      }
    });
  };

  const renderPartsList = (isPortal) => (
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

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '4px', color: 'var(--primary)' }}>
        🧩 스킨 파츠 분해
      </h3>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
        스킨 파일을 업로드하면 부위별로 자동 분리<br />후 커스텀 선택지에 추가됩니다.
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

      {/* 성공: 분석 결과 */}
      {status === 'success' && extractionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* 성공 배너 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(102, 252, 241, 0.12), rgba(69, 162, 158, 0.08))',
            border: '1px solid rgba(102, 252, 241, 0.2)',
          }}>
            <CheckCircle size={20} style={{ color: '#66fcf1', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e0e0e0' }}>
                "{savedSkinName}" 저장 완료!
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {extractionResult.previewData.length}개 파츠가 커스텀 선택지에 추가되었습니다.
              </div>
            </div>
            {preview && (
              <img src={preview} alt="스킨" style={{
                width: '32px', height: '32px',
                imageRendering: 'pixelated', borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
              }} />
            )}
          </div>

          {/* 커스텀 탭으로 이동 버튼 */}
          {onSwitchToWardrobe && (
            <button
              onClick={onSwitchToWardrobe}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '8px', border: '1px solid rgba(102, 252, 241, 0.3)',
                backgroundColor: 'rgba(102, 252, 241, 0.08)', color: '#66fcf1',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(102, 252, 241, 0.08)';
              }}
            >
              <ArrowRight size={16} />
              커스텀 탭에서 적용하기
            </button>
          )}

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

          {/* 추출된 파츠 목록 (14종) */}
          {portalTarget ? createPortal(
            renderPartsList(true),
            portalTarget
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ margin: '4px 0', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                추출된 파츠 ({extractionResult.previewData.length}개)
              </h4>
              {renderPartsList(false)}
            </div>
          )}
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
