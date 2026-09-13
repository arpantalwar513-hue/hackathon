import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { TempleKeyItem } from './items/TempleKey.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';

/**
 * Level1Scene: THE TEMPLE KEY
 *
 * Faithfully recreates the authentic Shri Maa Sheetla Devi Mandir entrance from Reference Image 1:
 * - White limestone facade with carved terracotta/saffron decorative relief moldings
 * - Multi-foil scalloped entrance archway with fluted Indian temple columns
 * - Glowing banner with authentic Devanagari inscription: "श्री माँ शीतलायै नमः"
 * - Two sculpted white marble elephant statues on plinths flanking the entrance steps
 * - Three soaring Nagara Shikharas (spires) with golden Kalash finials illuminated against the night sky
 * - Left courtyard featuring the sacred banyan tree with raised whitewashed planter bench
 * - Roadside prasad stall ("प्रसाद की सरकारी दुकान") with the antique golden skeleton key (Reference Image 2)
 * - Closed double-leaf ornate brass-studded temple gate with locked/unlock mechanic
 * - Pure atmospheric exploration: NO AI, NO monsters, NO jumpscares, NO combat
 */
export class Level1Scene {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Player Physics & State - Spawns directly in front of the glowing temple at night
    this.player = {
      position: new THREE.Vector3(0, 1.75, 20), // 20m outside temple facing main gate
      velocity: new THREE.Vector3(),
      yaw: 0, // Faces negative Z (directly toward the temple entrance)
      pitch: -0.05,
      speed: 6.2,
      sprintSpeed: 9.8,
      isSprinting: false,
      isGrounded: true,
      headBobTimer: 0,
      canMove: true,
    };

    // Camera Shake
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

    // Progression State
    this.doorsOpening = false;
    this.doorAngle = 0;
    this.levelCompleted = false;
    this.isDayMode = false; // Level 1 is set at NIGHT by default

    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.interactables = [];
    this.hoveredItem = null;

    // Colliders (Bounding boxes for walls, statues, boundaries)
    this.colliders = [];
    this.doorCollider = null;

    // Dynamic Lighting & Environmental Elements
    this.animatedLights = [];
    this.lanternLights = [];
    this.dustParticles = null;
    this.moonLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.moonMesh = null;
    this.haloMesh = null;
    this.sunMesh = null;
    this.coronaMesh = null;

    // Doors & Padlock
    this.leftDoorPivot = null;
    this.rightDoorPivot = null;
    this.padlockMesh = null;
    this.gateInteractable = null;

    // Interactive 3D Item: Golden Skeleton Key
    this.templeKeyItem = null;
    this.firstPersonFlashlight = null;

