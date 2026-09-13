/**
 * GuideDialogueHUD — Minimal cinematic dialogue panel for the Unknown Guide.
 *
 * NOT a chatbot window. This is a bottom-screen, film-style dialogue overlay
 * that shows the guide's dialogue with 1-3 player response choices.
 *
 * Reads gameState.activeGuideDialogue:
 *   { speakerName, message, choices: [{label, key}] }
 *
 * Dispatches choices back via gameState.handleGuideChoice(key)
 */
import React, { useState, useEffect, useRef } from 'react';
import { gameState } from '../systems/GameState.js';

export default function GuideDialogueHUD({ dialogue, onChoice }) {
  const [displayedText, setDisplayedText] = useState('');
  const [textComplete, setTextComplete] = useState(false);
  const [visible, setVisible] = useState(false);
  const typewriterRef = useRef(null);
  const autoDismissRef = useRef(null);

  // Animate in when dialogue appears
  useEffect(() => {
    if (!dialogue) {
      setVisible(false);
      setDisplayedText('');
      setTextComplete(false);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      return;
    }

    setVisible(true);
    setTextComplete(false);

    // Typewriter effect for the message
    let i = 0;
    const msg = dialogue.message || '';
    setDisplayedText('');

    if (typewriterRef.current) clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(msg.slice(0, i));
      if (i >= msg.length) {
        clearInterval(typewriterRef.current);
        setTextComplete(true);

        // Auto-dismiss after 10 seconds if no choices or choices not clicked
        if (!dialogue.choices || dialogue.choices.length === 0) {
          if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
          autoDismissRef.current = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onChoice('auto_dismiss'), 400);
          }, 5000);
        }
      }
    }, 28); // 28ms per character — cinematic pace

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [dialogue]);

  if (!dialogue) return null;

  const handleChoiceClick = (key) => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    setVisible(false);
    setTimeout(() => onChoice(key), 350); // Wait for fade-out
  };

  // Skip typewriter and show full text immediately
  const handleSkipTyping = () => {
    if (!textComplete && dialogue?.message) {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setDisplayedText(dialogue.message);
      setTextComplete(true);
    }
  };

  return (
    <div
      className={`guide-dialogue-root ${visible ? 'guide-dialogue-visible' : 'guide-dialogue-hidden'}`}
      onClick={handleSkipTyping}
    >
      {/* Side accent line */}
      <div className="guide-dialogue-accent-line" />

      {/* Speaker name */}
      <div className="guide-speaker-row">
        <span className="guide-speaker-dot" />
        <span className="guide-speaker-name">{dialogue.speakerName || 'UNKNOWN GUIDE'}</span>
        <span className="guide-speaker-divider">—</span>
      </div>

      {/* Dialogue text */}
      <div className="guide-dialogue-text">
        {displayedText}
        {!textComplete && <span className="guide-cursor">▌</span>}
      </div>

      {/* Player response choices (only shown when typewriter is complete) */}
      {textComplete && dialogue.choices && dialogue.choices.length > 0 && (
        <div className="guide-choices-row">
          {dialogue.choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              className="guide-choice-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleChoiceClick(choice.key);
              }}
            >
              <span className="guide-choice-arrow">›</span>
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Continue hint */}
      {textComplete && (!dialogue.choices || dialogue.choices.length === 0) && (
        <div className="guide-continue-hint">[ Click anywhere to continue ]</div>
      )}
    </div>
  );
}
