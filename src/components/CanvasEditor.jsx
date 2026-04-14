import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { drawDefaultSkin, drawGridOverlay } from '../utils/skinGenerator';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { SKIN_UVS } from '../utils/skinUVs';

function hexToRgba(hex) {
  let r = parseInt(hex.slice(1, 3), 16) || 0;
  let g = parseInt(hex.slice(3, 5), 16) || 0;
  let b = parseInt(hex.slice(5, 7), 16) || 0;
  return { r, g, b, a: 255 };
}

const getAllFaces = (type) => {
  return [
    ...SKIN_UVS.head,
    ...SKIN_UVS.body,
    ...SKIN_UVS.rightLeg,
    ...SKIN_UVS.leftLeg,
    ...(type === 'classic' ? SKIN_UVS.rightArm : SKIN_UVS.rightArmSlim),
    ...(type === 'classic' ? SKIN_UVS.leftArm : SKIN_UVS.leftArmSlim)
  ];
};

export const CanvasEditor = forwardRef(({ onTextureUpdate, currentColor, activeTool, modelType }, ref) => {
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = document.getElementById('canvas-editor-scroll');
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault(); // Prevent native page scroll to use wheel for zooming
      if (e.deltaY < 0) {
        setZoom(z => Math.min(z + 0.5, 10));
      } else {
        setZoom(z => Math.max(z - 0.5, 1));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    updateTexture: () => updateTexture(),
    loadDefaultSkin: (type) => loadBuiltinSkin(type)
  }));

  const loadBuiltinSkin = (type) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawDefaultSkin(ctx, type);
    updateTexture();
  };

  useEffect(() => {
    // Redraw the grid whenever modelType changes or mounts
    if (gridCanvasRef.current) {
      gridCanvasRef.current.width = 512;
      gridCanvasRef.current.height = 512;
      const ctx = gridCanvasRef.current.getContext('2d');
      drawGridOverlay(ctx, modelType || 'classic');
    }
  }, [modelType]);

  useEffect(() => {
    // Load Steve as the initial default skin
    loadBuiltinSkin('classic');
  }, []);

  const updateTexture = () => {
     if (onTextureUpdate && canvasRef.current) {
        onTextureUpdate(canvasRef.current);
     }
  };

  const drawPixel = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Mapping Mouse X/Y to 64x64 grid
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    const ctx = canvas.getContext('2d');
    
    if (activeTool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else if (activeTool === 'brush') {
      ctx.fillStyle = currentColor;
      ctx.fillRect(x, y, 1, 1);
    } else if (activeTool === 'blur') {
      const imgData = ctx.getImageData(0, 0, 64, 64);
      const data = imgData.data;
      let valsR = [], valsG = [], valsB = [], valsA = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < 64 && ny >= 0 && ny < 64) {
             const idx = (ny * 64 + nx) * 4;
             valsR.push(data[idx]);
             valsG.push(data[idx+1]);
             valsB.push(data[idx+2]);
             valsA.push(data[idx+3]);
          }
        }
      }
      valsR.sort((a,b)=>a-b);
      valsG.sort((a,b)=>a-b);
      valsB.sort((a,b)=>a-b);
      valsA.sort((a,b)=>a-b);
      const mid = Math.floor(valsR.length / 2);
      
      // Clear before fill for proper alpha handling if median alpha is 0
      ctx.clearRect(x, y, 1, 1);
      if (valsA[mid] > 0) {
        ctx.fillStyle = `rgba(${valsR[mid]}, ${valsG[mid]}, ${valsB[mid]}, ${valsA[mid]/255})`;
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (activeTool === 'paint') {
      // Only execute paint once per click, not on drag
      if (e.type === 'pointerdown') {
        const faces = getAllFaces(modelType || 'classic');
        const face = faces.find(([fx, fy, fw, fh]) => 
           x >= fx && x < fx + fw && y >= fy && y < fy + fh
        );
        
        if (face) {
          const [boundX, boundY, boundW, boundH] = face;
          const imgData = ctx.getImageData(boundX, boundY, boundW, boundH);
          const data = imgData.data;
          
          const relX = x - boundX;
          const relY = y - boundY;
          const startIdx = (relY * boundW + relX) * 4;
          const targetR = data[startIdx];
          const targetG = data[startIdx+1];
          const targetB = data[startIdx+2];
          const targetA = data[startIdx+3];
          
          const fillRGB = hexToRgba(currentColor);
          if (!(targetR === fillRGB.r && targetG === fillRGB.g && targetB === fillRGB.b && targetA === fillRGB.a)) {
            const stack = [[relX, relY]];
            const visited = new Set();
            
            while(stack.length > 0) {
               const [cx, cy] = stack.pop();
               const key = `${cx},${cy}`;
               if (visited.has(key)) continue;
               visited.add(key);
               
               const idx = (cy * boundW + cx) * 4;
               if (data[idx] === targetR && data[idx+1] === targetG && data[idx+2] === targetB && data[idx+3] === targetA) {
                   data[idx] = fillRGB.r;
                   data[idx+1] = fillRGB.g;
                   data[idx+2] = fillRGB.b;
                   data[idx+3] = fillRGB.a;
                   
                   if (cx > 0) stack.push([cx - 1, cy]);
                   if (cx < boundW - 1) stack.push([cx + 1, cy]);
                   if (cy > 0) stack.push([cx, cy - 1]);
                   if (cy < boundH - 1) stack.push([cx, cy + 1]);
               }
            }
            ctx.putImageData(imgData, boundX, boundY);
          }
        }
      }
    }
    updateTexture();
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    drawPixel(e);
  };
  
  const handlePointerMove = (e) => {
    if (isDrawing) drawPixel(e);
  };
  
  const handlePointerUp = () => setIsDrawing(false);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Scroll Area */}
      <div 
        id="canvas-editor-scroll"
        style={{ flex: 1, overflow: 'auto', display: 'flex' }}
      >
        <div style={{ margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="canvas-container" style={{ position: 'relative', width: `${400 * zoom}px`, height: `${400 * zoom}px`, minWidth: `${400 * zoom}px`, minHeight: `${400 * zoom}px`, aspectRatio: '1/1' }}>
            <canvas
              ref={canvasRef}
              width={64}
              height={64}
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
                touchAction: 'none',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <canvas
              ref={gridCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ width: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        <button className="btn-icon" onClick={() => setZoom(z => Math.min(z + 0.5, 10))} title="확대 (+)">
          <ZoomIn size={24}/>
        </button>
        <button className="btn-icon" onClick={() => setZoom(z => Math.max(z - 0.5, 1))} title="축소 (-)">
          <ZoomOut size={24}/>
        </button>
      </div>
    </div>
  );
});
