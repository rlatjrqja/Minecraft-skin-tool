import React, { useState, useRef, useCallback } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { extractSkinParts, getExtractionPreview } from '../utils/skinPartExtractor';
import { saveExtractedParts } from '../utils/partsStorage';
import { FileDropzone } from './extractor/FileDropzone';
import { ExtractedPartsList } from './extractor/ExtractedPartsList';

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

export function SkinPartExtractorUI({ onPartsExtracted, onSwitchToWardrobe, openPartEditor, closePartEditor, portalTarget }) {
  const [status, setStatus] = useState('idle');
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

      const result = await extractSkinParts(file);
      const previewData = getExtractionPreview(result);

      setExtractionResult({ ...result, previewData });

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

  const handleEditorClose = useCallback(() => {
    setStatus('loading');
    setEditingPartId(null);
    
    setTimeout(() => {
      try {
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

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '4px', color: 'var(--primary)' }}>
        🧩 스킨 파츠 분해
      </h3>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
        스킨 파일을 업로드하면 부위별로 자동 분리<br />후 커스텀 선택지에 추가됩니다.
      </p>

      <FileDropzone 
        fileInputRef={fileInputRef}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
        handleFileSelect={handleFileSelect}
        status={status}
        errorMessage={errorMessage}
      />

      {status === 'success' && extractionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

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

          <ExtractedPartsList 
            isPortal={!!portalTarget}
            extractionResult={extractionResult}
            startEditingPart={startEditingPart}
            handleDownloadPart={handleDownloadPart}
            portalTarget={portalTarget}
          />
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
