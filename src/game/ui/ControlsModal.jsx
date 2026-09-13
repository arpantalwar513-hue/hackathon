import React from 'react';

export default function ControlsModal({ isOpen, currentLevel = 1, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="controls-card" onClick={(e) => e.stopPropagation()}>
        <div className="controls-header">
          <span className="ctrl-badge">SURVIVAL GUIDE</span>
          <h3>{currentLevel === 2 ? 'LEVEL 2: HALL INVESTIGATION CONTROLS' : 'EXPLORATION CONTROLS'}</h3>
        </div>

        <div className="controls-grid">
          <div className="ctrl-row">
            <span className="key">W A S D</span>
            <span className="desc">Move explorer forward, left, backward, right</span>
          </div>
          <div className="ctrl-row">
            <span className="key">MOUSE</span>
            <span className="desc">First-person look (Click canvas to lock pointer)</span>
          </div>
          <div className="ctrl-row">
            <span className="key">SHIFT</span>
            <span className="desc">Sprint / Fast exploration</span>
          </div>
          <div className="ctrl-row">
            <span className="key">SPACE</span>
            <span className="desc">Jump over obstacles</span>
          </div>
          <div className="ctrl-row">
            <span className="key">E</span>
            <span className="desc">
              {currentLevel === 2
                ? "Interact (Investigate Clues, Activate Mechanisms)"
                : 'Interact (Pick up Golden Key, Unlock Temple Doors)'}
            </span>
          </div>
          {currentLevel === 1 && (
            <div className="ctrl-row">
              <span className="key">N</span>
              <span className="desc">Toggle Day / Night lighting mode</span>
            </div>
          )}
          <div className="ctrl-row">
            <span className="key">ESC</span>
            <span className="desc">Release mouse cursor / Pause game</span>
          </div>
        </div>

        <div className="controls-footer-tip">
          {currentLevel === 7 ? (
            <span>💡 LEVEL 7 GUIDE: Read the ancient inscription, locate the three symbols and mechanisms to unseal the archive, examine the ancient scroll on the central pedestal, and decode the restoration sequence (A → C → B) at the altar.</span>
          ) : currentLevel === 6 ? (
            <span>💡 LEVEL 6 GUIDE: Follow the footsteps into the deep catacombs, retrieve your friend's keepsake, align the ancient rotary seal to unseal the chamber, and find your trapped friend on the central dais.</span>
          ) : currentLevel === 5 ? (
            <span>💡 LEVEL 5 GUIDE: Explore the quiet chamber, decipher the three ancient symbols, engage the temple mechanisms, and uncover your friend's journal.</span>
          ) : currentLevel === 2 ? (
            <span>💡 LEVEL 2 GUIDE: Explore the daylight temple hall, investigate the 3 clues (footprints, friend's watch, and wall symbol), activate the 3 mechanisms to open the secret passage, and enter it!</span>
          ) : (
            <span>💡 LEVEL 1 GUIDE: Search the prasad stall along the road to find the temple key, then unlock the main temple gates.</span>
          )}
        </div>

        <button type="button" className="close-btn" onClick={onClose}>
          RESUME INVESTIGATION [ESC]
        </button>
      </div>
    </div>
  );
}
