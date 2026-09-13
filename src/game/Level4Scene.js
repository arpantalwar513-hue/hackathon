import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { EntityAI, AI_STATES } from './ai/EntityAI.js';

/**
 * Level4Scene: THE DEEP SANCTUM
 *
 * A haunted corrupted temple sanctuary. Bright enough to read environment
 * clearly without flashlight (target 70-80% ambient visibility).
 *
 * Gameplay Progression:
 * 1. Spawn in corrupted sanctum entrance
 * 2. Discover glowing relic on altar (examine it)
 * 3. Decipher wall inscriptions (3 inscriptions)
 * 4. Activate the corrupted altar mechanism
 * 5. Entity encounters + chase sequence
 * 6. Escape through the sanctum gate
 * 7. Level 4 complete
 */
export class Level4Scene {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Player - spawns at sanctum entrance
    this.player = {
      position: new THREE.Vector3(0, 1.75, 20),
      velocity: new THREE.Vector3(),
      yaw: Math.PI, // facing -Z (into sanctum)
      pitch: -0.04,
      speed: 5.5,
      sprintSpeed: 9.0,
      isSprinting: false,
      isGrounded: true,
      headBobTimer: 0,
      canMove: true,
    };

    this.shakeIntensity = 0;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };

    this.isPointerLocked = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    this.interactables = [];
    this.colliders = [];
    this.hoveredItem = null;
    this.raycaster = new THREE.Raycaster();

    // Level 4 state
    this.levelCompleted = false;
    this.relicExamined = false;
    this.inscription1Examined = false;
    this.inscription2Examined = false;
    this.inscription3Examined = false;
    this.altarActivated = false;
    this.gateOpened = false;

    this.firstSightingTriggered = false;
    this.secondSightingTriggered = false;
    this.chaseTriggered = false;
    this.safeExitReached = false;

    // Animated objects
    this.altarGlow = null;
    this.altarGlowMat = null;
    this.sanctumTorches = [];
    this.corruptedLights = [];
    this.gateGroup = null;
    this.gateOpening = false;
    this.gateOpenProgress = 0;

    this.firstPersonFlashlight = null;
    this.entityAI = null;

    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.setupThree();
    this.setupLighting();
    this.buildSanctumEnvironment();
    this.setupRelic();
    this.setupInscriptions();
    this.setupAltar();
    this.setupSanctumGate();
    this.setupEntityAI();
    this.setupPlayerFlashlight();
    this.setupEventListeners();

    // Notify GameState — use setTimeout to avoid triggering React re-render during effect
    setTimeout(() => {
      gameState.startLevel4();
    }, 0);

    this.animate();
  }

  // --- 1. THREE.JS SETUP ---
  setupThree() {
    this.scene = new THREE.Scene();
    // Light warm amber fog — keeps distance visible while feeling haunted
    this.scene.fog = new THREE.FogExp2(0x1a1218, 0.014);

    const width = (this.canvas && this.canvas.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
    const height = (this.canvas && this.canvas.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 300);
    this.camera.position.copy(this.player.position);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Lift midtones for haunted temple visibility
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // --- 2. LIGHTING — balanced dark temple (NOT pitch black) ---
  setupLighting() {
    // 1. Strong ambient base — ensures every surface is readable without flashlight
    const ambientLight = new THREE.AmbientLight(0x3a2a38, 0.82);
    this.scene.add(ambientLight);

    // 2. Hemisphere light: warm amber ceiling / deep purple floor
    const hemiLight = new THREE.HemisphereLight(0x5c3d50, 0x2a1a28, 1.65);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Directional fill from above — soft roof light filtering through cracks
    const fillLight = new THREE.DirectionalLight(0x6a4a58, 0.72);
    fillLight.position.set(0, 25, 5);
    this.scene.add(fillLight);

    // 4. Warm amber back fill — ensures rear walls / corridors stay visible
    const backFill = new THREE.DirectionalLight(0x5a3830, 0.5);
    backFill.position.set(0, 8, -50);
    this.scene.add(backFill);

    // 5. Cool blue-purple side rim — gives architectural depth without crushing blacks
    const rimLight = new THREE.DirectionalLight(0x3a3060, 0.42);
    rimLight.position.set(-18, 12, 0);
    this.scene.add(rimLight);

    // 6. Central altar glow — warm orange point light at altar center
    const altarLight = new THREE.PointLight(0xff8c3a, 2.8, 28, 1.6);
    altarLight.position.set(0, 3.5, -10);
    this.scene.add(altarLight);

    // 7. Sanctum gate zone warm light
    const gateLight = new THREE.PointLight(0xffa060, 2.2, 20, 1.8);
    gateLight.position.set(0, 3, -58);
    this.scene.add(gateLight);
  }

  // --- 3. SANCTUM ENVIRONMENT ---
  buildSanctumEnvironment() {
    // Use verified texture methods that exist in ProceduralTextures.js
    const wallTex = textureFactory.getSanctumRuneWallTexture();
    const floorTex = textureFactory.getSanctumAstralFloorTexture();
    const corruptedTex = textureFactory.getCorruptedWallTexture();

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.78,
      metalness: 0.12,
      color: 0xb08090, // warm rose-stone tint visible even under low light
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.55,
      metalness: 0.18,
      color: 0x998080,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x2a1e28,
      roughness: 0.9,
      metalness: 0.05,
    });

    const corruptedMat = new THREE.MeshStandardMaterial({
      map: corruptedTex,
      roughness: 0.82,
      metalness: 0.08,
      color: 0x7a4858,
    });

    // ---- Section 1: Entrance Corridor (Z: 22 to 0) ----
    const entranceLen = 24;
    this._buildCorridor(0, entranceLen / 2 - 2, 7, 5.2, entranceLen, wallMat, floorMat, ceilingMat);

    // ---- Section 2: Main Sanctum Hall (Z: 0 to -35) ----
    const hallLen = 38;
    this._buildCorridor(0, -hallLen / 2 + 2, 10, 6.0, hallLen, wallMat, floorMat, ceilingMat);

    // ---- Section 3: Corrupted Descent (Z: -35 to -65) ----
    const descentLen = 32;
    this._buildCorridor(0, -35 - descentLen / 2, 8, 5.4, descentLen, corruptedMat, floorMat, ceilingMat);

    // ---- Section 4: Final Sanctum Gate Zone (Z: -65 to -80) ----
    const gateLen = 18;
    this._buildCorridor(0, -65 - gateLen / 2, 9, 6.0, gateLen, wallMat, floorMat, ceilingMat);

    // Add stone pillars in main hall
    this._buildPillars(wallMat);

    // Add braziers / wall torches
    this._buildTorches();

    // Add corrupted tendrils on walls (decorative boxes)
    this._buildCorruptionDetails(corruptedMat);
  }

  _buildCorridor(cx, cz, width, height, length, wallMat, floorMat, ceilingMat) {
    const hw = width / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(width, length), ceilingMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, height, cz);
    this.scene.add(ceil);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(cx - hw, height / 2, cz);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.addBarrier(cx - hw - 0.2, height / 2, cz, 0.4, height, length);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(cx + hw, height / 2, cz);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    this.addBarrier(cx + hw + 0.2, height / 2, cz, 0.4, height, length);
  }

  _buildPillars(wallMat) {
    const pillarPositions = [
      [-3.5, -5], [3.5, -5],
      [-3.5, -15], [3.5, -15],
      [-3.5, -25], [3.5, -25],
      [-4, -42], [4, -42],
      [-4, -52], [4, -52],
    ];

    const pillarGeo = new THREE.BoxGeometry(1.0, 5.8, 1.0);
    const pillarMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getCryptStoneWallTexture(),
      roughness: 0.88,
      metalness: 0.06,
      color: 0xc0a0a8,
    });

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 2.9, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.addBarrier(px, 2.9, pz, 1.2, 5.8, 1.2);
    });
  }

  _buildTorches() {
    // Wall brazier positions [x, y, z, color]
    const torchData = [
      [-4.8, 3.5, 5, 0xff9944],
      [4.8, 3.5, 5, 0xff9944],
      [-4.8, 3.5, -5, 0xff8833],
      [4.8, 3.5, -5, 0xff8833],
      [-4.6, 3.5, -20, 0xff7722],
      [4.6, 3.5, -20, 0xff7722],
      [-4.6, 3.5, -32, 0xff6633],
      [4.6, 3.5, -32, 0xff6633],
      [-4.2, 3.5, -48, 0xdd5522],
      [4.2, 3.5, -48, 0xdd5522],
      [-4.5, 3.5, -60, 0xff9944],
      [4.5, 3.5, -60, 0xff9944],
    ];

    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x3a2820, roughness: 0.8, metalness: 0.6 });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff8822,
      emissive: 0xff6600,
      emissiveIntensity: 1.5,
      roughness: 0.4,
    });

    torchData.forEach(([x, y, z, color]) => {
      // Bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), bracketMat);
      bracket.position.set(x, y, z);
      this.scene.add(bracket);

      // Flame cone
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 8), flameMat.clone());
      flame.position.set(x, y + 0.28, z);
      this.scene.add(flame);

      // Point light
      const light = new THREE.PointLight(color, 2.2, 12, 2.0);
      light.position.set(x, y + 0.3, z);
      this.scene.add(light);

      this.sanctumTorches.push({ light, flameMesh: flame, baseIntensity: 2.2 });
    });
  }

  _buildCorruptionDetails(mat) {
    // Dark tendril vines on walls as decoration
    const boxGeo = new THREE.BoxGeometry(0.08, 2.0, 0.08);
    const positions = [
      [-4.9, 2.5, -38], [-4.9, 1.8, -42], [4.9, 2.5, -38],
      [4.9, 1.8, -46], [-4.9, 2.0, -50], [4.9, 2.2, -54],
    ];
    positions.forEach(([x, y, z]) => {
      const vine = new THREE.Mesh(boxGeo, mat);
      vine.position.set(x, y, z);
      vine.rotation.z = (Math.random() - 0.5) * 0.4;
      this.scene.add(vine);
    });

    // Fallen debris / broken urns
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0x6a5048, roughness: 0.9 });
    [[-2, 0.2, -18], [2.5, 0.2, -22], [-1.5, 0.2, -40], [3, 0.2, -45]].forEach(([x, y, z]) => {
      const debris = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), debrisMat);
      debris.position.set(x, y, z);
      debris.rotation.y = Math.random() * Math.PI;
      this.scene.add(debris);
    });
  }

  // --- 4. RELIC (Interactable) ---
  setupRelic() {
    const relicGroup = new THREE.Group();

    // Altar base
    const altarMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getInnerDoorTexture(),
      roughness: 0.7,
      metalness: 0.22,
      color: 0xd0a080,
    });
    const altarBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), altarMat);
    altarBase.position.set(0, 0.5, -10);
    altarBase.castShadow = true;
    this.scene.add(altarBase);
    this.addBarrier(0, 0.5, -10, 1.4, 1.2, 1.4);

    // Relic orb on top of altar
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff3300,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.6,
    });
    this.altarGlowMat = relicMat;

    const relicGeo = new THREE.SphereGeometry(0.22, 16, 16);
    this.altarGlow = new THREE.Mesh(relicGeo, relicMat);
    this.altarGlow.position.set(0, 1.28, -10);
    this.scene.add(this.altarGlow);

    // Interactable
    this.altarGlow.userData = {
      action: () => this._examineRelic(),
      prompt: () => this.relicExamined ? null : '[E] EXAMINE RELIC',
    };
    this.interactables.push(this.altarGlow);
  }

  _examineRelic() {
    if (this.relicExamined) return;
    this.relicExamined = true;
    soundManager.playCrystalPickup();
    gameState.setToast('The relic pulses with corrupted energy. Something ancient stirs...');
    gameState.setObjective('DECIPHER THE THREE INSCRIPTIONS');
    gameState.set({ companionRelicFound: true, companionRelicExamined: true });

    // Flicker all torches once
    let count = 0;
    const flicker = setInterval(() => {
      count++;
      this.sanctumTorches.forEach(t => {
        t.light.intensity = count % 2 === 0 ? 0.3 : t.baseIntensity * 1.8;
      });
      if (count > 5) {
        clearInterval(flicker);
        this.sanctumTorches.forEach(t => { t.light.intensity = t.baseIntensity; });
      }
    }, 110);
  }

  // --- 5. WALL INSCRIPTIONS (3 interactable clue panels) ---
  setupInscriptions() {
    const inscriptionData = [
      { pos: [-4.85, 2.2, -8], label: 'INSCRIPTION I', msg: '"The relic was sealed here to protect the living from the entity within."' },
      { pos: [4.85, 2.2, -18], label: 'INSCRIPTION II', msg: '"Three seals must be broken at the altar. But beware — it will awaken."' },
      { pos: [-4.85, 2.2, -28], label: 'INSCRIPTION III', msg: '"The sacred gate at the end of the sanctum is the only escape."' },
    ];

    const inscMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getAncientCarvedSymbolTexture(),
      roughness: 0.75,
      metalness: 0.08,
      color: 0xe0c090,
      emissive: 0x3a2010,
      emissiveIntensity: 0.6,
    });

    inscriptionData.forEach((insc, idx) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), inscMat.clone());
      panel.position.set(...insc.pos);
      // Face inward (toward corridor center)
      panel.rotation.y = insc.pos[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(panel);

      const flags = [
        () => this.inscription1Examined,
        () => this.inscription2Examined,
        () => this.inscription3Examined,
      ];
      const setFlags = [
        () => { this.inscription1Examined = true; },
        () => { this.inscription2Examined = true; },
        () => { this.inscription3Examined = true; },
      ];

      panel.userData = {
        action: () => {
          if (flags[idx]()) return;
          setFlags[idx]();
          soundManager.playSymbolActivate();
          gameState.setToast(insc.msg);

          const allRead = this.inscription1Examined && this.inscription2Examined && this.inscription3Examined;
          if (allRead) {
            setTimeout(() => {
              gameState.setToast('All inscriptions deciphered. Now activate the corrupted altar.');
              gameState.setObjective('ACTIVATE THE CORRUPTED ALTAR');
            }, 3000);
          }
        },
        prompt: () => flags[idx]() ? null : `[E] READ ${insc.label}`,
      };
      this.interactables.push(panel);
    });
  }

  // --- 6. ALTAR MECHANISM ---
  setupAltar() {
    // Lever on altar side
    const leverMat = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.7, metalness: 0.5 });
    this.leverGroup = new THREE.Group();
    this.leverGroup.position.set(0.8, 1.0, -10);

    const leverBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), leverMat);
    leverBase.rotation.z = Math.PI / 2;
    this.leverGroup.add(leverBase);

    const leverHandle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), leverMat);
    leverHandle.position.set(0.35, 0, 0);
    this.leverGroup.add(leverHandle);

    this.scene.add(this.leverGroup);

    this.leverGroup.userData = {
      action: () => this._activateAltar(),
      prompt: () => {
        if (this.altarActivated) return null;
        const allRead = this.inscription1Examined && this.inscription2Examined && this.inscription3Examined;
        return allRead ? '[E] ACTIVATE ALTAR' : null;
      },
    };
    this.interactables.push(this.leverGroup);
  }

  _activateAltar() {
    if (this.altarActivated) return;
    const allRead = this.inscription1Examined && this.inscription2Examined && this.inscription3Examined;
    if (!allRead) {
      gameState.setToast('Decipher all three inscriptions first.');
      soundManager.playPuzzleFail();
      return;
    }

    this.altarActivated = true;
    soundManager.playStoneMechanism();
    gameState.setToast('The altar mechanism activates! The entity awakens...');
    gameState.setObjective('ESCAPE THROUGH THE SANCTUM GATE');
    gameState.set({ astralDial1Aligned: true, astralDial2Aligned: true, astralDial3Aligned: true });

    // Relic glows bright then fades
    if (this.altarGlowMat) {
      this.altarGlowMat.emissiveIntensity = 4.0;
      setTimeout(() => { if (this.altarGlowMat) this.altarGlowMat.emissiveIntensity = 0.8; }, 1500);
    }

    // Open the sanctum gate
    setTimeout(() => {
      this._openSanctumGate();
    }, 2000);
  }

  // --- 7. SANCTUM GATE ---
  setupSanctumGate() {
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.set(0, 0, -65);
    this.scene.add(this.gateGroup);

    const gateMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getTempleGateTexture(),
      roughness: 0.5,
      metalness: 0.4,
      color: 0xe0c880,
      emissive: 0x5a3800,
      emissiveIntensity: 0.5,
    });

    // Left gate panel
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.8, 0.3), gateMat);
    leftPanel.position.set(-2.1, 2.9, 0);
    this.gateGroup.add(leftPanel);

    // Right gate panel
    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.8, 0.3), gateMat);
    rightPanel.position.set(2.1, 2.9, 0);
    this.gateGroup.add(rightPanel);

    // Gate collider (blocks until opened)
    this.gateCollider = this.addBarrier(0, 2.9, -65, 8.8, 6.0, 0.6);

    // Arch above gate
    const archMat = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.7, metalness: 0.3 });
    const arch = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.8, 0.5), archMat);
    arch.position.set(0, 6.2, -65);
    this.scene.add(arch);

    // Wall barrier at end (closed until gate opens)
    this.addBarrier(0, 3, -80, 9, 7, 0.6);
  }

  _openSanctumGate() {
    if (this.gateOpened) return;
    this.gateOpened = true;
    this.gateOpening = true;

    soundManager.playStoneDoorSlide();
    gameState.setToast('The sanctum gate slides open! RUN!');

    // Remove gate collider
    const idx = this.colliders.indexOf(this.gateCollider);
    if (idx !== -1) this.colliders.splice(idx, 1);
  }

  // --- 8. ENTITY AI ---
  setupEntityAI() {
    try {
      this.entityAI = new EntityAI(this.scene, this.player, {
        color: 0x220011,
        eyeColor: 0xff2200,
        speed: 6.5,
        detectionRange: 24,
        attackRange: 1.8,
      });
      if (this.entityAI && this.entityAI.group) {
        this.entityAI.group.visible = false;
      }
    } catch (err) {
      console.warn('Level4: EntityAI init error:', err);
      this.entityAI = null;
    }
  }

  // --- 9. FLASHLIGHT ---
  setupPlayerFlashlight() {
    try {
      this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera);
      const state = gameState ? gameState.getState() : {};
      const hasFlashlight = state.hasFlashlight !== undefined ? state.hasFlashlight : true;
      const flashlightEquipped = state.flashlightEquipped !== undefined ? state.flashlightEquipped : true;
      const flashlightOn = state.flashlightOn !== undefined ? state.flashlightOn : true;

      if (hasFlashlight && flashlightEquipped) {
        this.firstPersonFlashlight.equip();
        if (flashlightOn) {
          this.firstPersonFlashlight.turnOn();
        } else {
          this.firstPersonFlashlight.turnOff();
        }
      }
    } catch (err) {
      console.warn('Level4: Flashlight init error:', err);
    }
  }

  // --- 10. EVENT LISTENERS ---
  setupEventListeners() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onResize = this.onResize.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
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
      case 'KeyW': case 'ArrowUp':    this.keys.forward = true; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'Space':
        if (this.player.isGrounded) {
          this.player.velocity.y = 6.5;
          this.player.isGrounded = false;
          soundManager.playJump();
        }
        break;
      case 'KeyF':
        if (this.firstPersonFlashlight) {
          const isNowOn = this.firstPersonFlashlight.toggle();
          gameState.set({ flashlightOn: isNowOn });
        }
        break;
      case 'KeyE':
        this.triggerInteraction();
        break;
      case 'Escape':
        if (document.pointerLockElement) document.exitPointerLock();
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = false; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked) return;
    const sens = 0.0018;
    this.player.yaw -= e.movementX * sens;
    this.player.pitch -= e.movementY * sens;
    this.player.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.pitch));
    this.mouseDeltaX = e.movementX;
    this.mouseDeltaY = e.movementY;
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // --- 11. INTERACTION ---
  triggerInteraction() {
    if (this.hoveredItem && this.hoveredItem.userData.action) {
      this.hoveredItem.userData.action();
    }
  }

  checkInteractables() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const maxDist = 5.0;
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    let found = null;

    for (const hit of hits) {
      if (hit.distance <= maxDist) {
        let curr = hit.object;
        while (curr && curr !== this.scene) {
          if (curr.userData && curr.userData.action) {
            found = curr;
            break;
          }
          curr = curr.parent;
        }
        if (found) break;
      }
    }

    // Proximity fallback
    if (!found) {
      const pPos = this.player.position;
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      let closestDist = 4.2;
      for (const item of this.interactables) {
        const itemPos = new THREE.Vector3();
        item.getWorldPosition(itemPos);
        const dist = pPos.distanceTo(itemPos);
        if (dist <= closestDist) {
          const dirToItem = itemPos.clone().sub(this.camera.position).normalize();
          const dot = camDir.dot(dirToItem);
          if (dot > 0.38) {
            closestDist = dist;
            found = item;
          }
        }
      }
    }

    this.hoveredItem = found;

    if (found) {
      const promptText = typeof found.userData.prompt === 'function'
        ? found.userData.prompt()
        : found.userData.prompt;
      gameState.setInteractionPrompt(promptText);
    } else {
      gameState.setInteractionPrompt(null);
    }
  }

  // --- 12. COLLISION ---
  addBarrier(x, y, z, width, height, depth) {
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(width, height, depth)
    );
    this.colliders.push(box);
    return box;
  }

  // --- 13. PLAYER UPDATE ---
  updatePlayer(delta) {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.player.pitch;
    euler.y = this.player.yaw;
    this.camera.quaternion.setFromEuler(euler);

    if (!this.player.canMove) {
      this.camera.position.copy(this.player.position);
      return;
    }

    const moveDir = new THREE.Vector3();
    if (this.keys.forward)  moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left)     moveDir.x -= 1;
    if (this.keys.right)    moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) moveDir.normalize();

    this.player.isSprinting = this.keys.sprint && isMoving;
    const currentSpeed = this.player.isSprinting ? this.player.sprintSpeed : this.player.speed;

    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    moveDir.applyQuaternion(yawQuat);

    this.player.velocity.x = THREE.MathUtils.lerp(this.player.velocity.x, moveDir.x * currentSpeed, delta * 10);
    this.player.velocity.z = THREE.MathUtils.lerp(this.player.velocity.z, moveDir.z * currentSpeed, delta * 10);
    this.player.velocity.y -= 15.0 * delta;

    const nextPos = this.player.position.clone();
    nextPos.x += this.player.velocity.x * delta;
    nextPos.z += this.player.velocity.z * delta;
    nextPos.y += this.player.velocity.y * delta;

    const groundElevation = 1.75;
    if (nextPos.y <= groundElevation) {
      nextPos.y = groundElevation;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    }

    const playerBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(0.8, 1.8, 0.8));
    let collided = false;
    for (const box of this.colliders) {
      if (box.intersectsBox(playerBox)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      this.player.position.copy(nextPos);
    } else {
      const testX = this.player.position.clone();
      testX.x = nextPos.x;
      if (!this.colliders.some(b => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testX, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.x = nextPos.x;
      }
      const testZ = this.player.position.clone();
      testZ.z = nextPos.z;
      if (!this.colliders.some(b => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testZ, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.z = nextPos.z;
      }
    }

    if (isMoving && this.player.isGrounded) {
      soundManager.playFootstep(this.player.isSprinting);
      const bobFreq = this.player.isSprinting ? 14 : 9;
      this.player.headBobTimer += delta * bobFreq;
      const bobY = Math.sin(this.player.headBobTimer) * (this.player.isSprinting ? 0.05 : 0.03);

      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeIntensity > 0.001) {
        shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, delta * 5);
      }

      this.camera.position.set(
        this.player.position.x + shakeX,
        this.player.position.y + bobY + shakeY,
        this.player.position.z
      );
    } else {
      this.camera.position.copy(this.player.position);
    }

    // Flashlight update
    if (this.firstPersonFlashlight) {
      this.firstPersonFlashlight.update(
        delta,
        isMoving,
        this.player.isSprinting,
        this.player.headBobTimer,
        this.mouseDeltaX,
        this.mouseDeltaY
      );
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }

    this.checkGameplayTriggers();
  }

  // --- 14. GAMEPLAY TRIGGERS ---
  checkGameplayTriggers() {
    const pZ = this.player.position.z;

    // First entity sighting: player moves into main hall
    if (!this.firstSightingTriggered && pZ <= -12) {
      this.firstSightingTriggered = true;
      this._triggerFirstSighting();
    }

    // Second sighting after altar activation
    if (!this.secondSightingTriggered && this.altarActivated && pZ <= -25) {
      this.secondSightingTriggered = true;
      this._triggerSecondSighting();
    }

    // Chase begins: player enters corrupted descent
    if (!this.chaseTriggered && this.altarActivated && pZ <= -40) {
      this.chaseTriggered = true;
      this._triggerChase();
    }

    // Safe exit: player passes through gate
    if (!this.safeExitReached && this.gateOpened && pZ <= -68) {
      this.safeExitReached = true;
      this._triggerSafeExit();
    }
  }

  _triggerFirstSighting() {
    if (!this.entityAI) return;
    try {
      this.entityAI.reappear(new THREE.Vector3(0, 1.8, -32), 0.5);
      this.entityAI.setState(AI_STATES.WATCH);
    } catch (e) { /* safe */ }
    gameState.triggerEntityEncounterL4();
    setTimeout(() => {
      try { if (this.entityAI) this.entityAI.vanish(0.6); } catch(e) {}
    }, 2500);
  }

  _triggerSecondSighting() {
    if (!this.entityAI) return;
    soundManager.playEntityWhisper();
    try {
      this.entityAI.reappear(new THREE.Vector3(-4, 1.8, -42), 0.5);
      this.entityAI.setState(AI_STATES.FOLLOW);
    } catch (e) { /* safe */ }
    gameState.set({ entityFollowingL4: true });
    setTimeout(() => {
      gameState.setToast('Something is following you through the sanctum...');
    }, 500);
  }

  _triggerChase() {
    if (!this.entityAI) return;
    soundManager.startChaseDrone();
    try {
      this.entityAI.reappear(new THREE.Vector3(0, 1.8, -30), 0.4);
      this.entityAI.setState(AI_STATES.CHASE);
    } catch (e) { /* safe */ }
    gameState.set({ chaseTriggeredL4: true });
    gameState.setToast('IT IS CHASING YOU! REACH THE GATE!');
    gameState.setObjective('REACH THE SANCTUM GATE — ESCAPE!');
  }

  _triggerSafeExit() {
    soundManager.stopChaseDrone();
    soundManager.playSanctuaryChime();
    try {
      if (this.entityAI) {
        this.entityAI.setState(AI_STATES.RETREAT);
        setTimeout(() => { try { if (this.entityAI) this.entityAI.vanish(0.8); } catch(e) {} }, 800);
      }
    } catch (e) { /* safe */ }

    gameState.set({ escapedToSanctuaryL4: true, chaseTriggeredL4: false });
    gameState.setToast('You escaped the sanctum! The entity cannot follow...');

    setTimeout(() => {
      this._completeLevel4();
    }, 5000);
  }

  _completeLevel4() {
    if (this.levelCompleted) return;
    this.levelCompleted = true;
    gameState.completeLevel4();
  }

  // --- 15. ANIMATION LOOP ---
  animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.checkInteractables();

    if (this.entityAI) {
      try { this.entityAI.update(delta); } catch (e) { /* safe */ }
    }

    // Torch flickering
    const time = this.clock.getElapsedTime();
    this.sanctumTorches.forEach((t, idx) => {
      t.light.intensity = t.baseIntensity
        + Math.sin(time * 7.5 + idx * 1.3) * 0.3
        + (Math.random() - 0.5) * 0.18;
    });

    // Relic glow pulse
    if (this.altarGlowMat && this.altarGlow) {
      const pulse = 1.5 + Math.sin(time * 3.0) * 0.6;
      this.altarGlowMat.emissiveIntensity = this.altarActivated ? 0.8 : pulse;
      this.altarGlow.rotation.y += delta * 0.8;
    }

    // Gate opening animation: slide panels outward
    if (this.gateOpening && this.gateGroup) {
      this.gateOpenProgress += delta * 0.7;
      const leftPanel = this.gateGroup.children[0];
      const rightPanel = this.gateGroup.children[1];
      if (leftPanel) leftPanel.position.x = -2.1 - this.gateOpenProgress * 3.5;
      if (rightPanel) rightPanel.position.x = 2.1 + this.gateOpenProgress * 3.5;
      if (this.gateOpenProgress >= 1.4) {
        this.gateOpening = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- 16. DESTROY ---
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('resize', this.onResize);
    if (this.onCanvasClick) {
      this.canvas.removeEventListener('click', this.onCanvasClick);
    }

    if (this.firstPersonFlashlight) {
      this.firstPersonFlashlight.destroy();
      this.firstPersonFlashlight = null;
    }

    if (this.entityAI) {
      try { this.entityAI.destroy(); } catch (e) { /* safe */ }
      this.entityAI = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
