import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { ExpeditionWatch } from './items/ExpeditionWatch.js';
import { EntityAI, AI_STATES } from './ai/EntityAI.js';

/**
 * Level3Scene: THE HIDDEN PATH
 *
 * Faithfully recreates the authentic ancient crypt, corrupted hallway, and subterranean descent
 * shown in the user's reference panels:
 * 1. Dark Crypt Passage: Ancient stone walls with hieroglyphic markings, damp puddles, green/cyan torches
 * 2. Corrupted Hallways: Ashlar masonry with creeping dark tendrils, fallen masonry, broken urns, red torches
 * 3. Spiraling Descent: Stone stairs descending into the catacombs, scratch marks, and safe sanctuary exit
 *
 * Gameplay Progression Flow:
 * 1. Enter secret passage beneath the temple
 * 2. Find friend's fresh footprints in dust -> Follow trail
 * 3. Discover friend's dropped personal object (Expedition Watch) -> Examine & Hold
 * 4. Discover strange wall symbol on masonry -> Examine
 * 5. Find & activate hidden stone wall mechanism -> Inner stone door slides open
 * 6. Enter grand dark crypt chamber -> First supernatural silhouette encounter (vanishes)
 * 7. Second sighting watching from high alcove
 * 8. Supernatural chase sequence down corrupted corridor -> Dynamic pursuit with adaptive AI
 * 9. Reach safe sanctuary threshold -> Entity is repelled and dissolves into dark
 * 10. Mysterious hooded person appears in sanctuary mist, speaks cryptic dialogue, vanishes
 * 11. Level 3 Complete transition to Level 4
 */
export class Level3Scene {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Player Physics & State - Spawns at the secret passage entrance
    this.player = {
      position: new THREE.Vector3(0, 1.75, 18), // Secret passage threshold
      velocity: new THREE.Vector3(),
      yaw: 0, // Facing negative Z (down the crypt)
      pitch: -0.04,
      speed: 5.8,
      sprintSpeed: 9.2,
      isSprinting: false,
      isGrounded: true,
      headBobTimer: 0,
      canMove: true,
    };

    this.shakeIntensity = 0;

    // Movement Controls
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

    // Interactable Objects & Colliders
    this.interactables = [];
    this.colliders = [];
    this.hoveredItem = null;
    this.raycaster = new THREE.Raycaster();

    // First-Person Hold System
    this.heldObject = null;
    this.isHoldingObject = false;
    this.attractingObject = null;
    this.attractionProgress = 0;
    this.attractionStartPos = new THREE.Vector3();
    this.attractionStartRot = new THREE.Quaternion();
    this.originalScale = new THREE.Vector3();
    this.holdPoint = null;

    // Level 3 State Machine & Cinematic Milestones
    this.levelCompleted = false;
    this.footprintsInspected = false;
    this.watchInspected = false;
    this.symbolInspected = false;
    this.mechanismActivated = false;
    this.innerDoorOpening = false;
    this.innerDoorSlideProgress = 0;
    this.innerDoor = null;
    this.innerDoorCollider = null;

    this.firstSightingTriggered = false;
    this.secondSightingTriggered = false;
    this.chaseTriggered = false;
    this.safeExitReached = false;
    this.mysteriousPersonEncountered = false;

    // Lights for flickering events
    this.cryptTorches = [];
    this.corruptedTorches = [];

    // Flashlight & Entity AI
    this.firstPersonFlashlight = null;
    this.entityAI = null;
    this.mysteriousPersonGroup = null;

    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.setupThree();
    this.setupLighting();
    this.buildCryptEnvironment();
    this.setupFootprints();
    this.setupFriendWatch();
    this.setupWallSymbolAndMechanism();
    this.setupGrandDarkChamber();
    this.setupCorruptedDescent();
    this.setupSafeSanctuary();
    this.setupEntityAI();
    this.setupMysteriousPerson();
    this.setupPlayerFlashlight();
    this.setupEventListeners();

    // Notify central GameState
    gameState.startLevel3();

