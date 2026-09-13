import React from 'react';

export default function NoticeModal({ notice, onClose }) {
  if (!notice) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="notice-card" onClick={(e) => e.stopPropagation()}>
        <div className="notice-om">ॐ</div>
        <h2 className="notice-title">{notice.title}</h2>
        <div className="notice-location">{notice.date}</div>
        <div className="notice-body">
          {notice.body.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <button type="button" className="notice-close-btn" onClick={onClose}>
          BACK TO EXPLORATION [ESC]
        </button>
      </div>
    </div>
  );
}
