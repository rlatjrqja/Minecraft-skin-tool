import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { Download, Brush as BrushIcon, Eraser as EraserIcon, Hand as HandIcon, RefreshCw as RotateIcon, PaintBucket as PaintIcon, Droplet as BlurIcon, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { ThreeViewer } from './components/ThreeViewer';
import { CanvasEditor } from './components/CanvasEditor';
import { Wardrobe } from './components/Wardrobe';
import { SkinPartExtractorUI } from './components/SkinPartExtractorUI';
import { drawDefaultSkin } from './utils/skinGenerator';
import './index.css';

function App() {
  const [texture, setTexture] = useState(null);
  const [activeTool, setActiveTool] = useState('brush'); // brush | eraser
  const [currentColor, setCurrentColor] = useState('#66fcf1');
  const [activeTab, setActiveTab] = useState('3d'); // 3d | editor | wardrobe
  const [rightPanelTab, setRightPanelTab] = useState('wardrobe'); // wardrobe | extractor
  const [modelType, setModelType] = useState('classic'); // classic (Steve) | slim (Alex)
  
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
    hair: 'base', eyes: 'base', head: 'base', top: 'base', sleeves: 'base', bottom: 'base', shoes: 'base', accessory: 'base'
  });

  const handleWardrobeChange = useCallback((selections) => {
    setWardrobeSelections(selections);
    const canvas = editorRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 의상 덧씌우기 전, 현재 체형의 기본 스킨으로 초기화
    drawDefaultSkin(ctx, modelType);
    
    // 선택된 파츠 렌더링
    if (selections.head === 'creeper') {
      ctx.fillStyle = '#2d9c2d'; ctx.fillRect(8, 8, 8, 8);
      ctx.fillStyle = '#000000'; ctx.fillRect(9, 10, 2, 2); ctx.fillRect(13, 10, 2, 2);
      ctx.fillRect(11, 12, 2, 3); ctx.fillRect(10, 13, 1, 3); ctx.fillRect(13, 13, 1, 3);
    }
    
    if (selections.eyes === 'sunglasses') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(8, 12, 3, 2); ctx.fillRect(13, 12, 3, 2); ctx.fillRect(11, 12, 2, 1);
      ctx.fillRect(6, 12, 2, 1); ctx.fillRect(16, 12, 2, 1);
    }
    
    if (selections.top === 'suit') {
      ctx.fillStyle = '#222222'; ctx.fillRect(20, 20, 8, 12);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(23, 20, 2, 6);
      ctx.fillStyle = '#dd0000'; ctx.fillRect(23, 22, 2, 4);
    }
    
    if (selections.sleeves === 'gauntlet') {
      ctx.fillStyle = '#ffd700'; ctx.fillRect(44, 28, 4, 4); // Right Arm
      ctx.fillStyle = '#b8860b'; ctx.fillRect(45, 29, 2, 2); 
    }
    
    if (selections.bottom === 'black_pants') {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 16, 16, 16);  // Right leg UV area
      ctx.fillRect(16, 48, 16, 16); // Left leg UV area
    }
    
    editorRef.current.updateTexture(); 
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
            {/* 오른쪽 패널 탭 전환 */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <button
                className={`tab ${rightPanelTab === 'wardrobe' ? 'active' : ''}`}
                onClick={() => setRightPanelTab('wardrobe')}
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                🎨 커스텀
              </button>
              <button
                className={`tab ${rightPanelTab === 'extractor' ? 'active' : ''}`}
                onClick={() => setRightPanelTab('extractor')}
                style={{ flex: 1, fontSize: '0.8rem' }}
              >
                🧩 파츠 분해
              </button>
            </div>

            {rightPanelTab === 'wardrobe' && (
              <Wardrobe onChange={handleWardrobeChange} />
            )}
            {rightPanelTab === 'extractor' && (
              <SkinPartExtractorUI
                onPartsExtracted={(result) => {
                  console.log('Parts extracted:', result);
                }}
              />
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