    // Start Animation Loop
    this.animate();
  }

  // --- 1. THREE.JS SCENE SETUP ---
  setupThree() {
    this.scene = new THREE.Scene();
    // Atmospheric dark subterranean mist - balanced density so distance details and silhouettes are clearly visible
    this.scene.fog = new THREE.FogExp2(0x0f1520, 0.024);

    const width = (this.canvas && this.canvas.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
    const height = (this.canvas && this.canvas.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 300);
    this.camera.position.copy(this.player.position);
    this.scene.add(this.camera);

    // Dedicated camera holdPoint for first-person item holding (bottom center-right)
    this.holdPoint = new THREE.Group();
    this.holdPoint.position.set(0.18, -0.25, -0.72);
    this.camera.add(this.holdPoint);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimized for 4GB VRAM
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22; // Cinematic horror exposure that lifts midtone details without washing out
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // --- 2. LIGHTING SETUP ---
  setupLighting() {
    // 1. Ambient Light: base illumination that prevents crushing pitch blacks across underground areas
    const ambientLight = new THREE.AmbientLight(0x1a2434, 0.58);
    this.scene.add(ambientLight);

    // 2. Subterranean Vault Hemisphere Light (Target 1.4 - 1.5 intensity)
    // Cool vaulted ceiling stone tone (0x2d3a4e) vs dark damp stone floor tone (0x181f2b)
    const hemiLight = new THREE.HemisphereLight(0x2d3a4e, 0x181f2b, 1.48);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Directional Architectural Fill - soft crevice moonlit glow filtering down through ceiling fissures
    const fissureLight = new THREE.DirectionalLight(0x384860, 0.65);
    fissureLight.position.set(6, 18, 12);
    this.scene.add(fissureLight);

    // 4. Subtle Reverse Bounce Fill - ensures north-facing walls, alcoves, and pillar backs remain distinct
    const bounceFill = new THREE.DirectionalLight(0x202a3a, 0.45);
    bounceFill.position.set(-6, -4, -40);
    this.scene.add(bounceFill);

    // 5. Deep Catacomb Corridor Ambient Fill: lifts the deep corrupted descent & grand chamber
    const deepCorridorFill = new THREE.DirectionalLight(0x242e3e, 0.38);
    deepCorridorFill.position.set(0, 10, -82);
    this.scene.add(deepCorridorFill);
  }

  // --- 3. CRYPT CORRIDOR ARCHITECTURE (Reference Panel 1: Dark Crypt Passage) ---
  buildCryptEnvironment() {
    const wallTex = textureFactory.getCryptStoneWallTexture();
    const floorTex = textureFactory.getCryptFloorPuddleTexture();

    // Floor Material (Subtle wet gloss reflection)
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.32,
      metalness: 0.12,
    });

    // Wall Material (Rough-hewn ancient ashlar stone)
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.08,
    });

    // Ceiling Material (Heavy dark stone slab)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x141310,
      roughness: 0.95,
      metalness: 0.05,
    });

    // --- Section 1: Secret Crypt Corridor (Z: 20 down to -16, Width: 6m, Height: 4.8m) ---
    const corridorLen = 36;
    const corridorZ = 2; // Center of corridor

    // Floor
    const floorGeo = new THREE.PlaneGeometry(6.4, corridorLen);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, corridorZ);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 4.8, corridorZ);
    this.scene.add(ceiling);

    // Left Wall (X = -3.2)
    const wallGeo = new THREE.PlaneGeometry(corridorLen, 4.8);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-3.2, 2.4, corridorZ);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.addBarrier(-3.4, 2.4, corridorZ, 0.4, 4.8, corridorLen);

    // Right Wall (X = 3.2, with an opening into the alcove between Z = -9 and -15)
    // Front right wall (Z: 20 to -9)
    const rWallFrontLen = 29;
    const rWallFront = new THREE.Mesh(new THREE.PlaneGeometry(rWallFrontLen, 4.8), wallMat);
    rWallFront.position.set(3.2, 2.4, 5.5);
    rWallFront.rotation.y = -Math.PI / 2;
    rWallFront.receiveShadow = true;
    this.scene.add(rWallFront);
    this.addBarrier(3.4, 2.4, 5.5, 0.4, 4.8, rWallFrontLen);

    // Rear boundary wall behind spawn (Z = 20)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.8), wallMat);
    backWall.position.set(0, 2.4, 20);
    this.scene.add(backWall);
    this.addBarrier(0, 2.4, 20.2, 6.4, 4.8, 0.4);

    // Wall Arch Beams across corridor ceiling every 6m
    for (let z = 18; z >= -14; z -= 6) {
      const archBeam = new THREE.Mesh(
        new THREE.BoxGeometry(6.4, 0.45, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1f1d18, roughness: 0.9 })
      );
      archBeam.position.set(0, 4.6, z);
      this.scene.add(archBeam);

      // Hanging roots / vines clinging to arch (reference panel 1)
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x181e14, roughness: 0.9 });
      for (let v = 0; v < 3; v++) {
        const vineLen = 0.8 + Math.random() * 1.2;
        const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, vineLen, 6), vineMat);
        vine.position.set(-2.2 + v * 2.2, 4.6 - vineLen / 2, z + (Math.random() - 0.5) * 0.3);
        this.scene.add(vine);
      }
    }

    // Cobwebs in ceiling corners (reference panel 2)
    const cobwebTex = textureFactory.getCobwebTexture();
    const cobwebMat = new THREE.MeshBasicMaterial({
      map: cobwebTex,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    for (let z = 14; z >= -12; z -= 8) {
      const webL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), cobwebMat);
      webL.position.set(-3.18, 4.0, z);
      webL.rotation.y = Math.PI / 2;
      this.scene.add(webL);
    }

    // Wall Sconces (Greenish eerie torches matching reference panel 1)
    const torchZ = [14, 2, -10];
    torchZ.forEach((tz, idx) => {
      const isLeft = idx % 2 === 0;
      const tx = isLeft ? -3.05 : 3.05;

      const sconce = new THREE.Group();
      sconce.position.set(tx, 2.3, tz);

      // Iron wall bracket
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x121316, metalness: 0.8, roughness: 0.6 })
      );
      sconce.add(bracket);

      // Sconce bowl / torch cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.08, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: 0x1f2228, metalness: 0.7, roughness: 0.5 })
      );
      cup.position.set(isLeft ? 0.18 : -0.18, 0.1, 0);
      sconce.add(cup);

      // Eerie Greenish Flame Mesh (reference panel 1)
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.9,
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 8), flameMat);
      flame.position.set(isLeft ? 0.18 : -0.18, 0.28, 0);
      sconce.add(flame);

      // PointLight (Enhanced for subterranean visibility while preserving emerald flame atmosphere)
      const torchLight = new THREE.PointLight(0x4ade80, 3.2, 16, 1.6);
      torchLight.position.set(isLeft ? 0.18 : -0.18, 0.35, 0);
      sconce.add(torchLight);

      this.scene.add(sconce);
      this.cryptTorches.push({ light: torchLight, baseIntensity: 3.2 });
    });

    // Environmental Debris: Stacked fallen stone masonry & clay urns along corridor walls
    this.addCorridorProps();
  }

  addCorridorProps() {
    const stoneBlockMat = new THREE.MeshStandardMaterial({
      color: 0x2b2823,
      roughness: 0.88,
    });
    const urnMat = new THREE.MeshStandardMaterial({
      color: 0x5a341e, // Ancient terracotta
      roughness: 0.75,
    });

    // Stacked stone blocks along left wall (reference panel 2)
    const blockPositions = [
      [-2.6, 0.25, 8.0],
      [-2.5, 0.65, 8.0],
      [-2.6, 0.25, -2.0],
      [-2.7, 0.25, -2.8],
      [2.6, 0.25, 11.0],
    ];
    blockPositions.forEach(([bx, by, bz]) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.95), stoneBlockMat);
      block.position.set(bx, by, bz);
      block.rotation.y = (Math.random() - 0.5) * 0.4;
      block.castShadow = true;
      this.scene.add(block);
      this.addBarrier(bx, by, bz, 0.9, 0.5, 1.0);
    });

    // Clay Urns / Jars sitting in corner crevices
    const urnPositions = [
      [-2.7, 0.45, 6.5],
      [-2.8, 0.35, 5.8],
      [2.7, 0.45, 1.2],
      [-2.7, 0.4, -6.5],
    ];
    urnPositions.forEach(([ux, uy, uz]) => {
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.85, 12), urnMat);
      urn.position.set(ux, uy, uz);
      urn.castShadow = true;
      this.scene.add(urn);
      this.addBarrier(ux, uy, uz, 0.5, 0.9, 0.5);
    });

    // Weathered Wooden Cart with stone debris (reference panel 2)
    const cartGroup = new THREE.Group();
    cartGroup.position.set(2.4, 0.5, -4.0);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0x22160d, roughness: 0.9 });
    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.8), cartMat);
    cartGroup.add(cartBody);
    // Wheels
    for (let w = -1; w <= 1; w += 2) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12), cartMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(w * 0.65, -0.15, 0);
      cartGroup.add(wheel);
    }
    this.scene.add(cartGroup);
    this.addBarrier(2.4, 0.5, -4.0, 1.4, 0.8, 2.0);
  }

  // --- 4. FOOTPRINT SYSTEM (Friend's fresh tracks in the dust) ---
  setupFootprints() {
    const footTex = textureFactory.getFootprintsTexture();
    const footMat = new THREE.MeshBasicMaterial({
      map: footTex,
      color: 0xdfd7c5,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });

    // Sequential boot prints leading down corridor toward the side alcove
    const trailPositions = [
      [0.0, 0.015, 14.0],
      [0.2, 0.015, 10.0],
      [0.5, 0.015, 6.0],
      [0.9, 0.015, 2.0],
      [1.4, 0.015, -2.0],
      [2.0, 0.015, -6.0],
      [2.8, 0.015, -10.0], // Leading into side alcove
    ];

    trailPositions.forEach(([fx, fy, fz], idx) => {
      const footprint = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), footMat);
      footprint.rotation.x = -Math.PI / 2;
      footprint.rotation.z = -0.15;
      footprint.position.set(fx, fy, fz);
      this.scene.add(footprint);

      // The primary interactive clue trigger is placed at z = 6.0
      if (idx === 2) {
        footprint.userData = {
          label: "Friend's Footprints",
          prompt: '[E] EXAMINE FOOTPRINTS',
          action: () => {
            if (this.footprintsInspected) return;
            this.footprintsInspected = true;
            gameState.examineFootprintsL3();
          },
        };
        this.interactables.push(footprint);
      }
    });
  }

  // --- 5. FRIEND'S DROPPED OBJECT (Expedition Watch) ---
  setupFriendWatch() {
    // Ancient stone plinth / table in side alcove (X: 3.2 to 7.0, Z: -9 to -15)
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x282520,
      roughness: 0.85,
    });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 1.2), plinthMat);
    plinth.position.set(4.8, 0.425, -12.5);
    plinth.castShadow = true;
    this.scene.add(plinth);
    this.addBarrier(4.8, 0.425, -12.5, 1.3, 0.9, 1.3);

    // Overturned decorative clay urn next to plinth
    const brokenUrn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.18, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: 0x6e3b20, roughness: 0.75 })
    );
    brokenUrn.rotation.z = Math.PI / 2.3;
    brokenUrn.position.set(4.8, 0.95, -12.2);
    this.scene.add(brokenUrn);

    // Friend's Expedition Watch sitting on top of plinth
    this.friendWatch = ExpeditionWatch.create(4.8, 0.88, -12.5);
    this.friendWatch.userData.action = () => {
      if (!this.watchInspected) {
        this.watchInspected = true;
        gameState.examineFriendObject();
      }
    };
    this.scene.add(this.friendWatch);
    this.interactables.push(this.friendWatch);
  }

  // --- 6. WALL SYMBOL & HIDDEN STONE MECHANISM ---
  setupWallSymbolAndMechanism() {
    const wallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getCryptStoneWallTexture(),
      roughness: 0.85,
    });

    // Side Alcove Walls (X: 3.2 to 7.2, Z: -9 to -15, Height: 4.8m)
    // Alcove Floor
    const alcoveFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(4.0, 6.0),
      new THREE.MeshStandardMaterial({ map: textureFactory.getCryptFloorPuddleTexture(), roughness: 0.35 })
    );
    alcoveFloor.rotation.x = -Math.PI / 2;
    alcoveFloor.position.set(5.2, 0, -12.0);
    this.scene.add(alcoveFloor);

    // Alcove North Wall (Z = -15.0)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.8), wallMat);
    northWall.position.set(5.2, 2.4, -15.0);
    this.scene.add(northWall);
    this.addBarrier(5.2, 2.4, -15.2, 4.0, 4.8, 0.4);

    // Alcove South Wall (Z = -9.0)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.8), wallMat);
    southWall.position.set(5.2, 2.4, -9.0);
    southWall.rotation.y = Math.PI;
    this.scene.add(southWall);
    this.addBarrier(5.2, 2.4, -8.8, 4.0, 4.8, 0.4);

    // Alcove East Wall (X = 7.2)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.8), wallMat);
    eastWall.position.set(7.2, 2.4, -12.0);
    eastWall.rotation.y = -Math.PI / 2;
    this.scene.add(eastWall);
    this.addBarrier(7.4, 2.4, -12.0, 0.4, 4.8, 6.0);

    // --- Wall Symbol Carving (Etched into the North Wall at X = 4.2, Z = -14.95) ---
    const symbolTex = textureFactory.getAncientCarvedSymbolTexture();
    const symbolMat = new THREE.MeshStandardMaterial({
      map: symbolTex,
      roughness: 0.6,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
    });
    const symbolMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), symbolMat);
    symbolMesh.position.set(4.2, 2.2, -14.94);
    symbolMesh.userData = {
      label: 'Ancient Wall Symbol',
      prompt: '[E] EXAMINE ANCIENT SYMBOL',
      action: () => {
        if (this.symbolInspected) return;
        this.symbolInspected = true;
        gameState.examineWallSymbolL3();
      },
    };
    this.scene.add(symbolMesh);
    this.interactables.push(symbolMesh);

    // Dedicated warm sconce clearly illuminating both the symbol and the mechanism lever
    const symbolLight = new THREE.PointLight(0xf59e0b, 2.6, 9.0, 1.7);
    symbolLight.position.set(4.8, 2.8, -14.0);
    this.scene.add(symbolLight);

    // --- Physical Stone Mechanism (Rotating stone wheel / lever next to symbol) ---
    const mechGroup = new THREE.Group();
    mechGroup.position.set(6.2, 1.9, -14.94);

    // Heavy stone circular mount
    const mountGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.12, 24);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x221f1a, roughness: 0.85 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.rotation.x = Math.PI / 2;
    mechGroup.add(mount);

    // Rotating stone wheel / lever arm
    this.leverArm = new THREE.Group();
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x3d372e, roughness: 0.6, metalness: 0.4 });
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 12, 24), wheelMat);
    this.leverArm.add(wheelRim);

    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.05), wheelMat);
    this.leverArm.add(spoke);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.4 })
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.22, 0.09);
    this.leverArm.add(handle);

    this.leverArm.position.z = 0.08;
    mechGroup.add(this.leverArm);

    mechGroup.userData = {
      label: 'Stone Mechanism',
      prompt: () => (this.mechanismActivated ? 'MECHANISM ACTIVATED' : '[E] ACTIVATE STONE MECHANISM'),
      action: () => {
        if (this.mechanismActivated) return;
        this.triggerMechanismActivation();
      },
    };
    this.scene.add(mechGroup);
    this.interactables.push(mechGroup);

    // --- Secret Inner Stone Door (Z = -16.0, blocking the passage into Grand Chamber) ---
    const doorTex = textureFactory.getInnerDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.8,
      metalness: 0.15,
    });
    this.innerDoor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.8, 0.6), doorMat);
    this.innerDoor.position.set(0, 2.4, -16.0);
    this.innerDoor.castShadow = true;
    this.scene.add(this.innerDoor);

    // Initial barrier blocking player from entering chamber before mechanism is activated
    this.innerDoorCollider = this.addBarrier(0, 2.4, -16.0, 6.4, 4.8, 0.8);
  }

  triggerMechanismActivation() {
    this.mechanismActivated = true;
    this.innerDoorOpening = true;
    this.shakeIntensity = 0.06;

    // Trigger GameState updates & audio
    gameState.activateMechanismL3();

    // Remove door collider so player can walk through
    const idx = this.colliders.indexOf(this.innerDoorCollider);
    if (idx !== -1) {
      this.colliders.splice(idx, 1);
    }
  }

  // --- 7. GRAND DARK CRYPT CHAMBER (Suspense Horror Section) ---
  setupGrandDarkChamber() {
    const wallTex = textureFactory.getCryptStoneWallTexture();
    const floorTex = textureFactory.getCryptFloorPuddleTexture();

    const chamberW = 28; // X: -14 to 14
    const chamberLen = 42; // Z: -16 to -58
    const chamberCenterZ = -37;
    const chamberH = 7.2;

    const chamberFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(chamberW, chamberLen),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.38, metalness: 0.1 })
    );
    chamberFloor.rotation.x = -Math.PI / 2;
    chamberFloor.position.set(0, 0, chamberCenterZ);
    chamberFloor.receiveShadow = true;
    this.scene.add(chamberFloor);

    const chamberCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(chamberW, chamberLen),
      new THREE.MeshStandardMaterial({ color: 0x0f0e0c, roughness: 0.95 })
    );
    chamberCeiling.rotation.x = Math.PI / 2;
    chamberCeiling.position.set(0, chamberH, chamberCenterZ);
    this.scene.add(chamberCeiling);

    // Chamber Left Wall (X = -14)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(chamberLen, chamberH), new THREE.MeshStandardMaterial({ map: wallTex }));
    leftWall.position.set(-14, chamberH / 2, chamberCenterZ);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);
    this.addBarrier(-14.2, chamberH / 2, chamberCenterZ, 0.4, chamberH, chamberLen);

    // Chamber Right Wall (X = 14)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(chamberLen, chamberH), new THREE.MeshStandardMaterial({ map: wallTex }));
    rightWall.position.set(14, chamberH / 2, chamberCenterZ);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);
    this.addBarrier(14.2, chamberH / 2, chamberCenterZ, 0.4, chamberH, chamberLen);

    // Two Colonnades of Massive Square Stone Pillars with stepped capitals
    const pillarMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.82,
      metalness: 0.1,
    });
    const pillarX = [-6.5, 6.5];
    const pillarZ = [-24, -32, -40, -48];

    pillarX.forEach((px) => {
      pillarZ.forEach((pz) => {
        // Main pillar shaft
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, chamberH, 1.6), pillarMat);
        shaft.position.set(px, chamberH / 2, pz);
        shaft.castShadow = true;
        this.scene.add(shaft);
        this.addBarrier(px, chamberH / 2, pz, 1.8, chamberH, 1.8);

        // Stepped bracket capital at top
        const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), pillarMat);
        cap.position.set(px, chamberH - 0.2, pz);
        this.scene.add(cap);
      });
    });

    // Chamber Wall Sconces (flickering torches - increased intensity & reach)
    const cTorchPositions = [
      [-13.8, 3.2, -26],
      [13.8, 3.2, -26],
      [-13.8, 3.2, -42],
      [13.8, 3.2, -42],
    ];
    cTorchPositions.forEach(([tx, ty, tz]) => {
      const light = new THREE.PointLight(0xef4444, 2.8, 22, 1.6); // Ominous reddish glow in chamber
      light.position.set(tx, ty, tz);
      this.scene.add(light);
      this.cryptTorches.push({ light, baseIntensity: 2.8 });
    });

    // Central ancient broken stone dais / altar
    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.7, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x1a1815, roughness: 0.9 })
    );
    altar.position.set(0, 0.35, -36);
    this.scene.add(altar);
    this.addBarrier(0, 0.35, -36, 3.8, 0.8, 3.8);
  }

  // --- 8. CORRUPTED HALLWAY & CHASE DESCENT (Reference Panel 2 & 3) ---
  setupCorruptedDescent() {
    const corrWallTex = textureFactory.getCorruptedWallTexture();
    const floorTex = textureFactory.getCryptFloorPuddleTexture();

    const corrMat = new THREE.MeshStandardMaterial({ map: corrWallTex, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.4 });

    // Long descending corridor (Z: -58 to -108, Width: 5.4m, Height: 4.8m)
    const descentLen = 50;
    const descentCenterZ = -83;

    // Floor with descending stepped terraces
    const corrFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.4, descentLen), floorMat);
    corrFloor.rotation.x = -Math.PI / 2;
    corrFloor.position.set(0, 0, descentCenterZ);
    corrFloor.receiveShadow = true;
    this.scene.add(corrFloor);

    // Ceiling
    const corrCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, descentLen),
      new THREE.MeshStandardMaterial({ color: 0x090807, roughness: 0.95 })
    );
    corrCeiling.rotation.x = Math.PI / 2;
    corrCeiling.position.set(0, 4.8, descentCenterZ);
    this.scene.add(corrCeiling);

    // Left Corrupted Wall (X = -2.7)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(descentLen, 4.8), corrMat);
    leftWall.position.set(-2.7, 2.4, descentCenterZ);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);
    this.addBarrier(-2.9, 2.4, descentCenterZ, 0.4, 4.8, descentLen);

    // Right Corrupted Wall (X = 2.7)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(descentLen, 4.8), corrMat);
    rightWall.position.set(2.7, 2.4, descentCenterZ);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);
    this.addBarrier(2.9, 2.4, descentCenterZ, 0.4, 4.8, descentLen);

    // Torches along the corrupted descent (blood-red embers - enhanced visibility)
    for (let z = -64; z >= -104; z -= 12) {
      const redTorch = new THREE.PointLight(0xdc2626, 3.5, 18, 1.6);
      redTorch.position.set(z % 24 === 0 ? -2.5 : 2.5, 2.4, z);
      this.scene.add(redTorch);
      this.corruptedTorches.push({ light: redTorch, baseIntensity: 3.5 });
    }
  }

  // --- 9. SAFE SANCTUARY & EXIT (Threshold where entity stops) ---
  setupSafeSanctuary() {
    // Grand Sanctuary Archway (at Z = -108)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Golden sacred stone
      roughness: 0.45,
      metalness: 0.5,
    });

    const archFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 0.6), archMat);
    archFrameL.position.set(-2.6, 2.5, -108);
    this.scene.add(archFrameL);

    const archFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 0.6), archMat);
    archFrameR.position.set(2.6, 2.5, -108);
    this.scene.add(archFrameR);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.6, 0.6), archMat);
    archTop.position.set(0, 4.8, -108);
    this.scene.add(archTop);

    // Radiant Golden Sanctuary Light emitting from beyond the archway
    const sanctuaryLight = new THREE.PointLight(0xfef08a, 5.0, 30, 1.2);
    sanctuaryLight.position.set(0, 3.2, -114);
    this.scene.add(sanctuaryLight);

    // Sanctuary Chamber Room (Z: -108 to -128, Width: 12m, Height: 5.5m)
    const sanctFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 20),
      new THREE.MeshStandardMaterial({ color: 0x242018, roughness: 0.4 })
    );
    sanctFloor.rotation.x = -Math.PI / 2;
    sanctFloor.position.set(0, 0, -118);
    this.scene.add(sanctFloor);

    // Outer boundary walls for sanctuary
    this.addBarrier(-6.2, 2.5, -118, 0.4, 5.5, 20);
    this.addBarrier(6.2, 2.5, -118, 0.4, 5.5, 20);
    this.addBarrier(0, 2.5, -128.2, 12, 5.5, 0.4);
  }

  // --- 10. ENTITY AI INITIALIZATION ---
  setupEntityAI() {
    // Hidden path waypoints through chamber and down corrupted corridor
    const waypoints = [
      new THREE.Vector3(0, 1.8, -32),
      new THREE.Vector3(-4.0, 1.8, -42),
      new THREE.Vector3(0, 1.8, -54),
      new THREE.Vector3(0, 1.8, -70),
      new THREE.Vector3(0, 1.8, -88),
      new THREE.Vector3(0, 1.8, -104),
    ];

    this.entityAI = new EntityAI(this.scene, this.player, waypoints);
    // Initially positioned at the far end of the chamber, hidden
    this.entityAI.position.set(0, 1.8, -48);
    this.entityAI.vanish(0.1);
  }

  // --- 11. MYSTERIOUS PERSON (AI Companion Precursor) ---
  setupMysteriousPerson() {
    this.mysteriousPersonGroup = new THREE.Group();
    this.mysteriousPersonGroup.position.set(0, 0, -120);

    // Hooded silhouette material (Deep midnight blue robe with subtle gold trim)
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Body cloak
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.7, 16), robeMat);
    body.position.y = 0.85;
    this.mysteriousPersonGroup.add(body);

    // Head / Hood
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), robeMat);
    hood.position.y = 1.85;
    this.mysteriousPersonGroup.add(hood);

    // Ethereal subtle golden halo aura
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.38, 24), haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 2.1;
    this.mysteriousPersonGroup.add(halo);

    this.mysteriousPersonGroup.visible = false;
    this.scene.add(this.mysteriousPersonGroup);
  }

  // --- 12. FIRST-PERSON FLASHLIGHT SYSTEM ---
  setupPlayerFlashlight() {
    try {
      this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera);
      if (this.firstPersonFlashlight) {
        const state = gameState ? gameState.getState() : {};
        // Inherit flashlight state from GameState if present
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
      }
    } catch (err) {
      console.warn('Flashlight initialization error in Level 3:', err);
    }
  }

  // --- 13. INPUT & EVENT LISTENERS ---
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
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
      case 'Space':
        if (this.player.isGrounded && this.player.canMove) {
          this.player.velocity.y = 5.0;
          this.player.isGrounded = false;
          soundManager.playJump();
        }
        break;
      case 'KeyE':
        this.triggerInteraction();
        break;
      case 'KeyF':
        if (this.firstPersonFlashlight) {
          const isOn = this.firstPersonFlashlight.toggle();
          if (gameState && typeof gameState.set === 'function') {
            gameState.set({ flashlightOn: isOn });
          }
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
    }
  }

  onMouseMove(e) {
    if (!this.isPointerLocked || !this.player.canMove) return;

    this.mouseDeltaX = e.movementX;
    this.mouseDeltaY = e.movementY;

    const sensitivity = 0.0022;
    this.player.yaw -= e.movementX * sensitivity;
    this.player.pitch -= e.movementY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.08;
    this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
  }

  onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = (this.canvas && this.canvas.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
    const height = (this.canvas && this.canvas.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    }
  }

  // --- 14. FIRST-PERSON OBJECT ATTRACTION & HOLD SYSTEM ---
  startAttractingObject(object) {
    if (this.isHoldingObject || this.attractingObject) return;

    this.attractingObject = object;
    this.attractionProgress = 0;
    this.originalScale.copy(object.scale);

    if (object.parent && object.parent !== this.scene) {
      this.scene.attach(object);
    }
    this.attractionStartPos.copy(object.position);
    this.attractionStartRot.copy(object.quaternion);

    const label = object.userData ? (object.userData.label || 'item') : 'item';
    gameState.setToast('Examining ' + label + '...');
  }

  updateObjectAttraction(delta) {
    if (!this.attractingObject) return;

    this.attractionProgress += delta * 3.8;
    const t = Math.min(1.0, this.attractionProgress);
    const easeT = t * t * (3 - 2 * t);

    const targetWorldPos = new THREE.Vector3();
    const targetWorldRot = new THREE.Quaternion();
    this.holdPoint.getWorldPosition(targetWorldPos);
    this.holdPoint.getWorldQuaternion(targetWorldRot);

    this.attractingObject.position.lerpVectors(this.attractionStartPos, targetWorldPos, easeT);
    this.attractingObject.quaternion.slerpQuaternions(this.attractionStartRot, targetWorldRot, easeT);

    if (t >= 1.0) {
      const preserveScale = this.originalScale.clone();
      this.holdPoint.attach(this.attractingObject);
      this.attractingObject.position.set(0, 0, 0);
      this.attractingObject.rotation.set(0, 0, 0);
      this.attractingObject.scale.copy(preserveScale);

      this.heldObject = this.attractingObject;
      this.isHoldingObject = true;
      this.attractingObject = null;
      this.attractionProgress = 0;

      const label = this.heldObject.userData ? (this.heldObject.userData.label || 'item') : 'item';
      gameState.setToast('Holding ' + label + '. Press [E] to release.');
    }
  }

  releaseHeldObject() {
    if (!this.heldObject && !this.attractingObject) return;

    const objToRelease = this.heldObject || this.attractingObject;
    const label = objToRelease.userData ? (objToRelease.userData.label || 'item') : 'item';

    this.heldObject = null;
    this.isHoldingObject = false;
    this.attractingObject = null;
    this.attractionProgress = 0;

    this.scene.attach(objToRelease);

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() > 0) camDir.normalize();

    const dropPos = new THREE.Vector3();
    dropPos.copy(this.player.position).addScaledVector(camDir, 1.2);
    dropPos.y = Math.max(0.18, this.player.position.y - 0.7);

    objToRelease.position.copy(dropPos);
    objToRelease.rotation.set(0, this.player.yaw, 0);
    objToRelease.scale.copy(this.originalScale);

    gameState.setToast('Placed down ' + label + '.');
  }

  triggerInteraction() {
    if (this.isHoldingObject || this.attractingObject) {
      if (this.hoveredItem && !this.hoveredItem.userData.isPickupable && this.hoveredItem.userData.action) {
        this.hoveredItem.userData.action();
        return;
      }
      this.releaseHeldObject();
      return;
    }

    if (this.hoveredItem && this.hoveredItem.userData) {
      if (this.hoveredItem.userData.isPickupable) {
        this.startAttractingObject(this.hoveredItem);
      }
      if (this.hoveredItem.userData.action) {
        this.hoveredItem.userData.action();
      }
    }
  }

  checkInteractables() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const maxDist = 5.0;
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    let found = null;

    for (let hit of hits) {
      if (hit.distance <= maxDist) {
        let curr = hit.object;

        let isHeld = false;
        let temp = curr;
        while (temp && temp !== this.scene) {
          if (temp === this.heldObject || temp === this.attractingObject) {
            isHeld = true;
            break;
          }
          temp = temp.parent;
        }
        if (isHeld) continue;

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
        if (item === this.heldObject || item === this.attractingObject) continue;
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

    if (found !== this.hoveredItem) {
      this.hoveredItem = found;
    }

    if (found) {
      const promptText =
        typeof found.userData.prompt === 'function'
          ? found.userData.prompt()
          : found.userData.prompt;
      gameState.setInteractionPrompt(promptText);
    } else if (this.isHoldingObject) {
      gameState.setInteractionPrompt('[E] DROP ITEM');
    } else {
      gameState.setInteractionPrompt(null);
    }
  }

  // --- 15. COLLISION & BOUNDARIES ---
  addBarrier(x, y, z, width, height, depth) {
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(width, height, depth)
    );
    this.colliders.push(box);
    return box;
  }

  // --- 16. PLAYER MOVEMENT & UPDATE ---
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
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) moveDir.normalize();

    this.player.isSprinting = this.keys.sprint && isMoving;
    const currentSpeed = this.player.isSprinting ? this.player.sprintSpeed : this.player.speed;

    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    moveDir.applyQuaternion(yawQuat);

    const targetVx = moveDir.x * currentSpeed;
    const targetVz = moveDir.z * currentSpeed;
    this.player.velocity.x = THREE.MathUtils.lerp(this.player.velocity.x, targetVx, delta * 10);
    this.player.velocity.z = THREE.MathUtils.lerp(this.player.velocity.z, targetVz, delta * 10);

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

    // Box Collision check
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
      // Slide X
      const testX = this.player.position.clone();
      testX.x = nextPos.x;
      if (!this.colliders.some((b) => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testX, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.x = nextPos.x;
      }
      // Slide Z
      const testZ = this.player.position.clone();
      testZ.z = nextPos.z;
      if (!this.colliders.some((b) => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testZ, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.z = nextPos.z;
      }
    }

    // Footstep audio & Head Bob
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

    // Handheld flashlight update
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

    // Check gameplay triggers (Chamber entrance, entity sightings, chase, sanctuary exit)
    this.checkGameplayTriggers();
  }

  // --- 17. CINEMATIC GAMEPLAY TRIGGERS ---
  checkGameplayTriggers() {
    const pZ = this.player.position.z;

    // 1. First Entity Silhouette Sighting in Grand Chamber (Z <= -20)
    if (!this.firstSightingTriggered && pZ <= -20) {
      this.firstSightingTriggered = true;
      this.triggerFirstEntitySighting();
    }

    // 2. Second Sighting watching from alcove (Z <= -34)
    if (!this.secondSightingTriggered && pZ <= -34) {
      this.secondSightingTriggered = true;
      this.triggerSecondEntitySighting();
    }

    // 3. Entity Chase Sequence Trigger (Z <= -62, entering corrupted descent)
    if (!this.chaseTriggered && pZ <= -62) {
      this.chaseTriggered = true;
      this.triggerChaseSequence();
    }

    // 4. Safe Sanctuary Exit Trigger (Z <= -107, crossing sacred golden archway)
    if (!this.safeExitReached && pZ <= -107) {
      this.safeExitReached = true;
      this.triggerSanctuaryEscape();
    }
  }

  triggerFirstEntitySighting() {
    if (!this.entityAI) return;

    // Entity appears in distance between pillars
    this.entityAI.reappear(new THREE.Vector3(0, 1.8, -48), 0.5);
    this.entityAI.setState(AI_STATES.WATCH);

    // Torches flicker intensely and extinguish momentarily
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      flickerCount++;
      this.cryptTorches.forEach((t) => {
        t.light.intensity = flickerCount % 2 === 0 ? 0.2 : t.baseIntensity * 1.5;
      });
      if (flickerCount > 6) {
        clearInterval(flickerInterval);
        this.cryptTorches.forEach((t) => { t.light.intensity = t.baseIntensity; });
      }
    }, 120);

    gameState.triggerEntityEncounterL3();

    // After 2.4 seconds, entity dissolves into shadow
    setTimeout(() => {
      if (this.entityAI) {
        this.entityAI.vanish(0.6);
      }
    }, 2400);
  }

  triggerSecondEntitySighting() {
    if (!this.entityAI) return;

    // Reappear perched near a broken pillar
    this.entityAI.reappear(new THREE.Vector3(-6.5, 1.8, -44), 0.5);
    this.entityAI.setState(AI_STATES.WATCH);
    soundManager.playEntityWhisper();

    setTimeout(() => {
      if (this.entityAI) {
        this.entityAI.setState(AI_STATES.FOLLOW);
        gameState.triggerEntityFollowL3();
      }
    }, 3000);
  }

  triggerChaseSequence() {
    if (!this.entityAI) return;

    // Entity spawns behind the player and begins active chase
    this.entityAI.reappear(new THREE.Vector3(0, 1.8, -54), 0.4);
    this.entityAI.setState(AI_STATES.CHASE);
    gameState.triggerChaseL3();
  }

  triggerSanctuaryEscape() {
    if (this.entityAI) {
      // Entity is repelled by sacred archway and dissolves back into dark
      this.entityAI.setState(AI_STATES.RETREAT);
      setTimeout(() => {
        if (this.entityAI) this.entityAI.vanish(0.8);
      }, 1000);
    }

    gameState.reachSafeExitL3();

    // Mysterious Hooded Person sequence
    if (this.mysteriousPersonGroup) {
      this.mysteriousPersonGroup.visible = true;
    }

    setTimeout(() => {
      gameState.setToast('"You shouldn\'t be here."');
    }, 1200);

    setTimeout(() => {
      gameState.setToast('"You are looking for your friend."');
    }, 4200);

    setTimeout(() => {
      // Figure dissolves into sanctuary mist
      if (this.mysteriousPersonGroup) {
        let fadeOut = 1.0;
        const fadeInterval = setInterval(() => {
          fadeOut -= 0.1;
          if (fadeOut <= 0) {
            clearInterval(fadeInterval);
            this.mysteriousPersonGroup.visible = false;
          }
        }, 80);
      }
    }, 7000);

    // Complete Level 3 transition
    setTimeout(() => {
      this.triggerLevel3Completion();
    }, 8500);
  }

  triggerLevel3Completion() {
    this.levelCompleted = true;
    gameState.completeLevel3();
  }

  // --- 18. ANIMATION LOOP ---
  animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateObjectAttraction(delta);
    this.checkInteractables();

    // Update Entity AI
    if (this.entityAI) {
      this.entityAI.update(delta);
    }

    // Physical Animation: Mechanism Lever Rotation
    if (this.mechanismActivated && this.leverArm && this.leverArm.rotation.z < Math.PI / 2) {
      this.leverArm.rotation.z += delta * 3.5;
    }

    // Physical Animation: Secret Inner Door Sliding Upward
    if (this.innerDoorOpening && this.innerDoorSlideProgress < 4.6) {
      const step = delta * 1.4;
      this.innerDoorSlideProgress += step;
      if (this.innerDoor) {
        this.innerDoor.position.y += step;
      }
    }

    // Torch light organic flickering
    const time = this.clock.getElapsedTime();
    this.cryptTorches.forEach((t, idx) => {
      t.light.intensity = t.baseIntensity + Math.sin(time * 8.0 + idx) * 0.25 + (Math.random() - 0.5) * 0.15;
    });
    this.corruptedTorches.forEach((t, idx) => {
      t.light.intensity = t.baseIntensity + Math.sin(time * 10.0 + idx) * 0.35 + (Math.random() - 0.5) * 0.2;
    });

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.isHoldingObject || this.heldObject || this.attractingObject) {
      this.releaseHeldObject();
    }
    if (this.holdPoint && this.camera) {
      this.camera.remove(this.holdPoint);
      this.holdPoint = null;
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
      this.entityAI.destroy();
      this.entityAI = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
