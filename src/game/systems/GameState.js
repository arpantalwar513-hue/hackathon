// Reactive GameState manager for Level 1 & Level 2: The Ancient Temple Exploration
import { soundManager } from '../audio/SoundManager.js';

class GameStateManager {
  constructor() {
    this.state = {
      currentLevel: 1, // 1: THE TEMPLE KEY, 2: THE ANCIENT TEMPLE EXPLORATION
      levelTitle: 'LEVEL 1: THE TEMPLE KEY',

      // --- Level 1 State ---
      hasTempleKey: false,
      templeGateUnlocked: false,
      templeDoorsOpen: false,
      playerEnteredTemple: false,
      level1Completed: false,

      // --- Level 2: The Ancient Temple Exploration State ---
      level2Started: false,
      clueFootprintsFound: false,
      friendItemFound: false,
      wallSymbolFound: false,
      mechanism1Activated: false,
      mechanism2Activated: false,
      mechanism3Activated: false,
      secretPassageOpened: false,
      playerEnteredSecretPassage: false,
      level2Completed: false,

      // --- Level 3: The Hidden Path State ---
      level3Started: false,
      clueFootprintsFoundL3: false,
      friendObjectFound: false,
      friendObjectExamined: false,
      wallSymbolExaminedL3: false,
      mechanismActivatedL3: false,
      innerDoorOpenedL3: false,
      entityEncounteredL3: false,
      entityFollowingL3: false,
      entityChasingL3: false,
      escapedToSanctuaryL3: false,
      mysteriousPersonEncounteredL3: false,
      level3Completed: false,

      // --- Level 4: The Deep Sanctum (The Awakening) State ---
      level4Started: false,
      clueFootprintsFoundL4: false,
      companionRelicFound: false,
      companionRelicExamined: false,
      aiCompanionAwakened: false,
      astralDial1Aligned: false,
      astralDial2Aligned: false,
      astralDial3Aligned: false,
      sanctumGateOpened: false,
      entityEncounteredL4: false,
      chaseTriggeredL4: false,
      escapedToSanctuaryL4: false,
      // --- Level 5: The Unknown Guide ---
      level5Started: false,
      guideEncountered: false,
      firstGuideConversationComplete: false,
      aiCompanionActive: false,
      aiCompanionMet: false,
      aiCompanionRevealed: false,
      symbolAFound: false,
      symbolBFound: false,
      symbolCFound: false,
      mechanismAActivated: false,
      mechanismBActivated: false,
      mechanismCActivated: false,
      innerChamberOpened: false,
      entityWarningTriggered: false,
      puzzleSymbol1Activated: false,   // Ω
      puzzleSymbol2Activated: false,   // Δ (entry symbol, press first)
      puzzleSymbol3Activated: false,   // Ψ (exit symbol, press last)
      puzzleSequenceProgress: 0,       // How many in correct sequence so far
      ancientChamberUnlocked: false,
      entityNearbyL5: false,
      level5Completed: false,
      friendClueRevealedL5: false,
      currentGuideState: 'IDLE',       // IDLE | OBSERVE | GUIDE | WARN | HIDE | DISAPPEAR
      level6Started: false,
      friendObjectFound: false,
      sealedDoorOpened: false,
      friendLocated: false,
      friendInteractionCompleted: false,
      negativeEnergyDetected: false,
      // --- Level 7: The Ancient Scroll State ---
      level7Started: false,
      inscriptionFound: false,
      symbolAFound: false,
      symbolBFound: false,
      symbolCFound: false,
      symbolAFoundL7: false,
      symbolBFoundL7: false,
      symbolCFoundL7: false,
      mechanismAActivated: false,
      mechanismBActivated: false,
      mechanismCActivated: false,
      mechanismAActivatedL7: false,
      mechanismBActivatedL7: false,
      mechanismCActivatedL7: false,
      archiveOpened: false,
      ancientScrollFound: false,
      restorationSequenceProgress: 0,
      restorationSequenceCompleted: false,
      altarActivated: false,
      spiritualPowerRestored: 0,
      entityReactionTriggered: false,
      level7Completed: false,
      level8Started: false,

      // --- Level 8: Spiritual Combat / Battle Arena State ---
      playerHealthL8: 100,
      bossHealthL8: 100,
      guardianAwakenedL8: false,
      relicSpawnedL8: false,
      relicCollectedL8: false,
      level8Completed: false,

      // --- Level 9: The Negative Entity State ---
      level9Started: false,
      negativeSource1Discovered: false,
      entityFirstManifestation: false,
      negativeSource2Discovered: false,
      entityFollowing: false,
      chaseStarted: false,
      chaseCompleted: false,
      negativeSource3Discovered: false,
      entityCoreDiscovered: false,
      entityAbsorptionStarted: false,
      entityEmpowered: false,
      finalArenaDiscovered: false,
      level9Completed: false,

      // --- Level 10: The Final Battle State ---
      level10Started: false,
      bossPhase: 1,
      bossHealth: 100,
      bossShieldStrength: 100,
      spiritualPointAActivated: false,
      spiritualPointBActivated: false,
      spiritualPointCActivated: false,
      allSpiritualPointsActivated: false,
      bossCoreExposed: false,
      spiritualEnergy: 100,
      spiritualPointCorrupted: false,
      spiritualPointRestored: false,
      finalCoreExposed: false,
      bossDefeated: false,
      divineEnergyDetected: false,
      level10Completed: false,

      // --- Level 11: The Divine Guardian State ---
      level11Started: false,
      divineEnergyDetectedL11: false,
      guardianAppeared: false,
      guardianRecognizedPlayer: false,
      guardianJoined: false,
      friendRecovered: false,
      exitObjectiveStarted: false,
      level11Completed: false,

      // --- Level 12: The Final Escape State ---
      level12Started: false,
      finalExitReached: false,
      guardianStayedBehind: false,
      friendsEscaped: false,
      finalCinematicStarted: false,
      finalCinematicCompleted: false,
      gameCompleted: false,

      // --- AI Companion dialogue (used by AICompanionModal + GuideDialogueHUD) ---
      aiCompanionDialogueHistory: [],
      aiCompanionOpen: false,
      aiCompanionThinking: false,
      activeGuideDialogue: null,        // { speakerName, message, choices: [{label, key}] }
      lastGuideChoice: null,

      // --- Player behavior tracking (Level 5) ---
      explorationTimeL5: 0,
      sprintCountL5: 0,
      interactionCountL5: 0,
      flashlightUsageL5: 0,
      recentLocationL5: 'entrance',
      recentActionL5: 'exploring',

      // --- Flashlight State ---
      hasFlashlight: true,
      flashlightEquipped: true,
      flashlightOn: true,

      // --- Shared HUD & Cinematic State ---
      currentObjective: 'FIND THE TEMPLE KEY',
      toastMessage: 'Explore the illuminated courtyard to find the temple key.',
      interactionPrompt: null,
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      activeNotice: null,
      isNightMode: true,
      isDayMode: false,
      distanceToTemple: 20,
    };

    this.listeners = new Set();
    this._guideChoiceHandler = null;
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in GameState listener:', err);
      }
    });
  }

  set(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  setObjective(objective) {
    if (this.state.currentObjective !== objective) {
      this.set({ currentObjective: objective });
    }
  }

  setToast(msg) {
    this.set({ toastMessage: msg });
  }

  setInteractionPrompt(prompt) {
    if (this.state.interactionPrompt !== prompt) {
      this.set({ interactionPrompt: prompt });
    }
  }

  setDistanceToTemple(meters) {
    this.state.distanceToTemple = Math.max(0, Math.round(meters));
  }

  setCinematicText(text) {
    this.set({ cinematicText: text });
  }

  openNotice(notice) {
    this.set({ activeNotice: notice });
  }

  closeNotice() {
    this.set({ activeNotice: null });
  }

  // --- LEVEL 1 ACTIONS ---
  acquireKey() {
    if (this.state.hasTempleKey) return;
    this.set({
      hasTempleKey: true,
      toastMessage: 'TEMPLE KEY FOUND',
      currentObjective: 'RETURN TO THE TEMPLE GATE',
    });
  }

  unlockTempleGate() {
    if (this.state.templeGateUnlocked) return;
    this.set({
      templeGateUnlocked: true,
      templeDoorsOpen: true,
      toastMessage: 'TEMPLE UNLOCKED',
      currentObjective: 'ENTER THE TEMPLE',
    });
  }

  unlockTemple() {
    this.unlockTempleGate();
  }

  enterTemple() {
    if (this.state.playerEnteredTemple) return;
    this.set({
      playerEnteredTemple: true,
      level1Completed: true,
      currentObjective: 'LEVEL 1 COMPLETE',
      toastMessage: 'LEVEL 1 COMPLETE',
      cinematicOutroActive: true,
    });
  }

  // --- LEVEL 2 ACTIONS ---
  startLevel2() {
    this.set({
      currentLevel: 2,
      levelTitle: 'LEVEL 2: THE ANCIENT TEMPLE EXPLORATION',
      hasTempleKey: true,
      templeGateUnlocked: true,
      templeDoorsOpen: true,
      level2Started: true,
      clueFootprintsFound: false,
      friendItemFound: false,
      wallSymbolFound: false,
      mechanism1Activated: false,
      mechanism2Activated: false,
      mechanism3Activated: false,
      secretPassageOpened: false,
      playerEnteredSecretPassage: false,
      level2Completed: false,
      currentObjective: 'FIND YOUR FRIEND',
      toastMessage: 'My friend came inside this temple...',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: false,
      isDayMode: true,
    });
  }

  // Discover Clue 1, 2, or 3
  discoverClue(clueType) {
    if (clueType === 'footprints') {
      if (this.state.clueFootprintsFound) return;
      this.state.clueFootprintsFound = true;
      this.setToast('He came this way...');
    } else if (clueType === 'friendItem') {
      if (this.state.friendItemFound) return;
      this.state.friendItemFound = true;
      this.setToast('You recognize this. He was here...');
    } else if (clueType === 'wallSymbol') {
      if (this.state.wallSymbolFound) return;
      this.state.wallSymbolFound = true;
      this.setToast("This symbol wasn't here before.");
    }

    const { clueFootprintsFound, friendItemFound, wallSymbolFound } = this.state;
    const foundCount = (clueFootprintsFound ? 1 : 0) + (friendItemFound ? 1 : 0) + (wallSymbolFound ? 1 : 0);

    if (foundCount < 3) {
      this.setObjective('FOLLOW THE CLUES');
      this.notify();
    } else {
      // All 3 clues found!
      setTimeout(() => {
        this.setToast('He was here... But where did he go?');
        this.setObjective('ACTIVATE THE THREE MECHANISMS');
      }, 1500);
      this.notify();
    }
  }

  // Activate Mechanism 1, 2, or 3
  activateMechanism(num) {
    if (num === 1) {
      if (this.state.mechanism1Activated) return;
      this.state.mechanism1Activated = true;
      this.setToast('Something moved...');
    } else if (num === 2) {
      if (this.state.mechanism2Activated) return;
      this.state.mechanism2Activated = true;
      this.setToast('You hear a mechanism...');
    } else if (num === 3) {
      if (this.state.mechanism3Activated) return;
      this.state.mechanism3Activated = true;
      this.setToast('Something unlocked...');
    }

    const { mechanism1Activated, mechanism2Activated, mechanism3Activated } = this.state;
    const mechCount = (mechanism1Activated ? 1 : 0) + (mechanism2Activated ? 1 : 0) + (mechanism3Activated ? 1 : 0);

    if (mechCount < 3) {
      this.setObjective('ACTIVATE THE THREE MECHANISMS');
      this.notify();
    } else {
      // All 3 mechanisms activated! Secret door opens!
      this.state.secretPassageOpened = true;
      this.state.currentObjective = 'SECRET PASSAGE OPENED';
      this.state.toastMessage = 'SECRET PASSAGE OPENED';
      this.notify();

      setTimeout(() => {
        this.setObjective('ENTER THE SECRET PASSAGE');
      }, 2500);
    }
  }

  // Enter the secret passage (end of Level 2)
  enterSecretPassage() {
    if (this.state.playerEnteredSecretPassage) return;
    this.set({
      playerEnteredSecretPassage: true,
      level2Completed: true,
      currentObjective: 'LEVEL 2 COMPLETE',
      toastMessage: 'LEVEL 2 COMPLETE',
      cinematicOutroActive: true,
      cinematicText: 'LEVEL 2 COMPLETE — THE SECRET DOOR IS OPEN',
    });
  }

  // --- Level 3: The Hidden Path Methods ---

  // Start / Initialize Level 3
  startLevel3() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 3,
      levelTitle: 'LEVEL 3: THE HIDDEN PATH',
      level3Started: true,
      clueFootprintsFoundL3: false,
      friendObjectFound: false,
      friendObjectExamined: false,
      wallSymbolExaminedL3: false,
      mechanismActivatedL3: false,
      innerDoorOpenedL3: false,
      entityEncounteredL3: false,
      entityFollowingL3: false,
      entityChasingL3: false,
      escapedToSanctuaryL3: false,
      mysteriousPersonEncounteredL3: false,
      level3Completed: false,
      currentObjective: 'EXPLORE THE HIDDEN PASSAGE',
      toastMessage: 'You stepped into the dark passage beneath the temple...',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  // Clue 1: Footprints examined
  examineFootprintsL3() {
    if (this.state.clueFootprintsFoundL3) return;
    this.state.clueFootprintsFoundL3 = true;
    soundManager.playFootprintInspect();
    this.setToast('Fresh footprints in the dust... He came through here recently.');
    this.setObjective('FOLLOW THE FOOTPRINTS');
    this.notify();
  }

  // Clue 2: Friend's dropped personal object (Expedition Watch)
  examineFriendObject() {
    if (this.state.friendObjectExamined) return;
    this.state.friendObjectFound = true;
    this.state.friendObjectExamined = true;
    soundManager.playClueInspect();

    this.setToast('You recognize this. He was definitely here.');
    this.setObjective('FIND OUT WHERE YOUR FRIEND WENT');
    this.notify();

    setTimeout(() => {
      this.setToast('Then where did he go?');
    }, 2800);
  }

  // Clue 3: Strange Wall Symbol
  examineWallSymbolL3() {
    if (this.state.wallSymbolExaminedL3) return;
    this.state.wallSymbolExaminedL3 = true;
    soundManager.playSymbolActivate();

    this.setToast("This symbol wasn't here by accident.");
    this.setObjective('FIND A WAY TO OPEN THE HIDDEN DOOR');
    this.notify();
  }

  // Activate Mechanism
  activateMechanismL3() {
    if (this.state.mechanismActivatedL3) return;
    this.state.mechanismActivatedL3 = true;
    this.state.innerDoorOpenedL3 = true;

    soundManager.playStoneMechanism();
    setTimeout(() => {
      soundManager.playStoneDoorSlide();
    }, 450);

    this.setToast('The mechanism unlocked... The stone door is opening!');
    this.setObjective('ENTER THE HIDDEN CHAMBER');
    this.notify();
  }

  // Supernatural Entity Sightings
  triggerEntityEncounterL3() {
    if (this.state.entityEncounteredL3) return;
    this.state.entityEncounteredL3 = true;

    soundManager.playEntityGlitchDrone();
    setTimeout(() => {
      soundManager.playEntityWhisper();
    }, 600);

    this.setToast('Did you see that...? Something moved in the shadows.');
    this.setObjective('EXPLORE THE DARK CHAMBER');
    this.notify();
  }

  triggerEntityFollowL3() {
    if (this.state.entityFollowingL3) return;
    this.state.entityFollowingL3 = true;

    soundManager.playEntityWhisper();
    this.setToast('Something is following you...');
    this.setObjective('SOMETHING IS FOLLOWING YOU');
    this.notify();
  }

  triggerChaseL3() {
    if (this.state.entityChasingL3) return;
    this.state.entityChasingL3 = true;

    soundManager.startChaseDrone();
    this.setToast('IT IS COMING FOR YOU! RUN!');
    this.setObjective('FIND A WAY OUT');
    this.notify();
  }

  // Safe Sanctuary Exit
  reachSafeExitL3() {
    if (this.state.escapedToSanctuaryL3) return;
    this.state.escapedToSanctuaryL3 = true;
    this.state.entityChasingL3 = false;
    this.state.entityFollowingL3 = false;

    soundManager.stopChaseDrone();
    soundManager.playSanctuaryChime();

    this.setToast('You crossed the sacred threshold! The entity cannot enter.');
    this.setObjective('OBJECTIVE COMPLETE');
    this.notify();
  }

  encounterMysteriousPersonL3() {
    if (this.state.mysteriousPersonEncounteredL3) return;
    this.state.mysteriousPersonEncounteredL3 = true;
    this.notify();
  }

  // Level 3 Completion Outro
  completeLevel3() {
    if (this.state.level3Completed) return;
    this.set({
      level3Completed: true,
      currentObjective: 'LEVEL 3 COMPLETE',
      toastMessage: 'LEVEL 3 COMPLETE',
      cinematicOutroActive: true,
      cinematicText: 'LEVEL 3 COMPLETE — THE HIDDEN PATH',
    });
  }

  // --- LEVEL 4: THE DEEP SANCTUM ---

  startLevel4() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 4,
      levelTitle: 'LEVEL 4: THE DEEP SANCTUM',
      level4Started: true,
      clueFootprintsFoundL4: false,
      companionRelicFound: false,
      companionRelicExamined: false,
      aiCompanionAwakened: false,
      astralDial1Aligned: false,
      astralDial2Aligned: false,
      astralDial3Aligned: false,
      sanctumGateOpened: false,
      entityEncounteredL4: false,
      chaseTriggeredL4: false,
      escapedToSanctuaryL4: false,
      level4Completed: false,
      currentObjective: 'EXPLORE THE CORRUPTED SANCTUM',
      toastMessage: 'You enter the deep sanctum... something watches from the darkness.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  triggerEntityEncounterL4() {
    if (this.state.entityEncounteredL4) return;
    this.state.entityEncounteredL4 = true;
    this.setToast('Did you see that?! Something lurks within the sanctum...');
    this.notify();
  }

  completeLevel4() {
    if (this.state.level4Completed) return;
    this.set({
      level4Completed: true,
      currentObjective: 'LEVEL 4 COMPLETE',
      toastMessage: 'LEVEL 4 COMPLETE',
      cinematicOutroActive: true,
      cinematicText: 'LEVEL 4 COMPLETE — THE DEEP SANCTUM',
    });
  }

  // --- Level 5: The Unknown Guide Methods ---
  startLevel5() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 5,
      levelTitle: 'LEVEL 5: THE UNKNOWN GUIDE',
      level5Started: true,
      guideEncountered: false,
      firstGuideConversationComplete: false,
      aiCompanionActive: false,
      aiCompanionMet: false,
      aiCompanionRevealed: false,
      symbolAFound: false,
      symbolBFound: false,
      symbolCFound: false,
      mechanismAActivated: false,
      mechanismBActivated: false,
      mechanismCActivated: false,
      innerChamberOpened: false,
      entityWarningTriggered: false,
      puzzleSymbol1Activated: false,
      puzzleSymbol2Activated: false,
      puzzleSymbol3Activated: false,
      puzzleSequenceProgress: 0,
      ancientChamberUnlocked: false,
      entityNearbyL5: false,
      level5Completed: false,
      friendClueRevealedL5: false,
      currentGuideState: 'IDLE',
      level6Started: false,
      aiCompanionDialogueHistory: [],
      aiCompanionOpen: false,
      aiCompanionThinking: false,
      activeGuideDialogue: null,
      lastGuideChoice: null,
      explorationTimeL5: 0,
      sprintCountL5: 0,
      interactionCountL5: 0,
      flashlightUsageL5: 0,
      recentLocationL5: 'entrance',
      recentActionL5: 'exploring',
      currentObjective: 'EXPLORE THE HIDDEN CHAMBER',
      toastMessage: 'A quiet chamber hidden beneath the temple... Explore the surroundings.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  meetAICompanion() {
    if (this.state.aiCompanionMet) return;
    this.state.aiCompanionMet = true;
    this.state.guideEncountered = true;
    this.state.aiCompanionActive = true;
    this.setObjective('SPEAK TO THE UNKNOWN GUIDE');
    this.setToast('A mysterious figure has appeared in the chamber...');
    this.notify();
  }

  revealAICompanion() {
    if (this.state.aiCompanionRevealed) return;
    this.state.aiCompanionRevealed = true;
    this.state.firstGuideConversationComplete = true;
    this.setObjective('DECIPHER THE THREE ANCIENT SYMBOLS');
    this.notify();
  }

  activateAICompanionL5() {
    this.state.aiCompanionActive = true;
    this.state.firstGuideConversationComplete = true;
    this.notify();
  }

  discoverSymbolL5(symbolKey) {
    const key = (symbolKey || '').toUpperCase();
    let isNew = false;
    if (key === 'A' && !this.state.symbolAFound) {
      this.state.symbolAFound = true;
      isNew = true;
    } else if (key === 'B' && !this.state.symbolBFound) {
      this.state.symbolBFound = true;
      isNew = true;
    } else if (key === 'C' && !this.state.symbolCFound) {
      this.state.symbolCFound = true;
      isNew = true;
    }

    if (isNew) {
      this.state.recentActionL5 = `examined_symbol_${key.toLowerCase()}`;
      soundManager.playSymbolActivate();
      const count = (this.state.symbolAFound ? 1 : 0) + (this.state.symbolBFound ? 1 : 0) + (this.state.symbolCFound ? 1 : 0);
      if (count >= 3) {
        this.setToast('All three ancient symbols deciphered! Activate the mechanisms.');
        this.setObjective('ACTIVATE THE THREE TEMPLE MECHANISMS');
      } else {
        this.setToast(`Ancient Symbol ${key} deciphered (${count}/3).`);
        this.setObjective('FIND THE REMAINING ANCIENT SYMBOLS');
      }
      this.notify();
    }
  }

  activateMechanismL5(mechKey) {
    const key = (mechKey || '').toUpperCase();
    let isNew = false;
    if (key === 'A' && !this.state.mechanismAActivated) {
      this.state.mechanismAActivated = true;
      isNew = true;
    } else if (key === 'B' && !this.state.mechanismBActivated) {
      this.state.mechanismBActivated = true;
      isNew = true;
    } else if (key === 'C' && !this.state.mechanismCActivated) {
      this.state.mechanismCActivated = true;
      isNew = true;
    }

    if (isNew) {
      this.state.recentActionL5 = `activated_mechanism_${key.toLowerCase()}`;
      soundManager.playMechanismClick();
      const count = (this.state.mechanismAActivated ? 1 : 0) + (this.state.mechanismBActivated ? 1 : 0) + (this.state.mechanismCActivated ? 1 : 0);
      if (count >= 3) {
        this.setToast('The final mechanism locks into place! The inner chamber opens!');
        this.openInnerChamberL5();
      } else {
        this.setToast(`Temple Mechanism ${key} engaged (${count}/3).`);
        this.setObjective('ACTIVATE THE REMAINING MECHANISMS');
        this.notify();
      }
    }
  }

  openInnerChamberL5() {
    if (this.state.innerChamberOpened) return;
    this.state.innerChamberOpened = true;
    this.state.ancientChamberUnlocked = true;
    soundManager.playStoneDoorSlide();
    this.setToast('The heavy stone gates grind open... The inner chamber is unlocked.');
    this.setObjective('ENTER THE INNER CHAMBER');
    this.notify();
  }

  activatePuzzleSymbolL5(symbolIndex) {
    const correctSequence = [1, 0, 2];
    const progress = this.state.puzzleSequenceProgress || 0;

    if (symbolIndex === correctSequence[progress]) {
      if (symbolIndex === 0) this.state.puzzleSymbol1Activated = true;
      if (symbolIndex === 1) this.state.puzzleSymbol2Activated = true;
      if (symbolIndex === 2) this.state.puzzleSymbol3Activated = true;

      const newProgress = progress + 1;
      this.state.puzzleSequenceProgress = newProgress;
      soundManager.playSymbolActivate();

      if (newProgress >= 3) {
        this.openInnerChamberL5();
      } else {
        this.setToast(`Symbol accepted. ${3 - newProgress} remaining.`);
        this.notify();
      }
    } else {
      this.state.puzzleSymbol1Activated = false;
      this.state.puzzleSymbol2Activated = false;
      this.state.puzzleSymbol3Activated = false;
      this.state.puzzleSequenceProgress = 0;
      this.setToast('The symbols fade. That\'s not the right sequence.');
      this.notify();
    }
  }

  triggerEntityNearbyL5(isNearby) {
    if (this.state.entityNearbyL5 === isNearby) return;
    this.state.entityNearbyL5 = isNearby;
    if (isNearby) {
      this.state.entityWarningTriggered = true;
      this.setObjective('DANGER: STAY ALERT');
      soundManager.playHeartbeat();
    }
    this.notify();
  }

  findFriendClueL5() {
    if (this.state.friendClueRevealedL5) return;
    this.state.friendClueRevealedL5 = true;
    this.state.recentActionL5 = 'read_friend_journal';
    soundManager.playClueInspect();
    this.setToast('A worn journal... Your friend\'s handwriting is on the pages.');
    this.setObjective('DISCOVER WHAT HAPPENED TO YOUR FRIEND');
    this.notify();
  }

  setGuideState(state) {
    this.state.currentGuideState = state;
    this.notify();
  }

  completeLevel5() {
    if (this.state.level5Completed) return;
    this.set({
      level5Completed: true,
      currentObjective: 'LEVEL 5 COMPLETE — FIND YOUR FRIEND',
      toastMessage: 'LEVEL 5 COMPLETE — THE UNKNOWN GUIDE',
      cinematicOutroActive: true,
      cinematicText: 'LEVEL 5 COMPLETE — THE UNKNOWN GUIDE',
    });
  }

  // --- Level 6: Finding the Friend Methods ---
  startLevel6() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 6,
      levelTitle: 'LEVEL 6: FINDING THE FRIEND',
      level6Started: true,
      friendObjectFound: false,
      sealedDoorOpened: false,
      friendLocated: false,
      friendInteractionCompleted: false,
      negativeEnergyDetected: false,
      spiritualPowerCorrupted: false,
      ancientScrollObjectiveActive: false,
      level6Completed: false,
      friendState: 'TRAPPED',
      level7Started: false,
      currentObjective: 'FOLLOW THE PATH OF THE POSSESSED',
      toastMessage: 'Level 6: Finding the Friend. Follow the trail deeper into the sanctum.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  findFriendObjectL6() {
    if (this.state.friendObjectFound) return;
    this.state.friendObjectFound = true;
    soundManager.playClueInspect();
    this.setToast("You recognize this... This belonged to your friend.");
    this.setObjective("FOLLOW THE STRANGE FOOTPRINTS TO THE SEALED CHAMBER");
    this.notify();
  }

  openSealedDoorL6() {
    if (this.state.sealedDoorOpened) return;
    this.state.sealedDoorOpened = true;
    soundManager.playStoneDoorSlide();
    this.setToast("The ancient rotary seal aligns. The heavy sanctum gates grind open.");
    this.setObjective("ENTER THE SANCTUM & FIND YOUR FRIEND");
    this.notify();
  }

  locateFriendL6() {
    if (this.state.friendLocated) return;
    this.state.friendLocated = true;
    this.state.friendState = 'DISTRESSED';
    this.setToast("You see a figure trapped on the central dais... It's your friend!");
    this.setObjective("APPROACH AND SPEAK TO YOUR FRIEND [E]");
    this.notify();
  }

  setFriendStateL6(friendState) {
    this.state.friendState = friendState;
    this.notify();
  }

  triggerNegativeEnergyEventL6() {
    if (this.state.negativeEnergyDetected) return;
    this.state.negativeEnergyDetected = true;
    this.state.friendState = 'CONTROLLED';
    soundManager.playHeartbeat(true);
    soundManager.playHorrorStinger();
    this.setToast("A dark surge erupts! An ominous entity briefly manifests!");
    this.notify();
  }

  discoverSpiritualCorruptionL6() {
    if (this.state.spiritualPowerCorrupted) return;
    this.state.spiritualPowerCorrupted = true;
    this.state.friendState = 'PROTECTED';
    this.state.ancientScrollObjectiveActive = true;
    this.setObjective("FIND A WAY TO RESTORE THE TEMPLE'S SPIRITUAL POWER");
    this.setToast("The temple's protective power has been corrupted... A sacred record must be found.");
    this.notify();
  }

  completeLevel6() {
    if (this.state.level6Completed) return;
    this.set({
      level6Completed: true,
      currentObjective: "FIND THE ANCIENT SCROLL (LEVEL 7)",
      toastMessage: "LEVEL 6 COMPLETE — FINDING THE FRIEND",
      cinematicOutroActive: true,
      cinematicText: "LEVEL 6 COMPLETE — FINDING THE FRIEND",
    });
  }

  startLevel7() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 7,
      levelTitle: 'LEVEL 7: THE ANCIENT SCROLL',
      level7Started: true,
      inscriptionFound: false,
      symbolAFound: false,
      symbolBFound: false,
      symbolCFound: false,
      symbolAFoundL7: false,
      symbolBFoundL7: false,
      symbolCFoundL7: false,
      mechanismAActivated: false,
      mechanismBActivated: false,
      mechanismCActivated: false,
      mechanismAActivatedL7: false,
      mechanismBActivatedL7: false,
      mechanismCActivatedL7: false,
      archiveOpened: false,
      ancientScrollFound: false,
      restorationSequenceProgress: 0,
      restorationSequenceCompleted: false,
      altarActivated: false,
      spiritualPowerRestored: 0,
      entityReactionTriggered: false,
      level7Completed: false,
      level8Started: false,
      // Preserve friend and corruption states from Level 6
      friendLocated: true,
      friendRescued: false,
      spiritualPowerCorrupted: true,
      currentObjective: 'FIND THE ANCIENT SCROLL',
      toastMessage: 'Level 7: The Ancient Scroll. Explore the deeper chambers to find the sacred archive.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  discoverInscriptionL7() {
    if (this.state.inscriptionFound) return;
    this.state.inscriptionFound = true;
    soundManager.playClueInspect();
    this.setToast("Ancient Inscription: 'Three symbols... three points of power. Awaken the nodes in sacred sequence.'");
    this.setObjective("FIND THREE ANCIENT SYMBOLS & MECHANISMS");
    this.notify();
  }

  findSymbolL7(symbolKey) {
    const keyL7 = `symbol${symbolKey.toUpperCase()}FoundL7`;
    const key = `symbol${symbolKey.toUpperCase()}Found`;
    if (this.state[keyL7]) return;
    this.state[keyL7] = true;
    this.state[key] = true;
    soundManager.playSymbolActivate();

    const count = (this.state.symbolAFoundL7 ? 1 : 0) + (this.state.symbolBFoundL7 ? 1 : 0) + (this.state.symbolCFoundL7 ? 1 : 0);
    this.setToast(`Ancient Symbol ${symbolKey.toUpperCase()} discovered! (${count}/3)`);
    if (count >= 3) {
      this.setObjective("ACTIVATE THREE CORRESPONDING MECHANISMS TO UNLOCK ARCHIVE");
    }
    this.notify();
  }

  activateMechanismL7(mechKey) {
    const keyL7 = `mechanism${mechKey.toUpperCase()}ActivatedL7`;
    const key = `mechanism${mechKey.toUpperCase()}Activated`;
    if (this.state[keyL7]) return;
    this.state[keyL7] = true;
    this.state[key] = true;
    soundManager.playMechanismClick();

    const count = (this.state.mechanismAActivatedL7 ? 1 : 0) + (this.state.mechanismBActivatedL7 ? 1 : 0) + (this.state.mechanismCActivatedL7 ? 1 : 0);
    this.setToast(`Mechanism ${mechKey.toUpperCase()} activated! (${count}/3)`);

    if (count >= 3) {
      this.openArchiveDoorL7();
    } else {
      this.notify();
    }
  }

  openArchiveDoorL7() {
    if (this.state.archiveOpened) return;
    this.state.archiveOpened = true;
    soundManager.playStoneDoorSlide();
    this.setToast("All three mechanisms engaged! The ancient archive door unseals!");
    this.setObjective("ENTER THE ARCHIVE & EXAMINE THE ANCIENT SCROLL");
    this.notify();
  }

  examineAncientScrollL7() {
    if (this.state.ancientScrollFound) return;
    this.state.ancientScrollFound = true;
    soundManager.playClueInspect();
    this.setToast("You examine the Ancient Scroll: The restoration ritual is revealed!");
    this.setObjective("DECODE THE RESTORATION SEQUENCE (A → C → B)");
    this.notify();
  }

  advanceRestorationSequenceL7(step) {
    this.state.restorationSequenceProgress = step;
    soundManager.playSymbolActivate();
    this.setToast(`Restoration Node awakened! Sequence progress: ${step}/3`);
    if (step >= 3) {
      this.completeRestorationSequenceL7();
    } else {
      this.notify();
    }
  }

  failRestorationSequenceL7() {
    this.state.restorationSequenceProgress = 0;
    soundManager.playHorrorStinger();
    this.setToast("The energy rejects the sequence! Nodes have reset.");
    this.notify();
  }

  completeRestorationSequenceL7() {
    this.state.restorationSequenceCompleted = true;
    this.state.restorationSequenceProgress = 3;
    soundManager.playSuccess();
    this.setToast("RESTORATION SEQUENCE COMPLETE! Approach and activate the central altar.");
    this.setObjective("ACTIVATE THE RESTORATION ALTAR [E]");
    this.notify();
  }

  activateAltarL7() {
    if (this.state.altarActivated) return;
    this.state.altarActivated = true;
    this.state.spiritualPowerRestored = 30;
    soundManager.playSymbolActivate();
    soundManager.playSuccess();
    this.setToast("Spiritual energy restored: 30%! Temple energy stabilizes!");
    this.setObjective("SURVIVE THE SURGE & ESCAPE THE ARCHIVE");
    this.notify();
  }

  triggerEntityReactionL7() {
    if (this.state.entityReactionTriggered) return;
    this.state.entityReactionTriggered = true;
    soundManager.playHeartbeat(true);
    soundManager.playHorrorStinger();
    this.setToast("A terrifying screech echoes! The negative entity has sensed the restoration!");
    this.notify();
  }

  completeLevel7() {
    if (this.state.level7Completed) return;
    this.set({
      level7Completed: true,
      currentObjective: "RESTORE THE TEMPLE'S SPIRITUAL POWER (LEVEL 8)",
      toastMessage: "LEVEL 7 COMPLETE — THE ANCIENT SCROLL",
      cinematicOutroActive: true,
      cinematicText: "LEVEL 7 COMPLETE — THE ANCIENT SCROLL",
    });
  }

  startLevel8() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 8,
      levelTitle: 'LEVEL 8: RESTORATION OF SPIRITUAL POWER',
      level8Started: true,
      nodeAActivatedL8: false,
      nodeBActivatedL8: false,
      nodeCActivatedL8: false,
      playerHealthL8: 100,
      bossHealthL8: 100,
      guardianAwakenedL8: false,
      relicSpawnedL8: false,
      relicCollectedL8: false,
      level8Completed: false,
      currentObjective: "APPROACH THE CORRUPTED GUARDIAN",
      toastMessage: 'Level 8: The Corrupted Guardian.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: false,
      isDayMode: true,
    });
  }

  awakenGuardianL8() {
    if (this.state.guardianAwakenedL8) return;
    this.state.guardianAwakenedL8 = true;
    soundManager.playHorrorStinger();
    this.setToast('THE GUARDIAN HAS AWAKENED! PREPARE TO FIGHT!');
    this.setObjective('DEFEAT THE CORRUPTED GUARDIAN');
    this.notify();
  }

  damagePlayerL8(amount) {
    if (this.state.level8Completed || this.state.playerHealthL8 <= 0) return;
    this.state.playerHealthL8 = Math.max(0, this.state.playerHealthL8 - amount);
    if (this.state.playerHealthL8 === 0) {
      soundManager.playFailure();
      this.setToast("YOU HAVE BEEN DEFEATED.");
      this.setObjective("RELOAD TO TRY AGAIN");
      // Could trigger game over screen, for now just notify
    } else {
      soundManager.playHorrorStinger(); // Or hurt sound
    }
    this.notify();
  }

  damageBossL8(amount) {
    if (!this.state.guardianAwakenedL8 || this.state.bossHealthL8 <= 0) return;
    this.state.bossHealthL8 = Math.max(0, this.state.bossHealthL8 - amount);
    
    if (this.state.bossHealthL8 === 0) {
      this.state.relicSpawnedL8 = true;
      soundManager.playSuccess();
      this.setToast("THE GUARDIAN HAS FALLEN! A RELIC APPEARED!");
      this.setObjective("RECOVER THE SPIRITUAL RELIC");
    } else {
      soundManager.playMechanismClick(); // Temporary hit sound
    }
    this.notify();
  }

  collectRelicL8() {
    if (this.state.relicCollectedL8) return;
    this.state.relicCollectedL8 = true;
    soundManager.playSymbolActivate();
    this.setToast("RELIC OBTAINED! The path is clear.");
    this.completeLevel8();
    this.notify();
  }

  completeLevel8() {
    if (this.state.level8Completed) return;
    this.set({
      level8Completed: true,
      currentObjective: "LEVEL 8 COMPLETE",
      toastMessage: "LEVEL 8 COMPLETE — GUARDIAN DEFEATED",
      cinematicOutroActive: true,
      cinematicText: "LEVEL 8 COMPLETE — GUARDIAN DEFEATED\n\nLEVEL 9 — THE NEGATIVE ENTITY",
    });
  }

  // --- Level 9: The Negative Entity Methods ---
  startLevel9() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 9,
      levelTitle: 'LEVEL 9: THE NEGATIVE ENTITY',
      level9Started: true,
      negativeSource1Discovered: false,
      entityFirstManifestation: false,
      negativeSource2Discovered: false,
      entityFollowing: false,
      chaseStarted: false,
      chaseCompleted: false,
      negativeSource3Discovered: false,
      entityCoreDiscovered: false,
      entityAbsorptionStarted: false,
      entityEmpowered: false,
      finalArenaDiscovered: false,
      level9Completed: false,
      // Friend remains safe from Level 8
      friendFoundL8: true,
      currentObjective: "INVESTIGATE THE SHAKING TEMPLE",
      toastMessage: 'Level 9: The Negative Entity. The temple is reacting to the restored power.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  discoverSource1L9() {
    if (this.state.negativeSource1Discovered) return;
    this.state.negativeSource1Discovered = true;
    soundManager.playClueInspect();
    this.setToast('Dark energy particles leak from the broken shrine...');
    this.setObjective('INVESTIGATE THE BROKEN SHRINE');
    this.notify();
    
    // Trigger First Manifestation shortly after
    setTimeout(() => {
      this.triggerFirstManifestationL9();
    }, 4000);
  }

  triggerFirstManifestationL9() {
    if (this.state.entityFirstManifestation) return;
    this.state.entityFirstManifestation = true;
    soundManager.playHorrorStinger();
    this.setToast('Did something just move in the distance?');
    this.setObjective('FIND THE SECOND NEGATIVE ENERGY SOURCE');
    this.notify();
  }

  discoverSource2L9() {
    if (this.state.negativeSource2Discovered) return;
    this.state.negativeSource2Discovered = true;
    soundManager.playClueInspect();
    this.setToast('Another corrupted chamber... the energy is stronger here.');
    this.setObjective('BE CAREFUL. SOMETHING IS WRONG.');
    this.notify();

    // Trigger following behavior
    setTimeout(() => {
      this.startEntityFollowingL9();
    }, 3000);
  }

  startEntityFollowingL9() {
    if (this.state.entityFollowing) return;
    this.state.entityFollowing = true;
    soundManager.playHeartbeat(true);
    this.setToast('Something is following you...');
    this.setObjective('STAY AWAY FROM THE ENTITY');
    this.notify();
  }

  startChaseL9() {
    if (this.state.chaseStarted) return;
    this.state.chaseStarted = true;
    soundManager.startChaseDrone();
    this.setToast('IT IS COMING FOR YOU! RUN TO THE SAFE CHAMBER!');
    this.setObjective('ESCAPE THE ENTITY');
    this.notify();
  }

  completeChaseL9() {
    if (this.state.chaseCompleted) return;
    this.state.chaseCompleted = true;
    this.state.chaseStarted = false;
    this.state.entityFollowing = false;
    soundManager.stopChaseDrone();
    soundManager.stopHeartbeat();
    soundManager.playSanctuaryChime();
    this.setToast('You escaped to the Safe Chamber. The entity stopped following.');
    this.setObjective('FIND THE THIRD NEGATIVE ENERGY SOURCE');
    this.notify();
  }

  discoverSource3L9() {
    if (this.state.negativeSource3Discovered) return;
    this.state.negativeSource3Discovered = true;
    soundManager.playClueInspect();
    this.setToast('An underground core chamber... The corruption originates here.');
    this.setObjective('EXAMINE THE ENTITY CORE');
    this.notify();
  }

  discoverCoreL9() {
    if (this.state.entityCoreDiscovered) return;
    this.state.entityCoreDiscovered = true;
    soundManager.playClueInspect();
    this.setToast('That floating sphere... That is its source!');
    this.setObjective('THE ENTITY IS ABSORBING ENERGY!');
    this.notify();

    setTimeout(() => {
      this.triggerAbsorptionL9();
    }, 2000);
  }

  triggerAbsorptionL9() {
    if (this.state.entityAbsorptionStarted) return;
    this.state.entityAbsorptionStarted = true;
    soundManager.playEntityGlitchDrone();
    this.setToast('The entity is absorbing the core\'s negative energy!');
    this.notify();

    setTimeout(() => {
      this.empowerEntityL9();
    }, 5000);
  }

  empowerEntityL9() {
    if (this.state.entityEmpowered) return;
    this.state.entityEmpowered = true;
    soundManager.playHorrorStinger();
    this.setToast('IT HAS BECOME STRONGER! WE CANNOT FIGHT IT LIKE THIS!');
    this.setObjective('FIND A WAY OUT');
    this.notify();
  }

  discoverFinalArenaL9() {
    if (this.state.finalArenaDiscovered) return;
    this.state.finalArenaDiscovered = true;
    this.setToast('This ancient arena... This is where we will have to face it.');
    this.setObjective('PREPARE FOR THE FINAL BATTLE');
    this.notify();

    setTimeout(() => {
      this.completeLevel9();
    }, 4000);
  }

  completeLevel9() {
    if (this.state.level9Completed) return;
    this.set({
      level9Completed: true,
      currentObjective: "LEVEL 9 COMPLETE",
      toastMessage: "LEVEL 9 COMPLETE — THE NEGATIVE ENTITY",
      cinematicOutroActive: true,
      cinematicText: "LEVEL 9 COMPLETE\n\nThe entity has absorbed the remaining negative energy.\nThe final confrontation is coming.\n\nLEVEL 10 — FINAL BATTLE",
    });
  }

  // --- Level 10: The Final Battle Methods ---
  startLevel10() {
    soundManager.setTempleInterior(true);
    this.set({
      currentLevel: 10,
      levelTitle: 'LEVEL 10: THE FINAL BATTLE',
      level10Started: true,
      bossPhase: 1,
      bossHealth: 100,
      bossShieldStrength: 100,
      spiritualPointAActivated: false,
      spiritualPointBActivated: false,
      spiritualPointCActivated: false,
      allSpiritualPointsActivated: false,
      bossCoreExposed: false,
      spiritualEnergy: 100,
      spiritualPointCorrupted: false,
      spiritualPointRestored: false,
      finalCoreExposed: false,
      bossDefeated: false,
      divineEnergyDetected: false,
      level10Completed: false,
      friendFoundL8: true,
      currentObjective: "ACTIVATE THE THREE SPIRITUAL POINTS",
      toastMessage: 'Level 10: The Final Battle. The entity\'s shield is too strong. Use the spiritual points.',
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      interactionPrompt: null,
      isNightMode: true,
      isDayMode: false,
    });
  }

  activateSpiritualPointL10(pointId) {
    if (pointId === 'A' && !this.state.spiritualPointAActivated) {
      this.set({ spiritualPointAActivated: true, bossShieldStrength: Math.max(0, this.state.bossShieldStrength - 33.3) });
      this.setToast('Spiritual Point A Activated. The shield weakens.');
    } else if (pointId === 'B' && !this.state.spiritualPointBActivated) {
      this.set({ spiritualPointBActivated: true, bossShieldStrength: Math.max(0, this.state.bossShieldStrength - 33.3) });
      this.setToast('Spiritual Point B Activated. The shield weakens.');
    } else if (pointId === 'C' && !this.state.spiritualPointCActivated) {
      this.set({ spiritualPointCActivated: true, bossShieldStrength: Math.max(0, this.state.bossShieldStrength - 33.4) });
      this.setToast('Spiritual Point C Activated. The shield weakens.');
    }
    this.checkSpiritualPointsL10();
  }

  checkSpiritualPointsL10() {
    if (this.state.spiritualPointAActivated && this.state.spiritualPointBActivated && this.state.spiritualPointCActivated && !this.state.allSpiritualPointsActivated) {
      this.set({
        allSpiritualPointsActivated: true,
        bossShieldStrength: 0,
        bossCoreExposed: true,
        currentObjective: "ATTACK THE EXPOSED CORE",
        toastMessage: "The shield is down! Use Spiritual Blast (Right Click) on the Core!"
      });
      soundManager.playClueInspect(); // or a shield break sound
    }
  }

  damageBossL10(amount) {
    if (!this.state.bossCoreExposed && !this.state.finalCoreExposed) {
      this.setToast('The shield absorbs the attack.');
      return;
    }

    const newHealth = Math.max(0, this.state.bossHealth - amount);
    this.set({ bossHealth: newHealth });

    if (newHealth <= 70 && this.state.bossPhase === 1) {
      this.transitionBossPhaseL10(2);
    } else if (newHealth <= 30 && this.state.bossPhase === 2) {
      this.transitionBossPhaseL10(3);
    } else if (newHealth <= 0 && this.state.bossPhase === 3) {
      this.triggerFinalDefeatL10();
    }
  }

  transitionBossPhaseL10(phase) {
    if (phase === 2) {
      this.set({
        bossPhase: 2,
        bossCoreExposed: false,
        spiritualPointCorrupted: true,
        spiritualPointAActivated: false, // Forcing reactivation of point A
        allSpiritualPointsActivated: false,
        bossShieldStrength: 50,
        currentObjective: "REACTIVATE THE CORRUPTED POINT",
        toastMessage: "The entity corrupted a spiritual point! Reactivate it!"
      });
      soundManager.playEntityGlitchDrone();
    } else if (phase === 3) {
      this.set({
        bossPhase: 3,
        bossCoreExposed: false,
        finalCoreExposed: true,
        bossShieldStrength: 0,
        currentObjective: "USE THE CENTRAL ALTAR",
        toastMessage: "The entity is desperate! Use the Central Altar to deliver the final blow!"
      });
      soundManager.playHorrorStinger();
    }
  }

  reactivateCorruptedPointL10() {
    if (this.state.spiritualPointCorrupted && !this.state.spiritualPointRestored) {
      this.set({
        spiritualPointAActivated: true,
        spiritualPointRestored: true,
        bossShieldStrength: 0,
        bossCoreExposed: true,
        currentObjective: "ATTACK THE EXPOSED CORE",
        toastMessage: "Point restored! Attack the core!"
      });
      this.checkSpiritualPointsL10();
    }
  }

  triggerFinalDefeatL10() {
    if (this.state.bossDefeated) return;
    this.set({
      bossDefeated: true,
      currentObjective: "OBSERVE THE DIVINE ENERGY",
      toastMessage: "The negative entity is collapsing!"
    });
    soundManager.playHorrorStinger(); // Use as collapse sound
    
    setTimeout(() => {
      this.set({
        divineEnergyDetected: true,
      });
      soundManager.playSanctuaryChime(); // Use as divine sound
    }, 4000);

    setTimeout(() => {
      this.completeLevel10();
    }, 8000);
  }

  completeLevel10() {
    if (this.state.level10Completed) return;
    this.set({
      level10Completed: true,
      currentObjective: "LEVEL 10 COMPLETE",
      toastMessage: "LEVEL 10 COMPLETE — THE FINAL BATTLE",
      cinematicOutroActive: true,
      cinematicText: "LEVEL 10 COMPLETE\n\nThe negative entity has been defeated.\nBut a mysterious Divine Guardian energy remains.\n\nTO BE CONTINUED IN LEVEL 11",
    });
  }

  // --- Level 11: The Divine Guardian ---
  startLevel11() {
    if (this.state.level11Started) return;
    this.set({
      currentLevel: 11,
      levelTitle: 'LEVEL 11: THE DIVINE GUARDIAN',
      level11Started: true,
      currentObjective: 'CHECK ON YOUR FRIEND',
      toastMessage: 'The temple is quiet. Check on your friend.',
      cinematicIntroActive: false,
      cinematicOutroActive: false,
      isDayMode: true,
      hasFlashlight: false
    });
  }

  detectDivineEnergyL11() {
    if (this.state.divineEnergyDetectedL11) return;
    this.set({
      divineEnergyDetectedL11: true,
      currentObjective: 'INVESTIGATE THE DIVINE ENERGY',
      toastMessage: 'Follow the positive energy into the central chamber.',
    });
  }
  
  manifestGuardianL11() {
    if (this.state.guardianAppeared) return;
    this.set({
      guardianAppeared: true,
      currentObjective: 'SPEAK WITH THE GUARDIAN',
    });
  }

  recognizePlayerL11() {
    if (this.state.guardianRecognizedPlayer) return;
    this.set({
      guardianRecognizedPlayer: true,
    });
  }

  joinGuardianL11() {
    if (this.state.guardianJoined) return;
    this.set({
      guardianJoined: true,
      currentObjective: 'CHECK ON YOUR FRIEND',
      toastMessage: 'THE GUARDIAN HAS JOINED YOU',
    });
  }

  recoverFriendL11() {
    if (this.state.friendRecovered) return;
    this.set({
      friendRecovered: true,
      currentObjective: 'LEAVE THE TEMPLE',
      toastMessage: 'Your friend is recovering.',
    });
  }

  startExitObjectiveL11() {
    if (this.state.exitObjectiveStarted) return;
    this.set({
      exitObjectiveStarted: true,
      currentObjective: 'LEAVE THE TEMPLE',
    });
  }

  completeLevel11() {
    if (this.state.level11Completed) return;
    this.set({
      level11Completed: true,
      currentObjective: 'LEVEL 11 COMPLETE',
      toastMessage: 'LEVEL 11 COMPLETE — THE DIVINE GUARDIAN',
      cinematicOutroActive: true,
      cinematicText: "LEVEL 11 COMPLETE\n\nThe Guardian has joined you.\nYour friend is safe.\n\nTO BE CONTINUED IN LEVEL 12 — THE END",
    });
  }

  // --- Level 12: The Final Escape ---
  startLevel12() {
    if (this.state.level12Started) return;
    this.set({
      currentLevel: 12,
      levelTitle: 'LEVEL 12: THE FINAL ESCAPE',
      level12Started: true,
      currentObjective: 'LEAVE THE TEMPLE',
      toastMessage: 'The temple is at peace. It is time to leave.',
      cinematicIntroActive: false,
      cinematicOutroActive: false,
      isDayMode: true,
      hasFlashlight: false
    });
  }

  triggerFinalExitL12() {
    if (this.state.finalExitReached) return;
    this.set({
      finalExitReached: true,
      currentObjective: 'THE END',
      toastMessage: 'You and your friend have escaped safely. The Guardian remains.',
      guardianStayedBehind: true,
      friendsEscaped: true
    });
    
    // Slight delay before full cinematic overlay
    setTimeout(() => {
      this.completeLevel12();
    }, 4000);
  }

  completeLevel12() {
    if (this.state.gameCompleted) return;
    this.set({
      finalCinematicStarted: true,
      finalCinematicCompleted: true,
      gameCompleted: true,
      cinematicOutroActive: true,
      cinematicText: "THE FINAL ESCAPE"
    });
  }

  // --- Guide Dialogue HUD ---
  triggerGuideDialogue({ speakerName = 'UNKNOWN GUIDE', message, choices = [] }) {
    this.set({
      activeGuideDialogue: { speakerName, message, choices },
    });
  }

  closeGuideDialogue() {
    this.set({ activeGuideDialogue: null });
  }

  setGuideChoiceHandler(fn) {
    this._guideChoiceHandler = fn;
  }

  handleGuideChoice(choiceKey) {
    this.set({ activeGuideDialogue: null, lastGuideChoice: choiceKey });
    if (this._guideChoiceHandler) {
      this._guideChoiceHandler(choiceKey);
    }
  }

  // --- AI Companion Modal (AICompanionModal.jsx compatibility) ---
  async askAICompanion(promptText) {
    if (this.state.aiCompanionThinking) return;

    const playerMsg = { sender: 'player', text: promptText, ts: Date.now() };
    this.set({
      aiCompanionThinking: true,
      aiCompanionDialogueHistory: [...this.state.aiCompanionDialogueHistory, playerMsg],
    });

    try {
      const { getGuideResponse } = await import('../services/GeminiService.js');
      const response = await getGuideResponse(promptText);
      const aiMsg = { sender: 'ai', text: response, ts: Date.now() };
      this.set({
        aiCompanionThinking: false,
        aiCompanionDialogueHistory: [...this.state.aiCompanionDialogueHistory, aiMsg],
      });
    } catch (err) {
      console.error('[GameState.askAICompanion] Error:', err);
      this.set({
        aiCompanionThinking: false,
        aiCompanionDialogueHistory: [
          ...this.state.aiCompanionDialogueHistory,
          { sender: 'ai', text: 'The connection fades. Ask again.', ts: Date.now() },
        ],
      });
    }
  }

  openAICompanion() {
    this.set({ aiCompanionOpen: true });
  }

  closeAICompanion() {
    this.set({ aiCompanionOpen: false });
  }

  closeScrollModal() {
    this.closeNotice();
  }

  // Reset to Level 1
  reset() {
    this.state = {
      currentLevel: 1,
      levelTitle: 'LEVEL 1: THE TEMPLE KEY',
      hasTempleKey: false,
      templeGateUnlocked: false,
      templeDoorsOpen: false,
      playerEnteredTemple: false,
      level1Completed: false,

      level2Started: false,
      clueFootprintsFound: false,
      friendItemFound: false,
      wallSymbolFound: false,
      mechanism1Activated: false,
      mechanism2Activated: false,
      mechanism3Activated: false,
      secretPassageOpened: false,
      playerEnteredSecretPassage: false,
      level2Completed: false,

      level3Started: false,
      clueFootprintsFoundL3: false,
      friendObjectFound: false,
      friendObjectExamined: false,
      wallSymbolExaminedL3: false,
      mechanismActivatedL3: false,
      innerDoorOpenedL3: false,
      entityEncounteredL3: false,
      entityFollowingL3: false,
      entityChasingL3: false,
      escapedToSanctuaryL3: false,
      mysteriousPersonEncounteredL3: false,
      level3Completed: false,

      level4Started: false,
      clueInscriptionExaminedL4: false,
      grimoireExaminedL4: false,
      friendRecorderFoundL4: false,
      mechanism1ActivatedL4: false,
      mechanism2ActivatedL4: false,
      relicPurgedL4: false,
      sanctuaryGateOpenedL4: false,
      entityManifestedL4: false,
      entityChasingL4: false,
      escapedSanctuaryL4: false,
      level4Completed: false,

      level5Started: false,
      aiCompanionMet: false,
      aiCompanionRevealed: false,
      puzzleSymbol1Activated: false,
      puzzleSymbol2Activated: false,
      puzzleSymbol3Activated: false,
      puzzleSequenceProgress: 0,
      ancientChamberUnlocked: false,
      entityNearbyL5: false,
      level5Completed: false,
      friendClueRevealedL5: false,

      // --- Level 8: Restoration of Spiritual Power State ---
      level8Started: false,
      nodeAActivatedL8: false,
      nodeBActivatedL8: false,
      nodeCActivatedL8: false,
      allNodesActivatedL8: false,
      altarReadyL8: false,
      restorationSequenceProgressL8: 0,
      restorationSequenceCompletedL8: false,
      negativeEnergyReactionTriggeredL8: false,
      altarStabilizationProgressL8: 0,
      altarStabilizedL8: false,
      spiritualPowerRestoredL8: false,
      friendReleaseTriggeredL8: false,
      friendFoundL8: false,
      level8Completed: false,

      // --- Level 9: The Negative Entity State ---
      level9Started: false,
      negativeSource1Discovered: false,
      entityFirstManifestation: false,
      negativeSource2Discovered: false,
      entityFollowing: false,
      chaseStarted: false,
      chaseCompleted: false,
      negativeSource3Discovered: false,
      entityCoreDiscovered: false,
      entityAbsorptionStarted: false,
      entityEmpowered: false,
      finalArenaDiscovered: false,
      level9Completed: false,

      // --- Level 10: The Final Battle State ---
      level10Started: false,
      bossPhase: 1,
      bossHealth: 100,
      bossShieldStrength: 100,
      spiritualPointAActivated: false,
      spiritualPointBActivated: false,
      spiritualPointCActivated: false,
      allSpiritualPointsActivated: false,
      bossCoreExposed: false,
      spiritualEnergy: 100,
      spiritualPointCorrupted: false,
      spiritualPointRestored: false,
      finalCoreExposed: false,
      bossDefeated: false,
      divineEnergyDetected: false,
      level10Completed: false,

      // --- Level 11: The Divine Guardian State ---
      level11Started: false,
      divineEnergyDetectedL11: false,
      guardianAppeared: false,
      guardianRecognizedPlayer: false,
      guardianJoined: false,
      friendRecovered: false,
      exitObjectiveStarted: false,
      level11Completed: false,

      // --- Level 12: The Final Escape State ---
      level12Started: false,
      finalExitReached: false,
      guardianStayedBehind: false,
      friendsEscaped: false,
      finalCinematicStarted: false,
      finalCinematicCompleted: false,
      gameCompleted: false,

      currentGuideState: 'IDLE',
      aiCompanionDialogueHistory: [],
      aiCompanionOpen: false,
      aiCompanionThinking: false,
      activeGuideDialogue: null,
      lastGuideChoice: null,
      explorationTimeL5: 0,
      sprintCountL5: 0,
      interactionCountL5: 0,
      flashlightUsageL5: 0,
      recentLocationL5: 'entrance',
      recentActionL5: 'exploring',

      // --- Flashlight State ---
      hasFlashlight: true,
      flashlightEquipped: true,
      flashlightOn: true,

      currentObjective: 'FIND THE TEMPLE KEY',
      toastMessage: 'Explore the illuminated courtyard to find the temple key.',
      interactionPrompt: null,
      cinematicIntroActive: false,
      cinematicIntroComplete: true,
      cinematicOutroActive: false,
      cinematicText: '',
      activeNotice: null,
      isNightMode: true,
      isDayMode: false,
      distanceToTemple: 20,
    };
    this.notify();
  }
}

export const gameState = new GameStateManager();
