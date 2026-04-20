import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Check, ZoomIn, ZoomOut, MousePointerSquare } from 'lucide-react';

export function PartEditor({ part, skinCanvas, onComplete }) {
  const [brushMode, setBrushMode] = useState('paint'); // 'paint' | 'erase' | 'lasso'
  const [zoom, setZoom] = useState(1.8);
  const [updateCounter, setUpdateCounter] = useState(0); 
  
  const displayCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  
  // Lasso state
  const lassoStart = useRef(null);
  const lassoCurrent = useRef(null);
  const checkShift = useRef(false);

  // 그리드 및 디스플레이 업데이트
  const renderDisplay = useCallback(() => {
    const dCanvas = displayCanvasRef.current;
    if (!dCanvas || !skinCanvas || !part?.canvas) return;
    const ctx = dCanvas.getContext('2d');
    
    // 화면상의 캔버스 스케일링 설정 (Crisp pixels)
    ctx.imageSmoothingEnabled = false;

    // 1. 전체 영역 초기화 (오류 방지)
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    
    // 2. 전체 스킨 원본을 그리기
    ctx.drawImage(skinCanvas, 0, 0, dCanvas.width, dCanvas.height);
    
    // 3. 어두운 오버레이 씌우기 (인식 범위 외의 영역을 Dim 처리)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, dCanvas.width, dCanvas.height);
    
    // 4. 파츠 마스크 올려서 밝게 표시하기
    ctx.drawImage(part.canvas, 0, 0, dCanvas.width, dCanvas.height);

    // 5. 올가미(Lasso) 드래그 중 영역 표시
    if (brushMode === 'lasso' && lassoStart.current && lassoCurrent.current) {
      const minX = Math.min(lassoStart.current.x, lassoCurrent.current.x);
      const maxX = Math.max(lassoStart.current.x, lassoCurrent.current.x);
      const minY = Math.min(lassoStart.current.y, lassoCurrent.current.y);
      const maxY = Math.max(lassoStart.current.y, lassoCurrent.current.y);
      
      const widthBlock = maxX - minX + 1;
      const heightBlock = maxY - minY + 1;
      
      const pxWidth = dCanvas.width / 64;
      const pxHeight = dCanvas.height / 64;
      
      const isErase = checkShift.current;
      
      ctx.fillStyle = isErase ? 'rgba(255, 100, 100, 0.3)' : 'rgba(102, 252, 241, 0.3)';
      ctx.fillRect(minX * pxWidth, minY * pxHeight, widthBlock * pxWidth, heightBlock * pxHeight);
      ctx.strokeStyle = isErase ? '#ff6060' : '#66fcf1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(minX * pxWidth, minY * pxHeight, widthBlock * pxWidth, heightBlock * pxHeight);
    }

  }, [skinCanvas, part, updateCounter, brushMode]);

  useEffect(() => {
    renderDisplay();
  }, [renderDisplay]);

  // 마우스 이벤트 핸들러
  const handlePointerEvent = (e) => {
    if (!isDrawing.current) return;
    
    const dCanvas = displayCanvasRef.current;
    if (!dCanvas || !skinCanvas || !part?.canvas) return;
    
    const rect = dCanvas.getBoundingClientRect();
    const scaleX = dCanvas.width / rect.width;
    const scaleY = dCanvas.height / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    let pixelX = Math.floor(canvasX / (dCanvas.width / 64));
    let pixelY = Math.floor(canvasY / (dCanvas.height / 64));
    
    // Clamp coordinates
    pixelX = Math.max(0, Math.min(63, pixelX));
    pixelY = Math.max(0, Math.min(63, pixelY));

    if (brushMode === 'lasso') {
      if (!lassoStart.current) {
        lassoStart.current = { x: pixelX, y: pixelY };
      }
      lassoCurrent.current = { x: pixelX, y: pixelY };
      checkShift.current = e.shiftKey;
      setUpdateCounter(c => c + 1); // 렌더링만 갱신
    } else {
      applySinglePixel(pixelX, pixelY, brushMode);
      setUpdateCounter(c => c + 1);
    }
  };

  const applySinglePixel = (x, y, mode) => {
    const partCtx = part.canvas.getContext('2d');
    const skinCtx = skinCanvas.getContext('2d');

    if (mode === 'paint') {
      const pixelData = skinCtx.getImageData(x, y, 1, 1);
      if (pixelData.data[3] > 0) {
        partCtx.putImageData(pixelData, x, y);
      }
    } else if (mode === 'erase') {
      partCtx.clearRect(x, y, 1, 1);
    }
  };

  const finishLasso = () => {
    if (brushMode === 'lasso' && lassoStart.current && lassoCurrent.current) {
      const minX = Math.min(lassoStart.current.x, lassoCurrent.current.x);
      const maxX = Math.max(lassoStart.current.x, lassoCurrent.current.x);
      const minY = Math.min(lassoStart.current.y, lassoCurrent.current.y);
      const maxY = Math.max(lassoStart.current.y, lassoCurrent.current.y);
      
      const mode = checkShift.current ? 'erase' : 'paint';
      
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          applySinglePixel(x, y, mode);
        }
      }
    }
    lassoStart.current = null;
    lassoCurrent.current = null;
    setUpdateCounter(c => c + 1);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#66fcf1' }}>
            <span style={{ color: 'var(--text-primary)' }}>{part?.label}</span> 영역 편집
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            • <b>브러쉬/지우개</b>: 클릭/드래그하여 영역 칠하기/지우기<br/>
            • <b>올가미</b>: 드래그하여 영역 더하기 / <b>Shift+드래그</b>하여 영역 빼기
          </div>
        </div>
        <button
          onClick={onComplete}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '6px', backgroundColor: '#66fcf1', color: '#0b0c10',
            fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a29e'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66fcf1'}
        >
          <Check size={16} /> 저장하고 나가기
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
        
        {/* 툴바 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '8px' }}>
          <button
            onClick={() => setBrushMode('paint')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: brushMode === 'paint' ? 'rgba(102, 252, 241, 0.2)' : 'transparent',
              color: brushMode === 'paint' ? '#66fcf1' : '#ccc', border: '1px solid',
              borderColor: brushMode === 'paint' ? 'rgba(102, 252, 241, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Pencil size={18} /> 추가하기 (Paint)
          </button>
          <button
            onClick={() => setBrushMode('erase')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: brushMode === 'erase' ? 'rgba(255, 100, 100, 0.2)' : 'transparent',
              color: brushMode === 'erase' ? '#ff6060' : '#ccc', border: '1px solid',
              borderColor: brushMode === 'erase' ? 'rgba(255, 100, 100, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Eraser size={18} /> 제외 (Erase)
          </button>
          <button
            onClick={() => setBrushMode('lasso')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: brushMode === 'lasso' ? 'rgba(200, 150, 255, 0.2)' : 'transparent',
              color: brushMode === 'lasso' ? '#d0a2ff' : '#ccc', border: '1px solid',
              borderColor: brushMode === 'lasso' ? 'rgba(200, 150, 255, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{width: 16, height: 16, border: '1px dashed currentColor'}}></div> 올가미 (Lasso)
          </button>
          
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
          
          <button
            onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
            className="btn-icon"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent' }}
            title="확대"
          >
            <ZoomIn size={18} /> 확대
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
            className="btn-icon"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent' }}
            title="축소"
          >
            <ZoomOut size={18} /> 축소
          </button>
        </div>

        <div 
          style={{ width: '100%', flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              // 브라우저 기본 줌 방지
            }
            const newZoom = zoom - e.deltaY * 0.005;
            setZoom(Math.max(0.5, Math.min(newZoom, 5)));
          }}
        >
          {/* 캔버스 영역 */}
          <div style={{
            position: 'relative',
            width: `${400 * zoom}px`,
            height: `${400 * zoom}px`,
            minWidth: `${400 * zoom}px`,
            minHeight: `${400 * zoom}px`,
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backgroundColor: '#111',
            cursor: brushMode === 'lasso' ? 'crosshair' : (brushMode === 'paint' ? 'cell' : 'pointer'),
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            {/* 바탕 체크무늬 패턴 (투명 확인용) */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'repeating-linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222), repeating-linear-gradient(45deg, #222 25%, #111 25%, #111 75%, #222 75%, #222)',
              backgroundPosition: '0 0, 10px 10px',
              backgroundSize: '20px 20px',
              borderRadius: '8px', zIndex: -1
            }} />

            {/* 에디터 캔버스 */}
            <canvas
              ref={displayCanvasRef}
              width={512}
              height={512}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                borderRadius: '8px',
              }}
            onPointerDown={(e) => {
              isDrawing.current = true;
              e.target.setPointerCapture(e.pointerId);
              handlePointerEvent(e);
            }}
            onPointerMove={(e) => {
              if (isDrawing.current) handlePointerEvent(e);
            }}
            onPointerUp={(e) => {
              isDrawing.current = false;
              e.target.releasePointerCapture(e.pointerId);
              if (brushMode === 'lasso') finishLasso();
            }}
            onPointerCancel={() => {
              isDrawing.current = false;
              if (brushMode === 'lasso') finishLasso();
            }}
          />
          
          {/* 그리드 오버레이 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: 'calc(100% / 64) calc(100% / 64)',
            pointerEvents: 'none',
            borderRadius: '8px'
          }} />
        </div>
      </div>

      <div style={{ paddingBottom: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5', flexShrink: 0 }}>
      </div>
    </div>
    </div>
  );
}
