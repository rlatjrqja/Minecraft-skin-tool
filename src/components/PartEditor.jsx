import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Check, ZoomIn, ZoomOut, SquareDashed } from 'lucide-react'; // MousePointer2 대신 흔히 쓰이는 아이콘 사용

export function PartEditor({ part, skinCanvas, onComplete }) {
  const [toolMode, setToolMode] = useState('paint'); // 'paint' | 'erase' | 'lasso'
  const [zoom, setZoom] = useState(1.8);
  const [updateCounter, setUpdateCounter] = useState(0); // 강제 렌더링 트리거
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

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
    if (e.button === 2 || e.button === 1) { // 우클릭 또는 휠클릭
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      e.target.setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return; // 좌클릭 외 무시
    
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
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

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
    if (isPanning.current) {
      isPanning.current = false;
      e.target.releasePointerCapture(e.pointerId);
      return;
    }

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

      {/* 사용 방법 안내 (임시 비활성화) */}
      {/* 
      <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#ccc', lineHeight: '1.6' }}>
          <li><strong style={{color: '#66fcf1'}}>추가(Paint):</strong> 어두운 곳을 칠해서 파츠 범위에 포함합니다.</li>
          <li><strong style={{color: '#ff6060'}}>제외(Erase):</strong> 밝은 곳을 지워서 파츠 범위에서 제외합니다.</li>
          <li><strong style={{color: '#fff'}}>올가미(Lasso):</strong> 드래그하여 일정 범위를 일괄 포함합니다. <strong style={{color: '#ff6060'}}>(Shift+드래그 시 일괄 제외)</strong></li>
        </ul>
      </div>
      */}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* 우측 상단 플로팅 툴바 (아이콘만) */}
        <div style={{ 
          position: 'absolute', top: '16px', right: '16px', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '8px', 
          backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <button
            onClick={() => setToolMode('paint')}
            style={{
              padding: '10px', borderRadius: '6px',
              backgroundColor: toolMode === 'paint' ? 'rgba(102, 252, 241, 0.2)' : 'transparent',
              color: toolMode === 'paint' ? '#66fcf1' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'paint' ? 'rgba(102, 252, 241, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="추가 (Paint)"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={() => setToolMode('erase')}
            style={{
              padding: '10px', borderRadius: '6px',
              backgroundColor: toolMode === 'erase' ? 'rgba(255, 100, 100, 0.2)' : 'transparent',
              color: toolMode === 'erase' ? '#ff6060' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'erase' ? 'rgba(255, 100, 100, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="제외 (Erase)"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setToolMode('lasso')}
            style={{
              padding: '10px', borderRadius: '6px',
              backgroundColor: toolMode === 'lasso' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: toolMode === 'lasso' ? '#fff' : '#ccc', border: '1px solid',
              borderColor: toolMode === 'lasso' ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="올가미 (Lasso) - 드래그: 추가 / Shift+드래그: 제외"
          >
            <SquareDashed size={20} />
          </button>

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '4px 0' }} />
          
          <button
            onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
            style={{ padding: '8px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="확대"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
            style={{ padding: '8px', borderRadius: '6px', color: '#ccc', cursor: 'pointer', border: '1px solid transparent', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="축소"
          >
            <ZoomOut size={20} />
          </button>
        </div>

        {/* 줌 및 팬 캔버스 영역 */}
        <div 
          style={{ width: '100%', height: '100%', cursor: isPanning.current ? 'grabbing' : 'auto' }}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault(); 
            }
            const newZoom = zoom - e.deltaY * 0.005;
            setZoom(Math.max(0.5, Math.min(newZoom, 5)));
          }}
        >
          {/* 캔버스 영역 박스 (Transform: Translate + Center) */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            width: `${400 * zoom}px`,
            height: `${400 * zoom}px`,
            minWidth: `${400 * zoom}px`,
            minHeight: `${400 * zoom}px`,
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backgroundColor: '#111',
            cursor: isPanning.current ? 'grabbing' : (toolMode === 'paint' ? 'crosshair' : toolMode === 'lasso' ? 'crosshair' : 'cell'),
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
                 isPanning.current = false;
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
