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
  const [currentSticker, setCurrentSticker] = useState('✨');
  const [stickerScale, setStickerScale] = useState(1);
  const [stickerRotation, setStickerRotation] = useState(0);

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
      
      if (newPhotos.length === 4) {
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

  // Load draft image into editor canvas when editing starts
  useEffect(() => {
    if (isEditingStickers && draftCanvasData && editorCanvasRef.current) {
        resetEditorCanvas();
    }
  }, [isEditingStickers, draftCanvasData]);

  const resetEditorCanvas = () => {
      const canvas = editorCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = draftCanvasData;
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
      };
  };

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
    if (photos.length !== 4) return;
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
        
        if (layout === 'strip') {
           canvas.width = imgW + (padding * 2);
           canvas.height = (imgH * 4) + (margin * 3) + padding + bottomSpace;
        } else {
           canvas.width = (imgW * 2) + margin + (padding * 2);
           canvas.height = (imgH * 2) + margin + padding + bottomSpace;
        }
        
        ctx.fillStyle = theme;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        loadedImgs.forEach((img, idx) => {
            let x, y;
            if (layout === 'strip') {
                x = padding;
                y = padding + (idx * (imgH + margin));
            } else {
                x = padding + ((idx % 2) * (imgW + margin));
                y = padding + (Math.floor(idx / 2) * (imgH + margin));
            }
            ctx.drawImage(img, x, y, imgW, imgH);
        });
        
        const isDark = theme === '#0f172a' || theme === '#000000';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.font = `bold ${layout === 'grid' ? 80 : 60}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('VIBE PHOTOBOOTH', canvas.width / 2, canvas.height - 50);

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

  const handleCanvasClick = (e) => {
    if (!editorCanvasRef.current || !currentSticker) return;
    const canvas = editorCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((stickerRotation * Math.PI) / 180);
    const fontSize = Math.floor(120 * scaleX * stickerScale);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentSticker, 0, 0);
    ctx.restore();
  };

  const handleSaveFinal = () => {
      const finalData = editorCanvasRef.current.toDataURL('image/jpeg', 0.85);
      onCapture(finalData);
      setIsEditingStickers(false);
      setDraftCanvasData(null);
  };

  if (isEditingStickers) {
      return (
          <div className="camera-container glass-panel sticker-editor-mode">
              <div className="camera-header">
                <h2>✨ Sticker & Edit</h2>
              </div>
              <div className="editor-workspace">
                 <canvas 
                    ref={editorCanvasRef} 
                    className="editable-canvas"
                    onClick={handleCanvasClick}
                 />
              </div>
              <div className="sticker-toolbar glass-panel">
                  <p>Chọn nhãn dán, sau đó <b>chạm vào ảnh</b> để dán!</p>
                  
                  <div className="sticker-controls">
                      <div className="sticker-control-group">
                          <label>Kích cỡ: {stickerScale}x</label>
                          <input type="range" min="0.5" max="3" step="0.1" value={stickerScale} onChange={(e) => setStickerScale(Number(e.target.value))} />
                      </div>
                      <div className="sticker-control-group">
                          <label>Góc xoay: {stickerRotation}°</label>
                          <input type="range" min="-180" max="180" step="5" value={stickerRotation} onChange={(e) => setStickerRotation(Number(e.target.value))} />
                      </div>
                  </div>

                  <div className="sticker-list">
                      {STICKERS.map(s => (
                          <button 
                            key={s} 
                            className={`sticker-item ${currentSticker === s ? 'active' : ''}`}
                            onClick={() => setCurrentSticker(s)}
                          >
                              {s}
                          </button>
                      ))}
                  </div>
                  <div className="editor-actions">
                      <button className="btn btn-secondary" onClick={resetEditorCanvas}>Làm lại (Kéo)</button>
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
              <option value="grid">Vuông 2x2</option>
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
            <div className="shot-indicator">Tấm {currentShot}/4</div>
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
