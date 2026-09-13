import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/SoundManager.js';
import { gameState } from '../systems/GameState.js';

export default function CinematicIntro({ onComplete }) {
  const [step, setStep] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Step 1: "Something happened here..." at 800ms
    const t1 = setTimeout(() => setStep(1), 800);
    // Step 2: "My friend entered this temple." at 3200ms
    const t2 = setTimeout(() => setStep(2), 3400);
    // Step 3: "He never came back." at 6000ms
    const t3 = setTimeout(() => setStep(3), 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleStart = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.playHorrorStinger();

    setFadingOut(true);
    gameState.finishCinematicIntro();
    if (onComplete) onComplete();
  };

  return (
    <div className={`cinematic-intro-overlay ${fadingOut ? 'fade-out' : ''}`}>
      <div className="intro-content">
        {step >= 1 && (
          <p className={`intro-line line-1 ${step >= 1 ? 'visible' : ''}`}>
            "Something happened here..."
          </p>
        )}
        {step >= 2 && (
          <p className={`intro-line line-2 ${step >= 2 ? 'visible' : ''}`}>
            "My friend entered this temple."
          </p>
        )}
        {step >= 3 && (
          <p className={`intro-line line-3 highlight ${step >= 3 ? 'visible' : ''}`}>
            "He never came back."
          </p>
        )}

        <div className={`intro-actions ${step >= 2 ? 'visible' : ''}`}>
          <button type="button" className="enter-game-btn" onClick={handleStart}>
            <span className="pulse-diamond">◆</span>
            <span>ENTER THE TEMPLE [CLICK TO START]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
