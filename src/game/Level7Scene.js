/**
 * Level7Scene: THE ANCIENT SCROLL
 *
 * Theme: ANCIENT KNOWLEDGE + PUZZLE + MYSTERY + SPIRITUAL ENERGY
 *
 * Level 6 ended with finding the missing friend trapped at the altar under corrupted
 * temple energy. The Unknown Guide revealed that the ancient temple's protective power
 * itself has been corrupted, and that an ancient record may hold the key to restoring it.
 *
 * Level 7 Flow:
 * 1. Explore the ancient temple corridor & discover the Ancient Inscription.
 * 2. Locate the 3 Ancient Symbols (Solar ☼, Ocular 👁, Lunar ☽).
 * 3. Discover the locked Archive Gate and engage the 3 corresponding mechanisms.
 * 4. Enter the forgotten Ancient Archive chamber.
 * 5. Locate & examine the glowing Ancient Scroll on the central pedestal to decode the restoration ritual.
 * 6. Solve the Restoration Sequence Puzzle on the sacred dais (A [Solar] → C [Lunar] → B [Ocular]).
 * 7. Activate the Central Restoration Altar to achieve Partial Spiritual Energy Restoration (30%).
 * 8. The negative entity senses the ritual — sudden roar, camera shake, silhouette manifestation.
 * 9. AI Guide warns the player to escape the archive, leading into Level 8 (Restoration of Spiritual Power).
 *
 * Visuals & Lighting:
 * - 70-80% environmental readability (never pitch black)
 * - Warm temple ambient, hemisphere ceiling fill, moonlight shafts, torch sconces
 * - Full WASD + Sprint + Jump + Mouse Look + Flashlight + Pointer Lock controls
 * - Asynchronous AI Guide integration with 100% resilient local fallback
 */

import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { getProactiveHint } from './services/GeminiService.js';

