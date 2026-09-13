import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';

/**
 * Level2Scene: THE FORGOTTEN HALL
 *
 * Faithfully recreates the authentic temple interior hall shown in the user's reference photo:
 * - Grand colonnade with two rows of massive square white pillars with stepped bracket capitals
 * - Polished dark charcoal tiled floor with white diamond corner cabochons
 * - Far back wall featuring the multi-tiered red-and-white chevron arch leading into the inner sanctum
 * - Deep garbhagriha chamber with warm golden deity altar illumination
 * - Upper mezzanine gallery with white balustrade railings
 * - Saffron-orange triangular bunting flags (toran) draped in catenary swags across the ceiling
 * - Wooden side tables, benches, and open colonnade aisles
 *
 * Gameplay Flow:
 * 1. "FIND YOUR FRIEND" -> Explore the central hall
 * 2. Discover 3 clues:
 *    - Footprints on the polished floor
 *    - Friend's broken watch/compass on the side wooden table
 *    - Strange carved symbol on the pillar
 * 3. Objective updates to "FIND THE HIDDEN MECHANISM" / "ACTIVATE THE THREE MECHANISMS"
 * 4. Locate & activate 3 hidden mechanisms:
 *    - Statue pedestal mechanism
 *    - Inscribed pillar symbol mechanism
 *    - Temple bell / pillar mechanism
 * 5. Secret passage physically slides open with grinding stone audio and dust particles
 * 6. Suspense event: Silence falls, lights flicker, distant footsteps, and faint voice: "Help me..."
 * 7. Entering the secret passage triggers "YOU FOUND A HIDDEN PATH." -> "LEVEL 2 COMPLETE" -> "LEVEL 3 — THE HIDDEN PATH"
 */
export class Level2Scene {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Player Physics & State - Spawns inside the temple hall entrance looking forward
    this.player = {
      position: new THREE.Vector3(0, 1.75, 18), // Entrance of the hall
      velocity: new THREE.Vector3(),
      yaw: 0, // Facing negative Z (toward the sanctum arch)
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

    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.interactables = [];
    this.hoveredItem = null;

    // Colliders
    this.colliders = [];
    this.secretDoorCollider = null;

    // Level 2 Interactive Objects & Mechanisms
    this.clueObjects = {};
    this.mechanisms = {};
    this.secretDoor = null;
    this.secretDoorOpening = false;
    this.secretDoorSlideProgress = 0;
    this.dustParticles = null;
    this.hallLanterns = [];
    this.suspenseEventTriggered = false;
    this.levelCompleted = false;

    // First person object pickup & hold system
    this.heldObject = null;
    this.isHoldingObject = false;
    this.attractingObject = null;
    this.attractionProgress = 0;
    this.attractionStartPos = new THREE.Vector3();
    this.attractionStartRot = new THREE.Quaternion();
    this.originalScale = new THREE.Vector3(1, 1, 1);
    this.holdPoint = null;

    // First person flashlight
    this.firstPersonFlashlight = null;

    this.init();
  }

  init() {
    try {
      // 1. Scene & Natural Daytime Atmosphere
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xdce8f2); // Soft clear natural daylight sky visible through upper openings
      this.scene.fog = new THREE.Fog(0xe8edf5, 50, 140); // Clean daytime atmospheric depth, NOT dark night fog

      // 2. Camera
      const width = (this.canvas && this.canvas.clientWidth > 0) ? this.canvas.clientWidth : window.innerWidth;
      const height = (this.canvas && this.canvas.clientHeight > 0) ? this.canvas.clientHeight : window.innerHeight;
      const aspect = (width && height) ? (width / height) : (16 / 9);

      this.camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 250);
      this.camera.position.copy(this.player.position);
      this.scene.add(this.camera);

      // Dedicated first-person object hold point attached to camera (X=0, Y=-0.25, Z=-1.0)
      this.holdPoint = new THREE.Group();
      this.holdPoint.position.set(0, -0.25, -1.0);
      this.camera.add(this.holdPoint);

      // 3. Renderer with ACES Tone Mapping tuned for realistic daytime interior
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18; // Crisp, balanced daylight exposure (not washed out, not dark)

      // 4. Interior Temple Lighting (Warm, clear natural daylight matching reference image)
      this.setupLighting();

      // 5. Build Grand Temple Interior Architecture
      this.buildTempleInteriorHall();

      // 6. Setup Clues & Interactive Mechanisms
      this.setupClues();
      this.setupMechanisms();
      this.setupSecretPassage();

