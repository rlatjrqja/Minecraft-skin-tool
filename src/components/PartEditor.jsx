import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Check, ZoomIn, ZoomOut, SquareDashed } from 'lucide-react'; // MousePointer2 대신 흔히 쓰이는 아이콘 사용

export function PartEditor({ part, skinCanvas, onComplete }) {
  const [toolMode, setToolMode] = useState('paint'); // 'paint' | 'erase' | 'lasso'
  const [zoom, setZoom] = useState(1.8);
  const [updateCounter, setUpdateCounter] = useState(0); // 강제 렌더링 트리거
  
  const displayCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lassoStartRef = useRef(null);
  const lassoCurrentRef = useRef(null);
  const isShiftDownRef = useRef(false);

  // 그리드 및 디스플레이 업데이트
  const renderDisplay = useCallback(() => {
    const dCanvas = displayCanvasRef.current;
    if (!dCanvas || !skinCanvas || !part?.canvas) return;
    const ctx = dCanvas.getContext('2d');
    
    // 화면상의 캔버스 스케일링 설정 (Crisp pixels)
    ctx.imageSmoothingEnabled = false;

    // 1. 전체 영역 초기화
    ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    
    // 2. 전체 스킨 원본을 그리기
    ctx.drawImage(skinCanvas, 0, 0, dCanvas.width, dCanvas.height);
    
    // 3. 어두운 오버레이 씌우기 (인식 범위 외의 영역을 Dim 처리)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, dCanvas.width, dCanvas.height);
    
    // 4. 파츠 마스크 올려서 밝게 표시하기
    ctx.drawImage(part.canvas, 0, 0, dCanvas.width, dCanvas.height);

    // 5. 올가미(Lasso) 드래그 박스 렌더링
    if (lassoStartRef.current && lassoCurrentRef.current) {
      const minX = Math.min(lassoStartRef.current.x, lassoCurrentRef.current.x);
      const maxX = Math.max(lassoStartRef.current.x, lassoCurrentRef.current.x) + 1;
      const minY = Math.min(lassoStartRef.current.y, lassoCurrentRef.current.y);
      const maxY = Math.max(lassoStartRef.current.y, lassoCurrentRef.current.y) + 1;

      const pW = dCanvas.width / 64;
      const pH = dCanvas.height / 64;

      ctx.strokeStyle = isShiftDownRef.current ? 'rgba(255, 100, 100, 0.8)' : 'rgba(102, 252, 241, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX * pW, minY * pH, (maxX - minX) * pW, (maxY - minY) * pH);
      ctx.fillStyle = isShiftDownRef.current ? 'rgba(255, 100, 100, 0.2)' : 'rgba(102, 252, 241, 0.2)';
      ctx.fillRect(minX * pW, minY * pH, (maxX - minX) * pW, (maxY - minY) * pH);
      ctx.setLineDash([]); // 복원
    }

  }, [skinCanvas, part, updateCounter]);

  useEffect(() => {
    renderDisplay();
  }, [renderDisplay]);

  const getPixelCoords = (e) => {
    const dCanvas = displayCanvasRef.current;
    if (!dCanvas) return null;
    const rect = dCanvas.getBoundingClientRect();
    const scaleX = dCanvas.width / rect.width;
    const scaleY = dCanvas.height / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    let pixelX = Math.floor(canvasX / (dCanvas.width / 64));
    let pixelY = Math.floor(canvasY / (dCanvas.height / 64));
    
    // 캔버스 범위를 벗어나지 않게 클램핑
    pixelX = Math.max(0, Math.min(63, pixelX));
    pixelY = Math.max(0, Math.min(63, pixelY));
    
    return { x: pixelX, y: pixelY };
  };

  const handlePointerDown = (e) => {
    isDrawing.current = true;
    e.target.setPointerCapture(e.pointerId);

    const pos = getPixelCoords(e);
    if (!pos) return;

    if (toolMode === 'lasso') {
      lassoStartRef.current = pos;
      lassoCurrentRef.current = pos;
      isShiftDownRef.current = e.shiftKey;
      renderDisplay();
    } else {
      applyBrush(pos.x, pos.y);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    const pos = getPixelCoords(e);
    if (!pos) return;

    if (toolMode === 'lasso') {
      lassoCurrentRef.current = pos;
      renderDisplay();
    } else {
      applyBrush(pos.x, pos.y);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    e.target.releasePointerCapture(e.pointerId);

    if (toolMode === 'lasso' && lassoStartRef.current && lassoCurrentRef.current) {
      applyLasso(lassoStartRef.current, lassoCurrentRef.current, isShiftDownRef.current);
      lassoStartRef.current = null;
      lassoCurrentRef.current = null;
    }
    
    setUpdateCounter(c => c + 1); // 렌더링 동기화
  };

  const applyBrush = (x, y) => {
    const partCtx = part.canvas.getContext('2d');
    const skinCtx = skinCanvas.getContext('2d');

    if (toolMode === 'paint') {
      const pixelData = skinCtx.getImageData(x, y, 1, 1);
      if (pixelData.data[3] > 0) {
        partCtx.putImageData(pixelData, x, y);
      }
    } else if (toolMode === 'erase') {
      partCtx.clearRect(x, y, 1, 1);
    }

    renderDisplay();
  };

  const applyLasso = (start, current, isErase) => {
    const partCtx = part.canvas.getContext('2d');
    const skinCtx = skinCanvas.getContext('2d');
    
    const minX = Math.min(start.x, current.x);
    const maxX = Math.max(start.x, current.x);
    const minY = Math.min(start.y, current.y);
    const maxY = Math.max(start.y, current.y);
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!isErase) {
          const pixelData = skinCtx.getImageData(x, y, 1, 1);
          if (pixelData.data[3] > 0) {
            partCtx.putImageData(pixelData, x, y);
          }
        } else {
          partCtx.clearRect(x, y, 1, 1);
        }
      }
    }
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            밝게 표시된 곳이 인식된 파츠 범위입니다.
          </span>
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

      {/* 사용 방법 안내 (상단 이동) */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#ccc', lineHeight: '1.6' }}>
          <li><strong style={{color: '#66fcf1'}}>추가(Paint):</strong> 어두운 곳을 칠해서 파츠 범위에 포함합니다.</li>
          <li><strong style={{color: '#ff6060'}}>제외(Erase):</strong> 밝은 곳을 지워서 파츠 범위에서 제외합니다.</li>
          <li><strong style={{color: '#fff'}}>올가미(Lasso):</strong> 드래그하여 일정 범위를 일괄 포함합니다. <strong style={{color: '#ff6060'}}>(Shift+드래그 시 일괄 제외)</strong></li>
        </ul>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
        
        {/* 툴바 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '8px' }}>
          <button
            onClick={() => setToolMode('paint')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: toolMode === 'paint' ? 'rgba(102, 252, 241, 0.2)' : 'transparent',
              color: toolMode === 'paint' ? '#66fcf1' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'paint' ? 'rgba(102, 252, 241, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Pencil size={18} /> 추가 (Paint)
          </button>
          <button
            onClick={() => setToolMode('erase')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: toolMode === 'erase' ? 'rgba(255, 100, 100, 0.2)' : 'transparent',
              color: toolMode === 'erase' ? '#ff6060' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'erase' ? 'rgba(255, 100, 100, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Eraser size={18} /> 제외 (Erase)
          </button>
          
          {/* 올가미 툴 추가 */}
          <button
            onClick={() => setToolMode('lasso')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px',
              backgroundColor: toolMode === 'lasso' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: toolMode === 'lasso' ? '#fff' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'lasso' ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="드래그: 추가 / Shift+드래그: 제외"
          >
            <SquareDashed size={18} /> 올가미 (Lasso)
          </button>

          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
          
          <button
            onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent', backgroundColor: 'transparent' }}
            title="확대"
          >
            <ZoomIn size={18} /> 확대
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent', backgroundColor: 'transparent' }}
            title="축소"
          >
            <ZoomOut size={18} /> 축소
          </button>
        </div>

        <div 
          style={{ width: '100%', flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault(); // 브라우저 기본 줌 방지
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
            cursor: toolMode === 'paint' ? 'crosshair' : toolMode === 'lasso' ? 'crosshair' : 'cell',
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={(e) => {
                 isDrawing.current = false;
                 lassoStartRef.current = null;
                 lassoCurrentRef.current = null;
                 renderDisplay();
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
      </div>
    </div>
  );
}
