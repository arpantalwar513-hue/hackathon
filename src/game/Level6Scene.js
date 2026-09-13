/**
 * Level6Scene: FINDING THE FRIEND
 *
 * The player descends into the deep temple catacombs following clues and footprints.
 * Inside a majestic, vaulted inner sanctum, the player discovers their missing friend.
 * The friend is alive but restrained by corrupted spiritual temple energy.
 * Approaching the friend triggers a reaction from the entity, demonstrating live
 * GameState-aware AI Guide communication and setting up Level 7 (The Ancient Scroll).
 *
 * Architecture & Systems:
 * - Reuses existing temple textures via textureFactory
 * - Reuses FirstPersonFlashlight
 * - Reuses SoundManager
 * - Reuses GameState & GuideDialogueHUD
 * - Reuses GeminiService with instant local fallback
 * - 70-80% environmental readability target (Ambient, Hemisphere, Sconces, Lanterns)
 * - Safe multi-stage initialization with zero single-point-of-failure
 */

import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { getProactiveHint } from './services/GeminiService.js';

export class Level6Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 25), // Spawns at catacomb entrance
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

    // ─── Interaction & Physics ───
    this.interactables = [];
    this.colliders     = [];
    this.hoveredItem   = null;
    this.raycaster     = new THREE.Raycaster();

    // ─── Flashlight & Lights ───
    this.firstPersonFlashlight = null;
    this.templeLights          = [];

    // ─── Puzzle & Sealed Door ───
    this.rotaryMechanismMesh   = null;
    this.doorL                 = null;
    this.doorR                 = null;
    this.doorCollider          = null;
    this.doorOpenProgress      = 0;
    this.isDoorOpening         = false;

    // ─── Missing Friend 3D Character ───
    this.friendGroup           = null;
    this.friendEnergyRings     = [];
    this.friendBreatheTimer    = 0;
    this.friendTorso           = null;
    this.friendHead            = null;
    this.friendLeftArm         = null;
    this.friendRightArm        = null;
    this.hasTriggeredApproach  = false;
    this.isDialogueActive      = false;

    // ─── Shadow Entity (Reference Image Match) ───
    this.entityGroup           = null;
    this.entityActive          = false;
    this.entityOpacity         = 0;
    this.entityTargetOpacity   = 0;
    this.entityPulseTimer      = 0;

    // ─── Particles & Atmosphere ───
    this.particles             = null;
    this.particlePositions     = null;
    this.corruptedParticles    = null;

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
  // 1. SAFE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  init() {
    this.setupThree();
    this.setupLighting();

    try {
      this.buildCatacombCorridor();
    } catch (err) {
      console.error('[Level6] Error building catacomb corridor:', err);
    }

    try {
      this.buildFriendKeepsakeAltar();
    } catch (err) {
      console.error('[Level6] Error building friend keepsake altar:', err);
    }

    try {
      this.buildSealedSanctumGate();
    } catch (err) {
      console.error('[Level6] Error building sealed sanctum gate:', err);
    }

    try {
      this.buildGrandSanctumChamber();
    } catch (err) {
      console.error('[Level6] Error building grand sanctum chamber:', err);
    }

    try {
      this.buildFriendCharacter();
    } catch (err) {
      console.error('[Level6] Error building friend character:', err);
    }

    try {
      this.buildShadowEntityManifestation();
    } catch (err) {
      console.error('[Level6] Error building shadow entity:', err);
    }

    try {
      this.buildAmbientDustAndEnergy();
    } catch (err) {
      console.warn('[Level6] Error building particles:', err);
    }

    try {
      this.setupFlashlight();
    } catch (err) {
      console.warn('[Level6] Error setting up flashlight:', err);
    }

    try {
      this.setupEventListeners();
    } catch (err) {
      console.error('[Level6] Error setting up event listeners:', err);
    }

    // Safely notify GameState on next event loop tick
    setTimeout(() => {
      gameState.startLevel6();
    }, 0);

    this.animate();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. THREE.JS ENGINE SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  setupThree() {
    this.scene = new THREE.Scene();
    // Warm atmospheric dark fog — gives depth while keeping elements 70-80% readable
    this.scene.fog = new THREE.FogExp2(0x18141e, 0.012);

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
    this.renderer.toneMappingExposure = 1.32;
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BALANCED TEMPLE LIGHTING (70-80% Readability Target)
  // ═══════════════════════════════════════════════════════════════════════════
  setupLighting() {
    // 1. Ambient Light — base visibility so scene is never pitch black
    const ambient = new THREE.AmbientLight(0x3e323e, 0.78);
    this.scene.add(ambient);

    // 2. Hemisphere Light: warm vaulted stone / cool shadow ground
    const hemi = new THREE.HemisphereLight(0x544458, 0x1e1622, 1.45);
    hemi.position.set(0, 20, 0);
    this.scene.add(hemi);

    // 3. Directional Key Light: soft moonlit skylight filtering from above
    const keyLight = new THREE.DirectionalLight(0x604d5e, 0.72);
    keyLight.position.set(4, 22, -10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 70;
    keyLight.shadow.bias = -0.0008;
    this.scene.add(keyLight);

    // 4. Fill Light: subtle cool backlight for corridor
    const backFill = new THREE.DirectionalLight(0x352b45, 0.45);
    backFill.position.set(-3, 8, 20);
    this.scene.add(backFill);

    // 5. Warm Oil Lanterns and Wall Sconces throughout the scene
    const torchConfigs = [
      // Corridor torches
      { pos: new THREE.Vector3(-2.6, 2.8, 21),  color: 0xffaa44, intensity: 1.35, dist: 16 },
      { pos: new THREE.Vector3( 2.6, 2.8, 21),  color: 0xffaa44, intensity: 1.35, dist: 16 },
      { pos: new THREE.Vector3(-2.6, 2.8, 14),  color: 0xff9933, intensity: 1.30, dist: 16 },
      { pos: new THREE.Vector3( 2.6, 2.8, 14),  color: 0xff9933, intensity: 1.30, dist: 16 },

      // Sealed Gate Torches
      { pos: new THREE.Vector3(-3.2, 3.2, 3),   color: 0xffa040, intensity: 1.45, dist: 18 },
      { pos: new THREE.Vector3( 3.2, 3.2, 3),   color: 0xffa040, intensity: 1.45, dist: 18 },

      // Grand Sanctum Pillar Lanterns
      { pos: new THREE.Vector3(-6.2, 3.4, -6),  color: 0xffa84c, intensity: 1.50, dist: 22 },
      { pos: new THREE.Vector3( 6.2, 3.4, -6),  color: 0xffa84c, intensity: 1.50, dist: 22 },
      { pos: new THREE.Vector3(-6.2, 3.4, -16), color: 0xff9838, intensity: 1.45, dist: 22 },
      { pos: new THREE.Vector3( 6.2, 3.4, -16), color: 0xff9838, intensity: 1.45, dist: 22 },
      { pos: new THREE.Vector3(-6.2, 3.4, -26), color: 0xff8c2c, intensity: 1.35, dist: 20 },
      { pos: new THREE.Vector3( 6.2, 3.4, -26), color: 0xff8c2c, intensity: 1.35, dist: 20 },

      // Altar & Dais Torches (illuminates friend directly)
      { pos: new THREE.Vector3(-2.8, 1.8, -13.5), color: 0xffaa50, intensity: 1.85, dist: 16 },
      { pos: new THREE.Vector3( 2.8, 1.8, -13.5), color: 0xffaa50, intensity: 1.85, dist: 16 },
    ];

    torchConfigs.forEach((t, idx) => {
      const pLight = new THREE.PointLight(t.color, t.intensity, t.dist, 1.4);
      pLight.position.copy(t.pos);
      this.scene.add(pLight);
      this.templeLights.push({ light: pLight, baseIntensity: t.intensity, idx });

      // Visual bracket & glowing ember flame bowl
      const bracketMat = new THREE.MeshStandardMaterial({ color: 0x1c1815, roughness: 0.8 });
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 6), bracketMat);
      bracket.position.set(t.pos.x, t.pos.y - 0.15, t.pos.z);
      this.scene.add(bracket);

      const flameMat = new THREE.MeshBasicMaterial({ color: t.color });
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), flameMat);
      flame.position.copy(t.pos);
      this.scene.add(flame);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ZONE 1: CATACOMB DESCENT CORRIDOR
  // ═══════════════════════════════════════════════════════════════════════════
  buildCatacombCorridor() {
    const wallTex = (textureFactory && typeof textureFactory.getCryptStoneWallTexture === 'function')
      ? textureFactory.getCryptStoneWallTexture() : null;
    if (wallTex) wallTex.repeat.set(3, 2);

    const floorTex = (textureFactory && typeof textureFactory.getSanctuaryFloorTexture === 'function')
      ? textureFactory.getSanctuaryFloorTexture() : null;
    if (floorTex) floorTex.repeat.set(2, 6);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x36302e, roughness: 0.88, metalness: 0.05 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex || undefined, color: 0x242220, roughness: 0.60, metalness: 0.08 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.96 });

    // Corridor Floor (Z: 28 to 8, width 6)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 18);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 5.5, 18);
    this.scene.add(ceil);

    // Left Wall
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(20, 5.5), wallMat);
    wallL.position.set(-3, 2.75, 18);
    wallL.rotation.y = Math.PI / 2;
    wallL.receiveShadow = true;
    this.scene.add(wallL);
    this.addBarrier(-3.2, 2.75, 18, 0.4, 5.5, 20);

    // Right Wall
    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(20, 5.5), wallMat);
    wallR.position.set(3, 2.75, 18);
    wallR.rotation.y = -Math.PI / 2;
    wallR.receiveShadow = true;
    this.scene.add(wallR);
    this.addBarrier(3.2, 2.75, 18, 0.4, 5.5, 20);

    // Back Barrier Wall (blocks going back up)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 5.5), wallMat);
    backWall.position.set(0, 2.75, 28);
    backWall.rotation.y = Math.PI;
    this.scene.add(backWall);
    this.addBarrier(0, 2.75, 28.2, 6, 5.5, 0.4);

    // Footprints decal trail on the floor leading forward
    const footTex = (textureFactory && typeof textureFactory.getFootprintTexture === 'function')
      ? textureFactory.getFootprintTexture() : null;
    const footMat = new THREE.MeshStandardMaterial({
      map: footTex || undefined,
      color: 0x8a7260,
      transparent: true,
      opacity: 0.85,
      roughness: 0.9,
    });

    const stepPositions = [
      [ 0.35, 24, 0.1 ],
      [-0.35, 21.5, -0.05 ],
      [ 0.28, 19, 0.08 ],
      [-0.32, 16.5, -0.04 ],
      [ 0.30, 14, 0.06 ],
      [-0.25, 11.5, -0.02 ],
      [ 0.20, 9, 0.04 ],
      [-0.15, 6.5, 0.0 ],
      [ 0.10, 4, 0.0 ],
    ];

    stepPositions.forEach(([x, z, rotY]) => {
      const stepMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.7), footMat);
      stepMesh.rotation.x = -Math.PI / 2;
      stepMesh.rotation.z = rotY;
      stepMesh.position.set(x, 0.02, z);
      this.scene.add(stepMesh);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FRIEND'S PERSONAL OBJECT (KEEPSAKE PEDESTAL)
  // ═══════════════════════════════════════════════════════════════════════════
  buildFriendKeepsakeAltar() {
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x2e2724, roughness: 0.82, metalness: 0.08 });

    // Weathered stone table in side alcove
    const tableGroup = new THREE.Group();

    // Stone Table base & top
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.8), altarMat);
    tableTop.position.set(2.1, 1.0, 18);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const tableLegL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.6), altarMat);
    tableLegL.position.set(1.7, 0.5, 18);
    tableGroup.add(tableLegL);

    const tableLegR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 0.6), altarMat);
    tableLegR.position.set(2.5, 0.5, 18);
    tableGroup.add(tableLegR);

    // Ancient Map / Parchment Cloth beneath the bracelet
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xc8b088, roughness: 0.92 });
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.45), clothMat);
    cloth.position.set(2.1, 1.1, 18);
    tableGroup.add(cloth);

    // Friend's Keepsake: Braided Leather Wristband & Brass Pocket Compass
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x5c3218, roughness: 0.7 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 18), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(2.1, 1.14, 18);
    tableGroup.add(band);

    const compassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const compass = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.028, 16), compassMat);
    compass.position.set(2.1, 1.15, 18);
    tableGroup.add(compass);

    // Subtle inspection beacon / glow light
    const beacon = new THREE.PointLight(0xffd700, 0.9, 3.5, 1.8);
    beacon.position.set(2.1, 1.45, 18);
    tableGroup.add(beacon);

    this.scene.add(tableGroup);
    this.addBarrier(2.1, 0.6, 18, 1.3, 1.2, 0.9);

    // Interaction registration
    const keepsake = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    keepsake.position.set(2.1, 1.2, 18);
    keepsake.userData = {
      prompt: () => gameState.getState().friendObjectFound
        ? "FRIEND'S BRACELET — EXAMINED"
        : "[E] EXAMINE FRIEND'S BRACELET",
      action: () => {
        if (!gameState.getState().friendObjectFound) {
          gameState.findFriendObjectL6();
          soundManager.playClueInspect();
          this.triggerAIHint('friend_object_found');
        } else {
          gameState.setToast("Your friend's braided bracelet. The compass needle points toward the sanctum.");
        }
      },
    };
    this.scene.add(keepsake);
    this.interactables.push(keepsake);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ZONE 2: SEALED SANCTUM VAULT GATE & ROTARY PUZZLE
  // ═══════════════════════════════════════════════════════════════════════════
  buildSealedSanctumGate() {
    const wallTex = (textureFactory && typeof textureFactory.getCryptStoneWallTexture === 'function')
      ? textureFactory.getCryptStoneWallTexture() : null;
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x36302e, roughness: 0.88 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x24201c, metalness: 0.75, roughness: 0.45 });

    // Archway portal frame at Z = 2
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.4, 0.8), wallMat);
    archTop.position.set(0, 4.8, 2);
    this.scene.add(archTop);

    const postL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 0.8), wallMat);
    postL.position.set(-2.6, 2.1, 2);
    this.scene.add(postL);
    this.addBarrier(-2.6, 2.1, 2, 1.2, 4.2, 0.8);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 0.8), wallMat);
    postR.position.set(2.6, 2.1, 2);
    this.scene.add(postR);
    this.addBarrier(2.6, 2.1, 2, 1.2, 4.2, 0.8);

    // Left Door Slab
    this.doorL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.0, 0.3), metalMat);
    this.doorL.position.set(-1.0, 2.0, 2);
    this.doorL.castShadow = true;
    this.scene.add(this.doorL);

    // Right Door Slab
    this.doorR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.0, 0.3), metalMat);
    this.doorR.position.set(1.0, 2.0, 2);
    this.doorR.castShadow = true;
    this.scene.add(this.doorR);

    // Door barrier collider (removed when opened)
    this.doorCollider = { minX: -2.1, maxX: 2.1, minZ: 1.7, maxZ: 2.3 };
    this.colliders.push(this.doorCollider);

    // Ancient Rotary Seal Mechanism on Right Post
    const rotaryHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.15, 16), wallMat);
    rotaryHousing.rotation.x = Math.PI / 2;
    rotaryHousing.position.set(1.85, 1.8, 2.45);
    this.scene.add(rotaryHousing);

    const dialMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x581c87, emissiveIntensity: 0.6, metalness: 0.6 });
    this.rotaryMechanismMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 8), dialMat);
    this.rotaryMechanismMesh.rotation.x = Math.PI / 2;
    this.rotaryMechanismMesh.position.set(1.85, 1.8, 2.54);
    this.scene.add(this.rotaryMechanismMesh);

    // Mechanism interaction trigger
    const mechTrigger = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mechTrigger.position.set(1.85, 1.8, 2.5);
    mechTrigger.userData = {
      prompt: () => gameState.getState().sealedDoorOpened
        ? "SANCTUM SEAL — ALIGNED"
        : "[E] ALIGN SANCTUM ROTARY SEAL",
      action: () => {
        if (!gameState.getState().sealedDoorOpened) {
          gameState.openSealedDoorL6();
          soundManager.playMechanismClick();
          this.isDoorOpening = true;
          this.shakeIntensity = 0.28;
          this.triggerAIHint('sealed_door_opened');
        } else {
          gameState.setToast("The ancient seal is unlocked. The sanctum doors are open.");
        }
      },
    };
    this.scene.add(mechTrigger);
    this.interactables.push(mechTrigger);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ZONE 3: GRAND SANCTUM CHAMBER (Direct Match to Reference Image)
  // ═══════════════════════════════════════════════════════════════════════════
  buildGrandSanctumChamber() {
    const wallTex = (textureFactory && typeof textureFactory.getCryptStoneWallTexture === 'function')
      ? textureFactory.getCryptStoneWallTexture() : null;
    if (wallTex) wallTex.repeat.set(4, 3);

    const floorTex = (textureFactory && typeof textureFactory.getSanctuaryFloorTexture === 'function')
      ? textureFactory.getSanctuaryFloorTexture() : null;
    if (floorTex) floorTex.repeat.set(5, 7);

    const reliefTex = (textureFactory && typeof textureFactory.getRelicAltarReliefTexture === 'function')
      ? textureFactory.getRelicAltarReliefTexture() : null;

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex || undefined, color: 0x3a3330, roughness: 0.86, metalness: 0.06 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex || undefined, color: 0x22201e, roughness: 0.58, metalness: 0.10 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x141012, roughness: 0.96 });
    const altarMat = new THREE.MeshStandardMaterial({ map: reliefTex || undefined, color: 0x2c2622, roughness: 0.78, metalness: 0.12 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.95 });

    // Grand Hall Floor (Z: 2 to -34, Width: 24)
    const sanctumFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 36), floorMat);
    sanctumFloor.rotation.x = -Math.PI / 2;
    sanctumFloor.position.set(0, 0, -16);
    sanctumFloor.receiveShadow = true;
    this.scene.add(sanctumFloor);

    // High Vaulted Ceiling
    const sanctumCeil = new THREE.Mesh(new THREE.PlaneGeometry(24, 36), ceilMat);
    sanctumCeil.rotation.x = Math.PI / 2;
    sanctumCeil.position.set(0, 8.5, -16);
    this.scene.add(sanctumCeil);

    // Left Perimeter Wall
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(36, 8.5), wallMat);
    wallL.position.set(-12, 4.25, -16);
    wallL.rotation.y = Math.PI / 2;
    wallL.receiveShadow = true;
    this.scene.add(wallL);
    this.addBarrier(-12.2, 4.25, -16, 0.4, 8.5, 36);

    // Right Perimeter Wall
    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(36, 8.5), wallMat);
    wallR.position.set(12, 4.25, -16);
    wallR.rotation.y = -Math.PI / 2;
    wallR.receiveShadow = true;
    this.scene.add(wallR);
    this.addBarrier(12.2, 4.25, -16, 0.4, 8.5, 36);

    // North End Wall (Behind Altar and Twin Staircases)
    const wallN = new THREE.Mesh(new THREE.PlaneGeometry(24, 8.5), wallMat);
    wallN.position.set(0, 4.25, -34);
    wallN.receiveShadow = true;
    this.scene.add(wallN);
    this.addBarrier(0, 4.25, -34.2, 24, 8.5, 0.4);

    // South Wall connecting to archway
    [-7, 7].forEach((x) => {
      const wPart = new THREE.Mesh(new THREE.PlaneGeometry(10, 8.5), wallMat);
      wPart.position.set(x, 4.25, 2);
      this.scene.add(wPart);
      this.addBarrier(x, 4.25, 2.2, 10, 8.5, 0.4);
    });

    // ─── Colonnade of Grand Pillars with Hanging Ropes & Ritual Banners ───
    const pillarCoords = [
      [-6, -6], [6, -6],
      [-6, -16], [6, -16],
      [-6, -26], [6, -26],
    ];

    pillarCoords.forEach(([px, pz]) => {
      const colGroup = new THREE.Group();

      // Main Column Shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 8.5, 16), wallMat);
      shaft.position.y = 4.25;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      colGroup.add(shaft);

      // Base ring & capital
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.5, 16), wallMat);
      base.position.y = 0.25;
      colGroup.add(base);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.15, 0.6, 16), wallMat);
      cap.position.y = 8.2;
      colGroup.add(cap);

      // Wrapped Ropes
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 0.9 });
      for (let rY = 2.8; rY <= 3.6; rY += 0.35) {
        const rope = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.04, 6, 20), ropeMat);
        rope.rotation.x = Math.PI / 2;
        rope.position.y = rY;
        colGroup.add(rope);
      }

      // Hanging Weathered Ritual Banner (Matching Reference Image)
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.8), bannerMat);
      banner.position.set(0, 4.8, (px < 0 ? 0.92 : -0.92));
      banner.rotation.y = (px < 0 ? 0 : Math.PI);
      colGroup.add(banner);

      colGroup.position.set(px, 0, pz);
      this.scene.add(colGroup);
      this.addBarrier(px, 4.25, pz, 1.8, 8.5, 1.8);
    });

    // ─── Stone Sarcophagi in Alcoves ───
    const sarcophagusCoords = [
      [-10, 0.5, -10, Math.PI / 2],
      [-10, 0.5, -22, Math.PI / 2],
      [ 10, 0.5, -10, -Math.PI / 2],
      [ 10, 0.5, -22, -Math.PI / 2],
    ];

    sarcophagusCoords.forEach(([sx, sy, sz, rotY]) => {
      const sarcGroup = new THREE.Group();
      const sarcBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2.4), altarMat);
      sarcBody.position.y = sy;
      sarcBody.castShadow = true;
      sarcGroup.add(sarcBody);

      // Carved lid
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 2.5), altarMat);
      lid.position.y = sy + 0.55;
      sarcGroup.add(lid);

      sarcGroup.position.set(sx, 0, sz);
      sarcGroup.rotation.y = rotY;
      this.scene.add(sarcGroup);
      this.addBarrier(sx, 0.6, sz, 1.4, 1.2, 2.6);
    });

    // ─── Central Stepped Dais (Elevated Sacred Platform) ───
    // Step 1: 10m x 10m, height 0.2m
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 10), altarMat);
    step1.position.set(0, 0.1, -15);
    step1.receiveShadow = true;
    this.scene.add(step1);

    // Step 2: 8m x 8m, height 0.2m
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), altarMat);
    step2.position.set(0, 0.3, -15);
    step2.receiveShadow = true;
    this.scene.add(step2);

    // Step 3: 6m x 6m, height 0.2m (Friend is stationed here)
    const step3 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), altarMat);
    step3.position.set(0, 0.5, -15);
    step3.receiveShadow = true;
    this.scene.add(step3);

    // ─── Grand Ceremonial Altar Table (Directly Behind Friend) ───
    const altarTable = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.4), altarMat);
    altarTable.position.set(0, 1.15, -16.2);
    altarTable.castShadow = true;
    altarTable.receiveShadow = true;
    this.scene.add(altarTable);
    this.addBarrier(0, 1.15, -16.2, 3.8, 1.4, 1.6);

    // Altar top cloth and ancient ritual scrolls
    const altarClothMat = new THREE.MeshStandardMaterial({ color: 0x9e8870, roughness: 0.95 });
    const altarCloth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 1.1), altarClothMat);
    altarCloth.position.set(0, 1.72, -16.2);
    this.scene.add(altarCloth);

    // Ritual Candles and Skulls on Altar
    [-1.2, 1.2].forEach((cx) => {
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0xe8d8c0 })
      );
      candle.position.set(cx, 1.85, -16.2);
      this.scene.add(candle);

      const candleLight = new THREE.PointLight(0xffa834, 0.85, 4.5, 1.8);
      candleLight.position.set(cx, 2.05, -16.2);
      this.scene.add(candleLight);
    });

    // ─── Twin Background Staircases Ascending to Darkness ───
    [-5.5, 5.5].forEach((sx) => {
      const stairGroup = new THREE.Group();
      for (let s = 0; s < 10; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 0.6), altarMat);
        step.position.set(0, 0.125 + s * 0.25, -20 - s * 0.55);
        stairGroup.add(step);
      }
      stairGroup.position.set(sx, 0, 0);
      this.scene.add(stairGroup);
      this.addBarrier(sx, 1.5, -23, 2.5, 3.0, 6.0);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. MISSING FRIEND 3D CHARACTER MODEL (Alive, Human, Restrained)
  // ═══════════════════════════════════════════════════════════════════════════
  buildFriendCharacter() {
    this.friendGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc89674, roughness: 0.75, metalness: 0.05 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x3d3229, roughness: 0.85 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.88 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x181410, roughness: 0.95 });

    // Lower Body: Kneeling / Slumped posture against the altar dais
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.8), pantsMat);
    legs.position.set(0, 0.22, 0);
    this.friendGroup.add(legs);

    // Torso / Jacket (slumped forward in exhaustion)
    this.friendTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.42), jacketMat);
    this.friendTorso.position.set(0, 0.72, -0.05);
    this.friendTorso.rotation.x = 0.22; // slight forward slouch
    this.friendTorso.castShadow = true;
    this.friendGroup.add(this.friendTorso);

    // Left Arm resting on knee
    this.friendLeftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), jacketMat);
    this.friendLeftArm.position.set(-0.38, 0.6, 0.15);
    this.friendLeftArm.rotation.x = 0.6;
    this.friendGroup.add(this.friendLeftArm);

    // Right Arm weakly bound
    this.friendRightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), jacketMat);
    this.friendRightArm.position.set(0.38, 0.6, 0.15);
    this.friendRightArm.rotation.x = 0.6;
    this.friendGroup.add(this.friendRightArm);

    // Hands
    [-0.38, 0.38].forEach((hx) => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
      hand.position.set(hx, 0.35, 0.38);
      this.friendGroup.add(hand);
    });

    // Head (tired, bowed posture)
    this.friendHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
    this.friendHead.position.set(0, 1.22, 0.05);
    this.friendHead.rotation.x = 0.18;
    this.friendGroup.add(this.friendHead);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), hairMat);
    hair.position.set(0, 1.25, 0.02);
    this.friendGroup.add(hair);

    // ─── Swirling Corrupted Spiritual Energy Bands (Visual Restraint) ───
    const ringColors = [0x9333ea, 0xdc2626, 0xa855f7];
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[i],
        emissive: ringColors[i],
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.65,
        wireframe: true,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75 + i * 0.18, 0.025, 8, 32), ringMat);
      ring.position.set(0, 0.7 + i * 0.35, 0);
      ring.rotation.x = Math.PI / 3 + i * 0.4;
      ring.rotation.y = i * 0.8;
      this.friendGroup.add(ring);
      this.friendEnergyRings.push({ mesh: ring, rotSpeed: 0.8 + i * 0.4 });
    }

    // Corrupted energy point light emanating from the restraint
    this.friendAuraLight = new THREE.PointLight(0xa855f7, 1.4, 6.0, 1.6);
    this.friendAuraLight.position.set(0, 0.9, 0);
    this.friendGroup.add(this.friendAuraLight);

    // Position friend on dais right before the main altar
    this.friendGroup.position.set(0, 0.6, -14.2);
    this.scene.add(this.friendGroup);

    // Register friend interaction trigger
    const friendTrigger = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.8, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    friendTrigger.position.set(0, 1.2, -14.2);
    friendTrigger.userData = {
      prompt: () => gameState.getState().friendInteractionCompleted
        ? "SPEAK TO YOUR FRIEND"
        : "[E] SPEAK TO YOUR FRIEND",
      action: () => this.interactWithFriend(),
    };
    this.scene.add(friendTrigger);
    this.interactables.push(friendTrigger);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SHADOW ENTITY MANIFESTATION (Exact match to Reference Image)
  // ═══════════════════════════════════════════════════════════════════════════
  buildShadowEntityManifestation() {
    this.entityGroup = new THREE.Group();

    // Dark void silhouette material
    const entityMat = new THREE.MeshStandardMaterial({
      color: 0x050406,
      roughness: 0.98,
      metalness: 0.1,
      transparent: true,
      opacity: 0.0,
    });
    this.entityMaterial = entityMat;

    // Menacing Torso & Ribcage
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.8), entityMat);
    torso.position.y = 2.0;
    this.entityGroup.add(torso);

    // Horned Skeletal Skull
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), entityMat);
    skull.position.set(0, 3.4, 0.2);
    this.entityGroup.add(skull);

    // Horns
    [-0.35, 0.35].forEach((hx) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 8), entityMat);
      horn.position.set(hx, 4.0, 0.1);
      horn.rotation.z = (hx < 0 ? 0.35 : -0.35);
      this.entityGroup.add(horn);
    });

    // Glowing Crimson Eyes (piercing red emissive lights)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1122, transparent: true, opacity: 0.0 });
    this.entityEyeMaterial = eyeMat;

    [-0.18, 0.18].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), eyeMat);
      eye.position.set(ex, 3.45, 0.65);
      this.entityGroup.add(eye);
    });

    // Multi-Armed Spanning Array (6 curved reaching arms matching reference image)
    const armConfigs = [
      // Top high reaching arms
      { x: -1.2, y: 3.2, z: 0, rz:  0.8, ry:  0.3 },
      { x:  1.2, y: 3.2, z: 0, rz: -0.8, ry: -0.3 },
      // Mid outstretched clawed arms
      { x: -1.6, y: 2.2, z: 0.3, rz:  0.3, ry:  0.5 },
      { x:  1.6, y: 2.2, z: 0.3, rz: -0.3, ry: -0.5 },
      // Lower sweeping arms
      { x: -1.4, y: 1.2, z: 0.2, rz: -0.4, ry:  0.4 },
      { x:  1.4, y: 1.2, z: 0.2, rz:  0.4, ry: -0.4 },
    ];

    armConfigs.forEach((cfg) => {
      const armGroup = new THREE.Group();
      const armUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.4, 8), entityMat);
      armUpper.position.y = 0.7;
      armGroup.add(armUpper);

      // Claw hands
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.45, 6), entityMat);
        claw.position.set(c * 0.08, 1.5, 0);
        claw.rotation.z = c * 0.25;
        armGroup.add(claw);
      }

      armGroup.position.set(cfg.x, cfg.y, cfg.z);
      armGroup.rotation.z = cfg.rz;
      armGroup.rotation.y = cfg.ry;
      this.entityGroup.add(armGroup);
    });

    // Swirling Dark Smoke / Void Wings (Backdrop)
    const voidMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 1.0,
      transparent: true,
      opacity: 0.0,
    });
    this.entityVoidMaterial = voidMat;

    const voidWings = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.5), voidMat);
    voidWings.position.set(0, 2.5, -0.4);
    this.entityGroup.add(voidWings);

    // Entity red aura light
    this.entityLight = new THREE.PointLight(0xff0022, 0, 18, 1.6);
    this.entityLight.position.set(0, 3.2, 1.0);
    this.entityGroup.add(this.entityLight);

    // Hovering directly above/behind the altar dais
    this.entityGroup.position.set(0, 3.2, -16.5);
    this.scene.add(this.entityGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. AMBIENT PARTICLES (Dust Motes + Void Sparks)
  // ═══════════════════════════════════════════════════════════════════════════
  buildAmbientDustAndEnergy() {
    const pCount = 200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = 0.5 + Math.random() * 7.5;
      pos[i * 3 + 2] = -32 + Math.random() * 56;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particlePositions = pos;

    const pMat = new THREE.PointsMaterial({
      color: 0xdfb48a,
      size: 0.06,
      transparent: true,
      opacity: 0.45,
    });

    this.particles = new THREE.Points(geo, pMat);
    this.scene.add(this.particles);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. FLASHLIGHT SETUP
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
      console.warn('[Level6] Flashlight setup error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. FRIEND INTERACTION & CINEMATIC NARRATIVE MOMENT
  // ═══════════════════════════════════════════════════════════════════════════
  interactWithFriend() {
    if (this.isDialogueActive) return;
    this.isDialogueActive = true;

    // Step 1: Friend recognizes the player
    gameState.triggerGuideDialogue({
      speakerName: 'FRIEND (WEAK)',
      message: '...You came.',
      choices: [{ label: '[E] "I\'m getting you out."', key: 'save_friend' }],
    });

    gameState.setGuideChoiceHandler((choiceKey) => {
      if (choiceKey === 'save_friend') {
        // Step 2: Friend warns player
        setTimeout(() => {
          gameState.triggerGuideDialogue({
            speakerName: 'FRIEND (DISTRESSED)',
            message: 'You can\'t... It won\'t let me leave.',
            choices: [{ label: '[E] "Why? What is holding you?"', key: 'why_holding' }],
          });

          gameState.setGuideChoiceHandler((choice2) => {
            if (choice2 === 'why_holding') {
              this.triggerNegativeEnergySurge();
            }
          });
        }, 300);
      }
    });
  }

  triggerNegativeEnergySurge() {
    // 1. Negative energy reaction
    gameState.triggerNegativeEnergyEventL6();

    // 2. Camera shake & audiovisual distortion
    this.shakeIntensity = 0.55;

    // 3. Manifest the towering shadow entity silhouette
    this.entityActive = true;
    this.entityTargetOpacity = 0.95;

    // 4. Friend flinches in distress
    if (this.friendTorso) this.friendTorso.rotation.x = 0.45;

    // 5. AI Guide urgently intervenes
    setTimeout(() => {
      gameState.triggerGuideDialogue({
        speakerName: 'UNKNOWN GUIDE (ALERT)',
        message: 'Don\'t touch him! The temple is using its own power to hold him here.',
        choices: [{ label: '[E] "How do we break the hold?"', key: 'break_hold' }],
      });

      gameState.setGuideChoiceHandler((choiceKey) => {
        if (choiceKey === 'break_hold') {
          // Entity slowly recedes into the ceiling shadows
          this.entityTargetOpacity = 0.0;

          setTimeout(() => {
            gameState.triggerGuideDialogue({
              speakerName: 'FRIEND (BREATHLESS)',
              message: 'There\'s something in this temple... It took control of me.',
              choices: [{ label: '[E] "Hold on, I will find a way."', key: 'find_way' }],
            });

            gameState.setGuideChoiceHandler((choice4) => {
              if (choice4 === 'find_way') {
                this.concludeLevel6Sequence();
              }
            });
          }, 350);
        }
      });
    }, 1800);
  }

  concludeLevel6Sequence() {
    // AI Guide explains spiritual corruption and points to Level 7 (Ancient Scroll)
    gameState.discoverSpiritualCorruptionL6();

    setTimeout(() => {
      gameState.triggerGuideDialogue({
        speakerName: 'UNKNOWN GUIDE',
        message: 'The temple\'s protective power has been corrupted. There is an old record somewhere in the temple... The answer may be written there.',
        choices: [{ label: '[E] "Find the ancient scroll."', key: 'complete_level' }],
      });

      gameState.setGuideChoiceHandler((choiceKey) => {
        if (choiceKey === 'complete_level') {
          this.isDialogueActive = false;
          gameState.setGuideChoiceHandler(null);
          gameState.set({ activeGuideDialogue: null, interactionPrompt: null });

          setTimeout(() => {
            soundManager.playSanctuaryChime();
            gameState.completeLevel6();
          }, 600);
        }
      });
    }, 400);
  }

  triggerAIHint(situationKey) {
    try {
      const hint = getProactiveHint(situationKey);
      if (hint) {
        gameState.triggerGuideDialogue({
          speakerName: 'UNKNOWN GUIDE',
          message: hint,
          choices: [{ label: '[E] Acknowledge', key: 'ack' }],
        });
        gameState.setGuideChoiceHandler(() => {
          gameState.setGuideChoiceHandler(null);
          gameState.set({ activeGuideDialogue: null });
        });
      }
    } catch (e) {
      console.warn('[Level6] AI Hint fallback:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. COLLISION SYSTEM & HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  addBarrier(cx, cy, cz, w, h, d) {
    this.colliders.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
    });
  }

  checkCollision(newPos) {
    const r = 0.45;
    for (const c of this.colliders) {
      if (
        newPos.x + r > c.minX &&
        newPos.x - r < c.maxX &&
        newPos.z + r > c.minZ &&
        newPos.z - r < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. EVENT LISTENERS & INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('resize', this.onResize);
    if (this.canvas) this.canvas.addEventListener('click', this.onCanvasClick);
  }

  onCanvasClick() {
    if (!this.isPointerLocked && this.canvas) {
      soundManager.init();
      soundManager.resume();
      this.canvas.requestPointerLock();
    }
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  onMouseMove(e) {
    if (!this.isPointerLocked) return;
    const sensitivity = 0.0022;
    this.mouseDeltaX = e.movementX || 0;
    this.mouseDeltaY = e.movementY || 0;

    this.player.yaw -= this.mouseDeltaX * sensitivity;
    this.player.pitch -= this.mouseDeltaY * sensitivity;
    this.player.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.player.pitch));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward  = true; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left     = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right    = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'Space':
        if (this.player.isGrounded && this.player.canMove) {
          this.player.velocity.y = 5.4;
          this.player.isGrounded = false;
          soundManager.playJump();
        }
        break;
      case 'KeyF':
        if (this.firstPersonFlashlight) {
          const isOn = this.firstPersonFlashlight.toggle();
          gameState.set({ flashlightOn: isOn });
        }
        break;
      case 'KeyE':
        this.handleInteraction();
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

  handleInteraction() {
    // If dialogue choices are visible, press E can accept the first option
    const s = gameState.getState();
    if (s.activeGuideDialogue && s.activeGuideDialogue.choices?.length > 0) {
      gameState.handleGuideChoice(s.activeGuideDialogue.choices[0].key);
      return;
    }

    if (this.hoveredItem && this.hoveredItem.userData?.action) {
      this.hoveredItem.userData.action();
    }
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    const w = (this.canvas?.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
    const h = (this.canvas?.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. MAIN ANIMATION & UPDATE LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayerMovement(delta);
    this.updateRotaryMechanismAndDoor(delta);
    this.updateFriendAnimation(delta);
    this.updateShadowEntity(delta);
    this.updateRaycasting();
    this.updateParticles(delta);

    // Update Flashlight
    if (this.firstPersonFlashlight) {
      const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
      this.firstPersonFlashlight.update(
        delta,
        isMoving,
        this.keys.sprint,
        this.player.headBobTimer,
        this.mouseDeltaX,
        this.mouseDeltaY
      );
    }
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // Screen shake decay
    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.05, delta);
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updatePlayerMovement(delta) {
    if (!this.player.canMove) return;

    // Movement direction vectors
    const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
    const right   = new THREE.Vector3( Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
    const moveDir = new THREE.Vector3();

    if (this.keys.forward)  moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right)    moveDir.add(right);
    if (this.keys.left)     moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
      const currentSpeed = this.keys.sprint ? this.player.sprintSpeed : this.player.speed;
      const stepDist = currentSpeed * delta;

      const nextPosX = this.player.position.clone().addScaledVector(new THREE.Vector3(moveDir.x, 0, 0), stepDist);
      if (!this.checkCollision(nextPosX)) {
        this.player.position.x = nextPosX.x;
      }

      const nextPosZ = this.player.position.clone().addScaledVector(new THREE.Vector3(0, 0, moveDir.z), stepDist);
      if (!this.checkCollision(nextPosZ)) {
        this.player.position.z = nextPosZ.z;
      }

      this.player.headBobTimer += delta * (this.keys.sprint ? 14 : 9);
    }

    // Gravity
    if (!this.player.isGrounded) {
      this.player.velocity.y -= 14.5 * delta;
      this.player.position.y += this.player.velocity.y * delta;
      if (this.player.position.y <= 1.75) {
        this.player.position.y = 1.75;
        this.player.velocity.y = 0;
        this.player.isGrounded = true;
      }
    }

    // Camera transform update
    const headBobY = isMoving ? Math.sin(this.player.headBobTimer) * 0.045 : 0;
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y + headBobY,
      this.player.position.z
    );

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    // Automatic discovery when approaching friend
    const distToFriend = this.player.position.distanceTo(new THREE.Vector3(0, 1.75, -14.2));
    if (distToFriend < 6.5 && !this.hasTriggeredApproach && gameState.getState().sealedDoorOpened) {
      this.hasTriggeredApproach = true;
      gameState.locateFriendL6();
      this.triggerAIHint('friend_located');
    }
  }

  updateRotaryMechanismAndDoor(delta) {
    // Animate dial rotation when opened
    if (gameState.getState().sealedDoorOpened && this.rotaryMechanismMesh) {
      this.rotaryMechanismMesh.rotation.z += delta * 2.0;
    }

    // Smooth door sliding opening animation
    if (this.isDoorOpening && this.doorL && this.doorR) {
      this.doorOpenProgress = Math.min(1.0, this.doorOpenProgress + delta * 0.65);
      this.doorL.position.x = -1.0 - this.doorOpenProgress * 2.2;
      this.doorR.position.x =  1.0 + this.doorOpenProgress * 2.2;

      if (this.doorOpenProgress >= 1.0) {
        this.isDoorOpening = false;
        // Remove door collider so player can walk into sanctum
        const idx = this.colliders.indexOf(this.doorCollider);
        if (idx !== -1) this.colliders.splice(idx, 1);
      }
    }
  }

  updateFriendAnimation(delta) {
    if (!this.friendGroup) return;

    this.friendBreatheTimer += delta * 1.8;
    const breathe = Math.sin(this.friendBreatheTimer) * 0.025;

    // Subtle chest breathing
    if (this.friendTorso) {
      this.friendTorso.scale.set(1 + breathe * 0.5, 1 + breathe, 1 + breathe * 0.5);
    }
    // Subtle weak head movement
    if (this.friendHead) {
      this.friendHead.rotation.z = Math.sin(this.friendBreatheTimer * 0.5) * 0.04;
    }

    // Rotate corrupted energy restraint rings
    this.friendEnergyRings.forEach((r) => {
      r.mesh.rotation.z += delta * r.rotSpeed;
    });

    // Pulse aura light
    if (this.friendAuraLight) {
      this.friendAuraLight.intensity = 1.2 + Math.sin(this.friendBreatheTimer * 2.5) * 0.35;
    }
  }

  updateShadowEntity(delta) {
    if (!this.entityGroup) return;

    // Smooth opacity transition
    this.entityOpacity = THREE.MathUtils.lerp(this.entityOpacity, this.entityTargetOpacity, delta * 4.5);

    if (this.entityMaterial) this.entityMaterial.opacity = this.entityOpacity;
    if (this.entityEyeMaterial) this.entityEyeMaterial.opacity = this.entityOpacity;
    if (this.entityVoidMaterial) this.entityVoidMaterial.opacity = this.entityOpacity * 0.75;
    if (this.entityLight) this.entityLight.intensity = this.entityOpacity * 3.5;

    // Subtle eerie hover
    if (this.entityOpacity > 0.01) {
      this.entityPulseTimer += delta * 3.0;
      this.entityGroup.position.y = 3.2 + Math.sin(this.entityPulseTimer) * 0.15;
    }
  }

  updateRaycasting() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, true);

    if (intersects.length > 0 && intersects[0].distance < 3.8) {
      let rootItem = intersects[0].object;
      while (rootItem.parent && !rootItem.userData?.prompt) {
        rootItem = rootItem.parent;
      }

      if (rootItem.userData?.prompt) {
        this.hoveredItem = rootItem;
        const prompt = typeof rootItem.userData.prompt === 'function'
          ? rootItem.userData.prompt()
          : rootItem.userData.prompt;
        gameState.setInteractionPrompt(prompt);
        return;
      }
    }

    this.hoveredItem = null;
    gameState.setInteractionPrompt(null);
  }

  updateParticles(delta) {
    if (!this.particles || !this.particlePositions) return;

    const count = this.particlePositions.length / 3;
    for (let i = 0; i < count; i++) {
      this.particlePositions[i * 3 + 1] += delta * 0.12;
      if (this.particlePositions[i * 3 + 1] > 8.0) {
        this.particlePositions[i * 3 + 1] = 0.6;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. DISPOSE & CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
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
    if (this.canvas) this.canvas.removeEventListener('click', this.onCanvasClick);

    // Reset Guide Dialogue state
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
