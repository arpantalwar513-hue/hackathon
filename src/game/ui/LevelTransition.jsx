import React from 'react';

export default function LevelTransition({
  active,
  cinematicText,
  currentLevel = 1,
  onReplay,
  onStartLevel1,
  onStartLevel2,
  onStartLevel3,
  onStartLevel4,
  onStartLevel5,
  onStartLevel6,
  onStartLevel7,
  onStartLevel8,
  onStartLevel9,
  onStartLevel10,
  onStartLevel11,
  onStartLevel12,
  onContinueExploring,
}) {
  if (!active) return null;

  // Level 1 completion card condition
  const showLevel1Card = currentLevel === 1 && cinematicText === 'THE REAL JOURNEY BEGINS...';

  // Level 2 completion card condition: triggers at final narrative caption
  const showLevel2Card = currentLevel === 2 && (
    cinematicText === 'LEVEL 3 — THE HIDDEN PATH' ||
    cinematicText === 'LEVEL 2 COMPLETE — THE SECRET DOOR IS OPEN'
  );

  // Level 3 completion card condition: triggers at Level 3 completion
  const showLevel3Card = currentLevel === 3 && (
    cinematicText === 'LEVEL 3 COMPLETE — THE HIDDEN PATH' ||
    cinematicText === 'THE SEARCH CONTINUES...' ||
    cinematicText === 'LEVEL 3 COMPLETE'
  );

  // Level 4 completion card condition: triggers at Level 4 completion
  const showLevel4Card = currentLevel === 4 && (
    cinematicText === 'LEVEL 4 COMPLETE — THE SANCTUARY CONQUERED' ||
    cinematicText === 'LEVEL 4 COMPLETE — THE DEEP SANCTUM' ||
    cinematicText === 'LEVEL 4 COMPLETE'
  );

  // Level 5 completion card condition: triggers at Level 5 completion
  const showLevel5Card = currentLevel === 5 && (
    cinematicText === 'LEVEL 5 COMPLETE — THE UNKNOWN GUIDE' ||
    cinematicText === 'LEVEL 5 COMPLETE'
  );

  // Level 6 completion card
  const showLevel6Card = currentLevel === 6;

  // Level 7 completion card
  const showLevel7Card = currentLevel === 7;

  // Level 8 completion card
  const showLevel8Card = currentLevel === 8;

  // Level 9 completion card
  const showLevel9Card = currentLevel === 9;

  // Level 10 completion card
  const showLevel10Card = currentLevel === 10;

  // Level 11 completion card
  const showLevel11Card = currentLevel === 11;

  // Level 12 completion card
  const showLevel12Card = currentLevel === 12;

  return (
    <div className="cinematic-outro-overlay">
      {/* Narrative Stinger Captions */}
      <div className="narrative-center-stage">
        {cinematicText && !showLevel1Card && !showLevel2Card && !showLevel3Card && !showLevel4Card && !showLevel5Card && !showLevel6Card && !showLevel7Card && !showLevel8Card && !showLevel9Card && !showLevel10Card && !showLevel11Card && !showLevel12Card && (
          <h1 className="narrative-heading animate-in">{cinematicText}</h1>
        )}

        {/* Level 1 Completion Modal Card */}
        {showLevel1Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle">
                <span className="mandala-symbol">🏛️</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 1 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond">◆</span>
              <span className="divider-text">THE REAL JOURNEY BEGINS...</span>
              <span className="divider-diamond">◆</span>
            </div>

            <p className="completion-summary">
              You explored the illuminated temple courtyard, discovered the antique golden key at the prasad stall, and unlocked the sacred gates of Shri Maa Sheetla Devi Mandir.
              The temple doors have opened, and Level 1: THE TEMPLE KEY is complete!
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2" onClick={onStartLevel2}>
                <span>ENTER LEVEL 2: THE FORGOTTEN HALL</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-explore" onClick={onContinueExploring}>
                <span>🚶 FREE ROAM / मंदिर में घूमें</span>
              </button>

              <button type="button" className="btn-replay" onClick={onReplay}>
                <span>↺ REPLAY LEVEL 1</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 2 Completion Modal Card */}
        {showLevel2Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle">
                <span className="mandala-symbol">🔱</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 2 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond">◆</span>
              <span className="divider-text">THE ANCIENT SEAL IS BROKEN</span>
              <span className="divider-diamond">◆</span>
            </div>

            <div className="completion-subtitle-quote">
              <p>The ancient seal has been broken...</p>
              <p>Something deeper inside the temple is awakening.</p>
            </div>

            <p className="completion-summary">
              You explored the ancient temple corridors, discovered the ancient parchment scroll, recovered the Sacred Energy Crystal, and aligned the Sun, Moon, and Trishul symbols to unseal the stone vault.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel3}>
                <span>CONTINUE TO LEVEL 3</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-explore" onClick={onContinueExploring}>
                <span>🚶 FREE ROAM / मन्दिर में घूमें</span>
              </button>

              <button type="button" className="btn-replay" onClick={onReplay}>
                <span>↺ REPLAY LEVEL 2</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel1}>
                <span>🏛️ RETURN TO LEVEL 1</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 3 Completion Modal Card */}
        {showLevel3Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle">
                <span className="mandala-symbol">👁️</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 3 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond">◆</span>
              <span className="divider-text">THE HIDDEN PATH SURVIVED</span>
              <span className="divider-diamond">◆</span>
            </div>

            <div className="completion-subtitle-quote">
              <p>You survived the supernatural entity stalking the darkness.</p>
              <p>Ahead in the sanctuary mist, a mysterious figure appeared...</p>
            </div>

            <p className="completion-summary">
              You descended through the ancient crypt corridors, uncovered your missing friend's dropped expedition watch, unlocked the inner stone mechanism, and sprinted through the corrupted hallways to safety.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel4}>
                <span>CONTINUE TO LEVEL 4: THE DEEP SANCTUM</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-explore" onClick={onContinueExploring}>
                <span>🚶 FREE ROAM / मन्दिर में घूमें</span>
              </button>

              <button type="button" className="btn-replay" onClick={onReplay}>
                <span>↺ REPLAY LEVEL 3</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel2}>
                <span>🔱 RETURN TO LEVEL 2</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel1}>
                <span>🏛️ RETURN TO LEVEL 1</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 4 Completion Modal Card */}
        {showLevel4Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle">
                <span className="mandala-symbol">🔮</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 4 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond">◆</span>
              <span className="divider-text">THE CORRUPTED SANCTUARY CONQUERED</span>
              <span className="divider-diamond">◆</span>
            </div>

            <div className="completion-subtitle-quote">
              <p>The Corrupted Core has been cleansed...</p>
              <p>Ahead lies the deepest sanctum vault of the ancient masters.</p>
            </div>

            <p className="completion-summary">
              You decoded the ancient Liber Corruptio grimoire, broke the twin wing seals in the Dark Crypt Passage and Spiraling Descent, purged the pulsating Corrupted Relic, and outran the supernatural entity to escape through the grand sanctuary portal!
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel5}>
                <span>ENTER LEVEL 5: THE UNKNOWN GUIDE</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onReplay}>
                <span>↺ REPLAY LEVEL 4</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-explore" onClick={onContinueExploring}>
                <span>🚶 FREE ROAM / मन्दिर में घूमें</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel3}>
                <span>👁️ RETURN TO LEVEL 3</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel2}>
                <span>🔱 RETURN TO LEVEL 2</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel1}>
                <span>🏛️ RETURN TO LEVEL 1</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 5 Completion Card */}
        {showLevel5Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(100,80,160,0.7)' }}>
                <span className="mandala-symbol">🌒</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 5 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#8060c0' }}>◆</span>
              <span className="divider-text">THE TRUTH IS CLOSER THAN YOU THINK...</span>
              <span className="divider-diamond" style={{ color: '#8060c0' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(100,80,160,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#c0a0e0' }}>"The darkness didn't take your friend."</p>
              <p style={{ fontStyle: 'italic', color: '#c0a0e0', marginTop: '4px' }}>"It took control of him."</p>
            </div>

            <p className="completion-summary">
              You discovered the quiet chamber beneath the sanctuary, met the mysterious Unknown Guide,
              decoded the three ancient symbols, activated the temple mechanisms, and uncovered your missing friend's journal.
              Ahead lies the deepest descent...
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel6}>
                <span>CONTINUE TO LEVEL 6: FINDING THE FRIEND</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel5}>
                <span>↺ REPLAY LEVEL 5</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel4}>
                <span>← RETURN TO LEVEL 4</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel3}>
                <span>👁️ RETURN TO LEVEL 3</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 6 Completion Card */}
        {showLevel6Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(217,119,6,0.8)' }}>
                <span className="mandala-symbol">📜</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 6 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#d97706' }}>◆</span>
              <span className="divider-text">FINDING THE FRIEND</span>
              <span className="divider-diamond" style={{ color: '#d97706' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(217,119,6,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#fcd34d' }}>"The temple's protective power has been corrupted."</p>
              <p style={{ fontStyle: 'italic', color: '#fcd34d', marginTop: '4px' }}>"Find the ancient knowledge that can restore the temple's power."</p>
            </div>

            <p className="completion-summary">
              You found your missing friend inside the deep sanctum chamber, but a malevolent entity and corrupted temple energy hold him captive.
              To release him, you must locate the ancient record and restore the sacred spiritual seals.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel7 || onContinueExploring}>
                <span>CONTINUE TO LEVEL 7: THE ANCIENT SCROLL</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel6}>
                <span>↺ REPLAY LEVEL 6</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel5}>
                <span>← RETURN TO LEVEL 5</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 7 Completion Card */}
        {showLevel7Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(56,189,248,0.8)' }}>
                <span className="mandala-symbol">📜</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 7 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#38bdf8' }}>◆</span>
              <span className="divider-text">THE ANCIENT SCROLL</span>
              <span className="divider-diamond" style={{ color: '#38bdf8' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(56,189,248,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#7dd3fc' }}>"You restored only part of the power."</p>
              <p style={{ fontStyle: 'italic', color: '#7dd3fc', marginTop: '4px' }}>"The rest must be restored from inside the temple. The one you came for is still trapped."</p>
            </div>

            <p className="completion-summary">
              You penetrated the forgotten archive, decoded the sacred sequence of awakening (Solar → Lunar → Ocular),
              and channeled the power into the restoration altar. 30% of the temple's ancient spiritual energy has been stabilized!
              However, the entity has sensed your ritual—prepare for the final restoration.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel8 || onContinueExploring}>
                <span>CONTINUE TO LEVEL 8: RESTORATION OF SPIRITUAL POWER</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel7}>
                <span>↺ REPLAY LEVEL 7</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel6}>
                <span>← RETURN TO LEVEL 6</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 8 Completion Card */}
        {showLevel8Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(56,189,248,0.8)' }}>
                <span className="mandala-symbol">✨</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 8 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#38bdf8' }}>◆</span>
              <span className="divider-text">GUARDIAN DEFEATED</span>
              <span className="divider-diamond" style={{ color: '#38bdf8' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(56,189,248,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#7dd3fc' }}>"The corrupted guardian falls..."</p>
              <p style={{ fontStyle: 'italic', color: '#7dd3fc', marginTop: '4px' }}>"The darkness is not trapped here."</p>
            </div>

            <p className="completion-summary">
              You defeated the Corrupted Temple Guardian in combat and recovered the Spiritual Relic.
              However, the negative entity has grown stronger and is now hunting you directly.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel9 || onContinueExploring}>
                <span>CONTINUE TO LEVEL 9: THE NEGATIVE ENTITY</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel8}>
                <span>↺ REPLAY LEVEL 8</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel7}>
                <span>← RETURN TO LEVEL 7</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 9 Completion Card */}
        {showLevel9Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(239,68,68,0.8)' }}>
                <span className="mandala-symbol">👁️</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 9 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#ef4444' }}>◆</span>
              <span className="divider-text">THE NEGATIVE ENTITY</span>
              <span className="divider-diamond" style={{ color: '#ef4444' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#fca5a5' }}>"It has absorbed the remaining darkness."</p>
              <p style={{ fontStyle: 'italic', color: '#fca5a5', marginTop: '4px' }}>"The final confrontation is here."</p>
            </div>

            <p className="completion-summary">
              You discovered the sources of the corruption and survived the entity's pursuit.
              Now it has retreated to the final arena, empowered and waiting.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel10 || onContinueExploring}>
                <span>CONTINUE TO LEVEL 10: THE FINAL BATTLE</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel9}>
                <span>↺ REPLAY LEVEL 9</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel8}>
                <span>← RETURN TO LEVEL 8</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 10 Completion Card */}
        {showLevel10Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(250,204,21,0.8)' }}>
                <span className="mandala-symbol">⚔️</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 10 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#facc15' }}>◆</span>
              <span className="divider-text">THE FINAL BATTLE WON</span>
              <span className="divider-diamond" style={{ color: '#facc15' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(250,204,21,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#fef08a' }}>"The darkness has been shattered."</p>
              <p style={{ fontStyle: 'italic', color: '#fef08a', marginTop: '4px' }}>"But what is this new, pure energy?"</p>
            </div>

            <p className="completion-summary">
              You used the spiritual points to drop the entity's shield, blasted its core, and delivered the final blow at the central altar. The negative entity has been destroyed... leaving behind a mysterious Divine Guardian energy.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel11 || onContinueExploring}>
                <span>CONTINUE TO LEVEL 11: THE DIVINE GUARDIAN</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel10}>
                <span>↺ REPLAY LEVEL 10</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel9}>
                <span>← RETURN TO LEVEL 9</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 11 Completion Card */}
        {showLevel11Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(255,255,255,0.8)', boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                <span className="mandala-symbol" style={{ filter: 'drop-shadow(0 0 10px white)' }}>✨</span>
              </div>
            </div>

            <h1 className="completion-main-title">LEVEL 11 COMPLETE</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#ffffff' }}>◆</span>
              <span className="divider-text">THE DIVINE GUARDIAN</span>
              <span className="divider-diamond" style={{ color: '#ffffff' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#ffffff' }}>"The Guardian has joined you."</p>
              <p style={{ fontStyle: 'italic', color: '#ffffff', marginTop: '4px' }}>"Your friend is safe."</p>
            </div>

            <p className="completion-summary">
              The darkness is gone. The positive energy of the Divine Guardian now accompanies you. It is time to leave the temple.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onStartLevel12}>
                <span>CONTINUE TO LEVEL 12: THE FINAL ESCAPE</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel11}>
                <span>↺ REPLAY LEVEL 11</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel10}>
                <span>← RETURN TO LEVEL 10</span>
              </button>
            </div>
          </div>
        )}

        {/* Level 12 Completion Card */}
        {showLevel12Card && (
          <div className="completion-card animate-scale-up">
            <div className="mandala-badge">
              <div className="mandala-circle" style={{ borderColor: 'rgba(255,255,255,0.8)', boxShadow: '0 0 30px rgba(255,215,0,0.8)' }}>
                <span className="mandala-symbol" style={{ filter: 'drop-shadow(0 0 15px gold)' }}>🌅</span>
              </div>
            </div>

            <h1 className="completion-main-title">THE END</h1>

            <div className="divider-line">
              <span className="divider-diamond" style={{ color: '#ffd700' }}>◆</span>
              <span className="divider-text">THE TEMPLE IS AT PEACE</span>
              <span className="divider-diamond" style={{ color: '#ffd700' }}>◆</span>
            </div>

            <div className="completion-subtitle-quote" style={{ borderColor: 'rgba(255,215,0,0.4)' }}>
              <p style={{ fontStyle: 'italic', color: '#ffebcd' }}>"You have done well, seeker."</p>
              <p style={{ fontStyle: 'italic', color: '#ffebcd', marginTop: '4px' }}>"The light remains, and your journey is complete."</p>
            </div>

            <p className="completion-summary">
              You and your friend have safely escaped the temple. The Divine Guardian watches over the restored sanctuary. Thank you for playing.
            </p>

            <div className="completion-actions">
              <button type="button" className="btn-level-2 btn-continue-level3" onClick={onContinueExploring}>
                <span>CONTINUE EXPLORING</span>
                <span className="arrow-icon">→</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel12}>
                <span>↺ REPLAY LEVEL 12</span>
                <span className="arrow-icon">↺</span>
              </button>

              <button type="button" className="btn-replay" onClick={onStartLevel1}>
                <span>↺ RESTART GAME</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
