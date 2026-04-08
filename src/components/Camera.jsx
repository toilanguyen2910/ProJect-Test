import React, { useRef, useState, useEffect } from 'react';
import './Camera.css';

const STICKERS = [
  '✨', '🎀', '🧸', '🌸', '💋', '❤️', '🦋', '🐶', '🍒', '🎉', '🍀', '🌟', 
  '🎂', '🎈', '🎁', '🥳', '🎊', '🍰', 
  '🇻🇳', '🎇', '🎆', '🏮', '🏵️', '🥁', '👒', '☕'
];

export default function Camera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const captureBtnRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  
  // Settings
  const [intervalSeconds, setIntervalSeconds] = useState(3);
  const [layout, setLayout] = useState('strip'); // 'strip' | 'grid'
  const [filter, setFilter] = useState('none');
  const [theme, setTheme] = useState('#ffffff'); 
  
  // Photobooth state
  const [isShooting, setIsShooting] = useState(false);
  const [burstCountdown, setBurstCountdown] = useState(null);
  const [currentShot, setCurrentShot] = useState(0); 
  const [burstPhotos, setBurstPhotos] = useState([]);

  // Sticker Editor state
  const [isEditingStickers, setIsEditingStickers] = useState(false);
  const [draftCanvasData, setDraftCanvasData] = useState(null);

  // Interactive Stickers state
  const [placedStickers, setPlacedStickers] = useState([]);
  const [activeStickerId, setActiveStickerId] = useState(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0, startStickerX: 0, startStickerY: 0 });
  const workspaceRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isEditingStickers) {
        e.preventDefault();
        if (captureBtnRef.current && !isShooting) captureBtnRef.current.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShooting, isEditingStickers]);

  useEffect(() => {
    if (burstCountdown === null || !isShooting) return;
    if (burstCountdown === 0) {
      const snap = takeSinglePhoto();
      if (!snap) return;

      const newPhotos = [...burstPhotos, snap];
      setBurstPhotos(newPhotos);
      
      const targetCount = layout === 'grid-6' ? 6 : 4;

      if (newPhotos.length === targetCount) {
        setIsShooting(false);
        setBurstCountdown(null);
        setCurrentShot(0);
        setBurstPhotos([]);
        createLayoutCanvas(newPhotos);
      } else {
        setCurrentShot(prev => prev + 1);
        setBurstCountdown(intervalSeconds);
      }
      return;
    }
    const timerId = setTimeout(() => setBurstCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timerId);
  }, [burstCountdown, isShooting]);

  useEffect(() => {
    if (isEditingStickers && draftCanvasData) {
        setPlacedStickers([]);
        setActiveStickerId(null);
    }
  }, [isEditingStickers, draftCanvasData]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setError("Unable to access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
  };

  const takeSinglePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.filter = filter;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      
      const flash = document.createElement('div');
      flash.className = 'camera-flash';
      video.parentElement.appendChild(flash);
      setTimeout(() => flash.remove(), 500);

      return canvas.toDataURL('image/jpeg', 0.9);
    }
    return null;
  };

  const createLayoutCanvas = (photos) => {
    if (photos.length === 0) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const imgObjs = photos.map(src => {
        const img = new Image(); img.src = src; return img;
    });

    Promise.all(imgObjs.map(img => new Promise(res => { img.onload = () => res(img); }))).then(loadedImgs => {
        const scale = 0.5;
        const imgW = loadedImgs[0].width * scale;
        const imgH = loadedImgs[0].height * scale;
        
        const padding = 40;
        const margin = 20;
        const bottomSpace = 140;
        
        if (layout === 'strip' || layout === 'strip-double') {
           const stripsCount = layout === 'strip-double' ? 2 : 1;
           canvas.width = (imgW + padding * 2) * stripsCount + (stripsCount - 1) * margin;
           canvas.height = (imgH * 4) + (margin * 3) + padding + bottomSpace;
        } else if (layout === 'grid' || layout === 'heart-4') {
           canvas.width = (imgW * 2) + margin + (padding * 2);
           canvas.height = (imgH * 2) + margin + padding + bottomSpace;
        } else if (layout === 'grid-6') {
           canvas.width = (imgW * 2) + margin + (padding * 2);
           canvas.height = (imgH * 3) + margin * 2 + padding + bottomSpace;
        }
        
        ctx.fillStyle = theme;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const drawHeart = (ctx, x, y, width, height) => {
            ctx.beginPath();
            const topCurveHeight = height * 0.3;
            ctx.moveTo(x + width / 2, y + topCurveHeight);
            ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
            ctx.bezierCurveTo(x, y + (height + topCurveHeight) / 2, x + width / 2, y + height, x + width / 2, y + height);
            ctx.bezierCurveTo(x + width / 2, y + height, x + width, y + (height + topCurveHeight) / 2, x + width, y + topCurveHeight);
            ctx.bezierCurveTo(x + width, y, x + width / 2, y, x + width / 2, y + topCurveHeight);
            ctx.closePath();
        };

        if (layout === 'strip-double') {
            const stripWidth = imgW + padding * 2;
            [0, 1].forEach(stripIdx => {
                const offsetX = stripIdx * (stripWidth + margin);
                loadedImgs.forEach((img, idx) => {
                    const x = offsetX + padding;
                    const y = padding + (idx * (imgH + margin));
                    ctx.drawImage(img, x, y, imgW, imgH);
                });
            });
        } else {
            loadedImgs.forEach((img, idx) => {
                let x, y;
                if (layout === 'strip') {
                    x = padding;
                    y = padding + (idx * (imgH + margin));
                } else {
                    x = padding + ((idx % 2) * (imgW + margin));
                    y = padding + (Math.floor(idx / 2) * (imgH + margin));
                }

                if (layout === 'heart-4') {
                    ctx.save();
                    drawHeart(ctx, x, y, imgW, imgH);
                    ctx.clip();
                    ctx.drawImage(img, x, y, imgW, imgH);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, x, y, imgW, imgH);
                }
            });
        }
        
        const isDark = theme === '#0f172a' || theme === '#000000';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.textAlign = 'center';

        if (layout === 'strip-double') {
             ctx.font = `bold 60px Inter, sans-serif`;
             const stripWidth = imgW + padding * 2;
             ctx.fillText('VIBE PHOTOBOOTH', stripWidth / 2, canvas.height - 50);
             ctx.fillText('VIBE PHOTOBOOTH', stripWidth + margin + stripWidth / 2, canvas.height - 50);
        } else {
             ctx.font = `bold ${layout.includes('grid') || layout === 'heart-4' ? 80 : 60}px Inter, sans-serif`;
             ctx.fillText('VIBE PHOTOBOOTH', canvas.width / 2, canvas.height - 50);
        }

        setDraftCanvasData(canvas.toDataURL('image/jpeg', 0.9));
        setIsEditingStickers(true);
    });
  };

  const handleCaptureClick = () => {
    if (isShooting) return;
    setIsShooting(true);
    setBurstPhotos([]);
    setCurrentShot(1);
    setBurstCountdown(intervalSeconds);
  };

  const handleAddSticker = (emoji) => {
      const newSticker = {
          id: Date.now(),
          emoji,
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0
      };
      setPlacedStickers(prev => [...prev, newSticker]);
      setActiveStickerId(newSticker.id);
  };

  const handleStickerPointerDown = (e, id) => {
      e.stopPropagation();
      setActiveStickerId(id);
      setIsDragging(true);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const stickerToDrag = placedStickers.find(s => s.id === id);
      if (!stickerToDrag) return;
      setDragOffset({
          startX: clientX,
          startY: clientY,
          startStickerX: stickerToDrag.x,
          startStickerY: stickerToDrag.y
      });
  };

  const handlePointerMove = (e) => {
      if (!isDragging || !activeStickerId || !workspaceRef.current) return;
      e.preventDefault(); 
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = workspaceRef.current.getBoundingClientRect();
      const dxPct = ((clientX - dragOffset.startX) / rect.width) * 100;
      const dyPct = ((clientY - dragOffset.startY) / rect.height) * 100;

      setPlacedStickers(prev => prev.map(s => 
          s.id === activeStickerId 
              ? { ...s, x: dragOffset.startStickerX + dxPct, y: dragOffset.startStickerY + dyPct }
              : s
      ));
  };

  const handlePointerUp = () => {
      setIsDragging(false);
  };

  const removeActiveSticker = () => {
      if (!activeStickerId) return;
      setPlacedStickers(prev => prev.filter(s => s.id !== activeStickerId));
      setActiveStickerId(null);
  };

  const handleSaveFinal = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = draftCanvasData;
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          if (workspaceRef.current) {
              const rect = workspaceRef.current.getBoundingClientRect();
              const scaleX = canvas.width / rect.width;
              
              placedStickers.forEach(sticker => {
                  const pxX = (sticker.x / 100) * canvas.width;
                  const pxY = (sticker.y / 100) * canvas.height;
                  ctx.save();
                  ctx.translate(pxX, pxY);
                  ctx.rotate((sticker.rotation * Math.PI) / 180);
                  const fontSize = Math.floor(80 * scaleX * sticker.scale);
                  ctx.font = `${fontSize}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(sticker.emoji, 0, 0);
                  ctx.restore();
              });
          }

          const finalData = canvas.toDataURL('image/jpeg', 0.85);
          onCapture(finalData);
          setIsEditingStickers(false);
          setDraftCanvasData(null);
          setPlacedStickers([]);
          setActiveStickerId(null);
      };
  };

  if (isEditingStickers) {
      const activeSticker = placedStickers.find(s => s.id === activeStickerId);
      const currentScale = activeSticker ? activeSticker.scale : 1;
      const currentRotation = activeSticker ? activeSticker.rotation : 0;

      return (
          <div className="camera-container glass-panel sticker-editor-mode">
              <div className="camera-header">
                <h2>✨ Sticker & Edit</h2>
              </div>
              <div className="editor-workspace-container">
                  <div 
                      className="editor-workspace"
                      ref={workspaceRef}
                      onPointerDown={(e) => {
                         if(e.target === workspaceRef.current || e.target.classList.contains('draft-image')) {
                             setActiveStickerId(null);
                         }
                      }}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      style={{ touchAction: 'none' }}
                  >
                     <img src={draftCanvasData} className="draft-image" draggable="false" alt="Draft" />
                     {placedStickers.map(sticker => (
                         <div
                            key={sticker.id}
                            className={`sticker-element ${activeStickerId === sticker.id ? 'active' : ''}`}
                            onPointerDown={(e) => handleStickerPointerDown(e, sticker.id)}
                            style={{
                                left: `${sticker.x}%`,
                                top: `${sticker.y}%`,
                                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                            }}
                         >
                            {sticker.emoji}
                         </div>
                     ))}
                  </div>
              </div>
              <div className="sticker-toolbar glass-panel">
                  <p><b>Nhấp vào</b> nhãn dán ở dưới để thêm, sau đó <b>kéo trực tiếp trên ảnh để di chuyển.</b></p>
                  
                  <div className={`sticker-controls ${!activeStickerId ? 'disabled' : ''}`}>
                      <div className="sticker-control-group">
                          <label>Kích cỡ: {currentScale}x</label>
                          <input 
                            type="range" min="0.5" max="3" step="0.1" 
                            value={currentScale} 
                            disabled={!activeStickerId}
                            onChange={(e) => {
                                if (activeStickerId) {
                                    setPlacedStickers(prev => prev.map(s => s.id === activeStickerId ? { ...s, scale: Number(e.target.value) } : s));
                                }
                            }} 
                          />
                      </div>
                      <div className="sticker-control-group">
                          <label>Góc xoay: {currentRotation}°</label>
                          <input 
                            type="range" min="-180" max="180" step="5" 
                            value={currentRotation} 
                            disabled={!activeStickerId}
                            onChange={(e) => {
                                if (activeStickerId) {
                                    setPlacedStickers(prev => prev.map(s => s.id === activeStickerId ? { ...s, rotation: Number(e.target.value) } : s));
                                }
                            }} 
                          />
                      </div>
                  </div>

                  <div className="sticker-list">
                      {STICKERS.map(s => (
                          <button 
                            key={s} 
                            className="sticker-item"
                            onClick={() => handleAddSticker(s)}
                          >
                              {s}
                          </button>
                      ))}
                  </div>
                  <div className="editor-actions">
                      <button 
                         className="btn btn-secondary" 
                         disabled={!activeStickerId} 
                         onClick={removeActiveSticker}
                      >
                         🗑️ Xoá hình đã chọn
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveFinal}>✅ HOÀN TẤT & LƯU</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="camera-container glass-panel">
      <div className="camera-header">
        <h2>📷 Photobooth</h2>
        <div className="settings-row">
          <div className="setting-group">
            <label>Nghỉ:</label>
            <select value={intervalSeconds} onChange={(e) => setIntervalSeconds(Number(e.target.value))} disabled={isShooting}>
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={7}>7s</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Form:</label>
            <select value={layout} onChange={(e) => setLayout(e.target.value)} disabled={isShooting}>
              <option value="strip">Dọc 1x4</option>
              <option value="strip-double">Dọc 2 dải (In đôi)</option>
              <option value="grid">Vuông 2x2</option>
              <option value="grid-6">Lưới 2x3 (6 ảnh)</option>
              <option value="heart-4">Tim 2x2 (Đặc biệt)</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Màu:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isShooting}>
              <option value="#ffffff">Trắng</option>
              <option value="#0f172a">Đen</option>
              <option value="#fdf2f8">Hồng</option>
              <option value="#c8956c">Cam Đất</option>
              <option value="#8b7355">Nâu Cổ Điển</option>
              <option value="#5d6e5d">Xanh Rêu</option>
              <option value="#4a5568">Xám Khói</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="viewfinder">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={startCamera}>Try Again</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="video-feed"
            style={{ filter: filter }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {burstCountdown !== null && (
          <div className="countdown-overlay">
            <div className="shot-indicator">Tấm {currentShot}/{layout === 'grid-6' ? 6 : 4}</div>
            <div className="countdown-number">{burstCountdown}</div>
          </div>
        )}

        <div className="filter-bar">
            {['none', 'grayscale(100%)', 'sepia(80%)', 'hue-rotate(90deg)', 'invert(100%)', 'contrast(120%) saturate(120%)'].map(f => (
                <div 
                  key={f} 
                  className={`filter-option ${filter === f ? 'active' : ''}`}
                  onClick={() => !isShooting && setFilter(f)}
                  title={f}
                >
                    <div className="filter-preview" style={{ filter: f }}>📸</div>
                </div>
            ))}
        </div>
      </div>

      <div className="camera-controls">
        <button 
          ref={captureBtnRef}
          className={`btn capture-btn ${isShooting ? 'shooting' : ''}`} 
          onClick={handleCaptureClick}
          disabled={!stream || error || isShooting}
        >
          <div className="capture-inner"></div>
        </button>
      </div>
      <div className="camera-hint">
        {isShooting ? "Chuẩn bị tạo dáng..." : "Spacebar để chụp"}
      </div>
    </div>
  );
}
