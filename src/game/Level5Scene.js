/**
 * Level5Scene: THE UNKNOWN GUIDE
 *
 * A quiet hidden temple chamber beneath the corrupted sanctuary.
 * The player discovers a mysterious human-like figure — an AI companion
 * that reads the actual GameState and provides contextual guidance.
 *
 * Architecture mirrors Level4Scene.js exactly.
 *
 * KEY SYSTEMS:
 * - Reuses existing temple textures (textureFactory)
 * - Reuses FirstPersonFlashlight
 * - Reuses SoundManager
 * - GuideDialogueHUD: cinematic bottom-panel dialogue (not a chatbot)
 * - GeminiService: game-state-aware AI with fallback
 * - Symbol puzzle: 3 tablets, spatial sequence (Δ→Ω→Ψ)
 * - Shadow entity: ambient danger, AI warnings with cooldown
 * - AI Companion state machine: IDLE, OBSERVE, GUIDE, WARN, HIDE, DISAPPEAR
 */

import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { getProactiveHint, getGuideResponse } from './services/GeminiService.js';

// ─── Companion States ─────────────────────────────────────────────────────────
const GUIDE_STATES = {
  IDLE:       'IDLE',
  OBSERVE:    'OBSERVE',
  GUIDE:      'GUIDE',
  WARN:       'WARN',
  HIDE:       'HIDE',
  DISAPPEAR:  'DISAPPEAR',
};

