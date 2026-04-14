import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { Download, Brush as BrushIcon, Eraser as EraserIcon } from 'lucide-react';
import { ThreeViewer } from './components/ThreeViewer';
import { CanvasEditor } from './components/CanvasEditor';
import { Wardrobe } from './components/Wardrobe';
import './index.css';

function App() {
  const [texture, setTexture] = useState(null);
  const [activeTool, setActiveTool] = useState('brush'); // brush | eraser
  const [currentColor, setCurrentColor] = useState('#66fcf1');
  const [activeTab, setActiveTab] = useState('editor'); // editor | wardrobe
  const [modelType, setModelType] = useState('classic'); // classic (Steve) | slim (Alex)
  
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

  const applyPart = (partName) => {
    const canvas = editorRef.current?.getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 옷장 파트 오버레이 (MVP 하드코딩된 픽셀 맵핑)
    if (partName === 'sunglasses') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(8, 12, 3, 2); // left eye glass
      ctx.fillRect(13, 12, 3, 2); // right eye glass
      ctx.fillRect(11, 12, 2, 1); // bridge
      // Sides
      ctx.fillRect(6, 12, 2, 1); // left temple
      ctx.fillRect(16, 12, 2, 1); // right temple
    } else if (partName === 'suit') {
      ctx.fillStyle = '#222222';
      // Body front (20, 20, 8, 12)
      ctx.fillRect(20, 20, 8, 12);
      ctx.fillStyle = '#ffffff';
      // Shirt showing in middle
      ctx.fillRect(23, 20, 2, 6);
      ctx.fillStyle = '#dd0000'; // red tie
      ctx.fillRect(23, 22, 2, 4);
    } else if (partName === 'creeper') {
      ctx.fillStyle = '#2d9c2d'; // Creeper Green
      ctx.fillRect(8, 8, 8, 8); // Head front
      ctx.fillStyle = '#000000'; // Eyes and mouth
      ctx.fillRect(9, 10, 2, 2);
      ctx.fillRect(13, 10, 2, 2);
      ctx.fillRect(11, 12, 2, 3);
      ctx.fillRect(10, 13, 1, 3);
      ctx.fillRect(13, 13, 1, 3);
    } else if (partName === 'golden_belt') {
      ctx.fillStyle = '#ffd700'; // Gold
      ctx.fillRect(20, 30, 8, 2); // Belt on front body
      ctx.fillStyle = '#b8860b'; // Buckle
      ctx.fillRect(23, 30, 2, 2); 
      // Thanos gauntlet on right arm (44, 20, 4, 12)
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(44, 28, 4, 4); // Hand
    }

    editorRef.current.updateTexture(); // 변경 후 Three.js 업데이트 강제
  };

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
          <button className="btn-secondary" onClick={() => {
            if (window.confirm("스티브 기본 스킨을 불러오시겠습니까? 현재 편집 내용이 초기화됩니다.")) {
              setModelType('classic');
              editorRef.current?.loadSkin('/steve.png');
            }
          }} title="스티브(클래식) 기본 스킨을 불러옵니다.">
            스티브 불러오기
          </button>
          <button className="btn-secondary" onClick={() => {
             if (window.confirm("알렉스 기본 스킨을 불러오시겠습니까? 현재 편집 내용이 초기화됩니다.")) {
              setModelType('slim');
              editorRef.current?.loadSkin('/alex.png');
            }
          }} title="알렉스(슬림) 기본 스킨을 불러옵니다.">
            알렉스 불러오기
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
            <div style={{ flex: 1, position: 'relative' }}>
              <ThreeViewer texture={texture} modelType={modelType} />
              <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                💡 마우스로 스킨을 드래그하여 회전할 수 있습니다.
              </div>
            </div>
            {/* 체형 선택 하단 버튼 */}
            <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              2D 에디터 모드
            </button>
            <button 
              className={`tab ${activeTab === 'wardrobe' ? 'active' : ''}`}
              onClick={() => setActiveTab('wardrobe')}
            >
              옷장 (의상실)
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: '16px' }}>
            {activeTab === 'editor' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', width: '100%', textAlign: 'center', lineHeight: '1.4' }}>
                  아래 캔버스에 마우스를 드래그하여 픽셀을 추가하세요.<br/>
                  (마인크래프트 기본 해상도: 64x64)
                </p>
                <div style={{ width: '100%', maxWidth: '300px' }}>
                   <CanvasEditor 
                     ref={editorRef}
                     onTextureUpdate={handleTextureUpdate}
                     currentColor={currentColor}
                     activeTool={activeTool}
                   />
                </div>
              </div>
            ) : (
              <Wardrobe applyPart={applyPart} />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