    this.init();
  }

  init() {
    // 1. Scene Setup & Night Skybox
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a14); // Deep midnight blue
    this.scene.fog = new THREE.FogExp2(0x070c18, 0.012); // Subtle nocturnal atmospheric haze

    // 2. Camera
    const width = this.canvas.clientWidth || window.innerWidth || 1280;
    const height = this.canvas.clientHeight || window.innerHeight || 720;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 400);
    this.camera.position.copy(this.player.position);
    this.scene.add(this.camera);

    // 3. Renderer with ACES Tone Mapping for rich golden light bloom
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 4. Night Lighting Setup
    this.setupLighting();

    // 5. Environmental Sky & Night Motes
    this.buildSkyAndAtmosphere();

    // 6. Authentic Temple Complex (Courtyard, Facade, Shikharas, Elephants, Tree, Stall)
    this.buildTempleComplex();

    // 7. Interactive Temple Key on Prasad Counter
    this.setupTempleKeyItem();

    // 8. First Person Handheld Flashlight (Auxiliary light)
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.camera);

    // 9. Input & Event Listeners
    this.setupEventListeners();

    // 10. Initial GameState Configuration
    gameState.setObjective('FIND THE TEMPLE KEY');
    gameState.setToast('Explore the illuminated courtyard to find the golden temple key.');

    // 11. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // --- 1. LIGHTING SETUP (Warm Golden Temple Night) ---
  setupLighting() {
    // Nocturnal Hemisphere Light (Cool moonlight from above, warm earth bounce)
    this.hemiLight = new THREE.HemisphereLight(0x4a658a, 0x1c1712, 0.45);
    this.scene.add(this.hemiLight);

    // Gentle night ambient light
    this.ambientLight = new THREE.AmbientLight(0x0d1527, 0.55);
    this.scene.add(this.ambientLight);

    // Directional Moonlight casting delicate blue-silver shadows
    this.moonLight = new THREE.DirectionalLight(0x7695c5, 1.1);
    this.moonLight.position.set(35, 75, 45);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 220;
    this.moonLight.shadow.camera.left = -50;
    this.moonLight.shadow.camera.right = 50;
    this.moonLight.shadow.camera.top = 50;
    this.moonLight.shadow.camera.bottom = -50;
    this.moonLight.shadow.bias = -0.0004;
    this.scene.add(this.moonLight);

    // Distant Full Moon Disc in the night sky
    const moonGeo = new THREE.SphereGeometry(4.2, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8f0fe });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(110, 190, 140);
    this.scene.add(this.moonMesh);

    // Soft celestial moon halo
    const haloGeo = new THREE.PlaneGeometry(42, 42);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x82a9db,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.position.copy(this.moonMesh.position);
    this.haloMesh.lookAt(0, 0, 0);
    this.scene.add(this.haloMesh);

    // Hidden Sun objects ready for Day Mode toggle
    const sunGeo = new THREE.SphereGeometry(6.5, 24, 24);
    this.sunMesh = new THREE.Mesh(sunGeo, new THREE.MeshBasicMaterial({ color: 0xfffae6 }));
    this.sunMesh.position.set(130, 240, 170);
    this.sunMesh.visible = false;
    this.scene.add(this.sunMesh);

    this.coronaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(55, 55),
      new THREE.MeshBasicMaterial({
        color: 0xffea9f,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    this.coronaMesh.position.copy(this.sunMesh.position);
    this.coronaMesh.lookAt(0, 0, 0);
    this.coronaMesh.visible = false;
    this.scene.add(this.coronaMesh);
  }

  setDayMode(isDay) {
    this.isDayMode = isDay;
    if (isDay) {
      this.scene.background = new THREE.Color(0x82b8ef);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0xa8cbf3);
        this.scene.fog.density = 0.0035;
      }
      if (this.moonLight) {
        this.moonLight.color.setHex(0xfff7e2);
        this.moonLight.intensity = 2.4;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xfffaed);
        this.ambientLight.intensity = 0.7;
      }
      if (this.hemiLight) this.hemiLight.intensity = 1.2;
      if (this.moonMesh) this.moonMesh.visible = false;
      if (this.haloMesh) this.haloMesh.visible = false;
      if (this.sunMesh) this.sunMesh.visible = true;
      if (this.coronaMesh) this.coronaMesh.visible = true;
      if (this.renderer) this.renderer.toneMappingExposure = 1.15;
    } else {
      this.scene.background = new THREE.Color(0x060a14);
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(0x070c18);
        this.scene.fog.density = 0.012;
      }
      if (this.moonLight) {
        this.moonLight.color.setHex(0x7695c5);
        this.moonLight.intensity = 1.1;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x0d1527);
        this.ambientLight.intensity = 0.55;
      }
      if (this.hemiLight) this.hemiLight.intensity = 0.45;
      if (this.moonMesh) this.moonMesh.visible = true;
      if (this.haloMesh) this.haloMesh.visible = true;
      if (this.sunMesh) this.sunMesh.visible = false;
      if (this.coronaMesh) this.coronaMesh.visible = false;
      if (this.renderer) this.renderer.toneMappingExposure = 1.25;
    }
  }

  toggleDayNight() {
    this.setDayMode(!this.isDayMode);
    gameState.setToast(this.isDayMode ? 'DAY MODE ACTIVE ☀️' : 'NIGHT MODE ACTIVE 🌙');
    gameState.set({ isNightMode: !this.isDayMode });
  }

  buildSkyAndAtmosphere() {
    // Delicate floating night embers / temple incense motes
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = Math.random() * 12 + 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 50 + 8;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfed7aa,
      size: 0.14,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.dustParticles);
  }

  // --- 2. THE REAL TEMPLE ARCHITECTURE & COURTYARD (Image 1) ---
  buildTempleComplex() {
    const whitePlasterTex = textureFactory.getTempleWhitePlasterTexture();
    const terracottaTex = textureFactory.getTempleTerracottaTexture();
    const sheetlaSignTex = textureFactory.getSheetlaTempleSignTexture();
    const mandalaTex = textureFactory.getMandalaReliefTexture();
    const flagstoneTex = textureFactory.getCourtyardFlagstoneTexture();
    const gateTex = textureFactory.getOrnateTempleGateTexture();

    const whiteMat = new THREE.MeshStandardMaterial({
      map: whitePlasterTex,
      roughness: 0.72,
      metalness: 0.08,
    });

    const terracottaMat = new THREE.MeshStandardMaterial({
      map: terracottaTex,
      roughness: 0.65,
      metalness: 0.12,
    });

    const goldKalashMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.95,
      roughness: 0.18,
      emissive: 0x78350f,
      emissiveIntensity: 0.45,
    });

    const whiteMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.38,
      metalness: 0.1,
    });

    // 1. Broad Courtyard Floor (Paved stone courtyard)
    flagstoneTex.repeat.set(10, 10);
    const courtyardMat = new THREE.MeshStandardMaterial({
      map: flagstoneTex,
      roughness: 0.82,
      metalness: 0.12,
    });
    const courtyardFloor = new THREE.Mesh(new THREE.PlaneGeometry(54, 46), courtyardMat);
    courtyardFloor.rotation.x = -Math.PI / 2;
    courtyardFloor.position.set(0, 0.02, 13);
    courtyardFloor.receiveShadow = true;
    this.scene.add(courtyardFloor);

    // Courtyard Perimeter Low Walls
    this.buildCourtyardWalls(whiteMat, terracottaMat);

    // 2. Multi-tier Broad Entrance Steps Leading up to Portal
    const stepsGroup = new THREE.Group();
    for (let s = 0; s < 4; s++) {
      const stepW = 28 - s * 1.4;
      const stepH = 0.25;
      const stepD = 1.4;
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), whiteMat);
      step.position.set(0, s * stepH + stepH / 2, 4.5 - s * stepD);
      step.receiveShadow = true;
      stepsGroup.add(step);

      // Clay Diyas lighting the steps
      [-8, -4, 4, 8].forEach((dx) => {
        const diya = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.06, 0.07, 8),
          new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 })
        );
        diya.position.set(dx, s * stepH + stepH + 0.035, 4.5 - s * stepD);
        stepsGroup.add(diya);

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.035, 0.1, 6),
          new THREE.MeshBasicMaterial({ color: 0xf59e0b })
        );
        flame.position.set(dx, s * stepH + stepH + 0.1, 4.5 - s * stepD);
        stepsGroup.add(flame);
      });
    }
    this.scene.add(stepsGroup);

    // 3. Two White Marble Sculpted Elephants on Plinths (Reference Image 1)
    this.buildElephantStatue(-4.4, 1.0, 3.8, whiteMarbleMat, terracottaMat, 1);
    this.buildElephantStatue(4.4, 1.0, 3.8, whiteMarbleMat, terracottaMat, -1);

    // 4. Grand Entrance Facade (White Wall with Saffron Trims)
    const facadeGroup = new THREE.Group();

    // Central Wall Structure (z = 0)
    const mainFacade = new THREE.Mesh(new THREE.BoxGeometry(32, 14, 2.4), whiteMat);
    mainFacade.position.set(0, 8.0, 0);
    mainFacade.castShadow = true;
    mainFacade.receiveShadow = true;
    facadeGroup.add(mainFacade);

    // Terracotta molding friezes running horizontally across facade
    const friezeGeo = new THREE.BoxGeometry(32.4, 0.5, 2.6);
    [2.2, 7.8, 12.6, 14.8].forEach((fy) => {
      const frieze = new THREE.Mesh(friezeGeo, terracottaMat);
      frieze.position.set(0, fy, 0);
      facadeGroup.add(frieze);
    });

    // 5. Central Portal Opening & Multi-Foil Scalloped Arch
    // Left & Right Portal Jamb Piers
    const jambGeo = new THREE.BoxGeometry(2.2, 7.5, 2.8);
    const leftJamb = new THREE.Mesh(jambGeo, whiteMat);
    leftJamb.position.set(-3.1, 4.75, 0.1);
    facadeGroup.add(leftJamb);

    const rightJamb = new THREE.Mesh(jambGeo, whiteMat);
    rightJamb.position.set(3.1, 4.75, 0.1);
    facadeGroup.add(rightJamb);

    // 4 Fluted Ring Columns in front of the portal
    [-3.6, -2.1, 2.1, 3.6].forEach((colX) => {
      const colGroup = this.createFlutedColumn(colX, 1.0, 1.6, 7.0, whiteMat, terracottaMat);
      facadeGroup.add(colGroup);
    });

    // Multi-Foil Scalloped Cusped Arch Header (Terracotta / Saffron)
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.0, 1.2), terracottaMat);
    archHeader.position.set(0, 7.2, 0.8);
    facadeGroup.add(archHeader);

    // Hanging Brass Temple Bells from Arch
    [-1.8, 1.8].forEach((bx) => {
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9 })
      );
      chain.position.set(bx, 6.2, 0.8);
      facadeGroup.add(chain);

      const bell = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.38, 10),
        goldKalashMat
      );
      bell.position.set(bx, 5.4, 0.8);
      facadeGroup.add(bell);
    });

    // 6. Authentic Devanagari Temple Signboard: "श्री माँ शीतलायै नमः"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 2.3, 0.5),
      new THREE.MeshStandardMaterial({
        map: sheetlaSignTex,
        roughness: 0.35,
        metalness: 0.2,
        emissive: 0x7c2d12,
        emissiveIntensity: 0.45,
      })
    );
    signBoard.position.set(0, 9.8, 1.4);
    facadeGroup.add(signBoard);

    // Dedicated Signboard Uplights
    const signLightL = new THREE.PointLight(0xffedd5, 2.2, 8);
    signLightL.position.set(-3.5, 8.4, 2.2);
    facadeGroup.add(signLightL);

    const signLightR = new THREE.PointLight(0xffedd5, 2.2, 8);
    signLightR.position.set(3.5, 8.4, 2.2);
    facadeGroup.add(signLightR);

    // 7. Symmetrical Wings: Jharokha Balconies & Mandala Reliefs
    [-11.0, 11.0].forEach((wingX) => {
      // Jharokha Projecting Oriel Balcony
      const jharokha = this.createJharokhaBalcony(wingX, 5.8, 1.2, whiteMat, terracottaMat);
      facadeGroup.add(jharokha);

      // 24-Ray Sun Mandala Relief Medallion
      const mandalaMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.25, 32),
        new THREE.MeshStandardMaterial({
          map: mandalaTex,
          roughness: 0.55,
          emissive: 0x9a3412,
          emissiveIntensity: 0.35,
        })
      );
      mandalaMesh.rotation.x = Math.PI / 2;
      mandalaMesh.position.set(wingX, 11.2, 1.35);
      facadeGroup.add(mandalaMesh);
    });

    // 8. Three Soaring Nagara Shikharas (Spires) with Golden Kalash (Image 1)
    // Central Main Shikhara (Rises 26m high)
    const centerShikhara = this.createNagaraShikhara(0, 14.5, -2.5, 8.5, 14.0, whiteMat, terracottaMat, goldKalashMat);
    facadeGroup.add(centerShikhara);

    // Left Subsidiary Shikhara (Rises 19m high)
    const leftShikhara = this.createNagaraShikhara(-11.0, 14.5, -2.5, 6.0, 10.0, whiteMat, terracottaMat, goldKalashMat);
    facadeGroup.add(leftShikhara);

    // Right Subsidiary Shikhara (Rises 19m high)
    const rightShikhara = this.createNagaraShikhara(11.0, 14.5, -2.5, 6.0, 10.0, whiteMat, terracottaMat, goldKalashMat);
    facadeGroup.add(rightShikhara);

    // Spire Uplights (Golden glow illuminating spires against the dark night sky)
    const spireGlowCenter = new THREE.SpotLight(0xffbe5c, 4.2, 42, Math.PI / 4, 0.5, 1.2);
    spireGlowCenter.position.set(0, 14.0, 5.0);
    spireGlowCenter.target = centerShikhara;
    facadeGroup.add(spireGlowCenter);

    const spireGlowL = new THREE.SpotLight(0xffbe5c, 3.2, 34, Math.PI / 4, 0.5, 1.2);
    spireGlowL.position.set(-11.0, 14.0, 5.0);
    spireGlowL.target = leftShikhara;
    facadeGroup.add(spireGlowL);

    const spireGlowR = new THREE.SpotLight(0xffbe5c, 3.2, 34, Math.PI / 4, 0.5, 1.2);
    spireGlowR.position.set(11.0, 14.0, 5.0);
    spireGlowR.target = rightShikhara;
    facadeGroup.add(spireGlowR);

    // 9. Closed Double-Leaf Temple Gate & Padlock
    this.buildTempleGate(facadeGroup, gateTex, goldKalashMat);

    // 10. Temple Interior Foyer & Altar Gateway (Visible when doors swing open)
    this.buildInnerSanctumVestibule(facadeGroup, whiteMat, terracottaMat);

    this.scene.add(facadeGroup);

    // Facade Collision Barriers
    this.addBarrier(-10.0, 7.0, 0, 12.0, 14.0, 3.0);
    this.addBarrier(10.0, 7.0, 0, 12.0, 14.0, 3.0);

    // 11. Left Courtyard: Sacred Banyan Tree & Raised White Planter Bench (Image 1)
    this.buildSacredBanyanTree(-13.0, 0, 13.5, whiteMat, terracottaMat);

    // 12. Left Courtyard: Prasad Stall ("प्रसाद की सरकारी दुकान") (Image 1)
    this.buildPrasadShop(-14.0, 0, 6.5, whiteMat, terracottaMat);

    // 13. Courtyard Lampposts (Warm amber lighting)
    this.buildCourtyardLampposts();
  }

  // --- 3. WHITE MARBLE ELEPHANT STATUES (Reference Image 1) ---
  buildElephantStatue(x, y, z, marbleMat, terracottaMat, facingDir = 1) {
    const elephantGroup = new THREE.Group();
    elephantGroup.position.set(x, y, z);

    // Raised White Plinth
    const plinthGeo = new THREE.BoxGeometry(1.9, 0.75, 2.8);
    const plinth = new THREE.Mesh(plinthGeo, marbleMat);
    plinth.position.y = -0.375;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    elephantGroup.add(plinth);

    // Terracotta Base Molding Ring
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.12, 2.95), terracottaMat);
    trim.position.y = -0.06;
    elephantGroup.add(trim);

    // Elephant Body (Torso)
    const bodyGeo = new THREE.CylinderGeometry(0.68, 0.76, 1.6, 12);
    const body = new THREE.Mesh(bodyGeo, marbleMat);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.85, 0);
    body.castShadow = true;
    elephantGroup.add(body);

    // 4 Sturdy Columnar Legs
    [ [-0.45, -0.55], [0.45, -0.55], [-0.45, 0.55], [0.45, 0.55] ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.85, 10), marbleMat);
      leg.position.set(lx, 0.42, lz);
      leg.castShadow = true;
      elephantGroup.add(leg);
    });

    // Elephant Head & Forehead Dome
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 14), marbleMat);
    head.position.set(0, 1.25, 0.85);
    head.castShadow = true;
    elephantGroup.add(head);

    // Large Flared Ears
    [-0.52, 0.52].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 10), marbleMat);
      ear.rotation.z = Math.PI / 2;
      ear.rotation.y = ex > 0 ? 0.35 : -0.35;
      ear.position.set(ex, 1.22, 0.7);
      elephantGroup.add(ear);
    });

    // Raised Salutation Trunk (Pranama posture curved upwards)
    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.5, 8), marbleMat);
    trunkBase.position.set(0, 0.95, 1.25);
    trunkBase.rotation.x = -0.4;
    elephantGroup.add(trunkBase);

    const trunkTip = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.45, 8), marbleMat);
    trunkTip.position.set(0, 1.25, 1.35);
    trunkTip.rotation.x = 0.8;
    elephantGroup.add(trunkTip);

    // Two White Tusks
    [-0.22, 0.22].forEach((tx) => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 8), marbleMat);
      tusk.position.set(tx, 0.95, 1.2);
      tusk.rotation.x = Math.PI / 2 + 0.2;
      elephantGroup.add(tusk);
    });

    // Ceremonial Saffron/Terracotta Saddle Caparison (Jhul) draped over torso
    const jhul = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.45, 1.1), terracottaMat);
    jhul.position.set(0, 1.15, 0);
    elephantGroup.add(jhul);

    // Slight inward welcoming orientation
    elephantGroup.rotation.y = facingDir * 0.12;

    this.scene.add(elephantGroup);

    // Collider so player walks around the statues
    this.addBarrier(x, y + 0.5, z, 2.0, 2.2, 3.0);
  }

  // --- 4. FLUTED COLUMNS (Traditional Indian Pillars) ---
  createFlutedColumn(x, y, z, height, whiteMat, terracottaMat) {
    const colGroup = new THREE.Group();
    colGroup.position.set(x, y, z);

    // Square Base Pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), terracottaMat);
    base.position.y = 0.35;
    colGroup.add(base);

    // Turned Ring Molding
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 10, 20), terracottaMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.75;
    colGroup.add(ring1);

    // Fluted Column Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, height - 1.8, 16), whiteMat);
    shaft.position.y = height / 2;
    shaft.castShadow = true;
    colGroup.add(shaft);

    // Capital & Carved Bracket
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.85), terracottaMat);
    capital.position.y = height - 0.4;
    colGroup.add(capital);

    return colGroup;
  }

  // --- 5. JHAROKHA BALCONY (Rajasthani/North Indian Oriel Window) ---
  createJharokhaBalcony(x, y, z, whiteMat, terracottaMat) {
    const jharokhaGroup = new THREE.Group();
    jharokhaGroup.position.set(x, y, z);

    // Cantilever bracket base
    const baseBracket = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.2), terracottaMat);
    baseBracket.position.y = 0;
    jharokhaGroup.add(baseBracket);

    // Balcony Parapet Railing
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, 1.1), whiteMat);
    parapet.position.y = 0.85;
    jharokhaGroup.add(parapet);

    // Miniature Fluted Pillars
    [-0.9, 0.9].forEach((px) => {
      const miniPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), terracottaMat);
      miniPillar.position.set(px, 2.2, 0.4);
      jharokhaGroup.add(miniPillar);
    });

    // Curved Chhajja Canopy Roof
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 4), terracottaMat);
    canopy.rotation.y = Math.PI / 4;
    canopy.position.y = 3.6;
    jharokhaGroup.add(canopy);

    return jharokhaGroup;
  }

  // --- 6. NAGARA SHIKHARA (Tiered Spire with Amalaka and Kalash) ---
  createNagaraShikhara(x, y, z, baseSize, height, whiteMat, terracottaMat, goldMat) {
    const spireGroup = new THREE.Group();
    spireGroup.position.set(x, y, z);

    // Stepped Bhumi Tiers tapering towards peak
    const numTiers = 7;
    for (let t = 0; t < numTiers; t++) {
      const tierFraction = t / numTiers;
      const tierW = baseSize * (1 - tierFraction * 0.72);
      const tierH = height / numTiers;
      const tierMesh = new THREE.Mesh(
        new THREE.BoxGeometry(tierW, tierH, tierW),
        t % 2 === 0 ? whiteMat : terracottaMat
      );
      tierMesh.position.y = t * tierH + tierH / 2;
      tierMesh.castShadow = true;
      spireGroup.add(tierMesh);
    }

    // Ribbed Circular Stone Disc: AMALAKA
    const amalaka = new THREE.Mesh(
      new THREE.CylinderGeometry(baseSize * 0.26, baseSize * 0.29, 0.6, 24),
      terracottaMat
    );
    amalaka.position.y = height + 0.3;
    amalaka.castShadow = true;
    spireGroup.add(amalaka);

    // Gleaming Golden Brass KALASH with Finial Flag
    const kalashPot = new THREE.Mesh(
      new THREE.SphereGeometry(baseSize * 0.16, 16, 16),
      goldMat
    );
    kalashPot.position.y = height + 1.1;
    kalashPot.castShadow = true;
    spireGroup.add(kalashPot);

    const kalashSpire = new THREE.Mesh(
      new THREE.ConeGeometry(baseSize * 0.07, 1.1, 10),
      goldMat
    );
    kalashSpire.position.y = height + 1.9;
    spireGroup.add(kalashSpire);

    return spireGroup;
  }

  // --- 7. ORNATE DOUBLE-LEAF TEMPLE GATE (Locked / Unlockable) ---
  buildTempleGate(facadeGroup, gateTex, goldMat) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0.75, 0.05);

    const doorMat = new THREE.MeshStandardMaterial({
      map: gateTex,
      roughness: 0.62,
      metalness: 0.28,
    });

    // Left Door Leaf (Hinged at x = -2.0)
    this.leftDoorPivot = new THREE.Group();
    this.leftDoorPivot.position.set(-2.0, 3.2, 0);

    const leftLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 6.4, 0.22), doorMat);
    leftLeaf.position.set(1.0, 0, 0);
    leftLeaf.castShadow = true;
    this.leftDoorPivot.add(leftLeaf);
    doorGroup.add(this.leftDoorPivot);

    // Right Door Leaf (Hinged at x = 2.0)
    this.rightDoorPivot = new THREE.Group();
    this.rightDoorPivot.position.set(2.0, 3.2, 0);

    const rightLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 6.4, 0.22), doorMat);
    rightLeaf.position.set(-1.0, 0, 0);
    rightLeaf.castShadow = true;
    this.rightDoorPivot.add(rightLeaf);
    doorGroup.add(this.rightDoorPivot);

    // Antique Brass Padlock in the Center (Visible when locked)
    this.padlockMesh = new THREE.Group();
    this.padlockMesh.position.set(0, 3.2, 0.18);

    const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.26), goldMat);
    this.padlockMesh.add(lockBody);

    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 10, 20), goldMat);
    shackle.position.y = 0.32;
    this.padlockMesh.add(shackle);

    doorGroup.add(this.padlockMesh);
    facadeGroup.add(doorGroup);

    // Gate Interaction Trigger Box (Transparent raycastable material)
    this.gateInteractable = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 6.5, 4.0),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    this.gateInteractable.position.set(0, 3.5, 1.5);
    this.gateInteractable.userData = {
      id: 'templeGate',
      label: 'Temple Gate',
      prompt: () => (gameState.state.hasTempleKey ? '[E] UNLOCK TEMPLE' : '[E] LOCKED'),
      action: () => this.interactWithTempleGate(),
    };
    this.scene.add(this.gateInteractable);
    this.interactables.push(this.gateInteractable);

    // Physical Collider Barrier (prevents walking through while closed)
    this.doorCollider = this.addBarrier(0, 3.2, 0, 4.4, 6.8, 1.0);
  }

  // --- 8. INNER SANCTUM VESTIBULE (Foyer visible through open gate) ---
  buildInnerSanctumVestibule(facadeGroup, whiteMat, terracottaMat) {
    const vestGroup = new THREE.Group();
    vestGroup.position.set(0, 0, -6.5);

    // Foyer Floor with Red Ceremonial Velvet Runner
    const vestFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(8.0, 13.0),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 })
    );
    vestFloor.rotation.x = -Math.PI / 2;
    vestFloor.position.y = 0.75;
    vestGroup.add(vestFloor);

    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 13.0),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.76, 0);
    vestGroup.add(carpet);

    // Foyer Walls
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 13.0), whiteMat);
    wallL.position.set(-4.0, 4.25, 0);
    vestGroup.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 13.0), whiteMat);
    wallR.position.set(4.0, 4.25, 0);
    vestGroup.add(wallR);

    // Inner Glowing Sanctum Altar in Distance
    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35, metalness: 0.5 })
    );
    altar.position.set(0, 1.65, -5.2);
    vestGroup.add(altar);

    // Golden Sanctuary Point Light
    const sanctumLight = new THREE.PointLight(0xf59e0b, 3.8, 16, 1.2);
    sanctumLight.position.set(0, 4.5, -4.5);
    vestGroup.add(sanctumLight);

    facadeGroup.add(vestGroup);

    // Vestibule Side Barriers
    this.addBarrier(-4.2, 4.0, -6.5, 0.8, 7.5, 13.0);
    this.addBarrier(4.2, 4.0, -6.5, 0.8, 7.5, 13.0);
  }

  // --- 9. SACRED BANYAN TREE WITH WHITE PLANTER BENCH (Image 1) ---
  buildSacredBanyanTree(x, y, z, whiteMat, terracottaMat) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Circular Raised Whitewashed Stone Planter Bench (Chabutra)
    const benchGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.8, 16);
    const bench = new THREE.Mesh(benchGeo, whiteMat);
    bench.position.y = 0.4;
    bench.receiveShadow = true;
    bench.castShadow = true;
    treeGroup.add(bench);

    // Terracotta Rim on Top of Bench
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.09, 8, 24), terracottaMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.82;
    treeGroup.add(rim);

    // Earth Soil inside planter
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.95 })
    );
    soil.position.y = 0.78;
    treeGroup.add(soil);

    // Sculpted Gnarled Banyan Trunk
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.25, 4.8, 10), woodMat);
    trunk.position.y = 3.0;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Aerial Prop Roots cascading down to planter
    for (let r = 0; r < 5; r++) {
      const angle = (r / 5) * Math.PI * 2;
      const rx = Math.cos(angle) * 1.6;
      const rz = Math.sin(angle) * 1.6;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 4.0, 8), woodMat);
      root.position.set(rx, 2.7, rz);
      root.rotation.z = Math.cos(angle) * 0.15;
      root.rotation.x = Math.sin(angle) * 0.15;
      treeGroup.add(root);
    }

    // Spreading Leafy Green Canopy
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.85 });
    const canopyCenters = [
      [0, 6.2, 0, 3.8],
      [-2.0, 5.8, 1.2, 2.6],
      [2.2, 6.0, -1.0, 2.8],
      [-0.8, 6.5, -2.2, 2.7],
      [1.4, 6.2, 1.8, 2.5],
    ];
    canopyCenters.forEach(([cx, cy, cz, cradius]) => {
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(cradius, 1), leafMat);
      foliage.position.set(cx, cy, cz);
      foliage.castShadow = true;
      treeGroup.add(foliage);
    });

    // Sacred Devotional Earthen Diyas around the tree bench
    for (let d = 0; d < 6; d++) {
      const da = (d / 6) * Math.PI * 2;
      const dx = Math.cos(da) * 3.4;
      const dz = Math.sin(da) * 3.4;

      const diya = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.05, 0.06, 8),
        new THREE.MeshStandardMaterial({ color: 0x9a3412 })
      );
      diya.position.set(dx, 0.85, dz);
      treeGroup.add(diya);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.09, 6),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      flame.position.set(dx, 0.92, dz);
      treeGroup.add(flame);
    }

    // Warm Tree Glow
    const treeLight = new THREE.PointLight(0xffedd5, 1.8, 10);
    treeLight.position.set(0, 2.5, 0);
    treeGroup.add(treeLight);

    this.scene.add(treeGroup);

    // Collider for tree and planter
    this.addBarrier(x, y + 1.2, z, 7.2, 2.4, 7.2);
  }

  // --- 10. PRASAD STALL ("प्रसाद की सरकारी दुकान") (Image 1) ---
  buildPrasadShop(x, y, z, whiteMat, terracottaMat) {
    const shopGroup = new THREE.Group();
    shopGroup.position.set(x, y, z);

    // Kiosk Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.2, 2.8), whiteMat);
    body.position.set(0, 1.6, 0);
    body.castShadow = true;
    shopGroup.add(body);

    // Overhanging Roof Trim
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 3.2), terracottaMat);
    roof.position.set(0, 3.35, 0);
    shopGroup.add(roof);

    // Front Signboard: "प्रसाद की सरकारी दुकान" (Reference Image 1)
    const prasadSignTex = textureFactory.getPrasadShopSignTexture();
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.0, 0.15),
      new THREE.MeshStandardMaterial({
        map: prasadSignTex,
        roughness: 0.4,
      })
    );
    sign.position.set(0, 2.5, 1.48);
    shopGroup.add(sign);

    // Wooden Counter Table in front of the kiosk (where Key sits!)
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.78 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.0), counterMat);
    counter.position.set(0, 0.45, 1.6);
    counter.castShadow = true;
    shopGroup.add(counter);

    // Prasad Offerings on Counter (Puja Thali, Coconuts, Sweets)
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    [-1.0, 1.0].forEach((tx) => {
      const thali = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16), brassMat);
      thali.position.set(tx, 0.92, 1.6);
      shopGroup.add(thali);

      const coconut = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x3f1d0b, roughness: 0.9 })
      );
      coconut.position.set(tx, 1.02, 1.6);
      shopGroup.add(coconut);
    });

    // Dedicated Counter Lantern Light illuminating the Prasad Counter
    const shopLantern = new THREE.PointLight(0xfde047, 3.2, 10, 1.2);
    shopLantern.position.set(0, 2.2, 1.6);
    shopLantern.castShadow = true;
    shopGroup.add(shopLantern);

    this.scene.add(shopGroup);

    // Stall Collider: Blocks kiosk structure behind the counter without obstructing access to counter front
    this.addBarrier(x, y + 1.6, z - 0.2, 4.4, 3.4, 2.2);
  }

  // --- 11. COURTYARD BOUNDARY WALLS & LAMPPOSTS ---
  buildCourtyardWalls(whiteMat, terracottaMat) {
    // Left boundary wall
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 44), whiteMat);
    wallL.position.set(-25, 1.1, 13);
    this.scene.add(wallL);
    this.addBarrier(-25, 1.1, 13, 1.0, 3.0, 44);

    // Right boundary wall
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 44), whiteMat);
    wallR.position.set(25, 1.1, 13);
    this.scene.add(wallR);
    this.addBarrier(25, 1.1, 13, 1.0, 3.0, 44);

    // Rear boundary wall (behind player spawn)
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(50, 2.2, 0.6), whiteMat);
    wallBack.position.set(0, 1.1, 33);
    this.scene.add(wallBack);
    this.addBarrier(0, 1.1, 33, 50, 3.0, 1.0);
  }

  buildCourtyardLampposts() {
    const lampPositions = [
      [-10, 22],
      [10, 22],
      [-18, 9],
      [18, 9],
    ];

    lampPositions.forEach(([lx, lz]) => {
      const postGroup = new THREE.Group();
      postGroup.position.set(lx, 0, lz);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      pole.position.y = 2.1;
      pole.castShadow = true;
      postGroup.add(pole);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      globe.position.y = 4.2;
      postGroup.add(globe);

      const pLight = new THREE.PointLight(0xffe29a, 2.2, 14, 1.4);
      pLight.position.set(0, 4.0, 0);
      postGroup.add(pLight);

      this.scene.add(postGroup);
      this.addBarrier(lx, 2.0, lz, 0.5, 4.2, 0.5);
    });
  }

  // --- 12. SETUP TEMPLE KEY ON PRASAD COUNTER (Reference Image 2) ---
  setupTempleKeyItem() {
    // Key rests right in the center of the prasad counter table at x = -14.0, y = 1.02, z = 8.1
    this.templeKeyItem = new TempleKeyItem(-14.0, 1.02, 8.1);
    this.templeKeyItem.mesh.userData.action = () => {
      this.pickupTempleKey();
    };
    this.scene.add(this.templeKeyItem.mesh);
    this.interactables.push(this.templeKeyItem.mesh);
  }

  pickupTempleKey() {
    if (gameState.state.hasTempleKey) return;
    this.templeKeyItem.hide();

    const idx = this.interactables.indexOf(this.templeKeyItem.mesh);
    if (idx !== -1) this.interactables.splice(idx, 1);

    soundManager.playKeyPickup();
    gameState.acquireKey();

    if (this.hoveredItem === this.templeKeyItem.mesh) {
      this.hoveredItem = null;
      gameState.setInteractionPrompt(null);
    }
  }

  // --- 13. GATE UNLOCKING & PHYSICAL OPENING ---
  interactWithTempleGate() {
    if (this.doorsOpening || gameState.state.templeGateUnlocked) return;

    if (!gameState.state.hasTempleKey) {
      // Locked rattle sound
      soundManager.playDoorLocked();
      gameState.setToast('THE TEMPLE GATE IS LOCKED. FIND THE TEMPLE KEY IN THE COURTYARD.');
      this.shakeIntensity = 0.035;
      return;
    }

    // Has Key -> Unlock & Open!
    this.doorsOpening = true;
    soundManager.playDoorUnlock();
    this.shakeIntensity = 0.05;

    setTimeout(() => {
      soundManager.playDoorOpen();
      soundManager.playTempleBell();
      gameState.unlockTempleGate();

      // Remove collider so player can walk right in!
      if (this.doorCollider) {
        const cIdx = this.colliders.indexOf(this.doorCollider);
        if (cIdx !== -1) this.colliders.splice(cIdx, 1);
        this.doorCollider = null;
      }

      // Hide padlock
      if (this.padlockMesh) this.padlockMesh.visible = false;
    }, 450);
  }

  // --- 14. INPUT HANDLING & EVENT LISTENERS ---
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
      case 'KeyN':
      case 'KeyT':
        this.toggleDayNight();
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

  triggerInteraction() {
    if (this.hoveredItem && this.hoveredItem.userData && this.hoveredItem.userData.action) {
      this.hoveredItem.userData.action();
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
        const itemPos = new THREE.Vector3();
        item.getWorldPosition(itemPos);
        const dist = pPos.distanceTo(itemPos);
        if (dist <= closestDist) {
          const dirToItem = itemPos.clone().sub(this.camera.position).normalize();
          const dot = camDir.dot(dirToItem);
          if (dot > 0.4) {
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
    } else {
      gameState.setInteractionPrompt(null);
    }
  }

  // --- 15. PLAYER PHYSICS & BOUNDARY UPDATE ---
  updatePlayer(delta) {
    // Camera Look Rotation
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.player.pitch;
    euler.y = this.player.yaw;
    this.camera.quaternion.setFromEuler(euler);

    // Distance to temple entrance portal (at z = 0)
    const distToTemple = Math.max(0, this.player.position.z);
    gameState.setDistanceToTemple(distToTemple);

    if (!this.player.canMove) {
      this.camera.position.copy(this.player.position);
      return;
    }

    // Input Direction
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

    // Velocity Interpolation
    const targetVx = moveDir.x * currentSpeed;
    const targetVz = moveDir.z * currentSpeed;
    this.player.velocity.x = THREE.MathUtils.lerp(this.player.velocity.x, targetVx, delta * 10);
    this.player.velocity.z = THREE.MathUtils.lerp(this.player.velocity.z, targetVz, delta * 10);

    // Gravity
    this.player.velocity.y -= 15.0 * delta;

    // Proposed next position
    const nextPos = this.player.position.clone();
    nextPos.x += this.player.velocity.x * delta;
    nextPos.z += this.player.velocity.z * delta;
    nextPos.y += this.player.velocity.y * delta;

    // Elevation (Temple steps rise from z = 5.0 to z = 0.5)
    let groundElevation = 1.75;
    if (nextPos.z < 5.0 && nextPos.z >= 0.5 && Math.abs(nextPos.x) < 14) {
      const stepT = (5.0 - nextPos.z) / 4.5;
      groundElevation = 1.75 + stepT * 0.75;
    } else if (nextPos.z < 0.5) {
      groundElevation = 2.5;
    }

    if (nextPos.y <= groundElevation) {
      nextPos.y = groundElevation;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    }

    // Collision Detection against colliders
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
      // Slide along X
      const testX = this.player.position.clone();
      testX.x = nextPos.x;
      if (!this.colliders.some((b) => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testX, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.x = nextPos.x;
      }
      // Slide along Z
      const testZ = this.player.position.clone();
      testZ.z = nextPos.z;
      if (!this.colliders.some((b) => b.intersectsBox(new THREE.Box3().setFromCenterAndSize(testZ, new THREE.Vector3(0.8, 1.8, 0.8))))) {
        this.player.position.z = nextPos.z;
      }
    }

    // Footsteps & Camera Bob
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

    // First person flashlight model update
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

    // Check Threshold Triggers
    this.checkGameTriggers();
  }

  // --- 16. LEVEL 1 COMPLETION THRESHOLD TRIGGER ---
  checkGameTriggers() {
    const pZ = this.player.position.z;
    const pX = this.player.position.x;

    // Crossing the entrance threshold into the opened sacred gate (z <= 0.2)
    if (
      !this.levelCompleted &&
      gameState.state.templeGateUnlocked &&
      pZ <= 0.2 &&
      Math.abs(pX) < 2.8
    ) {
      this.triggerLevel1Completion();
    }
  }

  triggerLevel1Completion() {
    this.levelCompleted = true;
    soundManager.setTempleInterior(true);
    soundManager.playTempleBell();

    gameState.enterTemple();

    setTimeout(() => {
      gameState.setCinematicText('THE TEMPLE REMEMBERS...');
    }, 800);

    setTimeout(() => {
      gameState.setCinematicText('LEVEL 1 COMPLETE — THE SACRED TEMPLE IS UNLOCKED');
    }, 2800);

    setTimeout(() => {
      gameState.setCinematicText('THE REAL JOURNEY BEGINS...');
    }, 5000);
  }

  addBarrier(x, y, z, width, height, depth) {
    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(width, height, depth)
    );
    this.colliders.push(box);
    return box;
  }

  // --- 17. MAIN ANIMATION RENDER LOOP ---
  animate() {
    if (!this.renderer) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.updatePlayer(delta);
    this.checkInteractables();

    // Update 3D Antique Golden Key
    if (this.templeKeyItem) {
      this.templeKeyItem.update(delta, elapsed);
    }

    // Physical Double Door Opening Swing
    if (this.doorsOpening && this.doorAngle < Math.PI * 0.48) {
      this.doorAngle += delta * 0.95;
      if (this.leftDoorPivot) this.leftDoorPivot.rotation.y = -this.doorAngle;
      if (this.rightDoorPivot) this.rightDoorPivot.rotation.y = this.doorAngle;
    }

    // Delicate Night Dust Drift
    if (this.dustParticles) {
      this.dustParticles.rotation.y = elapsed * 0.015;
    }

    this.renderer.render(this.scene, this.camera);
  }

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
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
