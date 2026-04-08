import React, { useState, useEffect } from 'react';
import Camera from './components/Camera.jsx';
import Gallery from './components/Gallery.jsx';

function App() {
  const [photos, setPhotos] = useState(() => {
    // Load from local storage initially
    const saved = localStorage.getItem('photobooth_photos');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to local storage whenever output changes
  useEffect(() => {
    localStorage.setItem('photobooth_photos', JSON.stringify(photos));
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
    <div className="app-container">
      <header className="app-header">
        <h1>Vibe Photobooth</h1>
        <p className="app-subtitle">~ capture & treasure your moments ~</p>
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
  );
}

export default App;
