import React, { useRef, useState, useEffect } from 'react';
  import './Camera.css';

  const STICKERS = [
    '✨', '🎨', '🌸', '🍀', '🎈', '❤️‍🔥', '☁️', '☀️', '🌙', '🎉', '⭐', '🌼',
    '🎈', '🎁', '🎊', '🍬', '🍭', '🧁',
    '💖', '🎀', '🌸', '🍀', '🌟', '🌈', '🌙'
  ];

  export default function Camera({ onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const editorCanvasRef = useRef(null);
    const captureBtnRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    const [intervalSeconds, setIntervalSeconds] = useState(3);
    const [layout, setLayout] = useState('strip');
    const [filter, setFilter] = useState('none');
    const [theme, setTheme] = useState('#ffffff');

    const [isShooting, setIsShooting] = useState(false);
    const [burstCountdown, setBurstCountdown] = useState(null);
    const [currentShot, setCurrentShot] = useState(0);
    const [burstPhotos, setBurstPhotos] = useState([]);

    const burstPhotosRef = useRef([]);
    const intervalSecondsRef = useRef(intervalSeconds);
    const layoutRef = useRef(layout);

    useEffect(() => { burstPhotosRef.current = burstPhotos; }, [burstPhotos]);
    useEffect(() => { intervalSecondsRef.current = intervalSeconds; }, [intervalSeconds]);
    useEffect(() => { layoutRef.current = layout; }, [layout]);

    const [isEditingStickers, setIsEditingStickers] = useState(false);
    const [draftCanvasData, setDraftCanvasData] = useState(null);
    const [placedStickers, setPlacedStickers] = useState([]);
    const [activeStickerId, setActiveStickerId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0, startStickerX: 0,
  startStickerY: 0 });
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

        const currentBurstPhotos = burstPhotosRef.current;
        const newPhotos = [...currentBurstPhotos, snap];
        setBurstPhotos(newPhotos);

        const currentLayout = layoutRef.current;
        const targetCount = currentLayout === 'grid-6' ? 6 : 4;

        if (newPhotos.length === targetCount) {
          setIsShooting(false);
          setBurstCountdown(null);
          setCurrentShot(0);
          setBurstPhotos([]);
          createLayoutCanvas(newPhotos);
        } else {
          setCurrentShot(prev => prev + 1);
          setBurstCountdown(intervalSecondsRef.current);
        }
        return;
      }
      const timerId = setTimeout(() => setBurstCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    }, [burstCountdown, isShooting]);

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
      if (!videoRef.current || !canvasRef.current) return null;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.filter = filter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    };

    const createLayoutCanvas = (photos) => {
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      const padding = 20;
      let canvasWidth, canvasHeight;

      if (layout === 'strip') {
        canvasWidth = 400;
        canvasHeight = 1600 + padding * 5;
      } else if (layout === 'strip-double') {
        // FIX: Chỉnh lại tỉ lệ cho 2 dải ảnh không bị phóng to quá mức
        canvasWidth = 800;
        canvasHeight = 800 + padding * 3;
      } else if (layout === 'grid') {
        canvasWidth = 800;
        canvasHeight = 800 + padding * 3;
      } else {
        canvasWidth = 800;
        canvasHeight = 1200 + padding * 4;
      }

      finalCanvas.width = canvasWidth;
      finalCanvas.height = canvasHeight;

      ctx.fillStyle = theme;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      photos.forEach((photoSrc, index) => {
        const img = new Image();
        img.src = photoSrc;
        img.onload = () => {
          let x, y, w, h;
          // Tính toán để giữ nguyên tỉ lệ ảnh
          const imgRatio = img.width / img.height;

          if (layout === 'strip') {
            w = canvasWidth - padding * 2;
            h = (canvasHeight - padding * 5) / 4;
            // Giữ nguyên tỉ lệ ảnh
            if (w / h > imgRatio) {
              w = h * imgRatio;
            } else {
              h = w / imgRatio;
            }
            x = padding + (w - w) / 2 + (w - w) / 2; // Căn giữa theo chiều ngang
            x = padding + (canvasWidth - padding * 2 - w) / 2;
            y = padding + h * index;
          } else if (layout === 'strip-double') {
            // Sửa logic vẽ ảnh cho strip-double để vừa khít
            const availableWidth = (canvasWidth - padding * 3) / 2;
            const availableHeight = (canvasHeight - padding * 3) / 2;

            if (availableWidth / availableHeight > imgRatio) {
              w = availableHeight * imgRatio;
              h = availableHeight;
            } else {
              w = availableWidth;
              h = availableWidth / imgRatio;
            }

            x = padding + (index % 2) * (availableWidth * 2) + (availableWidth - w) / 2;
            y = padding + Math.floor(index / 2) * (availableHeight * 2) + (availableHeight - h) / 2;
          } else {
            // Grid and others - giữ nguyên tỉ lệ
            const availableWidth = (canvasWidth - padding * 3) / 2;
            const availableHeight = (canvasHeight - padding * 3) / 2;

            if (availableWidth / availableHeight > imgRatio) {
              w = availableHeight * imgRatio;
              h = availableHeight;
            } else {
              w = availableWidth;
              h = availableWidth / imgRatio;
            }

            x = padding + (index % 2) * (availableWidth * 2) + (availableWidth - w) / 2;
            y = padding + Math.floor(index / 2) * (availableHeight * 2) + (availableHeight - h) / 2;
          }
          ctx.drawImage(img, x, y, w, h);
        };
      });

      setTimeout(() => {
        const finalData = finalCanvas.toDataURL('image/jpeg', 0.9);
        setDraftCanvasData(finalData);
        setIsEditingStickers(true);
        if (onCapture) onCapture(finalData);
      }, 500);
    };

    const handleCaptureClick = () => {
      if (isShooting) return;
      setIsShooting(true);
      setCurrentShot(0);
      setBurstPhotos([]);
      setBurstCountdown(intervalSeconds);
    };

    // Sticker functions (handleSaveFinal, etc.) remain the same as your original logic...
    const handleSaveFinal = () => {
      setIsEditingStickers(false);
      if (onCapture && draftCanvasData) onCapture(draftCanvasData);
    };

    return (
      <div className="camera-container glass-panel">
        <div className="camera-header">
          <h2>📸 Photobooth</h2>
          <div className="settings-row">
            <div className="setting-group">
              <label>Nghỉ:</label>
              <select value={intervalSeconds} onChange={(e) =>
  setIntervalSeconds(Number(e.target.value))} disabled={isShooting}>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={7}>7s</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Form:</label>
              <select value={layout} onChange={(e) => setLayout(e.target.value)} disabled={isShooting}
  >
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
          <div className="countdown-overlay">
            <div className="shot-indicator">Tấm {currentShot}/{layout === 'grid-6' ? 6 : 4}</div>
            <div className="countdown-number">{burstCountdown}</div>
          </div>
        )}

          <div className="filter-bar">
              {['none', 'grayscale(100%)', 'sepia(80%)', 'hue-rotate(90deg)'].map(f => (
                  <div
                    key={f}
                    className={`filter-option ${filter === f ? 'active' : ''}`}
                    onClick={() => !isShooting && setFilter(f)}
                    title={f}
                  >
                      <div className="filter-preview" style={{ filter: f }}>📷</div>
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