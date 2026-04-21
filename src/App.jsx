import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Download, Brush as BrushIcon, Eraser as EraserIcon, Hand as HandIcon, RefreshCw as RotateIcon, PaintBucket as PaintIcon, Droplet as BlurIcon, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { ThreeViewer } from './components/ThreeViewer';
import { CanvasEditor } from './components/CanvasEditor';
import { Wardrobe } from './components/Wardrobe';
import { SkinPartExtractorUI } from './components/SkinPartExtractorUI';
import { PartEditor } from './components/PartEditor';
import { drawBaseNakedSkin, drawDefaultPart } from './utils/skinGenerator';
import { SKIN_UVS } from './utils/skinUVs';
import './index.css';

// 클리핑 마스크(getClipBoxesForCategory) 로직은 모든 파츠를 64x64 규격으로 통일할 것이므로 제거되었습니다.

function App() {
  const [texture, setTexture] = useState(null);
  const [activeTool, setActiveTool] = useState('brush'); // brush | eraser
  const [currentColor, setCurrentColor] = useState('#66fcf1');
  const [activeTab, setActiveTab] = useState('3d'); // 3d | editor | extractor | part-editor
  const [modelType, setModelType] = useState('classic'); // classic (Steve) | slim (Alex)
  const [wardrobeRefreshKey, setWardrobeRefreshKey] = useState(0); // 워드로브 강제 갱신용
  const [partEditorProps, setPartEditorProps] = useState(null);
  const [extractorPortalTarget, setExtractorPortalTarget] = useState(null);
  
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [panSpeed, setPanSpeed] = useState(1);
  
  const editorRef = useRef(null);

  const handleTextureUpdate = (canvasEl) => {
    if (!canvasEl) return;
    const newTex = new THREE.CanvasTexture(canvasEl);
    newTex.magFilter = THREE.NearestFilter;
    newTex.minFilter = THREE.NearestFilter;
    
    // We update state safely holding the old texture to avoid garbage collection flickers
    setTexture(prev => {
      // Disposing the old texture properly
      if (prev) prev.dispose();
      return newTex;
    });
  };

  const [wardrobeSelections, setWardrobeSelections] = useState({
    hair: 'base', eyes: 'base', head: 'base', shirts: 'base', sleeves: 'base', pants: 'base', shoes: 'base', accessory: 'base'
  });

  const handleWardrobeChange = useCallback((selections) => {
    // 삭제 이벤트 처리
    if (selections._deleted) {
      setWardrobeRefreshKey(k => k + 1);
      return;
    }

    setWardrobeSelections(selections);
    const canvas = editorRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 1. 선택된 피부색이 있을 경우 해당 색상으로 맨몸(Base Naked Skin) 렌더링
    const { skinTone, ...partSelections } = selections;
    drawBaseNakedSkin(ctx, modelType, skinTone);

    // 2. 각 파츠 카테고리별로 '기본(Base)' 상태인 경우에만 스티브/알렉스 기본 의상이나 얼굴 요소 렌더링
    // _dataUrl 이나 _color 같은 파생 키를 제외한 순수 카테고리만 대상입니다 (ex: 'hair', 'top')
    Object.keys(partSelections).forEach(catId => {
      if (!catId.includes('_') && partSelections[catId] === 'base') {
        drawDefaultPart(ctx, modelType, catId);
      }
    });

    // 3. 등록된 커스텀 파츠 (비-Base) 렌더링
    const customPartKeys = Object.keys(partSelections).filter(k => k.endsWith('_dataUrl'));
    if (customPartKeys.length > 0) {
      let loadedCount = 0;
      
      customPartKeys.forEach(key => {
        const dataUrl = selections[key];
        const catId = key.replace('_dataUrl', '');
        const filterColor = selections[`${catId}_color`];

        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          if (filterColor && filterColor !== '#ffffff') {
            // 오프스크린 캔버스에 그리기 (투명도 유지 및 Multiply 합성)
            const scratch = document.createElement('canvas');
            scratch.width = img.width;
            scratch.height = img.height;
            const sCtx = scratch.getContext('2d');
            
            // 1. 원본 파츠 그리기
            sCtx.drawImage(img, 0, 0);
            
            // 2. 색상 곱하기 (Multiply)
            sCtx.globalCompositeOperation = 'multiply';
            sCtx.fillStyle = filterColor;
            sCtx.fillRect(0, 0, scratch.width, scratch.height);
            
            // 3. 원래 이미지의 불투명한 부분만 남기기 (투명도 복구)
            sCtx.globalCompositeOperation = 'destination-in';
            sCtx.drawImage(img, 0, 0);
            
            // 4. 메인 캔버스에 컬러 필터가 적용된 파츠 렌더링
            ctx.drawImage(scratch, 0, 0);
          } else {
            // 컬러 필터가 없으면 원본 그대로 렌더링
            ctx.drawImage(img, 0, 0);
          }
          
          loadedCount++;
          if (loadedCount >= customPartKeys.length) {
            editorRef.current?.updateTexture();
          }
        };
        img.src = dataUrl;
      });
    } else {
      editorRef.current.updateTexture();
    }
  }, [modelType]);

  useEffect(() => {
    // 체형이 변경될 때마다 적용된 의상을 기반으로 캔버스를 다시 그립니다.
    if (editorRef.current) {
      handleWardrobeChange(wardrobeSelections);
    }
  }, [modelType]);

  const handleDownload = () => {
    const canvas = editorRef.current?.getCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'mc_custom_skin.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="app-header glass-panel">
        <div className="logo">
          <div className="logo-icon">MC</div>
          <h1>MineCraft Skin Pro</h1>
        </div>
        <div className="actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => setIsOptionsOpen(true)} title="뷰포트 옵션 설정">
            <Settings size={18} /> 옵션
          </button>
          <button className="btn-primary" onClick={handleDownload} title="완성된 스킨을 64x64 PNG로 다운로드합니다.">
             <Download size={18} /> 스킨 다운로드
          </button>
        </div>
      </header>
      
      <main className="app-content">
        <aside className="left-panel glass-panel">
          <div className="panel-section">
            <h3 className="panel-title">도구 (Tools)</h3>
            <div className="tool-grid">
              <button 
                className={`btn-icon ${activeTool === 'brush' ? 'active' : ''}`}
                onClick={() => setActiveTool('brush')}
                title="브러시 (색칠)"
              >
                <BrushIcon size={24} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setActiveTool('eraser')}
                title="지우개 (투명하게 지움)"
              >
                <EraserIcon size={24} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'paint' ? 'active' : ''}`}
                onClick={() => setActiveTool('paint')}
                title="페인트 (같은 부위/면 채우기)"
              >
                <PaintIcon size={24} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'blur' ? 'active' : ''}`}
                onClick={() => setActiveTool('blur')}
                title="블러 (주변 픽셀 중간값)"
              >
                <BlurIcon size={24} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'hand' ? 'active' : ''}`}
                onClick={() => setActiveTool('hand')}
                title="핸드 (3D 뷰포트 이동)"
              >
                <HandIcon size={24} />
              </button>
              <button 
                className={`btn-icon ${activeTool === 'rotate' ? 'active' : ''}`}
                onClick={() => setActiveTool('rotate')}
                title="회전 (3D 뷰포트 회전)"
              >
                <RotateIcon size={24} />
              </button>
            </div>
          </div>
          
          <div className="panel-section">
            <h3 className="panel-title">색상 (Colors)</h3>
            <div className="color-picker-container">
              <input 
                type="color" 
                value={currentColor} 
                onChange={(e) => setCurrentColor(e.target.value)}
                style={{ width: '100%', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
              />
            </div>
            <div className="tool-grid" style={{ marginTop: '12px', gap: '12px' }}>
              {/* Preset colors */}
              {['#f0c0a0', '#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#ffff00', '#ff00ff'].map(c => (
                <button 
                  key={c}
                  style={{ width: '100%', aspectRatio: '1/1', backgroundColor: c, border: `2px solid ${currentColor === c ? '#66fcf1' : 'transparent'}`, borderRadius: '6px', cursor: 'pointer', outline: 'none' }}
                  onClick={() => setCurrentColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        </aside>
        
        <section className="center-panel">
          <div className="viewer-container glass-panel" style={{ background: 'transparent', display: 'flex', flexDirection: 'column' }}>
            <div className="tabs" style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                className={`tab ${activeTab === '3d' ? 'active' : ''}`}
                onClick={() => setActiveTab('3d')}
              >
                3D 뷰포트
              </button>
              <button 
                className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                2D 에디터
              </button>
              <button 
                className={`tab ${activeTab === 'extractor' ? 'active' : ''}`}
                onClick={() => setActiveTab('extractor')}
              >
                🧩 파츠 분해
              </button>
              {partEditorProps && (
                <button 
                  className={`tab ${activeTab === 'part-editor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('part-editor')}
                  style={{ color: '#66fcf1', borderBottomColor: activeTab === 'part-editor' ? '#66fcf1' : 'transparent' }}
                >
                  🧩 파츠 수정
                </button>
              )}
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {/* 3D 뷰포트 */}
              <div style={{ display: activeTab === '3d' ? 'block' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                <ThreeViewer texture={texture} modelType={modelType} activeTool={activeTool} rotateSpeed={rotateSpeed} panSpeed={panSpeed} />
                <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                  💡 도구를 활용해 카메라/스킨을 조작하세요.
                </div>
              </div>
              
              {/* 2D 에디터 (언마운트 방지를 위해 display로만 제어) */}
              <div style={{ display: activeTab === 'editor' ? 'flex' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                 <div style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
                     아래 캔버스에 마우스를 드래그하여 픽셀을 추가하세요. (마우스 휠 스크롤로 화면 확대/축소 가능)
                   </p>
                 </div>
                 <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', overflow: 'hidden' }}>
                    <CanvasEditor 
                      ref={editorRef}
                      onTextureUpdate={handleTextureUpdate}
                      currentColor={currentColor}
                      activeTool={activeTool}
                      modelType={modelType}
                    />
                 </div>
              </div>

              {/* 파츠 분해 UI */}
              <div style={{ display: activeTab === 'extractor' ? 'flex' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)', overflowY: 'auto', borderRadius: '8px' }}>
                <SkinPartExtractorUI
                  portalTarget={extractorPortalTarget}
                  onPartsExtracted={(result, skinName) => {
                    // 워드로브 갱신 트리거
                    setWardrobeRefreshKey(k => k + 1);
                  }}
                  onSwitchToWardrobe={() => {
                     setActiveTab('3d');
                  }}
                  openPartEditor={(props) => {
                    setPartEditorProps(props);
                    setActiveTab('part-editor');
                  }}
                  closePartEditor={() => {
                    setPartEditorProps(null);
                    setActiveTab('extractor');
                  }}
                />
              </div>

              {/* 파츠 수정 에디터 */}
              {partEditorProps && (
                <div style={{ display: activeTab === 'part-editor' ? 'flex' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <PartEditor {...partEditorProps} />
                </div>
              )}

            </div>

            {/* 체형 선택 하단 버튼 */}
            <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
              <button 
                className={`tab ${modelType === 'classic' ? 'active' : ''}`}
                onClick={() => setModelType('classic')}
                style={{ minWidth: '120px' }}
              >
                스티브 체형 (Classic)
              </button>
              <button 
                className={`tab ${modelType === 'slim' ? 'active' : ''}`}
                onClick={() => setModelType('slim')}
                style={{ minWidth: '120px' }}
              >
                알렉스 체형 (Slim)
              </button>
            </div>
          </div>
        </section>

        <aside className="right-panel glass-panel">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            {(activeTab === '3d' || activeTab === 'editor') ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, fontWeight: 'bold', color: '#66fcf1', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                   🎨 커스텀
                </div>
                <Wardrobe onChange={handleWardrobeChange} refreshKey={wardrobeRefreshKey} />
              </>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, fontWeight: 'bold', color: '#66fcf1', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                   🧩 추출된 파츠
                </div>
                <div ref={setExtractorPortalTarget} style={{ flex: 1, padding: '12px' }}></div>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* 뷰포트 옵션 설정 모달 */}
      {isOptionsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '320px', padding: '24px', backgroundColor: '#1a1a2e', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} /> 뷰포트 옵션
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <span>회전 속도 감도</span>
                <span>{rotateSpeed.toFixed(1)}x</span>
              </label>
              <input 
                type="range" min="0.1" max="3" step="0.1" 
                value={rotateSpeed} onChange={e => setRotateSpeed(parseFloat(e.target.value))} 
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                <span>이동(Pan) 속도 감도</span>
                <span>{panSpeed.toFixed(1)}x</span>
              </label>
              <input 
                type="range" min="0.1" max="3" step="0.1" 
                value={panSpeed} onChange={e => setPanSpeed(parseFloat(e.target.value))} 
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setIsOptionsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
