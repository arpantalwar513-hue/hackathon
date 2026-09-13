import React from 'react';

export default function ObjectiveHUD({
  currentLevel = 1,
  levelTitle = 'LEVEL 1: THE TEMPLE KEY',
  objective,
  distanceToTemple,
  hasKey,
  hasFlashlight,
  cluesCount = 0,
  mechanismsCount = 0,
  secretPassageOpened = false,
  friendObjectFound = false,
  wallSymbolFoundL3 = false,
  innerDoorOpenedL3 = false,
  entityChasingL3 = false,
  grimoireExaminedL4 = false,
  sanctuarySealsCount = 0,
  relicPurgedL4 = false,
  sanctuaryGateOpenedL4 = false,
  entityChasingL4 = false,
  symbolsCountL5 = 0,
  mechanismsCountL5 = 0,
  innerChamberOpenedL5 = false,
  guideStatusL5 = 'OBSERVING',
  entityNearbyL5 = false,
  // Level 6 & 7
  sealedDoorOpenedL6 = false,
  friendLocatedL6 = false,
  symbolsCountL7 = 0,
  mechanismsCountL7 = 0,
  archiveOpenedL7 = false,
  scrollFoundL7 = false,
  spiritualPowerRestoredL7 = 0,
  // Level 8
  playerHealthL8 = 100,
  bossHealthL8 = 100,
  guardianAwakenedL8 = false,
  relicCollectedL8 = false,
  // Level 9
  sourcesDiscoveredL9 = 0,
  entityEmpoweredL9 = false,
  // Level 10
  bossHealthL10 = 100,
  bossShieldStrengthL10 = 100,
  bossCoreExposedL10 = false,
  bossDefeatedL10 = false,
  activeSpiritualPointsL10 = 0,
  // Level 11
  guardianJoinedL11 = false,
  friendRecoveredL11 = false,
  // Level 12
  finalExitReachedL12 = false,
  guardianStayedBehindL12 = false,
  friendsEscapedL12 = false,
  toastMessage,
  isDayMode = false,
  onToggleDayNight,
  onToggleControls,
  onSwitchLevel,
}) {
  return (
    <div className="objective-hud-root">
      {/* Top Header: Objective & Inventory / Level Status */}
      <header className="hud-top-bar">
        {/* Left: Objective Panel */}
        <div className="objective-card">
          <div className="objective-badge">
            <span className="diamond-bullet">◆</span>
            <span>{levelTitle || (currentLevel === 11 ? 'LEVEL 11: THE DIVINE GUARDIAN' : currentLevel === 10 ? 'LEVEL 10: THE FINAL BATTLE' : currentLevel === 9 ? 'LEVEL 9: THE NEGATIVE ENTITY' : currentLevel === 8 ? 'LEVEL 8: RESTORATION OF SPIRITUAL POWER' : currentLevel === 7 ? 'LEVEL 7: THE ANCIENT SCROLL' : currentLevel === 6 ? 'LEVEL 6: FINDING THE FRIEND' : currentLevel === 5 ? 'LEVEL 5: THE UNKNOWN GUIDE' : currentLevel === 4 ? 'LEVEL 4: THE CORRUPTED SANCTUARY' : currentLevel === 3 ? 'LEVEL 3: THE HIDDEN PATH' : currentLevel === 2 ? 'LEVEL 2: THE ANCIENT TEMPLE EXPLORATION' : 'LEVEL 1: THE TEMPLE KEY')}</span>
          </div>
          <h2 className="objective-title">{objective}</h2>

          {currentLevel === 1 && distanceToTemple > 0 && (
            <div className="objective-distance">
              <span className="distance-icon">📍</span>
              <span className="distance-val">{distanceToTemple}m to Temple</span>
            </div>
          )}

          {currentLevel === 2 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${secretPassageOpened ? 'green' : 'amber'}`} />
                <span>{secretPassageOpened ? 'Secret Passage: OPEN' : 'Secret Passage: SEALED'}</span>
              </span>
            </div>
          )}

          {currentLevel === 3 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${entityChasingL3 ? 'red pulsing' : innerDoorOpenedL3 ? 'green' : 'amber'}`} />
                <span>{entityChasingL3 ? 'ENTITY PURSUIT: ESCAPE!' : innerDoorOpenedL3 ? 'Inner Door: OPEN' : 'Crypt Passage: ACTIVE'}</span>
              </span>
            </div>
          )}

          {currentLevel === 4 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${entityChasingL4 ? 'red pulsing' : relicPurgedL4 ? 'cyan' : sanctuarySealsCount >= 2 ? 'green' : 'amber'}`} />
                <span>{entityChasingL4 ? 'STALKER PURSUIT: ESCAPE!' : relicPurgedL4 ? 'Sanctuary Gate: UNSEALED' : sanctuarySealsCount >= 2 ? 'Corrupted Relic: VULNERABLE' : 'Corrupted Sanctuary: ACTIVE'}</span>
              </span>
            </div>
          )}

          {currentLevel === 5 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${entityNearbyL5 ? 'red pulsing' : innerChamberOpenedL5 ? 'green' : 'cyan'}`} />
                <span>{entityNearbyL5 ? 'DANGER: ENTITY DETECTED' : innerChamberOpenedL5 ? 'Inner Chamber: UNSEALED' : mechanismsCountL5 >= 3 ? 'Mechanisms: ALL ENGAGED' : 'Hidden Chamber: EXPLORING'}</span>
              </span>
            </div>
          )}

          {currentLevel === 6 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${friendLocatedL6 ? 'green' : sealedDoorOpenedL6 ? 'cyan' : 'amber'}`} />
                <span>{friendLocatedL6 ? 'Friend: LOCATED (TRAPPED)' : sealedDoorOpenedL6 ? 'Sanctum Gate: UNSEALED' : 'Catacomb: FOLLOWING TRAIL'}</span>
              </span>
            </div>
          )}

          {currentLevel === 7 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${spiritualPowerRestoredL7 > 0 ? 'cyan' : archiveOpenedL7 ? 'green' : 'amber'}`} />
                <span>{spiritualPowerRestoredL7 > 0 ? `Spiritual Energy: ${spiritualPowerRestoredL7}% RESTORED` : archiveOpenedL7 ? 'Archive Gate: UNSEALED' : 'Ancient Archive: EXPLORING'}</span>
              </span>
            </div>
          )}

          {currentLevel === 8 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${relicCollectedL8 ? 'green' : guardianAwakenedL8 ? 'red pulsing' : 'cyan'}`} />
                <span>{relicCollectedL8 ? 'Relic: SECURED' : guardianAwakenedL8 ? 'Combat: IN PROGRESS' : 'Guardian: DORMANT'}</span>
              </span>
            </div>
          )}

          {currentLevel === 9 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${entityEmpoweredL9 ? 'red pulsing' : sourcesDiscoveredL9 === 3 ? 'cyan' : 'amber'}`} />
                <span>{entityEmpoweredL9 ? 'DANGER: ENTITY EMPOWERED' : sourcesDiscoveredL9 === 3 ? 'Core Discovered' : 'Energy Sources: INVESTIGATING'}</span>
              </span>
            </div>
          )}

          {currentLevel === 10 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${bossDefeatedL10 ? 'cyan' : bossCoreExposedL10 ? 'green pulsing' : 'red pulsing'}`} />
                <span>{bossDefeatedL10 ? 'ENTITY DEFEATED' : bossCoreExposedL10 ? 'CORE EXPOSED - ATTACK!' : 'SHIELD ACTIVE'}</span>
              </span>
            </div>
          )}

          {currentLevel === 11 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${guardianJoinedL11 ? 'cyan' : 'amber'}`} />
                <span>{guardianJoinedL11 ? 'GUARDIAN ALLY' : 'POSITIVE ENERGY DETECTED'}</span>
              </span>
            </div>
          )}

          {currentLevel === 12 && (
            <div className="objective-sub-status">
              <span className="sub-status-item">
                <span className={`status-dot ${finalExitReachedL12 ? 'cyan' : 'green pulsing'}`} />
                <span>{finalExitReachedL12 ? 'ESCAPED' : 'EXIT PORTAL OPEN'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Center: Level Switcher Pills */}
        <div className="hud-level-switcher">
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 1 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(1)}
            title="Switch to Level 1: The Temple Key"
          >
            <span>LEVEL 1</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 2 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(2)}
            title="Switch to Level 2: The Ancient Temple Exploration"
          >
            <span>LEVEL 2</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 3 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(3)}
            title="Switch to Level 3: The Hidden Path"
          >
            <span>LEVEL 3</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 4 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(4)}
            title="Switch to Level 4: The Corrupted Sanctuary"
          >
            <span>LEVEL 4</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 5 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(5)}
            title="Switch to Level 5: The Unknown Guide"
          >
            <span>LEVEL 5</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 6 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(6)}
            title="Switch to Level 6: Finding the Friend"
          >
            <span>LEVEL 6</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 7 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(7)}
            title="Switch to Level 7: The Ancient Scroll"
          >
            <span>LEVEL 7</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 8 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(8)}
            title="Switch to Level 8: Restoration of Spiritual Power"
          >
            <span>LEVEL 8</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 9 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(9)}
            title="Switch to Level 9: The Negative Entity"
          >
            <span>LEVEL 9</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 10 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(10)}
            title="Switch to Level 10: The Final Battle"
          >
            <span>LEVEL 10</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 11 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(11)}
            title="Switch to Level 11: The Divine Guardian"
          >
            <span>LEVEL 11</span>
          </button>
          <button
            type="button"
            className={`level-pill-btn ${currentLevel === 12 ? 'active' : ''}`}
            onClick={() => onSwitchLevel(12)}
            title="Switch to Level 12: The Final Escape"
          >
            <span>LEVEL 12</span>
          </button>
        </div>

        {/* Right: Inventory & Level Status Tray */}
        <div className="inventory-tray">
          {currentLevel === 1 && (
            <>
              <button
                type="button"
                className={`hud-mode-toggle-btn ${isDayMode ? 'day' : 'night'}`}
                onClick={onToggleDayNight}
                title="Toggle Day/Night Mode [Hotkey: N]"
              >
                <span className="mode-icon">{isDayMode ? '☀️' : '🌙'}</span>
                <span className="mode-label">{isDayMode ? 'DAY MODE' : 'NIGHT MODE'}</span>
                <span className="key-shortcut">[N]</span>
              </button>

              <div className={`inv-slot ${hasKey ? 'active' : 'empty'}`}>
                <span className="inv-icon">🗝️</span>
                <div className="inv-meta">
                  <span className="inv-name">TEMPLE KEY</span>
                  <span className="inv-status">{hasKey ? 'FOUND' : 'MISSING'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 2 && (
            <>
              <div className="hud-daylight-pill" title="Level 2 Daytime Natural Lighting">
                <span className="daylight-icon">☀️</span>
                <span className="daylight-label">DAYLIGHT TEMPLE</span>
              </div>

              <div className={`inv-slot ${cluesCount >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔍</span>
                <div className="inv-meta">
                  <span className="inv-name">CLUES</span>
                  <span className="inv-status">{cluesCount} / 3 FOUND</span>
                </div>
              </div>

              <div className={`inv-slot ${mechanismsCount >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">⚙️</span>
                <div className="inv-meta">
                  <span className="inv-name">MECHANISMS</span>
                  <span className="inv-status">{mechanismsCount} / 3 ACTIVE</span>
                </div>
              </div>

              <div className={`inv-slot ${secretPassageOpened ? 'active' : 'empty'}`}>
                <span className="inv-icon">🚪</span>
                <div className="inv-meta">
                  <span className="inv-name">SECRET DOOR</span>
                  <span className="inv-status">{secretPassageOpened ? 'OPEN' : 'SEALED'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 3 && (
            <>
              <div className={`inv-slot ${friendObjectFound ? 'active' : 'empty'}`}>
                <span className="inv-icon">⏱️</span>
                <div className="inv-meta">
                  <span className="inv-name">FRIEND'S WATCH</span>
                  <span className="inv-status">{friendObjectFound ? 'FOUND' : 'MISSING'}</span>
                </div>
              </div>

              <div className={`inv-slot ${wallSymbolFoundL3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">👁️</span>
                <div className="inv-meta">
                  <span className="inv-name">WALL SYMBOL</span>
                  <span className="inv-status">{wallSymbolFoundL3 ? 'DECIPHERED' : 'HIDDEN'}</span>
                </div>
              </div>

              <div className={`inv-slot ${innerDoorOpenedL3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🚪</span>
                <div className="inv-meta">
                  <span className="inv-name">INNER DOOR</span>
                  <span className="inv-status">{innerDoorOpenedL3 ? 'UNSEALED' : 'LOCKED'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 4 && (
            <>
              <div className={`inv-slot ${grimoireExaminedL4 ? 'active' : 'empty'}`}>
                <span className="inv-icon">📖</span>
                <div className="inv-meta">
                  <span className="inv-name">ANCIENT TOME</span>
                  <span className="inv-status">{grimoireExaminedL4 ? 'DECIPHERED' : 'UNREAD'}</span>
                </div>
              </div>

              <div className={`inv-slot ${sanctuarySealsCount >= 2 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔱</span>
                <div className="inv-meta">
                  <span className="inv-name">WING SEALS</span>
                  <span className="inv-status">{sanctuarySealsCount} / 2 BROKEN</span>
                </div>
              </div>

              <div className={`inv-slot ${relicPurgedL4 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔮</span>
                <div className="inv-meta">
                  <span className="inv-name">CORRUPTED CORE</span>
                  <span className="inv-status">{relicPurgedL4 ? 'PURGED' : 'PULSATING'}</span>
                </div>
              </div>

              <div className={`inv-slot ${sanctuaryGateOpenedL4 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🚪</span>
                <div className="inv-meta">
                  <span className="inv-name">SANCTUARY GATE</span>
                  <span className="inv-status">{sanctuaryGateOpenedL4 ? 'UNSEALED' : 'LOCKED'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 5 && (
            <>
              <div className={`inv-slot ${symbolsCountL5 >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔮</span>
                <div className="inv-meta">
                  <span className="inv-name">ANCIENT SYMBOLS</span>
                  <span className="inv-status">{symbolsCountL5} / 3 FOUND</span>
                </div>
              </div>

              <div className={`inv-slot ${mechanismsCountL5 >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">⚙️</span>
                <div className="inv-meta">
                  <span className="inv-name">MECHANISMS</span>
                  <span className="inv-status">{mechanismsCountL5} / 3 ACTIVE</span>
                </div>
              </div>

              <div className={`inv-slot ${innerChamberOpenedL5 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🚪</span>
                <div className="inv-meta">
                  <span className="inv-name">INNER CHAMBER</span>
                  <span className="inv-status">{innerChamberOpenedL5 ? 'OPEN' : 'SEALED'}</span>
                </div>
              </div>

              <div className="inv-slot active">
                <span className="inv-icon">👁️</span>
                <div className="inv-meta">
                  <span className="inv-name">UNKNOWN GUIDE</span>
                  <span className="inv-status">{guideStatusL5}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 6 && (
            <>
              <div className={`inv-slot ${friendObjectFound ? 'active' : 'empty'}`}>
                <span className="inv-icon">🧭</span>
                <div className="inv-meta">
                  <span className="inv-name">FRIEND'S OBJECT</span>
                  <span className="inv-status">{friendObjectFound ? 'FOUND' : 'SEARCHING'}</span>
                </div>
              </div>

              <div className={`inv-slot ${sealedDoorOpenedL6 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🚪</span>
                <div className="inv-meta">
                  <span className="inv-name">SANCTUM GATE</span>
                  <span className="inv-status">{sealedDoorOpenedL6 ? 'UNSEALED' : 'SEALED'}</span>
                </div>
              </div>

              <div className={`inv-slot ${friendLocatedL6 ? 'active' : 'empty'}`}>
                <span className="inv-icon">👤</span>
                <div className="inv-meta">
                  <span className="inv-name">MISSING FRIEND</span>
                  <span className="inv-status">{friendLocatedL6 ? 'LOCATED' : 'MISSING'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 7 && (
            <>
              <div className={`inv-slot ${symbolsCountL7 >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔮</span>
                <div className="inv-meta">
                  <span className="inv-name">ARCHIVE SYMBOLS</span>
                  <span className="inv-status">{symbolsCountL7} / 3 FOUND</span>
                </div>
              </div>

              <div className={`inv-slot ${mechanismsCountL7 >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">⚙️</span>
                <div className="inv-meta">
                  <span className="inv-name">MECHANISMS</span>
                  <span className="inv-status">{mechanismsCountL7} / 3 ACTIVE</span>
                </div>
              </div>

              <div className={`inv-slot ${scrollFoundL7 ? 'active' : 'empty'}`}>
                <span className="inv-icon">📜</span>
                <div className="inv-meta">
                  <span className="inv-name">ANCIENT SCROLL</span>
                  <span className="inv-status">{scrollFoundL7 ? 'DECODED' : 'SEARCHING'}</span>
                </div>
              </div>

              <div className={`inv-slot ${spiritualPowerRestoredL7 > 0 ? 'active' : 'empty'}`}>
                <span className="inv-icon">✨</span>
                <div className="inv-meta">
                  <span className="inv-name">SPIRITUAL ENERGY</span>
                  <span className="inv-status">{spiritualPowerRestoredL7 > 0 ? `${spiritualPowerRestoredL7}%` : 'CORRUPTED'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 8 && (
            <>
              <div className={`inv-slot ${playerHealthL8 > 0 ? 'active' : 'empty'}`}>
                <span className="inv-icon">❤️</span>
                <div className="inv-meta">
                  <span className="inv-name">PLAYER HEALTH</span>
                  <span className="inv-status">{Math.floor(playerHealthL8)} / 100</span>
                </div>
              </div>

              <div className={`inv-slot ${bossHealthL8 > 0 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🗡️</span>
                <div className="inv-meta">
                  <span className="inv-name">BOSS HEALTH</span>
                  <span className="inv-status">{Math.floor(bossHealthL8)}%</span>
                </div>
              </div>

              <div className={`inv-slot ${relicCollectedL8 ? 'active' : 'empty'}`}>
                <span className="inv-icon">✨</span>
                <div className="inv-meta">
                  <span className="inv-name">SPIRITUAL RELIC</span>
                  <span className="inv-status">{relicCollectedL8 ? 'RECOVERED' : 'MISSING'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 9 && (
            <>
              <div className={`inv-slot ${sourcesDiscoveredL9 > 0 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔮</span>
                <div className="inv-meta">
                  <span className="inv-name">CORRUPTION SOURCES</span>
                  <span className="inv-status">{sourcesDiscoveredL9} / 3 FOUND</span>
                </div>
              </div>

              <div className={`inv-slot ${entityEmpoweredL9 ? 'active' : 'empty'}`}>
                <span className="inv-icon">👁️</span>
                <div className="inv-meta">
                  <span className="inv-name">THE ENTITY</span>
                  <span className="inv-status">{entityEmpoweredL9 ? 'EMPOWERED' : 'MANIFESTING'}</span>
                </div>
              </div>

              <div className={`inv-slot active`}>
                <span className="inv-icon">👤</span>
                <div className="inv-meta">
                  <span className="inv-name">FRIEND</span>
                  <span className="inv-status">SAFE</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 10 && (
            <>
              <div className={`inv-slot ${activeSpiritualPointsL10 >= 3 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🔮</span>
                <div className="inv-meta">
                  <span className="inv-name">SPIRITUAL POINTS</span>
                  <span className="inv-status">{activeSpiritualPointsL10} / 3 ACTIVE</span>
                </div>
              </div>

              <div className={`inv-slot active`}>
                <span className="inv-icon">🛡️</span>
                <div className="inv-meta">
                  <span className="inv-name">BOSS SHIELD</span>
                  <span className="inv-status">{Math.floor(bossShieldStrengthL10)}%</span>
                </div>
              </div>

              <div className={`inv-slot ${bossHealthL10 <= 0 ? 'active' : 'empty'}`}>
                <span className="inv-icon">❤️</span>
                <div className="inv-meta">
                  <span className="inv-name">BOSS HEALTH</span>
                  <span className="inv-status">{Math.floor(bossHealthL10)}%</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 11 && (
            <>
              <div className={`inv-slot ${guardianJoinedL11 ? 'active' : 'empty'}`}>
                <span className="inv-icon">✨</span>
                <div className="inv-meta">
                  <span className="inv-name">DIVINE GUARDIAN</span>
                  <span className="inv-status">{guardianJoinedL11 ? 'JOINED' : 'MANIFESTING'}</span>
                </div>
              </div>

              <div className={`inv-slot ${friendRecoveredL11 ? 'active' : 'empty'}`}>
                <span className="inv-icon">👤</span>
                <div className="inv-meta">
                  <span className="inv-name">FRIEND</span>
                  <span className="inv-status">{friendRecoveredL11 ? 'RECOVERED' : 'WEAK'}</span>
                </div>
              </div>
            </>
          )}

          {currentLevel === 12 && (
            <>
              <div className={`inv-slot ${guardianStayedBehindL12 ? 'active' : 'empty'}`}>
                <span className="inv-icon">✨</span>
                <div className="inv-meta">
                  <span className="inv-name">GUARDIAN</span>
                  <span className="inv-status">REMAINING</span>
                </div>
              </div>

              <div className={`inv-slot ${friendsEscapedL12 ? 'active' : 'empty'}`}>
                <span className="inv-icon">🌅</span>
                <div className="inv-meta">
                  <span className="inv-name">EXIT</span>
                  <span className="inv-status">OPEN</span>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Dynamic Toast Narrative Banner */}
      {toastMessage && (
        <div className="hud-toast-container">
          <div className="hud-toast-pill">
            <span className="toast-dot" />
            <span className="toast-body">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <footer className="hud-bottom-bar">
        <div className="controls-hint-group">
          <div className="ctrl-tag"><span className="tag-key">WASD</span><span>Move</span></div>
          <div className="ctrl-tag"><span className="tag-key">Shift</span><span>Sprint</span></div>
          <div className="ctrl-tag"><span className="tag-key">Space</span><span>Jump</span></div>
          <div className="ctrl-tag"><span className="tag-key">Mouse</span><span>Look</span></div>
          <div className="ctrl-tag"><span className="tag-key">E</span><span>Interact</span></div>
          {currentLevel === 10 && (
            <div className="ctrl-tag"><span className="tag-key">Right Click</span><span>Spiritual Blast</span></div>
          )}
          {currentLevel === 1 && (
            <div className="ctrl-tag"><span className="tag-key">N</span><span>Day/Night</span></div>
          )}
          <div className="ctrl-tag"><span className="tag-key">Esc</span><span>Pause</span></div>
        </div>

        <button type="button" className="help-button" onClick={onToggleControls}>
          [?] HELP / CONTROLS
        </button>
      </footer>
    </div>
  );
}
