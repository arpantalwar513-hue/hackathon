import React, { useEffect, useRef, useState } from 'react';
import { Level1Scene } from './game/Level1Scene.js';
import { Level2Scene } from './game/Level2Scene.js';
import { Level3Scene } from './game/Level3Scene.js';
import { Level4Scene } from './game/Level4Scene.js';
import { Level5Scene } from './game/Level5Scene.js';
import { Level6Scene } from './game/Level6Scene.js';
import { Level7Scene } from './game/Level7Scene.js';
import { Level8Scene } from './game/Level8Scene.js';
import { Level9Scene } from './game/Level9Scene.js';
import { Level10Scene } from './game/Level10Scene.js';
import { Level11Scene } from './game/Level11Scene.js';
import { Level12Scene } from './game/Level12Scene.js';
import { gameState } from './game/systems/GameState.js';
import { soundManager } from './game/audio/SoundManager.js';
import CinematicIntro from './game/ui/CinematicIntro.jsx';
import ObjectiveHUD from './game/ui/ObjectiveHUD.jsx';
import InteractionPrompt from './game/ui/InteractionPrompt.jsx';
import LevelTransition from './game/ui/LevelTransition.jsx';
import NoticeModal from './game/ui/NoticeModal.jsx';
import ControlsModal from './game/ui/ControlsModal.jsx';
import GuideDialogueHUD from './game/ui/GuideDialogueHUD.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  // Synced Game State
  const [appState, setAppState] = useState(gameState.getState());
  const [showControls, setShowControls] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    // Subscribe to central reactive GameState
    const unsubscribe = gameState.subscribe((newState) => {
      setAppState(newState);
    });

    return () => unsubscribe();
  }, []);

  // Track Pointer Lock state on the document/canvas
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      setIsPointerLocked(locked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Instantiate the active scene whenever currentLevel changes
  useEffect(() => {
    if (!canvasRef.current) return;

    if (sceneRef.current) {
      sceneRef.current.destroy();
      sceneRef.current = null;
    }

    let scene;
    if (appState.currentLevel === 12) {
      scene = new Level12Scene(canvasRef.current);
    } else if (appState.currentLevel === 11) {
      scene = new Level11Scene(canvasRef.current);
    } else if (appState.currentLevel === 10) {
      scene = new Level10Scene(canvasRef.current);
    } else if (appState.currentLevel === 9) {
      scene = new Level9Scene(canvasRef.current);
    } else if (appState.currentLevel === 8) {
      scene = new Level8Scene(canvasRef.current);
    } else if (appState.currentLevel === 7) {
      scene = new Level7Scene(canvasRef.current);
    } else if (appState.currentLevel === 6) {
      scene = new Level6Scene(canvasRef.current);
    } else if (appState.currentLevel === 5) {
      scene = new Level5Scene(canvasRef.current);
    } else if (appState.currentLevel === 4) {
      scene = new Level4Scene(canvasRef.current);
    } else if (appState.currentLevel === 3) {
      scene = new Level3Scene(canvasRef.current);
    } else if (appState.currentLevel === 2) {
      scene = new Level2Scene(canvasRef.current);
    } else {
      scene = new Level1Scene(canvasRef.current);
    }
    sceneRef.current = scene;

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, [appState.currentLevel]);

  const handleResumeGame = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    soundManager.init();
    soundManager.resume();
    setAudioStarted(true);
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleCloseNotice = () => {
    gameState.closeNotice();
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleCloseScrollModal = () => {
    gameState.closeScrollModal();
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleCloseAICompanion = () => {
    gameState.closeAICompanion();
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleReplay = () => {
    if (appState.currentLevel === 7) {
      gameState.startLevel7();
    } else if (appState.currentLevel === 6) {
      gameState.startLevel6();
    } else if (appState.currentLevel === 5) {
      gameState.startLevel5();
    } else if (appState.currentLevel === 4) {
      gameState.startLevel4();
    } else if (appState.currentLevel === 3) {
      gameState.startLevel3();
    } else if (appState.currentLevel === 2) {
      gameState.startLevel2();
    } else {
      gameState.reset();
    }
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleStartLevel6 = () => {
    gameState.startLevel6();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel7 = () => {
    gameState.startLevel7();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel8 = () => {
    gameState.startLevel8();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel10 = () => {
    gameState.startLevel10();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel11 = () => {
    gameState.startLevel11();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel12 = () => {
    gameState.startLevel12();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel9 = () => {
    gameState.startLevel9();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel5 = () => {
    gameState.startLevel5();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel4 = () => {
    gameState.startLevel4();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel3 = () => {
    gameState.startLevel3();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel2 = () => {
    gameState.startLevel2();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleStartLevel1 = () => {
    gameState.reset();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }
    }, 60);
  };

  const handleSwitchLevel = (lvl) => {
    if (lvl === 11) {
      handleStartLevel11();
    } else if (lvl === 10) {
      handleStartLevel10();
    } else if (lvl === 9) {
      handleStartLevel9();
    } else if (lvl === 8) {
      handleStartLevel8();
    } else if (lvl === 7) {
      handleStartLevel7();
    } else if (lvl === 6) {
      handleStartLevel6();
    } else if (lvl === 5) {
      handleStartLevel5();
    } else if (lvl === 4) {
      handleStartLevel4();
    } else if (lvl === 3) {
      handleStartLevel3();
    } else if (lvl === 2) {
      handleStartLevel2();
    } else {
      handleStartLevel1();
    }
  };

  const handleToggleDayNight = () => {
    if (sceneRef.current && typeof sceneRef.current.toggleDayNight === 'function') {
      sceneRef.current.toggleDayNight();
    } else {
      gameState.setToast('Interior hall is shrouded in temple night.');
    }
  };

  const handleContinueExploring = () => {
    gameState.set({ cinematicOutroActive: false });
    if (sceneRef.current && sceneRef.current.player) {
      sceneRef.current.player.canMove = true;
    }
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleGuideChoice = (key) => {
    gameState.handleGuideChoice(key);
    setTimeout(() => {
      if (canvasRef.current && !document.pointerLockElement) {
        canvasRef.current.requestPointerLock();
      }
    }, 400);
  };

  const isModalOpen = showControls || appState.activeNotice;

  return (
    <div className="game-container">
      {/* 3D WebGL Canvas - Dynamic key forces clean context recreation on level change */}
      <canvas
        key={`game-canvas-lvl-${appState.currentLevel}`}
        ref={canvasRef}
        className="webgl-canvas"
      />

      {/* Atmospheric Vignette & Soft Scanlines */}
      <div className={`vignette-overlay ${appState.isDayMode ? 'day-mode' : 'night-mode'}`} />
      <div className="scanlines-overlay" />

      {/* Phase 1: Cinematic Introductory Narrative Sequence */}
      {appState.cinematicIntroActive && (
        <CinematicIntro
          onComplete={() => {
            setAudioStarted(true);
            if (canvasRef.current) {
              canvasRef.current.requestPointerLock();
            }
          }}
        />
      )}

      {/* Main HUD during gameplay */}
      {!appState.cinematicIntroActive && !appState.cinematicOutroActive && (
        <>
          <ObjectiveHUD
            currentLevel={appState.currentLevel}
            levelTitle={appState.levelTitle}
            objective={appState.currentObjective}
            distanceToTemple={appState.distanceToTemple}
            hasKey={appState.hasTempleKey}
            hasFlashlight={appState.hasFlashlight}
            cluesCount={(appState.clueFootprintsFound ? 1 : 0) + (appState.friendItemFound ? 1 : 0) + (appState.wallSymbolFound ? 1 : 0)}
            mechanismsCount={(appState.mechanism1Activated ? 1 : 0) + (appState.mechanism2Activated ? 1 : 0) + (appState.mechanism3Activated ? 1 : 0)}
            secretPassageOpened={appState.secretPassageOpened}
            friendObjectFound={appState.friendObjectFound}
            wallSymbolFoundL3={appState.wallSymbolExaminedL3}
            innerDoorOpenedL3={appState.innerDoorOpenedL3}
            entityChasingL3={appState.entityChasingL3}
            grimoireExaminedL4={appState.grimoireExaminedL4}
            sanctuarySealsCount={(appState.mechanism1ActivatedL4 ? 1 : 0) + (appState.mechanism2ActivatedL4 ? 1 : 0)}
            relicPurgedL4={appState.relicPurgedL4}
            sanctuaryGateOpenedL4={appState.sanctuaryGateOpenedL4}
            entityChasingL4={appState.entityChasingL4}
            symbolsCountL5={(appState.symbolAFound ? 1 : 0) + (appState.symbolBFound ? 1 : 0) + (appState.symbolCFound ? 1 : 0)}
            mechanismsCountL5={(appState.mechanismAActivated ? 1 : 0) + (appState.mechanismBActivated ? 1 : 0) + (appState.mechanismCActivated ? 1 : 0)}
            innerChamberOpenedL5={appState.innerChamberOpened || appState.ancientChamberUnlocked}
            guideStatusL5={appState.currentGuideState || 'OBSERVING'}
            entityNearbyL5={appState.entityNearbyL5}
            sealedDoorOpenedL6={appState.sealedDoorOpened}
            friendLocatedL6={appState.friendLocated}
            symbolsCountL7={(appState.symbolAFoundL7 ? 1 : 0) + (appState.symbolBFoundL7 ? 1 : 0) + (appState.symbolCFoundL7 ? 1 : 0)}
            mechanismsCountL7={(appState.mechanismAActivatedL7 ? 1 : 0) + (appState.mechanismBActivatedL7 ? 1 : 0) + (appState.mechanismCActivatedL7 ? 1 : 0)}
            archiveOpenedL7={appState.archiveOpened}
            scrollFoundL7={appState.ancientScrollFound}
            spiritualPowerRestoredL7={appState.spiritualPowerRestored}
            nodesActivatedL8={(appState.nodeAActivatedL8 ? 1 : 0) + (appState.nodeBActivatedL8 ? 1 : 0) + (appState.nodeCActivatedL8 ? 1 : 0)}
            altarStabilizedL8={appState.altarStabilizedL8}
            friendFoundL8={appState.friendFoundL8}
            sourcesDiscoveredL9={(appState.negativeSource1Discovered ? 1 : 0) + (appState.negativeSource2Discovered ? 1 : 0) + (appState.negativeSource3Discovered ? 1 : 0)}
            entityEmpoweredL9={appState.entityEmpowered}
            bossHealthL10={appState.bossHealth}
            bossShieldStrengthL10={appState.bossShieldStrength}
            bossCoreExposedL10={appState.bossCoreExposed || appState.finalCoreExposed}
            bossDefeatedL10={appState.bossDefeated}
            activeSpiritualPointsL10={(appState.spiritualPointAActivated ? 1 : 0) + (appState.spiritualPointBActivated ? 1 : 0) + (appState.spiritualPointCActivated ? 1 : 0)}
            guardianJoinedL11={appState.guardianJoined}
            friendRecoveredL11={appState.friendRecovered}
            finalExitReachedL12={appState.finalExitReached}
            guardianStayedBehindL12={appState.guardianStayedBehind}
            friendsEscapedL12={appState.friendsEscaped}
            toastMessage={appState.toastMessage}
            isDayMode={appState.isDayMode}
            onToggleDayNight={handleToggleDayNight}
            onToggleControls={() => setShowControls(true)}
            onSwitchLevel={handleSwitchLevel}
          />

          <InteractionPrompt prompt={appState.interactionPrompt} />
        </>
      )}

      {/* Pause / Click to Enter Overlay when pointer lock is released and no modal is open */}
      {!isPointerLocked &&
        !appState.cinematicIntroActive &&
        !appState.cinematicOutroActive &&
        !isModalOpen && (
          <div className="game-pause-overlay" onClick={handleResumeGame}>
            <div className="pause-card" onClick={(e) => e.stopPropagation()}>
              <div className="pause-badge">GAME READY • CLICK TO PLAY</div>
              <h2 className="pause-title">
                {appState.currentLevel === 12
                  ? 'LEVEL 12: THE FINAL ESCAPE'
                  : appState.currentLevel === 11
                  ? 'LEVEL 11: THE DIVINE GUARDIAN'
                  : appState.currentLevel === 10
                  ? 'LEVEL 10: THE FINAL BATTLE'
                  : appState.currentLevel === 9
                  ? 'LEVEL 9: THE NEGATIVE ENTITY'
                  : appState.currentLevel === 8
                  ? 'LEVEL 8: RESTORATION OF SPIRITUAL POWER'
                  : appState.currentLevel === 7
                  ? 'LEVEL 7: THE ANCIENT SCROLL'
                  : appState.currentLevel === 6
                  ? 'LEVEL 6: FINDING THE FRIEND'
                  : appState.currentLevel === 5
                  ? 'LEVEL 5: THE UNKNOWN GUIDE'
                  : appState.currentLevel === 4
                  ? 'LEVEL 4: THE CORRUPTED SANCTUARY'
                  : appState.currentLevel === 3
                  ? 'LEVEL 3: THE HIDDEN PATH'
                  : appState.currentLevel === 2
                  ? 'LEVEL 2: THE FORGOTTEN HALL'
                  : 'LEVEL 1: THE TEMPLE KEY'}
              </h2>
              <p className="pause-subtitle">
                {appState.currentLevel === 12
                  ? 'The sun rises over the peaceful temple. It is time to leave.'
                  : appState.currentLevel === 11
                  ? 'The temple is quiet. Check on your friend and investigate the positive energy.'
                  : appState.currentLevel === 10
                  ? 'The negative entity\'s shield is too strong. Use the spiritual points and the central altar to defeat it once and for all.'
                  : appState.currentLevel === 9
                  ? 'The negative energy is gathering. Investigate the sources and survive the entity.'
                  : appState.currentLevel === 8
                  ? 'Defeat the Corrupted Temple Guardian in combat and recover the Spiritual Relic.'
                  : appState.currentLevel === 7
                  ? 'Decode the ancient scroll, awaken the sacred symbols, and restore the temple altar.'
                  : appState.currentLevel === 6
                  ? 'Follow clues into the catacombs, align the rotary seal, and find your trapped friend.'
                  : appState.currentLevel === 5
                  ? 'Enter the hidden chamber and meet the unknown guide.'
                  : appState.currentLevel === 4
                  ? 'Read the ancient grimoire, break the dual wing mechanisms, purge the corrupted core, and survive the stalking entities.'
                  : appState.currentLevel === 3
                  ? 'Descend into the dark crypt, follow the clues left by your friend, and survive the entity in the shadows.'
                  : appState.currentLevel === 2
                  ? 'Explore the colonnade hall, uncover clues, and activate the three mechanisms to reveal the secret passage.'
                  : 'Explore the illuminated courtyard, retrieve the ancient key, and unlock the sacred gates of Shri Maa Sheetla Devi Mandir.'}
              </p>

              <div className="pause-level-buttons">
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 1 ? 'active' : ''}`}
                  onClick={() => handleStartLevel1()}
                >
                  PLAY LEVEL 1
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 2 ? 'active' : ''}`}
                  onClick={() => handleStartLevel2()}
                >
                  PLAY LEVEL 2
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 3 ? 'active' : ''}`}
                  onClick={() => handleStartLevel3()}
                >
                  PLAY LEVEL 3
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 4 ? 'active' : ''}`}
                  onClick={() => handleStartLevel4()}
                >
                  PLAY LEVEL 4
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 5 ? 'active' : ''}`}
                  onClick={() => handleStartLevel5()}
                >
                  PLAY LEVEL 5
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 6 ? 'active' : ''}`}
                  onClick={() => handleStartLevel6()}
                >
                  PLAY LEVEL 6
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 7 ? 'active' : ''}`}
                  onClick={() => handleStartLevel7()}
                >
                  PLAY LEVEL 7
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 8 ? 'active' : ''}`}
                  onClick={() => handleStartLevel8()}
                >
                  PLAY LEVEL 8
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 9 ? 'active' : ''}`}
                  onClick={() => handleStartLevel9()}
                >
                  PLAY LEVEL 9
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 10 ? 'active' : ''}`}
                  onClick={() => handleStartLevel10()}
                >
                  PLAY LEVEL 10
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 11 ? 'active' : ''}`}
                  onClick={() => handleStartLevel11()}
                >
                  PLAY LEVEL 11
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 12 ? 'active' : ''}`}
                  onClick={() => handleStartLevel12()}
                >
                  PLAY LEVEL 12
                </button>
                <button
                  type="button"
                  className={`btn-pause-lvl ${appState.currentLevel === 11 ? 'active' : ''}`}
                  onClick={() => handleStartLevel11()}
                >
                  PLAY LEVEL 11
                </button>
              </div>

              <div className="pause-click-prompt" onClick={handleResumeGame}>
                <span className="pulse-diamond">◆</span>
                <span>CLICK TO ENTER & RESUME</span>
              </div>

              <div className="pause-controls-hint">
                <span><strong>WASD</strong> Move</span>
                <span><strong>Mouse</strong> Look</span>
                <span><strong>Shift</strong> Sprint</span>
                <span><strong>Space</strong> Jump</span>
                <span><strong>E</strong> Interact</span>
                <span><strong>Esc</strong> Pause</span>
              </div>
            </div>
          </div>
        )}

      {/* Level Completion & Cinematic Outro */}
      <LevelTransition
        active={appState.cinematicOutroActive}
        cinematicText={appState.cinematicText}
        currentLevel={appState.currentLevel}
        onReplay={handleReplay}
        onStartLevel1={handleStartLevel1}
        onStartLevel2={handleStartLevel2}
        onStartLevel3={handleStartLevel3}
        onStartLevel4={handleStartLevel4}
        onStartLevel5={handleStartLevel5}
        onStartLevel6={handleStartLevel6}
        onStartLevel7={handleStartLevel7}
        onStartLevel8={handleStartLevel8}
        onStartLevel9={handleStartLevel9}
        onStartLevel10={handleStartLevel10}
        onStartLevel11={handleStartLevel11}
        onStartLevel12={handleStartLevel12}
        onContinueExploring={handleContinueExploring}
      />

      {/* Notice Board Modal */}
      <NoticeModal notice={appState.activeNotice} onClose={handleCloseNotice} />

      {/* Controls Modal */}
      <ControlsModal
        isOpen={showControls}
        currentLevel={appState.currentLevel}
        onClose={() => setShowControls(false)}
      />

      {/* Level 5 to 12: Guide Dialogue HUD */}
      {(appState.currentLevel >= 5 && appState.currentLevel <= 12) && appState.activeGuideDialogue && (
        <GuideDialogueHUD
          dialogue={appState.activeGuideDialogue}
          onChoice={handleGuideChoice}
        />
      )}
    </div>
  );
}