      // 7. Flashlight Tool - Crash-proof initialization (subtle in daytime)
      try {
        this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera);
        // Flashlight kept unequipped in daylight so player's sunlit temple view is unobstructed
      } catch (err) {
        console.warn('Flashlight initialization fallback:', err);
      }

      // 8. Event Listeners
      this.setupEventListeners();

      // 9. Sound Setup
      try {
        soundManager.setTempleInterior(true);
      } catch (err) {
        console.warn('Sound setup fallback:', err);
      }

      // 10. Initial GameState Configuration
      gameState.setObjective('FIND YOUR FRIEND');
      gameState.setToast('My friend came inside this temple...');

      // 11. Animation Loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    } catch (criticalErr) {
      console.error('Critical Level 2 initialization error:', criticalErr);
    }
  }

  // --- 1. NATURAL DAYTIME TEMPLE LIGHTING (Matching Real Reference Photo) ---
  setupLighting() {
    // Primary Natural Sunlight streaming through clerestory openings & entrance
    const sunLight = new THREE.DirectionalLight(0xfff8ed, 2.3);
    sunLight.position.set(16, 32, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 90;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.radius = 2.5; // Soft realistic shadows
    this.scene.add(sunLight);

    // Diffuse Cool Sky Fill Light entering from opposite upper openings
    const skyFill = new THREE.DirectionalLight(0xdfeefa, 1.05);
    skyFill.position.set(-16, 26, -8);
    this.scene.add(skyFill);

    // Natural Daytime Hemisphere Light (Sunlit ceiling/sky, warm stone/floor bounce)
    const hemiLight = new THREE.HemisphereLight(0xfffef9, 0xd0c4b2, 1.4);
    this.scene.add(hemiLight);

    // Indoor Ambient Fill (Warm/neutral, ensures full visibility in colonnade shadows)
    const ambLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    this.scene.add(ambLight);

    // Decorative Hanging Brass Ceiling Lanterns (Soft daytime warm glow matching reference photo)
    const lanternZ = [14, 6, -2, -10];
    lanternZ.forEach((lz) => {
      const lanternLight = new THREE.PointLight(0xffd580, 1.2, 14, 1.2);
      lanternLight.position.set(0, 6.2, lz);
      this.scene.add(lanternLight);
      this.hallLanterns.push(lanternLight);

      // Visual hanging brass lantern lamp
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8),
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.85,
          roughness: 0.25,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.35,
        })
      );
      lamp.position.set(0, 6.2, lz);
      this.scene.add(lamp);
    });

    // Radiant Golden Light from the Garbhagriha (Inner Sanctum Altar Plinth)
    const sanctumGlow = new THREE.PointLight(0xf59e0b, 4.0, 24, 1.0);
    sanctumGlow.position.set(0, 3.2, -22);
    sanctumGlow.castShadow = true;
    this.scene.add(sanctumGlow);
  }

  // --- 2. TEMPLE INTERIOR ARCHITECTURE (Matching Reference Image) ---
  buildTempleInteriorHall() {
    const floorTex = textureFactory.getTempleHallFloorTexture();
    const sanctumArchTex = textureFactory.getSanctumArchTexture();
    const pilasterTex = textureFactory.getPilasterPatternTexture();
    const whitePlasterTex = textureFactory.getTempleWhitePlasterTexture();
    const terracottaTex = textureFactory.getTempleTerracottaTexture();
    const toranTex = textureFactory.getToranFlagTexture();

    // 1. Polished Dark Charcoal / Slate Tile Floor with Diamond Insets
    floorTex.repeat.set(7, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.28, // Polished stone specular reflection
      metalness: 0.16,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 44), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. High Ceiling with Transverse Beams
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: whitePlasterTex,
      roughness: 0.82,
      color: 0xf3ede2,
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(28, 44), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 8.4, 0);
    this.scene.add(ceiling);

    // Transverse Ceiling Beams
    [-14, -6, 2, 10, 18].forEach((bz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(28, 0.8, 1.0), ceilingMat);
      beam.position.set(0, 8.0, bz);
      this.scene.add(beam);
    });

    // 3. Colonnade Rows of Massive Square White Pillars (Reference Photo)
    const pillarMat = new THREE.MeshStandardMaterial({
      map: whitePlasterTex,
      roughness: 0.65,
      color: 0xfbf9f4,
    });

    // Terracotta material for moldings, pillar neck trims, and sanctum details
    const terracottaMat = new THREE.MeshStandardMaterial({
      map: terracottaTex,
      roughness: 0.72,
      color: 0xc2410c,
    });

    const pillarZ = [12, 4, -4, -12];
    [-5.5, 5.5].forEach((px) => {
      pillarZ.forEach((pz) => {
        this.buildColonnadePillar(px, 0, pz, pillarMat, terracottaMat);
      });
    });

    // 4. Upper Mezzanine Gallery & White Balustrade Railing (Reference Photo)
    this.buildUpperMezzanine(whitePlasterTex, pillarMat);

    // 5. Saffron-Orange Bunting Flags (Toran) Draped Across the Hall (Reference Photo)
    this.buildFestiveBuntingToran(toranTex, pillarZ);

    // 6. Far End Sanctum Wall with Concentric Red Chevron Arches (Reference Photo)
    this.buildSanctumPortalWall(sanctumArchTex, pilasterTex, whitePlasterTex, terracottaMat);

    // 7. Side Aisles, Outer Balustrades, and Wooden Benches (Reference Photo)
    this.buildSideAislesAndFurniture(whitePlasterTex);

    // 8. Outer Hall Boundary Walls (Enclosing the interior)
    const wallMat = new THREE.MeshStandardMaterial({
      map: whitePlasterTex,
      roughness: 0.75,
      color: 0xfbf9f4,
    });

    // Left outer wall - rear segment (z = -6 to +22)
    const wallLeftRear = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 28), wallMat);
    wallLeftRear.position.set(-13.5, 4.25, 8.0);
    this.scene.add(wallLeftRear);
    this.addBarrier(-13.5, 4.2, 8.0, 1.0, 8.5, 28);

    // Left outer wall - front segment (z = -10 to -22)
    const wallLeftFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 12), wallMat);
    wallLeftFront.position.set(-13.5, 4.25, -16.0);
    this.scene.add(wallLeftFront);
    this.addBarrier(-13.5, 4.2, -16.0, 1.0, 8.5, 12);

    // Door lintel beam above secret door opening (z = -10 to -6, height 4.25m to 8.5m)
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.3, 4.0), wallMat);
    doorLintel.position.set(-13.5, 6.35, -8.0);
    this.scene.add(doorLintel);

    // Right outer wall (full 44m length)
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 44), wallMat);
    wallRight.position.set(13.5, 4.25, 0);
    this.scene.add(wallRight);
    this.addBarrier(13.5, 4.2, 0, 1.0, 8.5, 44);

    // Rear outer wall (behind spawn at entrance)
    const wallRear = new THREE.Mesh(new THREE.BoxGeometry(28, 8.5, 0.8), wallMat);
    wallRear.position.set(0, 4.25, 21.5);
    this.scene.add(wallRear);
    this.addBarrier(0, 4.2, 21.5, 28, 8.5, 1.0);

    // Closed Double Entrance Temple Doors on Rear Wall
    const doorTex = (typeof textureFactory.getTempleGateTexture === 'function')
      ? textureFactory.getTempleGateTexture()
      : (typeof textureFactory.getOrnateTempleGateTexture === 'function'
          ? textureFactory.getOrnateTempleGateTexture()
          : textureFactory.getTempleDoorTexture());
    const gateMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.6, metalness: 0.25 });
    const rearDoor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 6.2, 0.2), gateMat);
    rearDoor.position.set(0, 3.1, 21.0);
    this.scene.add(rearDoor);

    // High Clerestory Windows with natural daylight along upper side walls (above mezzanine)
    const windowZ = [14, 6, -2, -10];
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xeef5fc }); // Soft clear outdoor sky
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    [-13.4, 13.4].forEach((wx) => {
      windowZ.forEach((wz) => {
        const winPane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), windowMat);
        winPane.position.set(wx, 6.8, wz);
        winPane.rotation.y = wx > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(winPane);

        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 2.6), frameMat);
        winFrame.position.set(wx > 0 ? wx - 0.04 : wx + 0.04, 6.8, wz);
        this.scene.add(winFrame);
      });
    });
  }

  // --- 3. SQUARE COLONNADE PILLARS (Matching Photo) ---
  buildColonnadePillar(x, y, z, whiteMat, terracottaMat) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(x, y, z);

    // Stepped Pedestal Base (Reference Photo)
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 1.9), whiteMat);
    base1.position.y = 0.225;
    base1.receiveShadow = true;
    pillarGroup.add(base1);

    const base2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), whiteMat);
    base2.position.y = 0.65;
    pillarGroup.add(base2);

    // Main Pillar Shaft (Square classical column with recessed panel profile)
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.3, 5.4, 1.3), whiteMat);
    shaft.position.y = 3.55;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // Stepped Capital with Cantilever Corbels/Brackets (Reference Photo)
    const neckTrim = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.18, 1.45), terracottaMat);
    neckTrim.position.y = 6.35;
    pillarGroup.add(neckTrim);

    const capital = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 1.85), whiteMat);
    capital.position.y = 6.7;
    pillarGroup.add(capital);

    // Outward corbel brackets supporting upper floor
    const bracketX = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 1.5), whiteMat);
    bracketX.position.y = 7.15;
    pillarGroup.add(bracketX);

    this.scene.add(pillarGroup);

    // Solid collision barrier for each pillar
    this.addBarrier(x, 3.5, z, 1.6, 7.2, 1.6);
  }

  // --- 4. UPPER MEZZANINE BALCONY (Reference Photo) ---
  buildUpperMezzanine(whitePlasterTex, pillarMat) {
    const mezMat = new THREE.MeshStandardMaterial({
      map: whitePlasterTex,
      roughness: 0.7,
      color: 0xfdfbf7,
    });

    // Left Gallery Floor (y = 5.6)
    const floorL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 42), mezMat);
    floorL.position.set(-9.2, 5.6, 0);
    this.scene.add(floorL);

    // Right Gallery Floor (y = 5.6)
    const floorR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 42), mezMat);
    floorR.position.set(9.2, 5.6, 0);
    this.scene.add(floorR);

    // Front/Nave Balustrade Railings (Matching the white pierced balustrade in photo)
    [-5.8, 5.8].forEach((rx) => {
      const railMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.95, 42), mezMat);
      railMesh.position.set(rx, 6.25, 0);
      railMesh.castShadow = true;
      this.scene.add(railMesh);
    });
  }

  // --- 5. FESTIVE SAFFRON BUNTING FLAGS (Toran) (Reference Photo) ---
  buildFestiveBuntingToran(toranTex, pillarZ) {
    const toranMat = new THREE.MeshStandardMaterial({
      map: toranTex,
      transparent: true,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });

    // 1. Cross swags across the central Nave between left and right pillar rows
    pillarZ.forEach((pz) => {
      const crossBanner = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 1.1), toranMat);
      crossBanner.position.set(0, 6.2, pz);
      this.scene.add(crossBanner);
    });

    // 2. Longitudinal catenary swags along left and right colonnades
    [-5.5, 5.5].forEach((px) => {
      for (let i = 0; i < pillarZ.length - 1; i++) {
        const pz1 = pillarZ[i];
        const pz2 = pillarZ[i + 1];
        const midZ = (pz1 + pz2) / 2;
        const len = Math.abs(pz1 - pz2);

        const longBanner = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.9), toranMat);
        longBanner.rotation.y = Math.PI / 2;
        longBanner.position.set(px, 6.3, midZ);
        this.scene.add(longBanner);
      }
    });
  }

  // --- 6. SANCTUM PORTAL WALL (Matching Reference Photo) ---
  buildSanctumPortalWall(sanctumArchTex, pilasterTex, whitePlasterTex, terracottaMat) {
    const wallZ = -18.0;
    const sanctumGroup = new THREE.Group();
    sanctumGroup.position.set(0, 0, wallZ);

    const whiteMat = new THREE.MeshStandardMaterial({ map: whitePlasterTex, roughness: 0.72 });
    const archMat = new THREE.MeshStandardMaterial({ map: sanctumArchTex, roughness: 0.65 });
    const pilasterMat = new THREE.MeshStandardMaterial({ map: pilasterTex, roughness: 0.62 });

    // Main Portal Wall Spanning the Nave
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.5, 1.6), whiteMat);
    wallLeft.position.set(-8.5, 4.25, 0);
    sanctumGroup.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.5, 1.6), whiteMat);
    wallRight.position.set(8.5, 4.25, 0);
    sanctumGroup.add(wallRight);

    const wallTop = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.2, 1.6), whiteMat);
    wallTop.position.set(0, 7.4, 0);
    sanctumGroup.add(wallTop);

    // Decorative Flanking Pilasters with Red Diamond Lozenges (Reference Photo)
    [-3.8, 3.8].forEach((px) => {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.0, 0.4), pilasterMat);
      pilaster.position.set(px, 3.5, 0.9);
      sanctumGroup.add(pilaster);
    });

    // Grand Multi-Tiered Concentric Archway with Red Chevron Stripes (Reference Photo)
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.8, 0.8), archMat);
    archHeader.position.set(0, 5.0, 0.7);
    sanctumGroup.add(archHeader);

    // Inner Sanctum (Garbhagriha) Chamber behind the portal
    const garbhFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(7.0, 9.0),
      new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.8 })
    );
    garbhFloor.rotation.x = -Math.PI / 2;
    garbhFloor.position.set(0, 0.05, -4.5);
    sanctumGroup.add(garbhFloor);

    // Sacred Deity Marble Altar
    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35, metalness: 0.4 })
    );
    altar.position.set(0, 0.7, -6.5);
    sanctumGroup.add(altar);

    // Glowing Temple Diya Lamps on Altar
    [-1.2, 0, 1.2].forEach((dx) => {
      const diya = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.08, 0.1, 8),
        terracottaMat
      );
      diya.position.set(dx, 1.45, -6.5);
      sanctumGroup.add(diya);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.14, 6),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      flame.position.set(dx, 1.55, -6.5);
      sanctumGroup.add(flame);
    });

    this.scene.add(sanctumGroup);

    // Sanctum wall colliders
    this.addBarrier(-8.5, 4.25, wallZ, 9.0, 8.5, 1.8);
    this.addBarrier(8.5, 4.25, wallZ, 9.0, 8.5, 1.8);
    this.addBarrier(0, 1.0, wallZ - 6.5, 3.8, 2.0, 2.4); // Altar barrier
  }

  // --- 7. SIDE AISLES & WOODEN TABLES (Reference Photo) ---
  buildSideAislesAndFurniture(whitePlasterTex) {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.78,
    });

    // Brown Wooden Table on the Left (Directly visible in the left foreground of reference photo!)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-8.8, 0, 4.0);

    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), woodMat);
    tabletop.position.y = 0.95;
    tabletop.castShadow = true;
    tableGroup.add(tabletop);

    // 4 Table Legs
    [ [-1.0, -0.45], [1.0, -0.45], [-1.0, 0.45], [1.0, 0.45] ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.12), woodMat);
      leg.position.set(lx, 0.475, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    this.scene.add(tableGroup);
    this.addBarrier(-8.8, 0.6, 4.0, 2.6, 1.2, 1.4);
    this.tableGroup = tableGroup;

    // Wooden Bench on the Right
    const benchGroup = new THREE.Group();
    benchGroup.position.set(8.8, 0, 4.0);
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.8), woodMat);
    benchTop.position.y = 0.55;
    benchGroup.add(benchTop);
    [ [-1.0, -0.3], [1.0, -0.3], [-1.0, 0.3], [1.0, 0.3] ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), woodMat);
      leg.position.set(lx, 0.275, lz);
      benchGroup.add(leg);
    });
    this.scene.add(benchGroup);
    this.addBarrier(8.8, 0.4, 4.0, 2.6, 0.8, 1.0);

    // Sacred Antique Brass Kalash (Temple Urn) on Right Bench - Pickupable
    const kalashGroup = new THREE.Group();
    kalashGroup.position.set(8.8, 0.65, 4.0);

    const kalashBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    kalashBase.position.y = 0.04;
    kalashGroup.add(kalashBase);

    const kalashBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    kalashBody.position.y = 0.20;
    kalashGroup.add(kalashBody);

    const kalashNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.14, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    kalashNeck.position.y = 0.32;
    kalashGroup.add(kalashNeck);

    const kalashRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.02, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    kalashRim.rotation.x = Math.PI / 2;
    kalashRim.position.y = 0.38;
    kalashGroup.add(kalashRim);

    kalashGroup.userData = {
      id: 'sacredKalash',
      label: 'Sacred Temple Kalash',
      isPickupable: true,
      prompt: () => (this.heldObject === kalashGroup ? '[E] DROP KALASH' : '[E] PICK UP KALASH'),
      action: () => {
        soundManager.playClueChime();
        gameState.setToast('An antique consecrated brass kalash.');
      },
    };
    this.scene.add(kalashGroup);
    this.interactables.push(kalashGroup);
  }

  // --- 8. THE THREE CLUES (Footprints, Personal Item, Wall Symbol) ---
  setupClues() {
    // --- CLUE 1: Footprints on the Temple Floor ---
    const footprintTex = textureFactory.getFootprintTexture();
    const footprintMat = new THREE.MeshStandardMaterial({
      map: footprintTex,
      transparent: true,
      roughness: 0.9,
    });
    const footprintMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), footprintMat);
    footprintMesh.rotation.x = -Math.PI / 2;
    footprintMesh.position.set(-1.8, 0.03, 8.0);
    this.scene.add(footprintMesh);

    // Interactive Proxy for Footprints (Transparent raycastable material)
    const footprintProxy = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.8, 2.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    footprintProxy.position.set(-1.8, 0.3, 8.0);
    footprintProxy.userData = {
      id: 'clueFootprints',
      label: 'Footprints',
      prompt: '[E] INVESTIGATE FOOTPRINTS',
      action: () => {
        soundManager.playClueChime();
        gameState.discoverClue('footprints');
      },
    };
    this.scene.add(footprintProxy);
    this.interactables.push(footprintProxy);

    // --- CLUE 2: Broken Personal Item (Friend's Watch/Compass on Left Wooden Table) ---
    const watchGroup = new THREE.Group();
    watchGroup.position.set(-8.8, 1.05, 4.0);

    const watchBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.25 })
    );
    watchGroup.add(watchBody);

    const watchGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.045, 16),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    watchGroup.add(watchGlass);

    const watchStrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    watchGroup.add(watchStrap);

    // Golden subtle glow
    const watchGlow = new THREE.PointLight(0xfde047, 1.4, 2.5);
    watchGlow.position.y = 0.2;
    watchGroup.add(watchGlow);

    watchGroup.userData = {
      id: 'clueFriendItem',
      label: "Friend's Broken Watch",
      isPickupable: true,
      prompt: () => (this.heldObject === watchGroup ? '[E] DROP WATCH' : '[E] PICK UP WATCH'),
      action: () => {
        soundManager.playClueChime();
        gameState.discoverClue('friendItem');
      },
    };
    this.scene.add(watchGroup);
    this.interactables.push(watchGroup);

    // --- CLUE 3: Strange Wall Marking (Inscribed on Back Pillar) ---
    const wallMarkingTex = textureFactory.getWallMarkingTexture();
    const markMat = new THREE.MeshBasicMaterial({
      map: wallMarkingTex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const markMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), markMat);
    markMesh.position.set(5.5, 2.4, -11.34); // On the inner face of the right pillar
    this.scene.add(markMesh);

    const markProxy = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.0, 1.5),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    markProxy.position.set(5.5, 2.4, -11.34);
    markProxy.userData = {
      id: 'clueWallMarking',
      label: 'Strange Wall Symbol',
      prompt: '[E] EXAMINE SYMBOL',
      action: () => {
        soundManager.playClueChime();
        gameState.discoverClue('wallSymbol');
      },
    };
    this.scene.add(markProxy);
    this.interactables.push(markProxy);
  }

  // --- 9. THE THREE HIDDEN MECHANISMS ---
  setupMechanisms() {
    // --- MECHANISM 1: Statue / Carved Structure on Pedestal ---
    const statueGroup = new THREE.Group();
    statueGroup.position.set(-5.5, 0, -4.0);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.75, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 })
    );
    pedestal.position.y = 0.6;
    statueGroup.add(pedestal);

    const brassStatue = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 })
    );
    brassStatue.position.y = 1.75;
    statueGroup.add(brassStatue);

    statueGroup.userData = {
      id: 'mechanism1',
      label: 'Sacred Statue Mechanism',
      prompt: () => (gameState.state.mechanism1Activated ? 'ACTIVATED' : '[E] ACTIVATE'),
      action: () => {
        if (gameState.state.mechanism1Activated) return;
        soundManager.playMechanismClick();
        statueGroup.rotation.y += Math.PI / 4; // Rotates
        gameState.activateMechanism(1);
        this.checkAllMechanisms();
      },
    };
    this.scene.add(statueGroup);
    this.interactables.push(statueGroup);
    this.mechanisms[1] = statueGroup;

    // --- MECHANISM 2: Hidden Wall/Pillar Symbol Mechanism ---
    const wallPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.3 })
    );
    wallPlate.position.set(13.0, 2.2, 4.0); // Mounted on right wall
    wallPlate.userData = {
      id: 'mechanism2',
      label: 'Hidden Stone Plate Mechanism',
      prompt: () => (gameState.state.mechanism2Activated ? 'ACTIVATED' : '[E] ACTIVATE'),
      action: () => {
        if (gameState.state.mechanism2Activated) return;
        soundManager.playMechanismClick();
        wallPlate.position.x += 0.08; // Presses into the wall
        gameState.activateMechanism(2);
        this.checkAllMechanisms();
      },
    };
    this.scene.add(wallPlate);
    this.interactables.push(wallPlate);
    this.mechanisms[2] = wallPlate;

    // --- MECHANISM 3: Temple Bell / Pull Lever Mechanism ---
    const bellGroup = new THREE.Group();
    bellGroup.position.set(-5.5, 4.8, 12.0);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.9 })
    );
    chain.position.y = -1.1;
    bellGroup.add(chain);

    const bell = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.48, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.2 })
    );
    bell.position.y = -0.3;
    bellGroup.add(bell);

    const leverProxy = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 3.2, 2.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    leverProxy.position.set(-5.5, 3.2, 12.0);
    leverProxy.userData = {
      id: 'mechanism3',
      label: 'Sacred Bell Mechanism',
      prompt: () => (gameState.state.mechanism3Activated ? 'ACTIVATED' : '[E] ACTIVATE'),
      action: () => {
        if (gameState.state.mechanism3Activated) return;
        soundManager.playTempleBell();
        soundManager.playMechanismClick();
        bellGroup.rotation.z = 0.2; // Swings
        setTimeout(() => { bellGroup.rotation.z = 0; }, 400);
        gameState.activateMechanism(3);
        this.checkAllMechanisms();
      },
    };
    this.scene.add(bellGroup);
    this.scene.add(leverProxy);
    this.interactables.push(leverProxy);
    this.mechanisms[3] = bellGroup;
  }

  // --- 10. SECRET PASSAGE & HIDDEN DOOR ---
  setupSecretPassage() {
    // Secret Door: Located on the left side wall of the hall at x = -13.0, z = -8.0
    const doorTex = textureFactory.getSecretDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.8,
    });

    this.secretDoor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 3.4), doorMat);
    this.secretDoor.position.set(-13.0, 2.1, -8.0);
    this.secretDoor.castShadow = true;
    this.scene.add(this.secretDoor);

    // Initial physical collision barrier blocking passage
    this.secretDoorCollider = this.addBarrier(-13.0, 2.1, -8.0, 1.2, 4.2, 3.5);

    // Secret Corridor Chamber Behind the Door
    const corridorGroup = new THREE.Group();
    corridorGroup.position.set(-17.0, 0, -8.0);

    const corridorFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8.0, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
    );
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.y = 0.05;
    corridorGroup.add(corridorFloor);

    // Ancient descending stone steps
    for (let st = 0; st < 6; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
      );
      step.position.set(2.0 - st * 1.0, -st * 0.25, 0);
      corridorGroup.add(step);
    }

    // Mystical deep green/amber torch light down in the secret passage
    const passageGlow = new THREE.PointLight(0xf59e0b, 2.8, 12, 1.5);
    passageGlow.position.set(-3.5, 1.8, 0);
    corridorGroup.add(passageGlow);

    this.scene.add(corridorGroup);

    // Dust particles emitter for door opening
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = -13.0 + (Math.random() - 0.5) * 1.5;
      dustPos[i + 1] = Math.random() * 3.5;
      dustPos[i + 2] = -8.0 + (Math.random() - 0.5) * 3.0;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dustParticles = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xd4bda5,
        size: 0.18,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    this.scene.add(this.dustParticles);
  }

  checkAllMechanisms() {
    const { mechanism1Activated, mechanism2Activated, mechanism3Activated } = gameState.state;
    if (mechanism1Activated && mechanism2Activated && mechanism3Activated) {
      this.triggerSecretDoorOpening();
    }
  }

  // --- 11. SECRET DOOR SLIDING & SUSPENSE SEQUENCE ---
  triggerSecretDoorOpening() {
    if (this.secretDoorOpening) return;
    this.secretDoorOpening = true;

    // Remove the collision barrier so the player can walk through!
    if (this.secretDoorCollider) {
      const idx = this.colliders.indexOf(this.secretDoorCollider);
      if (idx !== -1) this.colliders.splice(idx, 1);
      this.secretDoorCollider = null;
    }

    // Play stone door sliding audio
    soundManager.playStoneDoorSlide();
    this.shakeIntensity = 0.05;

    // Trigger Suspense Event after door opening finishes
    setTimeout(() => {
      this.triggerSuspenseEvent();
    }, 2800);
  }

  triggerSuspenseEvent() {
    if (this.suspenseEventTriggered) return;
    this.suspenseEventTriggered = true;

    // 1. Sudden silence falls over the temple for 2.5 seconds
    soundManager.silenceForHorror(3.5);

    // 2. Subtle light flicker in the lanterns
    let flickerCount = 0;
    const flickerInterval = setInterval(() => {
      flickerCount++;
      this.hallLanterns.forEach((l) => {
        l.intensity = flickerCount % 2 === 0 ? 0.8 : 2.8;
      });
      if (flickerCount > 6) {
        clearInterval(flickerInterval);
        this.hallLanterns.forEach((l) => { l.intensity = 2.6; });
      }
    }, 140);

    // 3. Distant footsteps echo down the passage
    setTimeout(() => {
      soundManager.playDistantFootsteps();
    }, 1200);

    // 4. Faint voice calls from the secret passage: "Help me..."
    setTimeout(() => {
      soundManager.playFaintVoiceHelp();
      gameState.setToast('"...Help me..."');
    }, 2400);

    // 5. Narration text: "That was my friend's voice."
    setTimeout(() => {
      gameState.setToast("That was my friend's voice.");
      gameState.setObjective('FIND YOUR FRIEND');
    }, 4500);
  }

  // --- 12. LEVEL 2 COMPLETION TRIGGER (Passing into Secret Passage) ---
  checkSecretPassageEntrance() {
    if (this.levelCompleted || !gameState.state.secretPassageOpened) return;

    const pX = this.player.position.x;
    const pZ = this.player.position.z;

    // Crossing into the secret passage (door is at x = -13.0, z = -8.0)
    if (pX <= -12.4 && Math.abs(pZ - (-8.0)) < 2.5) {
      this.triggerLevel2Completion();
    }
  }

  triggerLevel2Completion() {
    this.levelCompleted = true;
    soundManager.playTempleBell();

    gameState.enterSecretPassage();

    // Sequential narrative stingers:
    // 1. "YOU FOUND A HIDDEN PATH."
    setTimeout(() => {
      gameState.setCinematicText('YOU FOUND A HIDDEN PATH.');
    }, 800);

    // 2. "THE SEARCH CONTINUES..."
    setTimeout(() => {
      gameState.setCinematicText('THE SEARCH CONTINUES...');
    }, 3000);

    // 3. "LEVEL 2 COMPLETE"
    setTimeout(() => {
      gameState.setCinematicText('LEVEL 2 COMPLETE — THE SECRET DOOR IS OPEN');
    }, 5200);

    // 4. "LEVEL 3 — THE HIDDEN PATH"
    setTimeout(() => {
      gameState.setCinematicText('LEVEL 3 — THE HIDDEN PATH');
    }, 7600);
  }

  // --- 13. COLLISION & BOUNDARIES ---
  addBarrier(x, y, z, width, height, depth) {
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(width, height, depth)
    );
    this.colliders.push(box);
    return box;
  }

  // --- 14. INPUT & EVENT LISTENERS ---
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
    const width = this.canvas.clientWidth || window.innerWidth || 1280;
    const height = this.canvas.clientHeight || window.innerHeight || 720;
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

    // If attached to a sub-group, attach to scene so position/quaternion are in world coordinates
    if (object.parent && object.parent !== this.scene) {
      this.scene.attach(object);
    }
    this.attractionStartPos.copy(object.position);
    this.attractionStartRot.copy(object.quaternion);

    const label = object.userData ? (object.userData.label || 'item') : 'item';
    gameState.setToast('Picking up ' + label + '...');
  }

  updateObjectAttraction(delta) {
    if (!this.attractingObject) return;

    this.attractionProgress += delta * 3.8; // ~0.26s smooth attraction
    const t = Math.min(1.0, this.attractionProgress);
    const easeT = t * t * (3 - 2 * t); // smoothstep curve

    const targetWorldPos = new THREE.Vector3();
    const targetWorldRot = new THREE.Quaternion();
    this.holdPoint.getWorldPosition(targetWorldPos);
    this.holdPoint.getWorldQuaternion(targetWorldRot);

    this.attractingObject.position.lerpVectors(this.attractionStartPos, targetWorldPos, easeT);
    this.attractingObject.quaternion.slerpQuaternions(this.attractionStartRot, targetWorldRot, easeT);

    if (t >= 1.0) {
      // Re-parent cleanly to dedicated camera holdPoint (0, -0.25, -1.0)
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

    // Attach back to scene
    this.scene.attach(objToRelease);

    // Compute natural drop position in front of player
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
    // 1. If currently holding an object or attracting one:
    if (this.isHoldingObject || this.attractingObject) {
      // If looking directly at a stationary mechanism (e.g. wall lever, wheel, keypad):
      if (this.hoveredItem && !this.hoveredItem.userData.isPickupable && this.hoveredItem.userData.action) {
        this.hoveredItem.userData.action();
        return;
      }
      // Otherwise release the held object
      this.releaseHeldObject();
      return;
    }

    // 2. Not holding an object:
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

        // Skip the currently held or attracting object so it never blocks crosshairs
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

    // Proximity fallback: If ray misses slightly, check if player is close (< 4.2m) and facing the item
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

  // --- 15. PLAYER MOVEMENT & COLLISION LOOP ---
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

    // Footsteps & Head Bob
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

    // Update handheld flashlight
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

    // Check entrance into secret passage
    this.checkSecretPassageEntrance();
  }

  // --- 16. ANIMATION LOOP ---
  animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayer(delta);
    this.updateObjectAttraction(delta);
    this.checkInteractables();

    // Secret Door Physical Slide Animation
    if (this.secretDoorOpening && this.secretDoorSlideProgress < 3.2) {
      const step = delta * 1.1;
      this.secretDoorSlideProgress += step;
      if (this.secretDoor) {
        this.secretDoor.position.x -= step; // Slides into wall recess
      }

      // Emitting dust particles
      if (this.dustParticles) {
        this.dustParticles.material.opacity = Math.min(0.65, (3.2 - this.secretDoorSlideProgress) * 0.4);
      }
    }

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

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