export class Level5Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene   = null;
    this.camera  = null;
    this.renderer = null;
    this.clock   = new THREE.Clock();

    // ─── Player (matches Level 4 pattern) ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 20),
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         -0.04,
      speed:         5.8,
      sprintSpeed:   9.2,
      isSprinting:   false,
      isGrounded:    true,
      headBobTimer:  0,
      canMove:       true,
    };

    this.shakeIntensity = 0;
    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
    this.isPointerLocked = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // ─── Interaction System ───
    this.interactables = [];
    this.colliders     = [];
    this.hoveredItem   = null;
    this.raycaster     = new THREE.Raycaster();

    // ─── Level 5 State Machine ───
    this.levelCompleted     = false;
    this.firstPersonFlashlight = null;
    this.templeSconces      = [];

    // ─── Symbols & Mechanisms ───
    this.symbolMeshes          = {};
    this.symbolGlowLights      = {};
    this.mechanismMeshes       = {};
    this.mechanismGlowLights   = {};
    this.chamberDoor           = null;
    this.chamberDoorCollider   = null;
    this.doorOpenProgress      = 0;
    this.doorOpening           = false;
    this.flashlightReactCooldown = 0;

    // ─── AI Companion ───
    this.guide = {
      mesh:           null,
      state:          GUIDE_STATES.IDLE,
      position:       new THREE.Vector3(-3, 0, -5),
      targetPosition: new THREE.Vector3(-3, 0, -5),
      opacity:        0,
      targetOpacity:  0,
      lookYaw:        0,
      floatTimer:     0,
      headMat:        null,
      bodyMat:        null,
      cloakMat:       null,
      eyesMat:        null,
      eyeGlow:        null,
    };

    // ─── Companion Waypoints ───
    this.guideWaypoints = [
      new THREE.Vector3(-3, 0, -5),
      new THREE.Vector3(0, 0, -3),
      new THREE.Vector3(2, 0, -8),
      new THREE.Vector3(-5, 0, -1),
    ];
    this.guideWaypointIndex = 0;

    // ─── Dialogue / AI Timers ───
    this.firstEncounterTriggered = false;
    this.firstEncounterTimer     = 0;     // wait ~8s before appearing
    this.puzzleStuckTimer        = 0;     // how long near puzzle without solving
    this.dangerWarnCooldown      = 0;     // min 6s between AI danger warnings
    this.proactiveHintCooldown   = 0;     // general hint cooldown
    this.dialogueQueue           = [];    // queued dialogue segments
    this.isShowingDialogue       = false;
    this.guideRevealPending      = false;
    this.finalRevealDone         = false;

    // ─── Shadow Entity ───
    this.entity = {
      mesh:           null,
      position:       new THREE.Vector3(0, 0, -25),
      active:         false,
      speed:          2.4,           // slow patrol, not aggressive chase
      waypointIndex:  0,
      eyesMat:        null,
      cloakMat:       null,
      opacity:        0,
      floatTimer:     0,
    };

    this.entityWaypoints = [
      new THREE.Vector3(-4, 0, -18),
      new THREE.Vector3(4, 0, -22),
      new THREE.Vector3(0, 0, -26),
      new THREE.Vector3(-5, 0, -21),
    ];

    // ─── Behavior Tracking ───
    this.explorationTimer   = 0;
    this.nearPuzzleTimer    = 0;
    this.sprintCounter      = 0;
    this.sprintTrackTimer   = 0;

    this.animate = this.animate.bind(this);
    this.init();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INIT
  // ═══════════════════════════════════════════════════════════════════════════
  init() {
    this.setupThree();
    this.setupLighting();

    try {
      this.buildChamberArchitecture();
    } catch (err) {
      console.error('[Level5] Error building architecture:', err);
    }

    try {
      this.buildThreeAncientSymbols();
    } catch (err) {
      console.error('[Level5] Error building symbols:', err);
    }

    try {
      this.buildThreeAncientMechanisms();
    } catch (err) {
      console.error('[Level5] Error building mechanisms:', err);
    }

    try {
      this.buildLockedChamberDoor();
    } catch (err) {
      console.error('[Level5] Error building chamber door:', err);
    }

    try {
      this.buildHiddenChamber();
    } catch (err) {
      console.error('[Level5] Error building hidden chamber:', err);
    }

    try {
      this.buildDebrisAndDetails();
    } catch (err) {
      console.warn('[Level5] Error building debris:', err);
    }

    try {
      this.buildAICompanionMesh();
    } catch (err) {
      console.warn('[Level5] Error building AI companion mesh:', err);
    }

    try {
      this.buildShadowEntity();
    } catch (err) {
      console.warn('[Level5] Error building shadow entity:', err);
    }

    try {
      this.setupFlashlight();
    } catch (err) {
      console.warn('[Level5] Error setting up flashlight:', err);
    }

    try {
      this.setupEventListeners();
    } catch (err) {
      console.error('[Level5] Error setting up event listeners:', err);
    }

    try {
      this.registerGuideChoiceHandler();
    } catch (err) {
      console.warn('[Level5] Error registering guide handler:', err);
    }

    // Safely notify GameState on next tick to avoid React re-render collision during mount
    setTimeout(() => {
      gameState.startLevel5();
    }, 0);

    this.animate();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. THREE.JS SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  setupThree() {
    this.scene = new THREE.Scene();
    // Slightly warmer, thinner mist than Level 4 — hidden chamber feels different
    this.scene.fog = new THREE.FogExp2(0x1c1814, 0.013);

    const w = (this.canvas?.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
    const h = (this.canvas?.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 280);
    this.camera.position.copy(this.player.position);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LIGHTING  — dark + mysterious + readable (same target as Level 4)
  // ═══════════════════════════════════════════════════════════════════════════
  setupLighting() {
    // Warm dim ambient — prevents total black crushing
    this.scene.add(new THREE.AmbientLight(0x3a2e22, 0.70));

    // Hemisphere: warm stone-ceiling / dark damp floor
    const hemi = new THREE.HemisphereLight(0x4a3d28, 0x1a1410, 1.42);
    hemi.position.set(0, 18, 0);
    this.scene.add(hemi);

    // Main key: moonlight / fissure from above
    const key = new THREE.DirectionalLight(0x5e5038, 0.72);
    key.position.set(4, 18, 8);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far  = 60;
    key.shadow.bias = -0.001;
    this.scene.add(key);

    // Cool fill from north — keeps far chamber readable
    const fill = new THREE.DirectionalLight(0x2a3545, 0.38);
    fill.position.set(-4, 8, -30);
    this.scene.add(fill);

    // Warm sconces / torch brackets
    const sconceData = [
      { pos: new THREE.Vector3(-5.5, 3.2, 10),  color: 0xffa040, intensity: 1.25, dist: 20 },
      { pos: new THREE.Vector3( 5.5, 3.2, 10),  color: 0xffa040, intensity: 1.25, dist: 20 },
      { pos: new THREE.Vector3(-5.5, 3.2, -2),  color: 0xff9430, intensity: 1.15, dist: 18 },
      { pos: new THREE.Vector3( 5.5, 3.2, -2),  color: 0xff9430, intensity: 1.15, dist: 18 },
      { pos: new THREE.Vector3(-9.5, 2.6, -3),  color: 0xff8c38, intensity: 0.95, dist: 14 }, // alcove
      { pos: new THREE.Vector3( 0,   3.0, -14), color: 0xff8020, intensity: 1.05, dist: 16 }, // hidden chamber
    ];

    sconceData.forEach((s, i) => {
      const pLight = new THREE.PointLight(s.color, s.intensity, s.dist, 1.3);
      pLight.position.copy(s.pos);
      this.scene.add(pLight);
      this.templeSconces.push({ light: pLight, baseIntensity: s.intensity, idx: i });

      // Visual ember bowl
      const bowlMat = new THREE.MeshBasicMaterial({ color: s.color });
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.06, 0.14, 10), bowlMat);
      bowl.position.copy(s.pos);
      this.scene.add(bowl);

      // Wall bracket
      const brack = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.35, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.6, metalness: 0.7 })
      );
      brack.position.copy(s.pos).add(new THREE.Vector3(0, -0.18, 0.12));
      this.scene.add(brack);
    });

    // Subtle blue-purple puzzle alcove light (draws attention)
    const alcoveLight = new THREE.PointLight(0x3040a0, 0.65, 10, 1.8);
    alcoveLight.position.set(-8.5, 2.5, -3);
    this.scene.add(alcoveLight);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CHAMBER ARCHITECTURE
  //    Entry corridor: Z=22..12, width=4
  //    Central chamber: Z=12..-9, width=14
  //    Alcove: X=-14..-7, Z=2..-7
  // ═══════════════════════════════════════════════════════════════════════════
  buildChamberArchitecture() {
    const wallTex = (textureFactory && typeof textureFactory.getCryptStoneWallTexture === 'function')
      ? textureFactory.getCryptStoneWallTexture() : null;
    if (wallTex) wallTex.repeat.set(3, 2);

    const floorTex = (textureFactory && typeof textureFactory.getSanctuaryFloorTexture === 'function')
      ? textureFactory.getSanctuaryFloorTexture() : null;
    if (floorTex) floorTex.repeat.set(3, 7);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x3a3632, roughness: 0.85, metalness: 0.06 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex || undefined, color: 0x242220, roughness: 0.55, metalness: 0.10 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x140f0a, roughness: 0.96 });
    const pillarMat = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x3a3632, roughness: 0.80, metalness: 0.08 });

    // ─── Entry Corridor (narrow) ───
    // Floor
    const corrFloor = new THREE.Mesh(new THREE.PlaneGeometry(4, 10), floorMat);
    corrFloor.rotation.x = -Math.PI / 2;
    corrFloor.position.set(0, 0, 17);
    corrFloor.receiveShadow = true;
    this.scene.add(corrFloor);

    // Left wall
    const corrWallL = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat);
    corrWallL.position.set(-2, 3, 17);
    corrWallL.rotation.y = Math.PI / 2;
    corrWallL.receiveShadow = true;
    this.scene.add(corrWallL);
    this.addBarrier(-2.2, 3, 17, 0.4, 6, 10);

    // Right wall
    const corrWallR = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat);
    corrWallR.position.set(2, 3, 17);
    corrWallR.rotation.y = -Math.PI / 2;
    corrWallR.receiveShadow = true;
    this.scene.add(corrWallR);
    this.addBarrier(2.2, 3, 17, 0.4, 6, 10);

    // Ceiling (corridor)
    const corrCeil = new THREE.Mesh(new THREE.PlaneGeometry(4, 10), ceilingMat);
    corrCeil.rotation.x = Math.PI / 2;
    corrCeil.position.set(0, 6, 17);
    this.scene.add(corrCeil);

    // Entry back wall (blocks player from going too far behind)
    const entryBack = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), wallMat);
    entryBack.position.set(0, 3, 22);
    entryBack.rotation.y = Math.PI;
    this.scene.add(entryBack);
    this.addBarrier(0, 3, 22.2, 4, 6, 0.4);

    // ─── Central Chamber ───
    const chamFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), floorMat);
    chamFloor.rotation.x = -Math.PI / 2;
    chamFloor.position.set(0, 0, 1);
    chamFloor.receiveShadow = true;
    this.scene.add(chamFloor);

    // Ceiling
    const chamCeil = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), ceilingMat);
    chamCeil.rotation.x = Math.PI / 2;
    chamCeil.position.set(0, 6.2, 1);
    this.scene.add(chamCeil);

    // Left wall (no alcove portion: Z=12 to Z=2 and Z=-7 to Z=-9)
    const lWallUpper = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.2), wallMat);
    lWallUpper.position.set(-7, 3.1, 7);
    lWallUpper.rotation.y = Math.PI / 2;
    lWallUpper.receiveShadow = true;
    this.scene.add(lWallUpper);
    this.addBarrier(-7.2, 3.1, 7, 0.4, 6.2, 10);

    // Left wall lower (below alcove)
    const lWallLower = new THREE.Mesh(new THREE.PlaneGeometry(2, 6.2), wallMat);
    lWallLower.position.set(-7, 3.1, -8);
    lWallLower.rotation.y = Math.PI / 2;
    lWallLower.receiveShadow = true;
    this.scene.add(lWallLower);
    this.addBarrier(-7.2, 3.1, -8, 0.4, 6.2, 2);

    // Right wall
    const rWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 6.2), wallMat);
    rWall.position.set(7, 3.1, 1);
    rWall.rotation.y = -Math.PI / 2;
    rWall.receiveShadow = true;
    this.scene.add(rWall);
    this.addBarrier(7.2, 3.1, 1, 0.4, 6.2, 22);

    // North wall (far end — hidden chamber door sits here)
    const nWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.2), wallMat);
    nWall.position.set(0, 3.1, -9);
    this.scene.add(nWall);
    this.addBarrier(0, 3.1, -9.2, 14, 6.2, 0.4);

    // ─── Alcove (left side, puzzle area) ───
    // Floor
    const alcFloor = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), floorMat);
    alcFloor.rotation.x = -Math.PI / 2;
    alcFloor.position.set(-10.5, 0, -2.5);
    alcFloor.receiveShadow = true;
    this.scene.add(alcFloor);

    // Ceiling
    const alcCeil = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), ceilingMat);
    alcCeil.rotation.x = Math.PI / 2;
    alcCeil.position.set(-10.5, 5, -2.5);
    this.scene.add(alcCeil);

    // Far left wall
    const alcFarL = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), wallMat);
    alcFarL.position.set(-14, 2.5, -2.5);
    alcFarL.rotation.y = Math.PI / 2;
    alcFarL.receiveShadow = true;
    this.scene.add(alcFarL);
    this.addBarrier(-14.2, 2.5, -2.5, 0.4, 5, 9);

    // Alcove top wall
    const alcTop = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), wallMat);
    alcTop.position.set(-10.5, 2.5, 2);
    alcTop.rotation.y = 0;
    alcTop.receiveShadow = true;
    this.scene.add(alcTop);
    this.addBarrier(-10.5, 2.5, 2.2, 7, 5, 0.4);

    // Alcove bottom wall
    const alcBottom = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), wallMat);
    alcBottom.position.set(-10.5, 2.5, -7);
    alcBottom.receiveShadow = true;
    this.scene.add(alcBottom);
    this.addBarrier(-10.5, 2.5, -7.2, 7, 5, 0.4);

    // ─── Colonnade Pillars (4 pairs in central chamber) ───
    const pillarZCoords = [10, 4, -2];
    pillarZCoords.forEach((pz) => {
      [-4.5, 4.5].forEach((px) => {
        const pg = new THREE.Group();

        const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 6, 1.1), pillarMat);
        shaft.position.y = 3;
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        pg.add(shaft);

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 1.5), pillarMat);
        base.position.y = 0.175;
        pg.add(base);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 1.55), pillarMat);
        cap.position.y = 6.25;
        pg.add(cap);

        pg.position.set(px, 0, pz);
        this.scene.add(pg);
        this.addBarrier(px, 3, pz, 1.3, 6, 1.3);
      });
    });

    // ─── Cross Beams ───
    pillarZCoords.forEach((pz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 0.7), pillarMat);
      beam.position.set(0, 6.0, pz);
      this.scene.add(beam);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. THREE ANCIENT SYMBOLS (Symbol A, B, C)
  //    Symbol A: Dawn / Solar Glyph (on East Pillar)
  //    Symbol B: Watcher's Eye Glyph (in NW Alcove)
  //    Symbol C: Twilight Crescent Glyph (near Northern Sealed Gate)
  // ═══════════════════════════════════════════════════════════════════════════
  buildThreeAncientSymbols() {
    const symbolDefs = [
      {
        key: 'A',
        char: '☼',
        title: 'SOLAR GLYPH',
        pos: new THREE.Vector3(5.0, 2.4, 4.0),
        rotY: -Math.PI / 2,
        color: '#ffb830',
        glowColor: 0xffaa20,
        bgColor: '#201404',
      },
      {
        key: 'B',
        char: '👁',
        title: 'WATCHER GLYPH',
        pos: new THREE.Vector3(-12.8, 2.4, -2.8),
        rotY: Math.PI / 2,
        color: '#38d9f5',
        glowColor: 0x20c0e8,
        bgColor: '#041620',
      },
      {
        key: 'C',
        char: '☽',
        title: 'CRESCENT GLYPH',
        pos: new THREE.Vector3(2.8, 2.4, -8.6),
        rotY: 0,
        color: '#c084fc',
        glowColor: 0xaa60ea,
        bgColor: '#180828',
      },
    ];

    symbolDefs.forEach((sym) => {
      // Stone backing tablet
      const tabletMat = new THREE.MeshStandardMaterial({
        color: 0x3d3024,
        roughness: 0.88,
        metalness: 0.1,
      });
      const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.14), tabletMat);
      tablet.position.copy(sym.pos);
      tablet.rotation.y = sym.rotY;
      this.scene.add(tablet);

      // Glowing Rune Face
      const faceMat = new THREE.MeshStandardMaterial({
        map: this.makeSymbolTexture(sym.char, sym.color, sym.bgColor),
        emissive: new THREE.Color(sym.glowColor),
        emissiveIntensity: 0.25,
        roughness: 0.55,
        transparent: true,
      });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), faceMat);
      face.position.copy(sym.pos);
      face.rotation.y = sym.rotY;
      face.translateZ(0.08);
      this.scene.add(face);
      this.symbolMeshes[sym.key] = face;

      // Glow PointLight
      const glowLight = new THREE.PointLight(sym.glowColor, 0.4, 4.5, 1.8);
      glowLight.position.copy(sym.pos);
      glowLight.translateZ(0.4);
      this.scene.add(glowLight);
      this.symbolGlowLights[sym.key] = glowLight;

      // Interaction Hitbox
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.0, 1.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.copy(sym.pos);
      this.scene.add(hitbox);

      hitbox.userData = {
        prompt: () => {
          const s = gameState.getState();
          const discovered = s[`symbol${sym.key}Found`];
          return discovered
            ? `[ANCIENT SYMBOL ${sym.key} — ${sym.title} (RECORDED)]`
            : `[E] EXAMINE ANCIENT SYMBOL ${sym.key} (${sym.title})`;
        },
        action: () => {
          this.onDiscoverSymbol(sym.key, sym.title);
        },
      };
      this.interactables.push(hitbox);
    });

    // Decorative ancient relief panel on east wall
    const reliefTex = textureFactory.getSanctuaryArchInscriptionTexture
      ? textureFactory.getSanctuaryArchInscriptionTexture()
      : null;
    if (reliefTex) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.2), new THREE.MeshStandardMaterial({
        map: reliefTex,
        roughness: 0.75,
        metalness: 0.1,
      }));
      panel.position.set(6.95, 2.8, -2);
      panel.rotation.y = -Math.PI / 2;
      this.scene.add(panel);
    }
  }

  onDiscoverSymbol(key, title) {
    const s = gameState.getState();
    const alreadyFound = s[`symbol${key}Found`];

    gameState.discoverSymbolL5(key);
    soundManager.playSymbolActivate();

    // Visual flare
    const face = this.symbolMeshes[key];
    if (face?.material) {
      face.material.emissiveIntensity = 1.6;
    }
    const glow = this.symbolGlowLights[key];
    if (glow) {
      glow.intensity = 1.8;
    }

    if (!alreadyFound) {
      gameState.setToast(`Ancient Symbol ${key} recorded: ${title}`);

      // Companion observation
      const hints = {
        A: 'The Solar Glyph... It mirrors the pedestal standing in the eastern sanctuary.',
        B: 'The Watcher\'s eye... In the western alcove, an ocular dial awaits alignment.',
        C: 'The Lunar crescent... It resonates with the pressure mechanism beside the sealed gate.',
      };
      if (this.guide.state !== GUIDE_STATES.IDLE && !this.isShowingDialogue) {
        setTimeout(() => {
          this.showGuideMessage(hints[key] || `Ancient Symbol ${key} has been illuminated.`, []);
        }, 600);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. THREE ANCIENT MECHANISMS (Mechanism A, B, C)
  //    Mechanism A: Solar Pedestal (near East Wall / Pillars)
  //    Mechanism B: Ocular Pillar Dial (in NW Alcove)
  //    Mechanism C: Lunar Pressure Mechanism (near North Chamber Wall)
  // ═══════════════════════════════════════════════════════════════════════════
  buildThreeAncientMechanisms() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x483a2a, roughness: 0.86, metalness: 0.12 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0x9e7832, roughness: 0.45, metalness: 0.82 });

    // ─── Mechanism A: Solar Pedestal ───
    const mechAGroup = new THREE.Group();
    const baseA = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 1.2, 12), stoneMat);
    baseA.position.y = 0.6;
    mechAGroup.add(baseA);

    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 24), brassMat);
    ringA.rotation.x = Math.PI / 2;
    ringA.position.y = 1.22;
    mechAGroup.add(ringA);

    const dialA = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.22, 16), brassMat);
    dialA.position.y = 1.26;
    mechAGroup.add(dialA);

    const crystalA = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffaa20,
        emissive: 0x663300,
        emissiveIntensity: 0.3,
        roughness: 0.2,
      })
    );
    crystalA.position.y = 1.55;
    mechAGroup.add(crystalA);

    mechAGroup.position.set(6.8, 0, 1.0);
    this.scene.add(mechAGroup);
    this.addBarrier(6.8, 0.8, 1.0, 1.4, 1.6, 1.4);
    this.mechanismMeshes['A'] = { group: mechAGroup, dial: dialA, crystal: crystalA };

    const glowLightA = new THREE.PointLight(0xffaa20, 0.2, 5, 2);
    glowLightA.position.set(6.8, 1.8, 1.0);
    this.scene.add(glowLightA);
    this.mechanismGlowLights['A'] = glowLightA;

    // ─── Mechanism B: Ocular Pillar Dial ───
    const mechBGroup = new THREE.Group();
    const baseB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), stoneMat);
    baseB.position.y = 0.7;
    mechBGroup.add(baseB);

    const dialFaceB = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 20), brassMat);
    dialFaceB.rotation.x = Math.PI / 2;
    dialFaceB.position.set(0, 1.2, 0.58);
    mechBGroup.add(dialFaceB);

    const irisB = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x20c0e8,
        emissive: 0x083040,
        emissiveIntensity: 0.3,
        roughness: 0.2,
      })
    );
    irisB.position.set(0, 1.2, 0.65);
    mechBGroup.add(irisB);

    mechBGroup.position.set(-11.0, 0, -5.0);
    this.scene.add(mechBGroup);
    this.addBarrier(-11.0, 0.8, -5.0, 1.4, 1.6, 1.4);
    this.mechanismMeshes['B'] = { group: mechBGroup, dial: dialFaceB, crystal: irisB };

    const glowLightB = new THREE.PointLight(0x20c0e8, 0.2, 5, 2);
    glowLightB.position.set(-11.0, 1.8, -4.8);
    this.scene.add(glowLightB);
    this.mechanismGlowLights['B'] = glowLightB;

    // ─── Mechanism C: Lunar Pressure Mechanism ───
    const mechCGroup = new THREE.Group();
    const baseC = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.6), stoneMat);
    baseC.position.y = 0.175;
    mechCGroup.add(baseC);

    const plateC = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16),
      new THREE.MeshStandardMaterial({
        color: 0x6e527a,
        emissive: 0x200c30,
        emissiveIntensity: 0.3,
        roughness: 0.5,
        metalness: 0.6,
      })
    );
    plateC.position.y = 0.32;
    mechCGroup.add(plateC);

    mechCGroup.position.set(-2.8, 0, -8.0);
    this.scene.add(mechCGroup);
    this.addBarrier(-2.8, 0.3, -8.0, 1.6, 0.6, 1.6);
    this.mechanismMeshes['C'] = { group: mechCGroup, dial: plateC, crystal: plateC };

    const glowLightC = new THREE.PointLight(0xaa60ea, 0.2, 5, 2);
    glowLightC.position.set(-2.8, 1.2, -8.0);
    this.scene.add(glowLightC);
    this.mechanismGlowLights['C'] = glowLightC;

    // ─── Register Interactables for Mechanisms ───
    const mechs = [
      { key: 'A', name: 'SOLAR PEDESTAL', pos: new THREE.Vector3(6.8, 1.2, 1.0) },
      { key: 'B', name: 'OCULAR DIAL', pos: new THREE.Vector3(-11.0, 1.2, -5.0) },
      { key: 'C', name: 'LUNAR MECHANISM', pos: new THREE.Vector3(-2.8, 0.5, -8.0) },
    ];

    mechs.forEach((m) => {
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.0, 1.6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.copy(m.pos);
      this.scene.add(hitbox);

      hitbox.userData = {
        prompt: () => {
          const s = gameState.getState();
          const activated = s[`mechanism${m.key}Activated`];
          const symFound = s[`symbol${m.key}Found`];
          if (activated) return `[MECHANISM ${m.key} — ${m.name} (ACTIVE)]`;
          if (!symFound) return `[MECHANISM ${m.key} — LOCKED (REQUIRES SYMBOL ${m.key})]`;
          return `[E] ACTIVATE MECHANISM ${m.key} (${m.name})`;
        },
        action: () => {
          this.onActivateMechanism(m.key, m.name);
        },
      };
      this.interactables.push(hitbox);
    });
  }

  onActivateMechanism(key, name) {
    const s = gameState.getState();
    const activated = s[`mechanism${key}Activated`];
    if (activated) {
      gameState.setToast(`Mechanism ${key} (${name}) has already been engaged.`);
      return;
    }

    const symFound = s[`symbol${key}Found`];
    if (!symFound) {
      gameState.setToast(`The mechanism is locked. You must first find and decipher Ancient Symbol ${key}.`);
      if (this.guide.state !== GUIDE_STATES.IDLE && !this.isShowingDialogue) {
        setTimeout(() => {
          this.showGuideMessage(`The seal resists. Seek Ancient Symbol ${key} before turning the mechanism.`, []);
        }, 400);
      }
      return;
    }

    // Activate mechanism
    gameState.activateMechanismL5(key);
    soundManager.playMechanismClick();

    // Visual animation & glow
    const mechObj = this.mechanismMeshes[key];
    if (mechObj?.dial) {
      if (key === 'C') {
        mechObj.dial.position.y = 0.22; // depress plate
      } else {
        mechObj.dial.rotation.y += Math.PI / 2;
      }
    }
    if (mechObj?.crystal?.material) {
      mechObj.crystal.material.emissiveIntensity = 2.2;
    }
    const light = this.mechanismGlowLights[key];
    if (light) {
      light.intensity = 2.0;
    }

    gameState.setToast(`Mechanism ${key} engaged! (${name})`);

    const updated = gameState.getState();
    const count = [updated.mechanismAActivated, updated.mechanismBActivated, updated.mechanismCActivated].filter(Boolean).length;

    if (count === 3) {
      // All 3 mechanisms activated -> unseal inner chamber
      setTimeout(() => {
        this.openInnerChamber();
      }, 800);
    } else {
      if (this.guide.state !== GUIDE_STATES.IDLE && !this.isShowingDialogue) {
        setTimeout(() => {
          this.showGuideMessage(`A resonance echoes through the stone... ${count} of 3 mechanisms aligned.`, []);
        }, 700);
      }
    }
  }

  openInnerChamber() {
    if (this.doorOpening) return;
    this.doorOpening = true;

    gameState.openInnerChamberL5();
    soundManager.playStoneDoorSlide();
    gameState.setToast('The 3 mechanisms hum in unison... The ancient chamber door is unsealed!');

    // Guide reaction
    setTimeout(() => {
      this.showGuideMessage('The ancient seals have parted... The inner chamber lies open. But be vigilant... something ancient awakens in the dark.', []);
    }, 1200);

    // Awaken shadow entity patrol
    setTimeout(() => {
      this.entity.active = true;
    }, 3500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LOCKED CHAMBER DOOR
  // ═══════════════════════════════════════════════════════════════════════════
  buildLockedChamberDoor() {
    const wallTex = textureFactory.getCryptStoneWallTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.88,
      metalness: 0.14,
      color: 0x3a3028,
    });

    // Door geometry — fills the doorway opening in north wall
    this.chamberDoor = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.5, 0.5), doorMat);
    this.chamberDoor.position.set(0, 2.75, -9.1);
    this.chamberDoor.castShadow = true;
    this.chamberDoor.receiveShadow = true;
    this.scene.add(this.chamberDoor);

    this.chamberDoorCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 2.75, -9.1),
      new THREE.Vector3(4.5, 5.5, 0.7)
    );
    this.colliders.push(this.chamberDoorCollider);

    // Heavy door frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9, metalness: 0.2 });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.2, 0.6), frameMat);
    frameL.position.set(-3, 3.1, -9);
    this.scene.add(frameL);
    this.addBarrier(-3, 3.1, -9, 0.8, 6.2, 0.6);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.2, 0.6), frameMat);
    frameR.position.set(3, 3.1, -9);
    this.scene.add(frameR);
    this.addBarrier(3, 3.1, -9, 0.8, 6.2, 0.6);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.7, 0.6), frameMat);
    frameTop.position.set(0, 6.15, -9);
    this.scene.add(frameTop);

    // Door seal glyph
    const sealMat = new THREE.MeshStandardMaterial({
      map: this.makeSymbolTexture('⬡', '#8060a0', '#0a0612'),
      emissive: new THREE.Color(0.15, 0, 0.3),
      emissiveIntensity: 0.6,
      transparent: true,
    });
    const seal = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), sealMat);
    seal.position.set(0, 2.8, -8.85);
    this.scene.add(seal);

    // Locked door interaction (examine only — can't open manually)
    this.chamberDoor.userData = {
      prompt: () => gameState.getState().innerChamberOpened ? '[E] ENTER INNER CHAMBER' : '[E] ANCIENT CHAMBER DOOR — SEALED (REQUIRES 3 MECHANISMS)',
      action: () => {
        if (gameState.getState().innerChamberOpened) {
          gameState.setToast('The stone door has slid open. Step inside.');
        } else {
          gameState.setToast('The door is sealed by 3 ancient mechanisms. Find the 3 symbols and activate each mechanism.');
          if (!this.isShowingDialogue) {
            this.showGuideMessage(getProactiveHint('stuck_at_puzzle'), []);
          }
        }
      },
    };
    this.interactables.push(this.chamberDoor);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. HIDDEN CHAMBER (beyond locked door)
  // ═══════════════════════════════════════════════════════════════════════════
  buildHiddenChamber() {
    const wallTex = (textureFactory && typeof textureFactory.getCryptStoneWallTexture === 'function')
      ? textureFactory.getCryptStoneWallTexture() : null;
    const floorTex = (textureFactory && typeof textureFactory.getSanctuaryFloorTexture === 'function')
      ? textureFactory.getSanctuaryFloorTexture() : null;
    const wallMat  = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x3a3632, roughness: 0.88, metalness: 0.06 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex || undefined, color: 0x242220, roughness: 0.60, metalness: 0.08 });
    const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x100c08, roughness: 0.96 });

    // Floor
    const hFloor = new THREE.Mesh(new THREE.PlaneGeometry(8, 9), floorMat);
    hFloor.rotation.x = -Math.PI / 2;
    hFloor.position.set(0, 0, -13.5);
    hFloor.receiveShadow = true;
    this.scene.add(hFloor);

    // Ceiling
    const hCeil = new THREE.Mesh(new THREE.PlaneGeometry(8, 9), ceilMat);
    hCeil.rotation.x = Math.PI / 2;
    hCeil.position.set(0, 5.5, -13.5);
    this.scene.add(hCeil);

    // Walls
    [[-4, 3, -13.5, Math.PI / 2], [4, 3, -13.5, -Math.PI / 2]].forEach(([x, y, z, ry]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.5), wallMat);
      w.position.set(x, y, z);
      w.rotation.y = ry;
      w.receiveShadow = true;
      this.scene.add(w);
    });

    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.5), wallMat);
    endWall.position.set(0, 3, -18);
    this.scene.add(endWall);
    this.addBarrier(0, 3, -18.2, 8, 5.5, 0.4);
    this.addBarrier(-4.2, 3, -13.5, 0.4, 5.5, 9);
    this.addBarrier(4.2, 3, -13.5, 0.4, 5.5, 9);

    // ─── Friend's Journal ───
    const journalMat = new THREE.MeshStandardMaterial({
      color: 0x6b4a28,
      roughness: 0.85,
      metalness: 0.04,
      emissive: 0x2a1a08,
      emissiveIntensity: 0.3,
    });
    const journal = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.38), journalMat);
    journal.position.set(-0.5, 0.5, -14.5);
    journal.rotation.y = 0.4;
    journal.castShadow = true;
    this.scene.add(journal);

    // Small candle light near journal
    const candleLight = new THREE.PointLight(0xffaa40, 0.8, 6, 2.0);
    candleLight.position.set(-0.5, 1.2, -14.5);
    this.scene.add(candleLight);

    // Gentle ember glow
    const ember = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.02, 0.12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffbb44 })
    );
    ember.position.set(-0.5, 0.55, -14.5);
    this.scene.add(ember);

    journal.userData = {
      prompt: '[E] READ FRIEND\'S JOURNAL',
      action: () => {
        gameState.findFriendClueL5();
        this.onFriendJournalFound();
      },
    };
    this.interactables.push(journal);

    // Level exit trigger zone (far end of hidden chamber)
    this.chamberExitZ = -17;
  }

  onFriendJournalFound() {
    soundManager.playClueInspect();
    gameState.setToast("Journal entry recovered: '...the whisper didn't come from the dark. It came from within me...'");
    setTimeout(() => {
      this.triggerFinalReveal();
    }, 1600);
  }

  triggerFinalReveal() {
    if (this.finalRevealDone) return;
    this.finalRevealDone = true;

    // Companion materializes beside the player
    this.setGuideState(GUIDE_STATES.GUIDE);
    this.guide.position.set(1.2, 0, -13.8);
    this.guide.targetOpacity = 0.95;

    setTimeout(() => {
      // Part 1
      this.showGuideMessage(
        "You found his journal... He was desperate, racing against time.",
        [],
        () => {
          setTimeout(() => {
            // Part 2 - exact canonical reveal
            this.showGuideMessage(
              "The darkness didn't take your friend... It took control of him. You still have time.",
              [],
              () => {
                setTimeout(() => {
                  // Part 3 - conclusion
                  this.showGuideMessage(
                    "He descended into the deeper sanctum below. Go. Break the entity's hold before he is lost forever.",
                    [],
                    () => {
                      this.setGuideState(GUIDE_STATES.DISAPPEAR);
                      setTimeout(() => {
                        this.levelCompleted = true;
                        gameState.completeLevel5();
                      }, 2000);
                    }
                  );
                }, 1600);
              }
            );
          }, 1800);
        }
      );
    }, 1200);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. DEBRIS & DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  buildDebrisAndDetails() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.92, metalness: 0.04 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x28201a, roughness: 0.95 });

    // Scattered stone fragments
    const debrisPositions = [
      [2.5, 0.1, 8], [-2.1, 0.08, 5.5], [3.8, 0.06, 1], [-3.5, 0.09, -1],
      [1.2, 0.07, -6], [5.5, 0.1, -3], [-6, 0.08, 6],
    ];
    debrisPositions.forEach(([x, y, z]) => {
      const s = 0.15 + Math.random() * 0.35;
      const d = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.4, s * 0.8), stoneMat);
      d.position.set(x, y, z);
      d.rotation.y = Math.random() * Math.PI;
      d.castShadow = false;
      this.scene.add(d);
    });

    // Old urns / clay pots
    const urnPositions = [[-5.8, 0, 8.5], [5.5, 0, 7], [-4.8, 0, -3]];
    urnPositions.forEach(([x, y, z]) => {
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.55, 10), darkMat);
      urn.position.set(x, 0.275, z);
      this.scene.add(urn);
    });

    // Footprint trail toward puzzle alcove
    const footTex = textureFactory.getFootprintTexture ? textureFactory.getFootprintTexture() : null;
    if (footTex) {
      const fpMat = new THREE.MeshBasicMaterial({
        map: footTex, transparent: true, opacity: 0.55,
        color: 0xd0b898, depthWrite: false,
      });
      const trailPoints = [
        [0, 0.02, 12], [-0.5, 0.02, 8], [-1, 0.02, 4],
        [-2, 0.02, 0], [-4, 0.02, -1], [-6, 0.02, -2],
        [-8, 0.02, -2.5],
      ];
      trailPoints.forEach(([x, y, z]) => {
        const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6), fpMat);
        fp.rotation.x = -Math.PI / 2;
        fp.position.set(x, y, z);
        this.scene.add(fp);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. AI COMPANION MESH — human-like, mysterious cloaked figure
  // ═══════════════════════════════════════════════════════════════════════════
  buildAICompanionMesh() {
    const root = new THREE.Group();

    // Cloak material — transparent, dark, subtle rim glow
    this.guide.cloakMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e18,
      emissive: 0x080a14,
      emissiveIntensity: 0.25,
      roughness: 0.92,
      metalness: 0.06,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });

    // Skin/face material (barely visible — kept in shadow)
    this.guide.headMat = new THREE.MeshStandardMaterial({
      color: 0x3d2d1e,
      roughness: 0.88,
      metalness: 0.04,
      transparent: true,
      opacity: 0.0,
    });

    // ─── Body ───
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.2, 12), this.guide.cloakMat);
    torso.position.y = 1.6;
    root.add(torso);

    // Cloak/robe (cone over body)
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.2, 14, 6, true), this.guide.cloakMat);
    robe.position.y = 1.1;
    root.add(robe);

    // ─── Head ───
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), this.guide.headMat);
    head.position.y = 2.32;
    root.add(head);

    // Hood (cone over head, slightly tilted)
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 12), this.guide.cloakMat);
    hood.position.y = 2.55;
    root.add(hood);

    // ─── Shoulders / Arms ───
    [-0.38, 0.38].forEach((sx) => {
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.7, 8), this.guide.cloakMat);
      shoulder.position.set(sx, 1.8, 0);
      shoulder.rotation.z = sx > 0 ? -0.45 : 0.45;
      root.add(shoulder);
    });

    // ─── Eyes — subtle amber glow ───
    this.guide.eyesMat = new THREE.MeshBasicMaterial({
      color: 0xd4a040,
      transparent: true,
      opacity: 0.0,
    });
    const eyeGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const leftEye  = new THREE.Mesh(eyeGeo, this.guide.eyesMat);
    const rightEye = new THREE.Mesh(eyeGeo, this.guide.eyesMat);
    leftEye.position.set(-0.08, 2.32, -0.2);
    rightEye.position.set(0.08, 2.32, -0.2);
    root.add(leftEye);
    root.add(rightEye);

    // Eye point light (warm amber glow — NOT monster red)
    this.guide.eyeGlow = new THREE.PointLight(0xc8903a, 0, 4.0, 1.6);
    this.guide.eyeGlow.position.set(0, 2.35, -0.3);
    root.add(this.guide.eyeGlow);

    // ─── Shadow Tendrils (subtle) ───
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const tendril = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.7, 0.04),
        this.guide.cloakMat
      );
      tendril.position.set(Math.cos(angle) * 0.28, 0.35, Math.sin(angle) * 0.28);
      root.add(tendril);
    }

    // ─── Interaction Hitbox on Unknown Guide ───
    const guideHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.8, 1.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    guideHitbox.position.set(0, 1.4, 0);
    root.add(guideHitbox);

    guideHitbox.userData = {
      prompt: () => {
        const s = gameState.getState();
        if (!s.firstGuideConversationComplete) return '[E] SPEAK TO THE UNKNOWN GUIDE';
        return '[E] ASK THE GUIDE FOR GUIDANCE';
      },
      action: () => {
        this.interactWithGuide();
      },
    };
    this.interactables.push(guideHitbox);

    root.position.copy(this.guide.position);
    root.visible = true;
    this.scene.add(root);
    this.guide.mesh = root;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. SHADOW ENTITY (ambient danger, appears after puzzle solved)
  // ═══════════════════════════════════════════════════════════════════════════
  buildShadowEntity() {
    const root = new THREE.Group();

    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x080810,
      emissive: 0x040408,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.entity.cloakMat = cloakMat;

    const shroud = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 14, 6, true), cloakMat);
    shroud.position.y = 1.2;
    root.add(shroud);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 12), cloakMat);
    body.position.y = 1.2;
    root.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), cloakMat);
    head.position.y = 2.35;
    root.add(head);

    this.entity.eyesMat = new THREE.MeshBasicMaterial({
      color: 0xcc2020,
      transparent: true,
      opacity: 0.0,
    });
    const eyeGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const eL = new THREE.Mesh(eyeGeo, this.entity.eyesMat);
    const eR = new THREE.Mesh(eyeGeo, this.entity.eyesMat);
    eL.position.set(-0.1, 2.38, -0.24);
    eR.position.set(0.1, 2.38, -0.24);
    root.add(eL);
    root.add(eR);

    root.position.copy(this.entity.position);
    this.scene.add(root);
    this.entity.mesh = root;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. FLASHLIGHT
  // ═══════════════════════════════════════════════════════════════════════════
  setupFlashlight() {
    try {
      this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera);
      const s = gameState.getState();
      if (s.hasFlashlight && s.flashlightEquipped) {
        if (typeof this.firstPersonFlashlight.equip === 'function') {
          this.firstPersonFlashlight.equip();
        }
        if (s.flashlightOn && typeof this.firstPersonFlashlight.turnOn === 'function') {
          this.firstPersonFlashlight.turnOn();
        }
      }
    } catch (e) {
      console.warn('[Level5] Flashlight setup error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. GUIDE CHOICE HANDLER & INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════
  registerGuideChoiceHandler() {
    gameState.setGuideChoiceHandler((key) => this.onPlayerChoice(key));
  }

  interactWithGuide() {
    const s = gameState.getState();
    if (!s.firstGuideConversationComplete) {
      this.showGuideMessage(
        "You shouldn't have come this deep.",
        [
          { label: 'Who are you?', key: 'who_are_you' },
          { label: 'Where is my friend?', key: 'where_friend' },
          { label: '[Stay silent]', key: 'stay_silent' },
        ]
      );
    } else {
      const choices = [
        { label: 'How do I unseal the inner chamber?', key: 'puzzle_help' },
        { label: 'Where did my friend go?', key: 'where_friend' },
        { label: 'What is lurking in the shadows?', key: 'danger_ask' },
        { label: '[Step back]', key: 'silent' },
      ];
      this.showGuideMessage('What do you seek to know?', choices);
    }
  }

  async onPlayerChoice(key) {
    if (key === 'auto_dismiss' || key === 'silent') {
      this.isShowingDialogue = false;
      this.processDialogueQueue();
      return;
    }

    // Canonical first dialogue choices
    if (key === 'who_are_you') {
      gameState.activateAICompanionL5();
      this.showGuideMessage(
        "A guide... or what remains of one. This sanctum was built to seal an ancient corruption. And now it remembers every soul who entered.",
        [
          { label: 'Where is my friend?', key: 'where_friend' },
          { label: 'How do I unseal the chamber?', key: 'puzzle_help' },
          { label: '[Step back]', key: 'silent' },
        ]
      );
      return;
    }

    if (key === 'where_friend') {
      gameState.activateAICompanionL5();
      this.showGuideMessage(
        "He walked this way... past the three ancient seals. His footsteps were uneven, like a man hunted by his own thoughts. You must reach the inner chamber to trace him.",
        [
          { label: 'How do I unseal the chamber?', key: 'puzzle_help' },
          { label: 'Who are you?', key: 'who_are_you' },
          { label: '[Step back]', key: 'silent' },
        ]
      );
      return;
    }

    if (key === 'stay_silent') {
      gameState.activateAICompanionL5();
      this.showGuideMessage(
        "Silence will not conceal you from these walls. Three seals bar the inner sanctuary: The Solar, The Watcher, and The Crescent. Seek their glyphs, then activate the mechanisms.",
        [
          { label: 'Where are the symbols?', key: 'puzzle_help' },
          { label: '[Proceed]', key: 'silent' },
        ]
      );
      return;
    }

    // Dynamic game-state aware inquiries
    const promptMap = {
      puzzle_help:     'How do I unseal the inner chamber and activate the three mechanisms?',
      danger_ask:      'What is that shadow moving in the dark?',
      friend_location: 'Where did my friend go in this chamber?',
      reveal_ask:      'How do you know what happened to my friend?',
    };

    const prompt = promptMap[key] || key;
    this.isShowingDialogue = true;

    try {
      const response = await getGuideResponse(prompt);
      this.showGuideResponse(response);
    } catch {
      this.showGuideResponse("Listen closely to the stone... the glyphs hold the answer.");
    }
  }

  showGuideResponse(text, callback) {
    const choices = [
      { label: 'Where is my friend?', key: 'where_friend' },
      { label: 'How do I unseal the chamber?', key: 'puzzle_help' },
      { label: '[Step back]', key: 'silent' },
    ];
    this.showGuideMessage(text, choices, callback);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════
  setupEventListeners() {
    this.onKeyDown           = this.onKeyDown.bind(this);
    this.onKeyUp             = this.onKeyUp.bind(this);
    this.onMouseMove         = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onResize            = this.onResize.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);

    this.onCanvasClick = () => {
      soundManager.init();
      soundManager.resume();
      if (!this.isPointerLocked && this.player.canMove) {
        this.canvas.requestPointerLock();
      } else {
        this.triggerInteraction();
      }
    };
    this.canvas.addEventListener('click', this.onCanvasClick);
  }

  onKeyDown(e) {
    soundManager.init();
    soundManager.resume();
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward  = true; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left     = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right    = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'Space':
        if (this.player.isGrounded && this.player.canMove) {
          this.player.velocity.y = 5.0;
          this.player.isGrounded = false;
          soundManager.playJump();
        }
        break;
      case 'KeyE': this.triggerInteraction(); break;
      case 'KeyF':
        if (this.firstPersonFlashlight) {
          const isOn = this.firstPersonFlashlight.toggle();
          gameState.set({ flashlightOn: isOn });
          gameState.state.flashlightUsageL5 = (gameState.state.flashlightUsageL5 || 0) + 1;

          if (isOn && this.flashlightReactCooldown <= 0 && this.guide.state !== GUIDE_STATES.IDLE && !this.isShowingDialogue) {
            const dist = this.player.position.distanceTo(this.guide.position);
            if (dist < 12) {
              this.flashlightReactCooldown = 24.0;
              setTimeout(() => {
                this.showGuideMessage('Careful with the beam. What sleeps in these stones takes notice of light.', []);
              }, 400);
            }
          }
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward  = false; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left     = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right    = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked) return;
    this.mouseDeltaX = e.movementX;
    this.mouseDeltaY = e.movementY;
    const sens = 0.0018;
    this.player.yaw   -= e.movementX * sens;
    this.player.pitch -= e.movementY * sens;
    this.player.pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.player.pitch));
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.camera)   { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    if (this.renderer) this.renderer.setSize(w, h, false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════
  triggerInteraction() {
    if (!this.hoveredItem) return;
    const ud = this.hoveredItem.userData;
    if (ud?.action) {
      ud.action();
      gameState.state.interactionCountL5 = (gameState.state.interactionCountL5 || 0) + 1;
    }
  }

  checkInteractables() {
    if (!this.camera) return;
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);

    if (hits.length > 0 && hits[0].distance < 5.0) {
      this.hoveredItem = hits[0].object;
      const ud = this.hoveredItem.userData;
      const prompt = typeof ud?.prompt === 'function' ? ud.prompt() : ud?.prompt;
      gameState.setInteractionPrompt(prompt || null);
    } else {
      this.hoveredItem = null;
      gameState.setInteractionPrompt(null);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. DIALOGUE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  showGuideMessage(message, choices = [], onComplete = null) {
    if (this.isShowingDialogue) {
      this.dialogueQueue.push({ message, choices, onComplete });
      return;
    }
    this.isShowingDialogue = true;
    this._pendingDialogueCallback = onComplete;

    gameState.triggerGuideDialogue({
      speakerName: 'UNKNOWN GUIDE',
      message,
      choices,
    });
  }

  processDialogueQueue() {
    this.isShowingDialogue = false;
    const cb = this._pendingDialogueCallback;
    this._pendingDialogueCallback = null;
    if (cb) cb();

    if (this.dialogueQueue.length > 0) {
      const next = this.dialogueQueue.shift();
      setTimeout(() => {
        this.showGuideMessage(next.message, next.choices, next.onComplete);
      }, 500);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. COMPANION STATE MACHINE
  // ═══════════════════════════════════════════════════════════════════════════
  setGuideState(newState) {
    this.guide.state = newState;
    gameState.setGuideState(newState);

    switch (newState) {
      case GUIDE_STATES.IDLE:
        this.guide.targetOpacity = 0.0;
        break;
      case GUIDE_STATES.OBSERVE:
        this.guide.targetOpacity = 0.35;
        break;
      case GUIDE_STATES.GUIDE:
        this.guide.targetOpacity = 0.88;
        break;
      case GUIDE_STATES.WARN:
        this.guide.targetOpacity = 0.70;
        break;
      case GUIDE_STATES.HIDE:
        this.guide.targetOpacity = 0.12;
        break;
      case GUIDE_STATES.DISAPPEAR:
        this.guide.targetOpacity = 0.0;
        break;
    }
  }

  updateAICompanion(delta) {
    if (!this.guide.mesh) return;

    this.guide.floatTimer += delta * 1.6;
    const bobY = Math.sin(this.guide.floatTimer) * 0.04;

    // Move toward target position (slow walk)
    const toTarget = new THREE.Vector3().subVectors(this.guide.targetPosition, this.guide.position);
    const distToTarget = toTarget.length();
    if (distToTarget > 0.3) {
      toTarget.normalize();
      this.guide.position.addScaledVector(toTarget, delta * 1.8);
    }

    this.guide.mesh.position.set(
      this.guide.position.x,
      this.guide.position.y + bobY,
      this.guide.position.z
    );

    // Look toward player
    const pp = this.player.position;
    const targetYaw = Math.atan2(pp.x - this.guide.position.x, pp.z - this.guide.position.z);
    this.guide.lookYaw = THREE.MathUtils.lerp(this.guide.lookYaw, targetYaw, delta * 2.0);
    this.guide.mesh.rotation.y = this.guide.lookYaw;

    // Fade opacity
    this.guide.opacity = THREE.MathUtils.lerp(this.guide.opacity, this.guide.targetOpacity, delta * 3.0);
    if (this.guide.cloakMat) this.guide.cloakMat.opacity = this.guide.opacity;
    if (this.guide.headMat)  this.guide.headMat.opacity  = this.guide.opacity * 0.7;
    if (this.guide.eyesMat)  this.guide.eyesMat.opacity  = this.guide.opacity;
    if (this.guide.eyeGlow)  this.guide.eyeGlow.intensity = this.guide.opacity * 1.8;

    // State-specific behavior
    if (this.guide.state === GUIDE_STATES.DISAPPEAR && this.guide.opacity < 0.02) {
      this.guide.mesh.visible = false;
    } else {
      this.guide.mesh.visible = true;
    }

    if (this.flashlightReactCooldown > 0) {
      this.flashlightReactCooldown -= delta;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. FIRST ENCOUNTER TRIGGER
  // ═══════════════════════════════════════════════════════════════════════════
  triggerFirstEncounter() {
    if (this.firstEncounterTriggered) return;
    this.firstEncounterTriggered = true;

    gameState.meetAICompanion();

    this.setGuideState(GUIDE_STATES.OBSERVE);
    this.guide.targetPosition.set(-3, 0, -4);

    setTimeout(() => {
      this.setGuideState(GUIDE_STATES.GUIDE);
      this.showGuideMessage(
        "You shouldn't have come this deep.",
        [
          { label: 'Who are you?',        key: 'who_are_you' },
          { label: 'Where is my friend?', key: 'where_friend' },
          { label: '[Stay silent]',       key: 'stay_silent' },
        ]
      );
    }, 1800);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. DANGER SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  updateDangerSystem(delta) {
    if (!this.entity.active || !this.entity.mesh) return;

    // Entity patrol
    this.entity.floatTimer += delta * 2.8;
    const wp = this.entityWaypoints[this.entity.waypointIndex];
    const toWp = new THREE.Vector3().subVectors(wp, this.entity.position);
    if (toWp.length() < 2.0) {
      this.entity.waypointIndex = (this.entity.waypointIndex + 1) % this.entityWaypoints.length;
    } else {
      toWp.normalize();
      this.entity.position.addScaledVector(toWp, this.entity.speed * delta);
    }

    const bobY = Math.sin(this.entity.floatTimer) * 0.10;
    this.entity.mesh.position.set(
      this.entity.position.x,
      this.entity.position.y + bobY,
      this.entity.position.z
    );

    // Face movement direction
    const tgt = this.entityWaypoints[this.entity.waypointIndex];
    const eYaw = Math.atan2(tgt.x - this.entity.position.x, tgt.z - this.entity.position.z);
    this.entity.mesh.rotation.y = THREE.MathUtils.lerp(this.entity.mesh.rotation.y, eYaw, delta * 2.5);

    // Fade entity opacity (only visible when active)
    const targetOp = this.entity.active ? 0.78 : 0;
    this.entity.opacity = THREE.MathUtils.lerp(this.entity.opacity, targetOp, delta * 2.5);
    if (this.entity.cloakMat) this.entity.cloakMat.opacity = this.entity.opacity;
    if (this.entity.eyesMat)  this.entity.eyesMat.opacity  = this.entity.opacity;

    // Distance to player
    const distToPlayer = this.entity.position.distanceTo(this.player.position);
    const isNearby = distToPlayer < 12;
    gameState.triggerEntityNearbyL5(isNearby);

    // AI Warning system (with cooldown)
    this.dangerWarnCooldown -= delta;
    if (this.dangerWarnCooldown <= 0) {
      if (distToPlayer < 5 && !this.isShowingDialogue) {
        this.showGuideMessage(getProactiveHint('entity_warning_3'), []);
        this.dangerWarnCooldown = 8;
      } else if (distToPlayer < 8 && !this.isShowingDialogue) {
        this.showGuideMessage(getProactiveHint('entity_warning_2'), []);
        this.dangerWarnCooldown = 7;
      } else if (distToPlayer < 12 && !this.isShowingDialogue) {
        this.showGuideMessage(getProactiveHint('entity_warning_1'), []);
        this.dangerWarnCooldown = 6;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. PLAYER UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  updatePlayer(delta) {
    if (!this.player.canMove) return;

    const isSprinting = this.keys.sprint;
    this.player.isSprinting = isSprinting;
    const speed = isSprinting ? this.player.sprintSpeed : this.player.speed;

    // Apply camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    // Forward vector (flat)
    const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    const right   = new THREE.Vector3( Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));

    const moveDir = new THREE.Vector3();
    if (this.keys.forward)  moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.left)     moveDir.sub(right);
    if (this.keys.right)    moveDir.add(right);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const isMoving = moveDir.lengthSq() > 0;
    this.player.velocity.x = moveDir.x * speed;
    this.player.velocity.z = moveDir.z * speed;

    // Gravity
    this.player.velocity.y -= 14.0 * delta;

    const nextPos = this.player.position.clone();
    nextPos.x += this.player.velocity.x * delta;
    nextPos.z += this.player.velocity.z * delta;
    nextPos.y += this.player.velocity.y * delta;

    if (nextPos.y <= 1.75) {
      nextPos.y = 1.75;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    }

    // Collision
    const playerBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(0.8, 1.8, 0.8));
    let collided = false;
    for (const box of this.colliders) {
      if (box.intersectsBox(playerBox)) { collided = true; break; }
    }

    if (!collided) {
      this.player.position.copy(nextPos);
    } else {
      const testX = this.player.position.clone(); testX.x = nextPos.x;
      if (!this.colliders.some(b => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testX, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.x = testX.x;
      }
      const testZ = this.player.position.clone(); testZ.z = nextPos.z;
      if (!this.colliders.some(b => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testZ, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.z = testZ.z;
      }
    }

    // Head bob
    if (isMoving && this.player.isGrounded) {
      this.player.headBobTimer += delta * (isSprinting ? 15.0 : 10.0);
      const bob = Math.sin(this.player.headBobTimer) * (isSprinting ? 0.08 : 0.04);
      this.camera.position.set(this.player.position.x, this.player.position.y + bob, this.player.position.z);
      soundManager.playFootstep();
    } else {
      this.camera.position.copy(this.player.position);
    }

    // Flashlight update
    if (this.firstPersonFlashlight) {
      this.firstPersonFlashlight.update(delta, isMoving, isSprinting, this.player.headBobTimer, this.mouseDeltaX, this.mouseDeltaY);
    }
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. BEHAVIOR TRACKING (feeds GeminiService context)
  // ═══════════════════════════════════════════════════════════════════════════
  updateBehaviorTracking(delta) {
    // Exploration time
    this.explorationTimer += delta;
    gameState.state.explorationTimeL5 = Math.round(this.explorationTimer);

    // Sprint tracking
    if (this.keys.sprint) {
      this.sprintTrackTimer += delta;
      if (this.sprintTrackTimer > 0.5) {
        this.sprintTrackTimer = 0;
        this.sprintCounter++;
        gameState.state.sprintCountL5 = this.sprintCounter;
        if (this.sprintCounter === 6 && !this.isShowingDialogue && this.firstEncounterTriggered) {
          this.showGuideMessage(getProactiveHint('player_sprinting'), []);
        }
      }
    } else {
      this.sprintTrackTimer = 0;
    }

    // Location tracking
    const pz = this.player.position.z;
    const px = this.player.position.x;
    if (pz > 12) {
      gameState.state.recentLocationL5 = 'entry corridor';
    } else if (px < -7) {
      gameState.state.recentLocationL5 = 'puzzle alcove';
    } else if (pz < -9) {
      gameState.state.recentLocationL5 = 'hidden chamber';
    } else {
      gameState.state.recentLocationL5 = 'central chamber';
    }

    // First encounter timer
    if (!this.firstEncounterTriggered) {
      this.firstEncounterTimer += delta;
      if (this.firstEncounterTimer > 8.0 && this.player.position.z < 15) {
        this.triggerFirstEncounter();
      }
    }

    // Puzzle stuck timer (player near puzzle area but not solved)
    const state = gameState.getState();
    const nearPuzzle = px < -6 && pz > -8 && pz < 2;
    if (nearPuzzle && !state.innerChamberOpened) {
      this.nearPuzzleTimer += delta;
      if (this.nearPuzzleTimer > 35 && !this.isShowingDialogue && this.firstEncounterTriggered) {
        this.nearPuzzleTimer = 0;
        this.showGuideMessage(getProactiveHint('stuck_at_puzzle'), []);
      }
    } else {
      this.nearPuzzleTimer = 0;
    }

    // Wrong direction hint
    if (pz > 18 && this.firstEncounterTriggered && !this.isShowingDialogue) {
      this.proactiveHintCooldown -= delta;
      if (this.proactiveHintCooldown <= 0) {
        this.showGuideMessage(getProactiveHint('wrong_direction'), []);
        this.proactiveHintCooldown = 15;
      }
    }

    // Level exit trigger
    if (this.player.position.z < this.chamberExitZ && state.friendClueRevealedL5 && !this.levelCompleted) {
      // No explicit exit trigger here — final reveal happens via onFriendJournalFound
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. ANIMATE (main loop)
  // ═══════════════════════════════════════════════════════════════════════════
  animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time  = this.clock.getElapsedTime();

    this.updatePlayer(delta);
    this.updateBehaviorTracking(delta);
    this.checkInteractables();
    this.updateAICompanion(delta);
    this.updateDangerSystem(delta);

    // Chamber door slide animation
    if (this.doorOpening && this.chamberDoor && this.doorOpenProgress < 5.8) {
      const step = delta * 1.8;
      this.doorOpenProgress += step;
      this.chamberDoor.position.y += step;

      // Remove door collider once open enough
      if (this.chamberDoorCollider && this.doorOpenProgress >= 4.5) {
        const idx = this.colliders.indexOf(this.chamberDoorCollider);
        if (idx !== -1) { this.colliders.splice(idx, 1); this.chamberDoorCollider = null; }
      }
    }

    // Sconce flicker
    this.templeSconces.forEach((s) => {
      s.light.intensity = s.baseIntensity + Math.sin(time * 8.5 + s.idx) * 0.18 + (Math.random() - 0.5) * 0.08;
    });

    // Symbol & Mechanism glow pulse
    Object.values(this.symbolGlowLights).forEach((gl, i) => {
      if (gl && gl.intensity > 0.1) {
        gl.intensity = gl.intensity * 0.96 + (gl.intensity * 1.04) * 0.04 + Math.sin(time * 3 + i) * 0.05;
      }
    });
    Object.values(this.mechanismGlowLights).forEach((ml, i) => {
      if (ml && ml.intensity > 0.1) {
        ml.intensity = ml.intensity * 0.96 + (ml.intensity * 1.04) * 0.04 + Math.sin(time * 3.5 + i) * 0.05;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  addBarrier(x, y, z, w, h, d) {
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(w, h, d)
    );
    this.colliders.push(box);
  }

  /**
   * Creates a canvas texture with a single centered symbol character.
   */
  makeSymbolTexture(symbol, textColor = '#c4a878', bgColor = '#1a1208') {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Subtle vignette
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    // Symbol
    ctx.fillStyle = textColor;
    ctx.font      = 'bold 140px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = textColor;
    ctx.shadowBlur   = 18;
    ctx.fillText(symbol, size / 2, size / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. DESTROY
  // ═══════════════════════════════════════════════════════════════════════════
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('resize', this.onResize);
    if (this.onCanvasClick) this.canvas.removeEventListener('click', this.onCanvasClick);

    // Clear guide choice handler
    gameState.setGuideChoiceHandler(null);
    gameState.set({ activeGuideDialogue: null, interactionPrompt: null });

    if (this.firstPersonFlashlight) {
      this.firstPersonFlashlight.destroy();
      this.firstPersonFlashlight = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
