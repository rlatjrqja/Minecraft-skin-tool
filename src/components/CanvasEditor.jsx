import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export const CanvasEditor = forwardRef(({ onTextureUpdate, currentColor, activeTool }, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    updateTexture: () => updateTexture(),
    loadSkin: (url) => loadSkinImage(url)
  }));

  const loadSkinImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) { resolve(); return; }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(img, 0, 0, 64, 64);
        updateTexture();
        resolve();
      };
      img.src = url;
    });
  };

  useEffect(() => {
    // Load Steve as the initial default skin
    loadSkinImage('/steve.png');
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
      // Disable anti-aliasing context features just in case
      ctx.fillRect(x, y, 1, 1);
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
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
});
