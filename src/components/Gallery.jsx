import React, { useState } from 'react';
import './Gallery.css';

export default function Gallery({ photos, onDelete }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (photos.length === 0) {
    return (
      <div className="gallery-container glass-panel empty-state">
        <div className="empty-icon">🖼️</div>
        <h3>Your photobooth is empty</h3>
        <p>Take some photos to fill it up!</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (selectedPhoto) {
      onDelete(selectedPhoto.id);
      setSelectedPhoto(null);
    }
  };

  return (
    <div className="gallery-container glass-panel">
      <div className="gallery-header">
        <h2>✨ My Photobooth</h2>
        <span className="photo-count">{photos.length} strips</span>
      </div>
      
      <div className="gallery-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
            <img src={photo.url} alt={`Strip at ${new Date(photo.timestamp).toLocaleTimeString()}`} loading="lazy" />
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div className="lightbox-modal">
           <div className="lightbox-backdrop" onClick={() => setSelectedPhoto(null)}></div>
           <div className="lightbox-content">
             <button className="btn-close" onClick={() => setSelectedPhoto(null)}>✕</button>
             <div className="lightbox-image-container">
               <img src={selectedPhoto.url} alt="Full strip" />
             </div>
             <div className="lightbox-actions">
               <a href={selectedPhoto.url} download={`photobooth_${selectedPhoto.id}.jpg`} className="btn btn-primary" onClick={(e) => e.stopPropagation()}>
                 ⬇️ DOWNLOAD
               </a>
               <button className="btn btn-danger" onClick={handleDelete}>
                 🗑️ DELETE
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