export class Level7Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 22), // Spawns at corridor entrance
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         -0.03,
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

    // ─── Interaction & Physics ───
    this.interactables = [];
    this.colliders     = [];
    this.hoveredItem   = null;
    this.raycaster     = new THREE.Raycaster();

    // ─── Flashlight & Lights ───
    this.firstPersonFlashlight = null;
    this.templeLights          = [];

    // ─── Archive Gate Mechanism ───
    this.gateL                 = null;
    this.gateR                 = null;
    this.gateCollider          = null;
    this.gateOpenProgress      = 0;
    this.isGateOpening         = false;

    // ─── Interactive Mechanisms Meshes ───
    this.mechMeshA             = null;
    this.mechMeshB             = null;
    this.mechMeshC             = null;

    // ─── Symbols Meshes ───
    this.symbolMeshA           = null;
    this.symbolMeshB           = null;
    this.symbolMeshC           = null;

    // ─── Ancient Scroll & Pedestal ───
    this.scrollMesh            = null;
    this.scrollHalo            = null;
    this.scrollBobTimer        = 0;
    this.scrollModalOpen       = false;

    // ─── Restoration Dais & Altar ───
    this.altarCoreMesh         = null;
    this.altarLight            = null;
    this.nodeMeshes            = { A: null, B: null, C: null };
    this.nodeBeams             = [];
    this.sequenceStep          = 0; // Tracks current step: 0, 1, 2, 3
    this.isAltarActive         = false;

    // ─── Shadow Entity Flash ───
    this.entitySilhouette      = null;
    this.entityOpacity         = 0;
    this.entityTargetOpacity   = 0;

    // ─── Dust & Spiritual Particles ───
    this.particles             = null;
    this.spiritualParticles    = null;

    // ─── Progression Triggers ───
    this.hasTriggeredEscapeWarning = false;
    this.hasTriggeredCompletion    = false;

    // ─── Bound Event Handlers ───
    this.animate               = this.animate.bind(this);
    this.onKeyDown             = this.onKeyDown.bind(this);
    this.onKeyUp               = this.onKeyUp.bind(this);
    this.onMouseMove           = this.onMouseMove.bind(this);
    this.onPointerLockChange   = this.onPointerLockChange.bind(this);
    this.onResize              = this.onResize.bind(this);
    this.onCanvasClick         = this.onCanvasClick.bind(this);

    this.init();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  init() {
    this.setupThree();
    this.setupLighting();

    try {
      this.buildCorridorAndPillars();
    } catch (err) {
      console.error('[Level7] Error building corridor:', err);
    }

    try {
      this.buildAncientInscriptionTablet();
    } catch (err) {
      console.error('[Level7] Error building inscription:', err);
    }

    try {
      this.buildAncientSymbols();
    } catch (err) {
      console.error('[Level7] Error building symbols:', err);
    }

    try {
      this.buildThreeMechanisms();
    } catch (err) {
      console.error('[Level7] Error building mechanisms:', err);
    }

    try {
      this.buildArchiveGate();
    } catch (err) {
      console.error('[Level7] Error building archive gate:', err);
    }

    try {
      this.buildAncientArchiveChamber();
    } catch (err) {
      console.error('[Level7] Error building archive chamber:', err);
    }

    try {
      this.buildScrollPedestalAndScroll();
    } catch (err) {
      console.error('[Level7] Error building scroll pedestal:', err);
    }

    try {
      this.buildRestorationAltarAndNodes();
    } catch (err) {
      console.error('[Level7] Error building restoration altar:', err);
    }

    try {
      this.buildTempleAtmosphericDetails();
    } catch (err) {
      console.warn('[Level7] Error building temple atmospheric details:', err);
    }

    try {
      this.buildShadowEntitySilhouette();
    } catch (err) {
      console.error('[Level7] Error building entity silhouette:', err);
    }

    try {
      this.buildParticles();
    } catch (err) {
      console.warn('[Level7] Error building particles:', err);
    }

    try {
      this.setupFlashlight();
    } catch (err) {
      console.warn('[Level7] Error setting up flashlight:', err);
    }

    try {
      this.setupEventListeners();
    } catch (err) {
      console.error('[Level7] Error setting up event listeners:', err);
    }

    // Safely notify GameState on next event loop tick
    setTimeout(() => {
      gameState.startLevel7();
    }, 0);

    this.animate();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. THREE.JS ENGINE SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  setupThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x16151f, 0.011);

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
    this.renderer.toneMappingExposure = 1.36;
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BALANCED TEMPLE LIGHTING (70-80% Readability Target)
  // ═══════════════════════════════════════════════════════════════════════════
  setupLighting() {
    // Ambient Light: Soft dark gold & twilight ambient base
    const ambient = new THREE.AmbientLight(0x3a3440, 0.85);
    this.scene.add(ambient);

    // Hemisphere Light: warm vaulted stone ceiling / cool floor fill
    const hemi = new THREE.HemisphereLight(0x52485e, 0x1c1722, 1.5);
    hemi.position.set(0, 22, 0);
    this.scene.add(hemi);

    // Soft directional moonlight
    const keyLight = new THREE.DirectionalLight(0x71607a, 0.75);
    keyLight.position.set(5, 25, 10);
    this.scene.add(keyLight);

    // Torch sconces along corridor
    const torchPositions = [
      [-4.8, 2.5, 16], [4.8, 2.5, 16],
      [-4.8, 2.5, 6],  [4.8, 2.5, 6],
      [-4.8, 2.5, -4], [4.8, 2.5, -4],
      // Archive chamber torches
      [-8.5, 3.2, -14], [8.5, 3.2, -14],
      [-8.5, 3.2, -26], [8.5, 3.2, -26],
      [0, 4.0, -33],
    ];

    torchPositions.forEach(([x, y, z]) => {
      this.createTorchSconce(x, y, z);
    });
  }

  createTorchSconce(x, y, z) {
    const sconceGroup = new THREE.Group();
    sconceGroup.position.set(x, y, z);

    // Bracket
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.8, metalness: 0.5 });
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.35), bracketMat);
    sconceGroup.add(bracket);

    // Flame Bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 0.22, 8), bracketMat);
    bowl.position.set(0, 0.16, 0.2);
    sconceGroup.add(bowl);

    // Flame ember mesh
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa040 });
    const flame = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flameMat);
    flame.position.set(0, 0.32, 0.2);
    sconceGroup.add(flame);

    // Torch point light
    const light = new THREE.PointLight(0xff9933, 1.4, 16, 1.5);
    light.position.set(0, 0.35, 0.2);
    sconceGroup.add(light);

    this.templeLights.push({ light, baseIntensity: 1.4, flameMesh: flame, timeOffset: Math.random() * 20 });
    this.scene.add(sconceGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ZONE 1: ANCIENT CORRIDORS & PILLARS
  // ═══════════════════════════════════════════════════════════════════════════
  buildCorridorAndPillars() {
    const stoneWallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x4a434c,
      roughness: 0.88,
      metalness: 0.08,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0x3d3840,
      roughness: 0.92,
      metalness: 0.05,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x27232b,
      roughness: 0.95,
    });

    // Floor (Corridor: z = 24 to z = -7.5)
    const floorGeo = new THREE.PlaneGeometry(12, 32);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 8.25);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(12, 32);
    const ceil = new THREE.Mesh(ceilGeo, ceilingMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 6.8, 8.25);
    this.scene.add(ceil);

    // West Wall (Corridor)
    const wallGeoW = new THREE.BoxGeometry(0.8, 6.8, 32);
    const wallW = new THREE.Mesh(wallGeoW, stoneWallMat);
    wallW.position.set(-6, 3.4, 8.25);
    this.scene.add(wallW);
    this.colliders.push({ type: 'box', minX: -6.6, maxX: -5.4, minZ: -7.5, maxZ: 24 });

    // East Wall (Corridor)
    const wallGeoE = new THREE.BoxGeometry(0.8, 6.8, 32);
    const wallE = new THREE.Mesh(wallGeoE, stoneWallMat);
    wallE.position.set(6, 3.4, 8.25);
    this.scene.add(wallE);
    this.colliders.push({ type: 'box', minX: 5.4, maxX: 6.6, minZ: -7.5, maxZ: 24 });

    // Entrance Back Wall (South at z = 24)
    const backWallGeo = new THREE.BoxGeometry(12, 6.8, 0.8);
    const backWall = new THREE.Mesh(backWallGeo, stoneWallMat);
    backWall.position.set(0, 3.4, 24);
    this.scene.add(backWall);
    this.colliders.push({ type: 'box', minX: -6, maxX: 6, minZ: 23.4, maxZ: 24.6 });

    // Massive Columns along corridor
    const columnGeo = new THREE.CylinderGeometry(0.65, 0.75, 6.8, 12);
    const colPositions = [
      [-4.6, 3.4, 18], [4.6, 3.4, 18],
      [-4.6, 3.4, 10], [4.6, 3.4, 10],
      [-4.6, 3.4, 2],  [4.6, 3.4, 2],
    ];

    colPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(columnGeo, stoneWallMat);
      col.position.set(cx, cy, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      this.scene.add(col);
      this.colliders.push({ type: 'cylinder', x: cx, z: cz, radius: 0.75 });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ANCIENT INSCRIPTION TABLET
  // ═══════════════════════════════════════════════════════════════════════════
  buildAncientInscriptionTablet() {
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x332f38, roughness: 0.85 });
    const steleMat  = new THREE.MeshStandardMaterial({
      color: 0x221f26,
      roughness: 0.65,
      metalness: 0.25,
      emissive: 0x221600,
    });

    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(0, 0, 14);

    // Stone Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.2), plinthMat);
    base.position.y = 0.35;
    tabletGroup.add(base);

    // Carved Stele Slab
    const stele = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.25), steleMat);
    stele.position.set(0, 1.5, 0);
    stele.rotation.x = -0.08;
    tabletGroup.add(stele);

    // Glowing inscription glyph lines
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let r = 0; r < 4; r++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.9 - (r * 0.12), 0.05, 0.04), runeMat);
      line.position.set(0, 1.9 - (r * 0.28), 0.14);
      tabletGroup.add(line);
    }

    // Inscription aura light
    const runeLight = new THREE.PointLight(0xf59e0b, 1.1, 5, 2);
    runeLight.position.set(0, 1.5, 0.45);
    tabletGroup.add(runeLight);

    this.scene.add(tabletGroup);
    this.colliders.push({ type: 'box', minX: -1.0, maxX: 1.0, minZ: 13.2, maxZ: 14.8 });

    // Interaction Box
    this.interactables.push({
      mesh: stele,
      prompt: '[E] EXAMINE ANCIENT INSCRIPTION',
      range: 2.8,
      action: () => {
        gameState.discoverInscriptionL7();
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('inscription_found_l7') || 'Three symbols... three points of power. The symbols represent a sacred sequence.'
        );
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. THREE ANCIENT SYMBOLS (A, B, C)
  // ═══════════════════════════════════════════════════════════════════════════
  buildAncientSymbols() {
    // ─── SYMBOL A: Solar Glyph (☼) on West Pillar ───
    const solarGroup = new THREE.Group();
    solarGroup.position.set(-4.5, 2.4, 7.5);

    const solarRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.3 })
    );
    solarGroup.add(solarRing);

    const solarCore = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.18),
      new THREE.MeshBasicMaterial({ color: 0xffe082 })
    );
    solarGroup.add(solarCore);

    const solarLight = new THREE.PointLight(0xf59e0b, 1.2, 5, 2);
    solarGroup.add(solarLight);

    this.scene.add(solarGroup);
    this.symbolMeshA = solarGroup;

    this.interactables.push({
      mesh: solarRing,
      prompt: '[E] EXAMINE SOLAR GLYPH (SYMBOL A)',
      range: 2.5,
      action: () => {
        gameState.findSymbolL7('A');
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('symbol_a_found_l7') || 'You found the first symbol. Two remain.'
        );
      },
    });

    // ─── SYMBOL B: Ocular / Watcher Glyph (👁) in East Alcove ───
    const ocularGroup = new THREE.Group();
    ocularGroup.position.set(4.8, 2.4, 0.5);

    const ocularRune = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.06, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.3 })
    );
    ocularGroup.add(ocularRune);

    const ocularPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xbae6fd })
    );
    ocularGroup.add(ocularPupil);

    const ocularLight = new THREE.PointLight(0x38bdf8, 1.2, 5, 2);
    ocularGroup.add(ocularLight);

    this.scene.add(ocularGroup);
    this.symbolMeshB = ocularGroup;

    this.interactables.push({
      mesh: ocularRune,
      prompt: '[E] EXAMINE OCULAR GLYPH (SYMBOL B)',
      range: 2.5,
      action: () => {
        gameState.findSymbolL7('B');
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('symbol_b_found_l7') || 'The second symbol is revealed. One remains to unlock the archive.'
        );
      },
    });

    // ─── SYMBOL C: Lunar / Crescent Glyph (☽) above Northern Arch ───
    const lunarGroup = new THREE.Group();
    lunarGroup.position.set(0, 3.8, -4.8);

    const lunarCrescent = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.07, 8, 24, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0x7c3aed, roughness: 0.3 })
    );
    lunarCrescent.rotation.z = Math.PI / 4;
    lunarGroup.add(lunarCrescent);

    const lunarStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14),
      new THREE.MeshBasicMaterial({ color: 0xddd6fe })
    );
    lunarStar.position.set(0.12, 0.05, 0.05);
    lunarGroup.add(lunarStar);

    const lunarLight = new THREE.PointLight(0xa78bfa, 1.2, 5, 2);
    lunarGroup.add(lunarLight);

    this.scene.add(lunarGroup);
    this.symbolMeshC = lunarGroup;

    this.interactables.push({
      mesh: lunarCrescent,
      prompt: '[E] EXAMINE LUNAR GLYPH (SYMBOL C)',
      range: 3.2,
      action: () => {
        gameState.findSymbolL7('C');
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('symbol_c_found_l7') || 'You have everything you need. Now locate the three mechanisms.'
        );
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. THREE MECHANISMS (A, B, C)
  // ═══════════════════════════════════════════════════════════════════════════
  buildThreeMechanisms() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });

    // ─── Mechanism A (West Wall): Solar Rotary Dial ───
    const mechAGroup = new THREE.Group();
    mechAGroup.position.set(-5.5, 1.5, 3.2);

    const baseA = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.22, 16), metalMat);
    baseA.rotation.z = Math.PI / 2;
    mechAGroup.add(baseA);

    const dialA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    dialA.rotation.z = Math.PI / 2;
    mechAGroup.add(dialA);
    this.mechMeshA = dialA;

    this.scene.add(mechAGroup);

    this.interactables.push({
      mesh: dialA,
      prompt: '[E] ACTIVATE SOLAR MECHANISM (A)',
      range: 2.5,
      action: () => {
        if (!gameState.state.mechanismAActivatedL7) {
          dialA.rotation.x += Math.PI / 2;
          gameState.activateMechanismL7('A');
          this.triggerDialogue(
            'UNKNOWN GUIDE',
            getProactiveHint('mechanism_a_activated_l7') || 'One of the temple mechanisms has responded.'
          );
        }
      },
    });

    // ─── Mechanism B (East Wall): Ocular Dial ───
    const mechBGroup = new THREE.Group();
    mechBGroup.position.set(5.5, 1.5, -2.2);

    const baseB = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.22, 16), metalMat);
    baseB.rotation.z = -Math.PI / 2;
    mechBGroup.add(baseB);

    const dialB = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    dialB.rotation.z = -Math.PI / 2;
    mechBGroup.add(dialB);
    this.mechMeshB = dialB;

    this.scene.add(mechBGroup);

    this.interactables.push({
      mesh: dialB,
      prompt: '[E] ACTIVATE OCULAR MECHANISM (B)',
      range: 2.5,
      action: () => {
        if (!gameState.state.mechanismBActivatedL7) {
          dialB.rotation.x += Math.PI / 2;
          gameState.activateMechanismL7('B');
          this.triggerDialogue(
            'UNKNOWN GUIDE',
            getProactiveHint('mechanism_b_activated_l7') || 'The second mechanism turns. The archive seal is weakening.'
          );
        }
      },
    });

    // ─── Mechanism C (North Corridor): Lunar Pressure Plate ───
    const mechCGroup = new THREE.Group();
    mechCGroup.position.set(-2.8, 1.5, -5.8);

    const baseC = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.22, 16), metalMat);
    baseC.rotation.x = Math.PI / 2;
    mechCGroup.add(baseC);

    const dialC = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4 })
    );
    dialC.rotation.x = Math.PI / 2;
    mechCGroup.add(dialC);
    this.mechMeshC = dialC;

    this.scene.add(mechCGroup);

    this.interactables.push({
      mesh: dialC,
      prompt: '[E] ACTIVATE LUNAR MECHANISM (C)',
      range: 2.5,
      action: () => {
        if (!gameState.state.mechanismCActivatedL7) {
          dialC.rotation.y += Math.PI / 2;
          gameState.activateMechanismL7('C');
          this.triggerDialogue(
            'UNKNOWN GUIDE',
            getProactiveHint('mechanism_c_activated_l7') || 'All three mechanisms engaged. The ancient archive door is unsealed.'
          );
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ARCHIVE GATE (Opens on 3/3 Mechanisms)
  // ═══════════════════════════════════════════════════════════════════════════
  buildArchiveGate() {
    const doorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x36303c,
      roughness: 0.85,
      metalness: 0.15,
    });

    const doorArchMat = new THREE.MeshStandardMaterial({ color: 0x27222c, roughness: 0.9 });

    // Arch Frame Left & Right
    const archL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6.8, 1.2), doorArchMat);
    archL.position.set(-4.5, 3.4, -7.5);
    this.scene.add(archL);
    this.colliders.push({ type: 'box', minX: -6.0, maxX: -3.0, minZ: -8.2, maxZ: -6.8 });

    const archR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6.8, 1.2), doorArchMat);
    archR.position.set(4.5, 3.4, -7.5);
    this.scene.add(archR);
    this.colliders.push({ type: 'box', minX: 3.0, maxX: 6.0, minZ: -8.2, maxZ: -6.8 });

    // Arch Top Lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 1.4), doorArchMat);
    lintel.position.set(0, 6.1, -7.5);
    this.scene.add(lintel);

    // Sliding Left Door Leaf
    this.gateL = new THREE.Mesh(new THREE.BoxGeometry(3.1, 5.4, 0.45), doorMat);
    this.gateL.position.set(-1.55, 2.7, -7.5);
    this.scene.add(this.gateL);

    // Sliding Right Door Leaf
    this.gateR = new THREE.Mesh(new THREE.BoxGeometry(3.1, 5.4, 0.45), doorMat);
    this.gateR.position.set(1.55, 2.7, -7.5);
    this.scene.add(this.gateR);

    // Dynamic Door Collider
    this.gateCollider = { type: 'box', minX: -3.0, maxX: 3.0, minZ: -7.8, maxZ: -7.2 };
    this.colliders.push(this.gateCollider);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ZONE 3: ANCIENT ARCHIVE CHAMBER
  // ═══════════════════════════════════════════════════════════════════════════
  buildAncientArchiveChamber() {
    const archiveWallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x403744,
      roughness: 0.86,
      metalness: 0.1,
    });

    const archiveFloorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0x332c38,
      roughness: 0.9,
    });

    const archiveCeilMat = new THREE.MeshStandardMaterial({ color: 0x221c26, roughness: 0.95 });
    const woodShelfMat   = new THREE.MeshStandardMaterial({ color: 0x38281d, roughness: 0.85 });

    // Chamber Floor (z = -7.5 to z = -39, width = 22)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 32), archiveFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -23.5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Chamber Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(22, 32), archiveCeilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 8.4, -23.5);
    this.scene.add(ceil);

    // Chamber West Wall
    const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.4, 32), archiveWallMat);
    wallW.position.set(-11, 4.2, -23.5);
    this.scene.add(wallW);
    this.colliders.push({ type: 'box', minX: -11.6, maxX: -10.4, minZ: -40, maxZ: -7.5 });

    // Chamber East Wall
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.4, 32), archiveWallMat);
    wallE.position.set(11, 4.2, -23.5);
    this.scene.add(wallE);
    this.colliders.push({ type: 'box', minX: 10.4, maxX: 11.6, minZ: -40, maxZ: -7.5 });

    // Chamber North Back Wall with central chasm fissure (matching reference art)
    const wallNL = new THREE.Mesh(new THREE.BoxGeometry(9.6, 8.4, 0.8), archiveWallMat);
    wallNL.position.set(-6.2, 4.2, -39.5);
    this.scene.add(wallNL);
    this.colliders.push({ type: 'box', minX: -11, maxX: -1.4, minZ: -40.1, maxZ: -38.9 });

    const wallNR = new THREE.Mesh(new THREE.BoxGeometry(9.6, 8.4, 0.8), archiveWallMat);
    wallNR.position.set(6.2, 4.2, -39.5);
    this.scene.add(wallNR);
    this.colliders.push({ type: 'box', minX: 1.4, maxX: 11, minZ: -40.1, maxZ: -38.9 });

    // Deep Chasm Backdrop behind the split rear wall
    const chasmBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    chasmBackdrop.position.set(0, 5.0, -42.0);
    this.scene.add(chasmBackdrop);

    const chasmLight = new THREE.PointLight(0x60a5fa, 1.8, 22, 1.8);
    chasmLight.position.set(0, 5.5, -40.5);
    this.scene.add(chasmLight);
    this.colliders.push({ type: 'box', minX: -1.6, maxX: 1.6, minZ: -40.3, maxZ: -39.5 });

    // South Front Wall (around gate)
    const wallSW = new THREE.Mesh(new THREE.BoxGeometry(5.0, 8.4, 0.8), archiveWallMat);
    wallSW.position.set(-8.5, 4.2, -7.5);
    this.scene.add(wallSW);
    this.colliders.push({ type: 'box', minX: -11, maxX: -6.0, minZ: -8.1, maxZ: -6.9 });

    const wallSE = new THREE.Mesh(new THREE.BoxGeometry(5.0, 8.4, 0.8), archiveWallMat);
    wallSE.position.set(8.5, 4.2, -7.5);
    this.scene.add(wallSE);
    this.colliders.push({ type: 'box', minX: 6.0, maxX: 11, minZ: -8.1, maxZ: -6.9 });

    // Archive Shelves along walls
    const shelfGeo = new THREE.BoxGeometry(1.4, 4.8, 4.5);
    const shelfPositions = [
      [-9.8, 2.4, -13], [-9.8, 2.4, -20], [-9.8, 2.4, -27],
      [9.8, 2.4, -13],  [9.8, 2.4, -20],  [9.8, 2.4, -27],
    ];

    shelfPositions.forEach(([sx, sy, sz]) => {
      const shelf = new THREE.Mesh(shelfGeo, woodShelfMat);
      shelf.position.set(sx, sy, sz);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.scene.add(shelf);
      this.colliders.push({ type: 'box', minX: sx - 0.8, maxX: sx + 0.8, minZ: sz - 2.4, maxZ: sz + 2.4 });
    });

    // Vaulted Chamber Columns
    const chamberColGeo = new THREE.CylinderGeometry(0.85, 0.95, 8.4, 14);
    const chamberCols = [
      [-6.2, 4.2, -15], [6.2, 4.2, -15],
      [-6.2, 4.2, -25], [6.2, 4.2, -25],
    ];

    chamberCols.forEach(([cx, cy, cz]) => {
      const cCol = new THREE.Mesh(chamberColGeo, archiveWallMat);
      cCol.position.set(cx, cy, cz);
      cCol.castShadow = true;
      this.scene.add(cCol);
      this.colliders.push({ type: 'cylinder', x: cx, z: cz, radius: 0.95 });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CENTRAL SCROLL PEDESTAL & ANCIENT SCROLL
  // ═══════════════════════════════════════════════════════════════════════════
  buildScrollPedestalAndScroll() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, -17.5);

    // Tiered Stepped Plinth
    const plinth1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x302936, roughness: 0.85 })
    );
    plinth1.position.y = 0.225;
    pedestalGroup.add(plinth1);

    const plinth2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.3, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x261f2b, roughness: 0.8 })
    );
    plinth2.position.y = 0.8;
    pedestalGroup.add(plinth2);

    // Velvet ritual cloth
    const cloth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.7 })
    );
    cloth.position.y = 1.18;
    pedestalGroup.add(cloth);

    // ─── 3D Ancient Scroll ───
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(0, 1.35, 0);

    // Parchment Roll (cylinder)
    const parchmentMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.55,
      emissive: 0x3d2700,
    });
    const scrollRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 16), parchmentMat);
    scrollRoll.rotation.z = Math.PI / 2;
    scrollGroup.add(scrollRoll);

    // Gold ribbon seal
    const sealMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
    const sealRing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), sealMat);
    sealRing.rotation.z = Math.PI / 2;
    scrollGroup.add(sealRing);

    // Aura Halo
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), haloMat);
    scrollGroup.add(halo);
    this.scrollHalo = halo;

    // Glowing warm scroll light
    const scrollLight = new THREE.PointLight(0xf59e0b, 1.4, 6, 2);
    scrollLight.position.set(0, 0.3, 0);
    scrollGroup.add(scrollLight);

    pedestalGroup.add(scrollGroup);
    this.scrollMesh = scrollGroup;

    this.scene.add(pedestalGroup);
    this.colliders.push({ type: 'cylinder', x: 0, z: -17.5, radius: 1.6 });

    // Interaction with Ancient Scroll
    this.interactables.push({
      mesh: scrollRoll,
      prompt: '[E] EXAMINE ANCIENT SCROLL',
      range: 2.8,
      action: () => {
        gameState.examineAncientScrollL7();
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('ancient_scroll_found_l7') || 'You found it. The scroll contains the answer. Study the symbols to decode the sequence.'
        );
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. RESTORATION ALTAR & THREE NODES (Sequence: A → C → B)
  // ═══════════════════════════════════════════════════════════════════════════
  buildRestorationAltarAndNodes() {
    const altarDaisGroup = new THREE.Group();
    altarDaisGroup.position.set(0, 0, -28.5);

    // Stepped Ceremonial Dais
    const dais1 = new THREE.Mesh(
      new THREE.CylinderGeometry(5.8, 6.2, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x2c2633, roughness: 0.9 })
    );
    dais1.position.y = 0.175;
    altarDaisGroup.add(dais1);

    const dais2 = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 5.0, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x231d28, roughness: 0.85 })
    );
    dais2.position.y = 0.525;
    altarDaisGroup.add(dais2);

    // Central Altar Stone Table
    const altarTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.85, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1f1922, roughness: 0.75, metalness: 0.2 })
    );
    altarTable.position.set(0, 1.15, 0);
    altarDaisGroup.add(altarTable);

    // Central Altar Crystal Core
    const crystalGeo = new THREE.OctahedronGeometry(0.32);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.4,
    });
    const crystalCore = new THREE.Mesh(crystalGeo, crystalMat);
    crystalCore.position.set(0, 1.8, 0);
    altarDaisGroup.add(crystalCore);
    this.altarCoreMesh = crystalCore;

    // Altar Core Light
    this.altarLight = new THREE.PointLight(0x38bdf8, 0.8, 12, 1.8);
    this.altarLight.position.set(0, 1.85, 0);
    altarDaisGroup.add(this.altarLight);

    // ─── 3 Surrounding Ritual Nodes on the Dais ───
    // Node A (Solar - Left/West): Inscribed with Solar Glyph (☼)
    this.buildNodePillar(altarDaisGroup, 'A', -3.6, 0, 0xf59e0b, 'SOLAR NODE (☼)');

    // Node C (Lunar - Top/North): Inscribed with Lunar Glyph (☽)
    this.buildNodePillar(altarDaisGroup, 'C', 0, -3.8, 0xa78bfa, 'LUNAR NODE (☽)');

    // Node B (Ocular - Right/East): Inscribed with Ocular Glyph (👁)
    this.buildNodePillar(altarDaisGroup, 'B', 3.6, 0, 0x38bdf8, 'OCULAR NODE (👁)');

    this.scene.add(altarDaisGroup);
    this.colliders.push({ type: 'cylinder', x: 0, z: -28.5, radius: 4.8 });

    // Altar Table Interaction
    this.interactables.push({
      mesh: altarTable,
      prompt: '[E] ACTIVATE RESTORATION ALTAR',
      range: 3.2,
      action: () => {
        if (!gameState.state.restorationSequenceCompleted) {
          gameState.setToast('The altar is dormant. Decode and awaken the three surrounding nodes in sacred sequence.');
          return;
        }
        if (!this.isAltarActive) {
          this.executeAltarActivation();
        }
      },
    });
  }

  buildNodePillar(parentGroup, key, x, z, colorHex, label) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, 0.7, z);

    // Stone Pedestal
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x382f40, roughness: 0.85 })
    );
    pillar.position.y = 0.6;
    pillarGroup.add(pillar);

    // Node Rune Crystal
    const nodeCrystal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: 0x111111,
        roughness: 0.3,
      })
    );
    nodeCrystal.position.y = 1.35;
    pillarGroup.add(nodeCrystal);

    const nodeLight = new THREE.PointLight(colorHex, 0.4, 4, 2);
    nodeLight.position.y = 1.4;
    pillarGroup.add(nodeLight);

    parentGroup.add(pillarGroup);
    this.nodeMeshes[key] = { crystal: nodeCrystal, light: nodeLight, active: false };

    // Node Interaction (Part of Restoration Sequence: A -> C -> B)
    this.interactables.push({
      mesh: nodeCrystal,
      prompt: `[E] AWAKEN ${label}`,
      range: 2.5,
      action: () => {
        this.handleNodeInteraction(key);
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. SEQUENCE PUZZLE LOGIC (Correct: A → C → B)
  // ═══════════════════════════════════════════════════════════════════════════
  handleNodeInteraction(nodeKey) {
    if (gameState.state.restorationSequenceCompleted) {
      gameState.setToast('All nodes are harmonious! Activate the central altar.');
      return;
    }

    const expectedSequence = ['A', 'C', 'B'];
    const currentStep = this.sequenceStep;

    if (nodeKey === expectedSequence[currentStep]) {
      // Correct step!
      this.sequenceStep++;
      this.nodeMeshes[nodeKey].active = true;
      this.nodeMeshes[nodeKey].crystal.material.emissive.setHex(
        nodeKey === 'A' ? 0xf59e0b : nodeKey === 'C' ? 0xa78bfa : 0x38bdf8
      );
      this.nodeMeshes[nodeKey].light.intensity = 1.8;

      gameState.advanceRestorationSequenceL7(this.sequenceStep);

      if (this.sequenceStep === 1) {
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('restoration_step_1') || 'The first symbol resonates with spiritual energy.');
      } else if (this.sequenceStep === 2) {
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('restoration_step_2') || 'Two nodes awakened. One final node to bridge the power.');
      } else if (this.sequenceStep === 3) {
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('restoration_sequence_done') || 'The symbols are responding in harmony. Now activate the central altar.');
      }
    } else {
      // Wrong sequence — reset!
      this.sequenceStep = 0;
      Object.keys(this.nodeMeshes).forEach((k) => {
        this.nodeMeshes[k].active = false;
        this.nodeMeshes[k].crystal.material.emissive.setHex(0x111111);
        this.nodeMeshes[k].light.intensity = 0.4;
      });

      gameState.failRestorationSequenceL7();
      this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('restoration_sequence_wrong') || 'The temple rejected that sequence. The nodes have reset.');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12B. TEMPLE ATMOSPHERIC DETAILS (REFERENCE ART FIDELITY)
  // ═══════════════════════════════════════════════════════════════════════════
  buildTempleAtmosphericDetails() {
    const detailGroup = new THREE.Group();

    // 1. Central Floor Fissure / Deep Chasm Crack leading toward the Altar
    const crackMat = new THREE.MeshStandardMaterial({
      color: 0x09070c,
      roughness: 0.95,
      metalness: 0.1,
    });
    const fissureGeo = new THREE.BoxGeometry(0.55, 0.22, 18.0);
    const fissure = new THREE.Mesh(fissureGeo, crackMat);
    fissure.position.set(0, 0.04, -18.5);
    detailGroup.add(fissure);

    // Jagged crack offset stones along the fissure rim
    const jaggedMat = new THREE.MeshStandardMaterial({ color: 0x221d26, roughness: 0.9 });
    for (let i = 0; i < 14; i++) {
      const cz = -10 - i * 1.3;
      const cx = (i % 2 === 0 ? 0.38 : -0.38) + (Math.sin(i) * 0.12);
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(0.35 + Math.random() * 0.2, 0.12, 0.5 + Math.random() * 0.3),
        jaggedMat
      );
      stone.position.set(cx, 0.06, cz);
      stone.rotation.y = (i * 0.4);
      detailGroup.add(stone);
    }

    // 2. Crimson Ritual Blood Stains on Floor & Altar Steps
    const bloodMat = new THREE.MeshStandardMaterial({
      color: 0x580808,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    // Main pool at the foot of the altar
    const bloodPool1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 0.02, 12), bloodMat);
    bloodPool1.position.set(0, 0.08, -26.2);
    detailGroup.add(bloodPool1);

    // Trail dripping down the steps
    const bloodTrail = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.4), bloodMat);
    bloodTrail.rotation.x = -Math.PI / 2;
    bloodTrail.position.set(0, 0.36, -27.6);
    detailGroup.add(bloodTrail);

    // 3. Flanking Staircases with Twisting Dark Roots
    const stairStepMat = new THREE.MeshStandardMaterial({ color: 0x2a2430, roughness: 0.85 });
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x141017, roughness: 0.9 });

    [-7.6, 7.6].forEach((stairX) => {
      for (let s = 0; s < 7; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.9), stairStepMat);
        step.position.set(stairX, 0.2 + s * 0.4, -31.5 - s * 0.85);
        detailGroup.add(step);
        this.colliders.push({
          type: 'box',
          minX: stairX - 1.3,
          maxX: stairX + 1.3,
          minZ: -32 - s * 0.85,
          maxZ: -31 - s * 0.85,
        });

        // Tangled roots climbing up the steps
        if (s % 2 === 0) {
          const vine = new THREE.Mesh(
            new THREE.TorusGeometry(0.28, 0.06, 6, 12, Math.PI),
            vineMat
          );
          vine.position.set(stairX + (stairX > 0 ? 1.0 : -1.0), 0.4 + s * 0.4, -31.5 - s * 0.85);
          vine.rotation.x = Math.PI / 2;
          detailGroup.add(vine);
        }
      }
    });

    // 4. Carved Wall Graffiti & Desecrated Markings
    const createGraffitiMesh = (text, textColor, w, h) => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, 256, 128);
      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);

      const tex = new THREE.CanvasTexture(cv);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    };

    // Left North Wall: "WHY?"
    const graf1 = createGraffitiMesh('WHY?', '#881337', 3.2, 1.6);
    graf1.position.set(-4.5, 4.8, -39.05);
    detailGroup.add(graf1);

    // Left North Wall lower: "HELP ME"
    const graf2 = createGraffitiMesh('HELP ME', '#713f12', 2.8, 1.4);
    graf2.position.set(-8.5, 3.2, -39.05);
    detailGroup.add(graf2);

    // Right North Wall: "BURN IT"
    const graf3 = createGraffitiMesh('BURN IT', '#991b1b', 3.2, 1.6);
    graf3.position.set(4.5, 5.0, -39.05);
    detailGroup.add(graf3);

    // Right North Wall lower: "THE END IS HERE"
    const graf4 = createGraffitiMesh('THE END IS HERE', '#581c87', 3.8, 1.6);
    graf4.position.set(5.5, 3.4, -39.05);
    detailGroup.add(graf4);

    // 5. Hanging Tattered Banners on Pillars
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    [-6.2, 6.2].forEach((bx) => {
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.8), bannerMat);
      banner.position.set(bx + (bx > 0 ? -0.85 : 0.85), 4.2, -15);
      banner.rotation.y = bx > 0 ? -Math.PI / 6 : Math.PI / 6;
      detailGroup.add(banner);

      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x451a03, metalness: 0.7 })
      );
      rod.position.set(bx + (bx > 0 ? -0.85 : 0.85), 6.1, -15);
      rod.rotation.z = Math.PI / 2;
      detailGroup.add(rod);
    });

    // 6. Scattered Relics: Broken Swords, Shields, Bone Clusters on Floor
    const metalItemMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });

    // Scattered swords
    [
      [-3.2, 0.08, -14, 0.8],
      [4.5, 0.08, -19, -0.6],
      [-2.8, 0.08, -24, 2.1],
      [3.1, 0.08, -25, -1.8],
    ].forEach(([sx, sy, sz, rot]) => {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.9), metalItemMat);
      blade.position.set(sx, sy, sz);
      blade.rotation.y = rot;
      detailGroup.add(blade);

      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.06), metalItemMat);
      hilt.position.set(sx, sy, sz + 0.45 * Math.cos(rot));
      hilt.rotation.y = rot;
      detailGroup.add(hilt);
    });

    // Scattered shields
    [
      [-6.8, 0.45, -16.5, 0.4],
      [6.8, 0.45, -23.2, -0.4],
    ].forEach(([shx, shy, shz, rotZ]) => {
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 12), metalItemMat);
      shield.position.set(shx, shy, shz);
      shield.rotation.z = Math.PI / 3 + rotZ;
      shield.rotation.y = Math.PI / 4;
      detailGroup.add(shield);
    });

    // Scattered bone clusters
    [
      [-4.2, 0.06, -16],
      [4.8, 0.06, -21],
      [-5.2, 0.06, -26],
      [3.8, 0.06, -27],
    ].forEach(([bx, by, bz]) => {
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), boneMat);
      skull.position.set(bx, by + 0.12, bz);
      detailGroup.add(skull);

      const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), boneMat);
      bone.position.set(bx + 0.15, by + 0.04, bz + 0.1);
      bone.rotation.z = Math.PI / 3;
      detailGroup.add(bone);
    });

    // 7. Lit Ritual Candles on Altar Table & Steps
    const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });
    const candleFlameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    const candlePositions = [
      [-0.85, 1.62, -28.2],
      [-0.65, 1.58, -28.0],
      [0.85, 1.62, -28.2],
      [0.70, 1.58, -28.0],
      [-1.4, 0.62, -27.5],
      [1.4, 0.62, -27.5],
    ];

    candlePositions.forEach(([cx, cy, cz]) => {
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), candleWaxMat);
      wax.position.set(cx, cy, cz);
      detailGroup.add(wax);

      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), candleFlameMat);
      flame.position.set(cx, cy + 0.15, cz);
      detailGroup.add(flame);
    });

    // Extra ritual parchment rolls on the altar table
    const altarScrollMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });
    const altarScroll1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 10), altarScrollMat);
    altarScroll1.position.set(-0.6, 1.62, -28.5);
    altarScroll1.rotation.z = Math.PI / 2;
    altarScroll1.rotation.y = 0.3;
    detailGroup.add(altarScroll1);

    const altarScroll2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.48, 10), altarScrollMat);
    altarScroll2.position.set(-0.5, 1.62, -28.7);
    altarScroll2.rotation.z = Math.PI / 2;
    altarScroll2.rotation.y = -0.2;
    detailGroup.add(altarScroll2);

    this.scene.add(detailGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. CENTRAL ALTAR ACTIVATION & SPIRITUAL ENERGY RESTORATION (30%)
  // ═══════════════════════════════════════════════════════════════════════════
  executeAltarActivation() {
    this.isAltarActive = true;
    gameState.activateAltarL7();

    // Visual: altar core flares with brilliant divine radiance
    if (this.altarCoreMesh) {
      this.altarCoreMesh.material.color.setHex(0x38bdf8);
      this.altarCoreMesh.material.emissive.setHex(0x0284c7);
      this.altarCoreMesh.scale.set(1.6, 1.6, 1.6);
    }
    if (this.altarLight) {
      this.altarLight.intensity = 4.5;
      this.altarLight.distance  = 26;
      this.altarLight.color.setHex(0x38bdf8);
    }

    this.triggerDialogue(
      'UNKNOWN GUIDE',
      getProactiveHint('altar_activated_l7') || 'You restored part of its power. Spiritual energy at thirty percent.'
    );

    // Negative Entity Reaction triggered after a short delay
    setTimeout(() => {
      this.triggerEntityReaction();
    }, 1800);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. NEGATIVE ENTITY REACTION EVENT
  // ═══════════════════════════════════════════════════════════════════════════
  triggerEntityReaction() {
    gameState.triggerEntityReactionL7();
    this.shakeIntensity = 0.42;

    // Entity silhouette appears at archive doorway
    this.entityTargetOpacity = 0.85;

    // Flash lights dark red/purple
    this.templeLights.forEach((t) => {
      t.light.color.setHex(0x7c2d12);
      t.light.intensity = 2.2;
    });

    this.triggerDialogue(
      'UNKNOWN GUIDE',
      getProactiveHint('entity_reaction_l7') || 'Something noticed what you just did! The entity is enraged! Escape the archive!'
    );

    // Fade entity silhouette after 3.2s
    setTimeout(() => {
      this.entityTargetOpacity = 0;
      this.templeLights.forEach((t) => {
        t.light.color.setHex(0xff9933);
        t.light.intensity = t.baseIntensity;
      });
    }, 3200);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. SHADOW ENTITY SILHOUETTE
  // ═══════════════════════════════════════════════════════════════════════════
  buildShadowEntitySilhouette() {
    const group = new THREE.Group();
    group.position.set(0, 3.2, -7.2); // Positioned right at archive gate threshold

    // Shadow torso
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050208,
      transparent: true,
      opacity: 0,
    });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 2.4, 8), shadowMat);
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), shadowMat);
    head.position.y = 1.4;
    group.add(head);

    // Piercing Red Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
    eyeL.position.set(-0.14, 1.45, 0.32);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
    eyeR.position.set(0.14, 1.45, 0.32);
    group.add(eyeL);
    group.add(eyeR);

    // Multi-armed shadow claws
    for (let c = 0; c < 6; c++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), shadowMat);
      const angle = (c / 6) * Math.PI - Math.PI / 2;
      arm.position.set(Math.cos(angle) * 1.2, 0.8 + Math.sin(angle) * 0.6, 0);
      arm.rotation.z = angle;
      group.add(arm);
    }

    this.scene.add(group);
    this.entitySilhouette = group;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. DUST & SPIRITUAL PARTICLES
  // ═══════════════════════════════════════════════════════════════════════════
  buildParticles() {
    // Ambient floating dust particles
    const pCount = 180;
    const pGeo   = new THREE.BufferGeometry();
    const pPos   = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 20;
      pPos[i * 3 + 1] = Math.random() * 6.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 8;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
    });

    this.particles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.particles);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. FIRST-PERSON FLASHLIGHT
  // ═══════════════════════════════════════════════════════════════════════════
  setupFlashlight() {
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera, this.scene);
    if (this.firstPersonFlashlight && typeof this.firstPersonFlashlight.init === 'function') {
      this.firstPersonFlashlight.init();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════
  setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);
    if (this.canvas) {
      this.canvas.addEventListener('click', this.onCanvasClick);
    }
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = true; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'KeyE': this.handleInteraction(); break;
      case 'KeyF':
        if (this.firstPersonFlashlight && typeof this.firstPersonFlashlight.toggle === 'function') {
          this.firstPersonFlashlight.toggle();
        }
        break;
      case 'Space':
        if (this.player.isGrounded) {
          this.player.velocity.y = 4.6;
          this.player.isGrounded = false;
        }
        break;
      default: break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = false; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
      default: break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked) return;
    const sensitivity = 0.0022;
    this.player.yaw   -= e.movementX * sensitivity;
    this.player.pitch -= e.movementY * sensitivity;
    this.player.pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.player.pitch));
  }

  onPointerLockChange() {
    this.isPointerLocked = (document.pointerLockElement === this.canvas);
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    const w = this.canvas?.clientWidth || window.innerWidth;
    const h = this.canvas?.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  onCanvasClick() {
    if (!this.isPointerLocked && this.canvas) {
      this.canvas.requestPointerLock();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. INTERACTION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  updateInteractionRaycast() {
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    let closestItem = null;
    let closestDist = Infinity;

    for (const item of this.interactables) {
      const dist = this.camera.position.distanceTo(item.mesh.getWorldPosition(new THREE.Vector3()));
      if (dist <= item.range) {
        const intersects = this.raycaster.intersectObject(item.mesh, true);
        if (intersects.length > 0 && dist < closestDist) {
          closestItem = item;
          closestDist = dist;
        }
      }
    }

    if (closestItem !== this.hoveredItem) {
      this.hoveredItem = closestItem;
      gameState.setInteractionPrompt(closestItem ? closestItem.prompt : null);
    }
  }

  handleInteraction() {
    if (this.hoveredItem && typeof this.hoveredItem.action === 'function') {
      this.hoveredItem.action();
    }
  }

  triggerDialogue(speaker, message) {
    gameState.triggerGuideDialogue({ speakerName: speaker, message, choices: [] });
    setTimeout(() => {
      gameState.closeGuideDialogue();
    }, 5500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. PHYSICS & COLLISION RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════════
  updatePlayerPhysics(delta) {
    if (!this.player.canMove) return;

    // Movement direction
    const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw)).normalize();
    const right   = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keys.forward)  moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right)    moveDir.add(right);
    if (this.keys.left)     moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();

    const currentSpeed = this.keys.sprint ? this.player.sprintSpeed : this.player.speed;
    const targetVelX = moveDir.x * currentSpeed;
    const targetVelZ = moveDir.z * currentSpeed;

    this.player.velocity.x += (targetVelX - this.player.velocity.x) * 12 * delta;
    this.player.velocity.z += (targetVelZ - this.player.velocity.z) * 12 * delta;

    // Gravity
    if (!this.player.isGrounded) {
      this.player.velocity.y -= 9.8 * delta;
    }

    // Proposed new position
    const nextX = this.player.position.x + this.player.velocity.x * delta;
    const nextZ = this.player.position.z + this.player.velocity.z * delta;
    const nextY = this.player.position.y + this.player.velocity.y * delta;

    // Collision Check
    const playerRadius = 0.45;
    let allowedX = true;
    let allowedZ = true;

    for (const col of this.colliders) {
      if (col.type === 'box') {
        if (nextX + playerRadius > col.minX && nextX - playerRadius < col.maxX &&
            this.player.position.z + playerRadius > col.minZ && this.player.position.z - playerRadius < col.maxZ) {
          allowedX = false;
        }
        if (this.player.position.x + playerRadius > col.minX && this.player.position.x - playerRadius < col.maxX &&
            nextZ + playerRadius > col.minZ && nextZ - playerRadius < col.maxZ) {
          allowedZ = false;
        }
      } else if (col.type === 'cylinder') {
        const dX = nextX - col.x;
        const dZ = nextZ - col.z;
        if (Math.hypot(dX, dZ) < col.radius + playerRadius) {
          allowedX = false;
          allowedZ = false;
        }
      }
    }

    if (allowedX) this.player.position.x = nextX;
    if (allowedZ) this.player.position.z = nextZ;

    // Floor collision
    if (nextY <= 1.75) {
      this.player.position.y = 1.75;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    } else {
      this.player.position.y = nextY;
    }

    // Head-bobbing
    if (isMoving && this.player.isGrounded) {
      this.player.headBobTimer += delta * (this.keys.sprint ? 14 : 9);
    } else {
      this.player.headBobTimer = 0;
    }

    const bobOffset = Math.sin(this.player.headBobTimer) * 0.055;

    // Apply Camera transforms
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + bobOffset;
    this.camera.position.z = this.player.position.z;

    // Screen Shake application
    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.08, delta);
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    // Update First-Person Flashlight
    if (this.firstPersonFlashlight && typeof this.firstPersonFlashlight.update === 'function') {
      this.firstPersonFlashlight.update(delta);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. STORYLINE & PROGRESSION CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  checkStoryProgression() {
    // 1. Check if Archive Gate should open
    if (gameState.state.archiveOpened && this.gateOpenProgress < 1.0) {
      this.gateOpenProgress = Math.min(1.0, this.gateOpenProgress + 0.015);
      if (this.gateL) this.gateL.position.x = -1.55 - this.gateOpenProgress * 2.8;
      if (this.gateR) this.gateR.position.x =  1.55 + this.gateOpenProgress * 2.8;

      // Remove door collider once sufficiently open
      if (this.gateOpenProgress >= 0.7 && this.gateCollider) {
        const idx = this.colliders.indexOf(this.gateCollider);
        if (idx !== -1) this.colliders.splice(idx, 1);
        this.gateCollider = null;
      }
    }

    // 2. Escape warning: after altar is activated, when player heads towards corridor threshold
    if (gameState.state.entityReactionTriggered && !this.hasTriggeredEscapeWarning) {
      if (this.player.position.z > -11) {
        this.hasTriggeredEscapeWarning = true;
        this.triggerDialogue(
          'UNKNOWN GUIDE',
          getProactiveHint('level7_ending_speech') || 'You restored only part of the power. The rest must be restored from inside the temple. The one you came here for is still trapped.'
        );

        // Complete Level 7 after speech
        setTimeout(() => {
          if (!this.hasTriggeredCompletion) {
            this.hasTriggeredCompletion = true;
            gameState.completeLevel7();
          }
        }, 3200);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  animate() {
    if (!this.renderer) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Player Physics & Controls
    this.updatePlayerPhysics(delta);

    // 2. Raycast interactions
    this.updateInteractionRaycast();

    // 3. Torch flickers
    for (const t of this.templeLights) {
      const flicker = Math.sin(elapsed * 7.5 + t.timeOffset) * 0.12 + (Math.random() - 0.5) * 0.06;
      t.light.intensity = t.baseIntensity + flicker;
      if (t.flameMesh) {
        t.flameMesh.scale.set(1 + flicker * 0.25, 1 + flicker * 0.4, 1 + flicker * 0.25);
      }
    }

    // 4. Scroll bobbing animation
    if (this.scrollMesh) {
      this.scrollBobTimer += delta * 2.2;
      this.scrollMesh.position.y = 1.35 + Math.sin(this.scrollBobTimer) * 0.06;
      this.scrollMesh.rotation.y = elapsed * 0.5;
    }

    // 5. Altar Crystal Core rotation
    if (this.altarCoreMesh) {
      this.altarCoreMesh.rotation.y = elapsed * 0.75;
      this.altarCoreMesh.rotation.x = Math.sin(elapsed * 1.2) * 0.18;
    }

    // 6. Entity Silhouette Opacity Lerp
    if (this.entitySilhouette) {
      this.entityOpacity += (this.entityTargetOpacity - this.entityOpacity) * 5 * delta;
      this.entitySilhouette.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = this.entityOpacity;
        }
      });
    }

    // 7. Ambient particles gentle drift
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.015;
    }

    // 8. Storyline checks
    this.checkStoryProgression();

    // 9. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. TEARDOWN & CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('resize', this.onResize);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onCanvasClick);
    }

    if (this.firstPersonFlashlight && typeof this.firstPersonFlashlight.destroy === 'function') {
      this.firstPersonFlashlight.destroy();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
  }
}
