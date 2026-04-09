import React, { useState, useEffect, useRef } from 'react';
import Camera from './components/Camera.jsx';
import Gallery from './components/Gallery.jsx';

function App() {
  const [photos, setPhotos] = useState(() => {
    // Load from local storage initially
    const saved = localStorage.getItem('photobooth_photos');
    return saved ? JSON.parse(saved) : [];
  });
  const canvasRef = useRef(null);

  // Save to local storage whenever output changes
  useEffect(() => {
    try {
      localStorage.setItem('photobooth_photos', JSON.stringify(photos));
    } catch (err) {
      // localStorage quota exceeded — remove oldest photos until it fits
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        console.warn('localStorage full! Removing oldest photos to free space...');
        let trimmed = [...photos];
        while (trimmed.length > 0) {
          trimmed = trimmed.slice(0, -1); // remove the oldest (last) photo
          try {
            localStorage.setItem('photobooth_photos', JSON.stringify(trimmed));
            setPhotos(trimmed);
            break;
          } catch (_) {
            // keep removing until it fits
          }
        }
      }
    }
  }, [photos]);

  // Global click effect
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const sparkle = document.createElement('div');
      sparkle.className = 'click-sparkle';
      sparkle.style.left = `${e.clientX}px`;
      sparkle.style.top = `${e.clientY}px`;
      document.body.appendChild(sparkle);
      
      // Clean up after animation
      setTimeout(() => {
        sparkle.remove();
      }, 800);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Smooth canvas-based color ribbon trail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const TRAIL_LENGTH = 60;
    const points = [];
    const MAX_WIDTH = 4;

    let mouseX = -200, mouseY = -200;
    let animId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Color stops for the gradient along the trail
    const trailColors = [
      { r: 100, g: 170, b: 190 }, // teal
      { r: 160, g: 120, b: 190 }, // purple
      { r: 199, g: 91, b: 74 },   // warm red
      { r: 212, g: 168, b: 85 },  // gold
      { r: 200, g: 149, b: 108 }, // accent
      { r: 230, g: 210, b: 180 }, // cream
    ];

    const getColor = (t) => {
      // t: 0 (tail) → 1 (head), map to color stops
      const idx = t * (trailColors.length - 1);
      const i = Math.floor(idx);
      const f = idx - i;
      const c1 = trailColors[Math.min(i, trailColors.length - 1)];
      const c2 = trailColors[Math.min(i + 1, trailColors.length - 1)];
      return {
        r: c1.r + (c2.r - c1.r) * f,
        g: c1.g + (c2.g - c1.g) * f,
        b: c1.b + (c2.b - c1.b) * f,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new point at exact mouse position (centered)
      if (points.length === 0) {
        points.push({ x: mouseX, y: mouseY });
      } else {
        const head = points[points.length - 1];
        // Smooth lerp so it doesn't jump
        const nx = head.x + (mouseX - head.x) * 0.35;
        const ny = head.y + (mouseY - head.y) * 0.35;
        points.push({ x: nx, y: ny });
      }

      // Trim trail
      if (points.length > TRAIL_LENGTH) {
        points.shift();
      }

      if (points.length < 3) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw each segment with gradient color + fading opacity + thinning width
      for (let i = 1; i < points.length - 1; i++) {
        const t = i / (points.length - 1); // 0=tail, 1=head
        const alpha = t * t * 0.65;
        const width = MAX_WIDTH * t;
        const color = getColor(t);

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
        ctx.lineWidth = width;

        // Smooth quadratic curve
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.moveTo(
          (points[i - 1].x + points[i].x) / 2,
          (points[i - 1].y + points[i].y) / 2
        );
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleCapture = (photoDataUrl) => {
    const newPhoto = {
      id: Date.now(),
      url: photoDataUrl,
      timestamp: new Date().toISOString()
    };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handleDelete = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  return (
    <>
      <canvas ref={canvasRef} className="trail-canvas" />
      <div className="app-container">
        <header className="app-header">
          <h1>Vibe Photobooth</h1>
          <p className="app-subtitle">~ capture &amp; treasure your moments ~</p>
        </header>
        
        <main className="app-content">
          <section className="camera-section">
            <Camera onCapture={handleCapture} />
          </section>
          
          <section className="gallery-section">
            <Gallery photos={photos} onDelete={handleDelete} />
          </section>
        </main>
        
        <div className="author-signature">Make by Khoi Nguyen</div>
      </div>
    </>
  );
}

export default App;
