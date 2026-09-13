import React from 'react';

export default function InteractionPrompt({ prompt }) {
  return (
    <div className="interaction-center-anchor">
      {/* Center Reticle */}
      <div className={`center-reticle ${prompt ? 'reticle-active' : ''}`}>
        <div className="reticle-core" />
        {prompt && <div className="reticle-pulse-ring" />}
      </div>

      {/* Floating Prompt Badge */}
      {prompt && (
        <div className="prompt-badge-container">
          <div className="prompt-badge">
            <span className="keycap">E</span>
            <span className="prompt-label">{prompt.replace(/^\[E\]\s*/, '')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
