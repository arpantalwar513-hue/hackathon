import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { getProactiveHint } from './services/GeminiService.js';

export class Level9Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 18),
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         0,
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

    // ─── Meshes ───
    this.source1Mesh = null;
    this.source2Mesh = null;
    this.coreMesh = null;
    
    this.entityGroup = null;
    this.entityMesh = null;
    this.entityAura = null;
    this.entityLight = null;
    this.entityState = 'DORMANT';
    this.lastDialogueTime = 0;

    this.chaseGate = null;
    this.darkParticles = [];

    // Setup events
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp   = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onClick   = this.handleClick.bind(this);
    this.onResize  = this.handleResize.bind(this);
    
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onClick);
    window.addEventListener('resize', this.onResize);

    this.init();
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.FogExp2(0x050508, 0.05);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.scene, this.camera);

    this.setupLighting();
    this.buildEnvironment();

    this.update = this.update.bind(this);
    this.renderer.setAnimationLoop(this.update);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x2a3040, 0.4); 
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x1a2030, 0x050510, 0.6);
    this.hemiLight.position.set(0, 10, 0);
    this.scene.add(this.hemiLight);
  }

  addTorch(x, y, z) {
    const torchLight = new THREE.PointLight(0xffaa55, 1.5, 12);
    torchLight.position.set(x, y, z);
    torchLight.castShadow = true;
    this.scene.add(torchLight);
    this.templeLights.push(torchLight);
    
    const fireGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.set(x, y, z);
    this.scene.add(fireMesh);
  }

  buildEnvironment() {
    const floorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const wallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x1a1a1a,
      roughness: 0.9,
    });

    // Safe Chamber
    this.createRoom(0, 0, 18, 10, 10, floorMat, wallMat);
    this.addTorch(0, 4, 18);

    // Corridor N
    this.createCorridor(0, 0, 8, 4, 20, false, floorMat, wallMat);
    
    // Broken Shrine (Source 1)
    this.createCorridor(-5, 0, -2, 10, 4, true, floorMat, wallMat);
    this.createRoom(-15, 0, -2, 10, 10, floorMat, wallMat);
    this.buildSource1(wallMat);

    // Corrupted Chamber (Source 2)
    this.createCorridor(5, 0, -2, 10, 4, true, floorMat, wallMat);
    this.createRoom(15, 0, -2, 12, 12, floorMat, wallMat);
    this.buildSource2(wallMat);

    // Long Chase Corridor N
    this.createCorridor(0, 0, -22, 4, 40, false, floorMat, wallMat);
    this.addTorch(0, 4, -15);
    this.addTorch(0, 4, -30);
    
    this.buildChaseGate(wallMat);

    // Core Chamber
    this.createRoom(0, 0, -55, 16, 16, floorMat, wallMat);
    this.buildCore(wallMat);

    // Final Arena Path
    this.createCorridor(0, 0, -70, 4, 14, false, floorMat, wallMat);
    this.buildArenaDoor(wallMat);

    this.buildEntity();
  }

  createRoom(x, y, z, width, depth, floorMat, wallMat) {
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, y, z);
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(x, y + 8, z);
    this.scene.add(ceiling);

    this.colliders.push({ type: 'box', minX: x - width/2, maxX: x + width/2, minZ: z - depth/2, maxZ: z + depth/2 });

    // Walls
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(width, 8, 1), wallMat);
    wallN.position.set(x, y + 4, z - depth/2);
    this.scene.add(wallN);

    const wallS = new THREE.Mesh(new THREE.BoxGeometry(width, 8, 1), wallMat);
    wallS.position.set(x, y + 4, z + depth/2);
    this.scene.add(wallS);

    const wallE = new THREE.Mesh(new THREE.BoxGeometry(1, 8, depth), wallMat);
    wallE.position.set(x + width/2, y + 4, z);
    this.scene.add(wallE);

    const wallW = new THREE.Mesh(new THREE.BoxGeometry(1, 8, depth), wallMat);
    wallW.position.set(x - width/2, y + 4, z);
    this.scene.add(wallW);
  }

  createCorridor(x, y, z, width, depth, isEastWest, floorMat, wallMat) {
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, y, z);
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(x, y + 8, z);
    this.scene.add(ceiling);

    this.colliders.push({ type: 'box', minX: x - width/2, maxX: x + width/2, minZ: z - depth/2, maxZ: z + depth/2 });

    if (isEastWest) {
      const wallN = new THREE.Mesh(new THREE.BoxGeometry(width, 8, 1), wallMat);
      wallN.position.set(x, y + 4, z - depth/2);
      this.scene.add(wallN);
      const wallS = new THREE.Mesh(new THREE.BoxGeometry(width, 8, 1), wallMat);
      wallS.position.set(x, y + 4, z + depth/2);
      this.scene.add(wallS);
    } else {
      const wallE = new THREE.Mesh(new THREE.BoxGeometry(1, 8, depth), wallMat);
      wallE.position.set(x + width/2, y + 4, z);
      this.scene.add(wallE);
      const wallW = new THREE.Mesh(new THREE.BoxGeometry(1, 8, depth), wallMat);
      wallW.position.set(x - width/2, y + 4, z);
      this.scene.add(wallW);
    }
  }

  buildSource1(wallMat) {
    const shrineGeo = new THREE.BoxGeometry(2, 2, 2);
    const shrine = new THREE.Mesh(shrineGeo, wallMat);
    shrine.position.set(-15, 1, -2);
    this.scene.add(shrine);
    
    this.source1Mesh = shrine;
    this.colliders.push({ type: 'box', minX: -16, maxX: -14, minZ: -3, maxZ: -1 });

    this.interactables.push({
      mesh: shrine,
      prompt: '[E] EXAMINE BROKEN SHRINE',
      range: 4,
      action: () => {
        if (!gameState.state.negativeSource1Discovered) {
          gameState.discoverSource1L9();
          this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_source1') || "This shrine was shattered from the inside. Negative energy is pouring out.");
          this.spawnDarkParticles(shrine.position, 10);
        }
      }
    });
  }

  buildSource2(wallMat) {
    const carving = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0x332244 }));
    carving.position.set(19.4, 3, -2);
    carving.rotation.y = -Math.PI / 2;
    this.scene.add(carving);
    
    this.source2Mesh = carving;

    this.interactables.push({
      mesh: carving,
      prompt: '[E] EXAMINE CORRUPTED WALL',
      range: 5,
      action: () => {
        if (gameState.state.entityFirstManifestation && !gameState.state.negativeSource2Discovered) {
          gameState.discoverSource2L9();
          this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_source2') || "The stone itself is bleeding dark energy. The entity is feeding on it.");
          this.spawnDarkParticles(carving.position, 10);
        } else if (!gameState.state.entityFirstManifestation) {
          gameState.setToast("I shouldn't touch this yet. I need to check the other room.");
        }
      }
    });
  }

  buildChaseGate(wallMat) {
    this.chaseGate = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 0.5), new THREE.MeshStandardMaterial({color: 0x222222}));
    this.chaseGate.position.set(0, 4, -41);
    this.scene.add(this.chaseGate);
    this.colliders.push({ type: 'box', minX: -2, maxX: 2, minZ: -41.5, maxZ: -40.5 });

    const switchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({color: 0x882222}));
    switchMesh.position.set(-1.8, 1.5, -39);
    this.scene.add(switchMesh);

    this.interactables.push({
      mesh: switchMesh,
      prompt: '[E] PULL SWITCH',
      range: 3,
      action: () => {
        soundManager.playMechanismClick();
        soundManager.playStoneDoorSlide();
        this.chaseGate.position.y += 8; // Open
        // Remove from colliders
        this.colliders = this.colliders.filter(c => !(c.minZ === -41.5 && c.maxZ === -40.5));
        
        if (gameState.state.chaseStarted) {
          gameState.completeChaseL9();
        }
      }
    });
  }

  buildCore(wallMat) {
    this.coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x220055, roughness: 0.1 })
    );
    this.coreMesh.position.set(0, 4, -55);
    this.scene.add(this.coreMesh);

    this.coreLight = new THREE.PointLight(0x220055, 1.0, 15);
    this.coreLight.position.copy(this.coreMesh.position);
    this.scene.add(this.coreLight);

    this.interactables.push({
      mesh: this.coreMesh,
      prompt: '[E] EXAMINE ENTITY CORE',
      range: 6,
      action: () => {
        if (gameState.state.chaseCompleted && !gameState.state.entityCoreDiscovered) {
          gameState.discoverCoreL9();
          this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_core') || "The core... it's pure concentrated malice. The entity will defend this.");
          this.spawnDarkParticles(this.coreMesh.position, 20);
        }
      }
    });
  }

  buildArenaDoor(wallMat) {
    const arenaDoor = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 0.5), new THREE.MeshStandardMaterial({color: 0x444444}));
    arenaDoor.position.set(0, 4, -76);
    this.scene.add(arenaDoor);
    this.colliders.push({ type: 'box', minX: -2, maxX: 2, minZ: -76.5, maxZ: -75.5 });

    this.interactables.push({
      mesh: arenaDoor,
      prompt: '[E] ENTER FINAL ARENA',
      range: 4,
      action: () => {
        if (gameState.state.entityEmpowered && !gameState.state.finalArenaDiscovered) {
          gameState.discoverFinalArenaL9();
          gameState.setToast("LEVEL 9 COMPLETED. PREPARE FOR FINAL BATTLE.");
          // Trigger Level 10 unlock or state change
          setTimeout(() => {
            gameState.startLevel10();
          }, 3000);
        } else if (!gameState.state.entityEmpowered) {
          gameState.setToast("The door is sealed by the entity's power. It must be empowered first.");
        }
      }
    });
  }

  buildEntity() {
    this.entityGroup = new THREE.Group();
    this.entityGroup.position.set(0, -100, 0);
    
    this.entityMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.8, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.8, emissive: 0x0a0a0a })
    );
    this.entityMesh.position.y = 1.3;
    this.entityGroup.add(this.entityMesh);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 2.0, 0.35);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 2.0, 0.35);
    this.entityGroup.add(leftEye, rightEye);

    this.entityAura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.6, 2.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x220022, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    this.entityAura.position.y = 1.25;
    this.entityGroup.add(this.entityAura);

    this.entityLight = new THREE.PointLight(0xff0000, 0, 5);
    this.entityLight.position.y = 2.0;
    this.entityGroup.add(this.entityLight);

    this.scene.add(this.entityGroup);
  }

  spawnDarkParticles(pos, count) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 3,
        pos.y + (Math.random() - 0.5) * 3,
        pos.z + (Math.random() - 0.5) * 3
      );
      mesh.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      mesh.baseY = mesh.position.y;
      this.scene.add(mesh);
      this.darkParticles.push(mesh);
    }
  }

  updateDarkParticles(dt) {
    if (this.darkParticles.length === 0) return;
    this.darkParticles.forEach(p => {
      p.position.addScaledVector(p.velocity, dt);
      p.rotation.x += dt;
      p.rotation.y += dt;
      p.position.y = p.baseY + Math.sin(this.clock.getElapsedTime() * 2 + p.position.x) * 0.5;
    });
  }

  triggerDialogue(speakerName, message) {
    const now = Date.now();
    if (now - this.lastDialogueTime > 5000) {
      gameState.triggerGuideDialogue({
        speakerName,
        message,
        choices: [{ label: 'Continue', actionKey: 'continue' }]
      });
      this.lastDialogueTime = now;
    }
  }

  handleKeyDown(e) {
    if (!this.player.canMove) return;
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'ShiftLeft': this.keys.sprint = true; break;
      case 'Space':
        if (this.player.isGrounded) this.player.velocity.y = 5.0;
        break;
      case 'KeyE':
        if (this.hoveredItem) {
          this.hoveredItem.action();
        }
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'ShiftLeft': this.keys.sprint = false; break;
    }
  }

  handleMouseMove(e) {
    if (!this.isPointerLocked || !this.player.canMove) return;
    const sensitivity = 0.002;
    this.mouseDeltaX = e.movementX || 0;
    this.mouseDeltaY = e.movementY || 0;
    this.player.yaw -= this.mouseDeltaX * sensitivity;
    this.player.pitch -= this.mouseDeltaY * sensitivity;
    this.player.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.player.pitch));
  }

  handleClick(e) {
    if (!this.isPointerLocked && !gameState.state.activeGuideDialogue && !gameState.state.cinematicIntroActive) {
      this.canvas.requestPointerLock();
    }
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.isPointerLocked = document.pointerLockElement === this.canvas;
    
    if (gameState.state.cinematicIntroActive || gameState.state.cinematicOutroActive || gameState.state.activeGuideDialogue) {
      this.player.canMove = false;
    } else {
      this.player.canMove = true;
    }

    if (this.player.canMove) {
      this.updatePlayerPhysics(dt);
    }
    
    this.updateCamera();
    this.checkInteractions();
    
    if (this.firstPersonFlashlight && gameState.state.hasFlashlight) {
      this.firstPersonFlashlight.update();
    }

    this.updateLogic(dt);

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerPhysics(dt) {
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;
    moveDir.normalize();
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);

    const speed = this.keys.sprint ? this.player.sprintSpeed : this.player.speed;
    this.player.velocity.x = moveDir.x * speed;
    this.player.velocity.z = moveDir.z * speed;
    this.player.velocity.y -= 15.0 * dt;

    const nextPos = this.player.position.clone().addScaledVector(this.player.velocity, dt);

    const pRadius = 0.4;
    let collidedX = false;
    let collidedZ = false;

    this.colliders.forEach(c => {
      if (
        nextPos.x + pRadius > c.minX && nextPos.x - pRadius < c.maxX &&
        this.player.position.z + pRadius > c.minZ && this.player.position.z - pRadius < c.maxZ
      ) collidedX = true;

      if (
        this.player.position.x + pRadius > c.minX && this.player.position.x - pRadius < c.maxX &&
        nextPos.z + pRadius > c.minZ && nextPos.z - pRadius < c.maxZ
      ) collidedZ = true;
    });

    if (!collidedX) this.player.position.x = nextPos.x;
    if (!collidedZ) this.player.position.z = nextPos.z;

    this.player.position.y += this.player.velocity.y * dt;
    if (this.player.position.y <= 1.75) {
      this.player.position.y = 1.75;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    } else {
      this.player.isGrounded = false;
    }

    if (this.player.isGrounded && (moveDir.x !== 0 || moveDir.z !== 0)) {
      this.player.headBobTimer += dt * (this.keys.sprint ? 12 : 8);
    } else {
      this.player.headBobTimer = 0;
    }
  }

  updateCamera() {
    const bobOffset = Math.sin(this.player.headBobTimer) * 0.08;
    this.camera.position.set(this.player.position.x, this.player.position.y + 0.8 + bobOffset, this.player.position.z);
    
    let shakeX = 0, shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
    }

    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.player.pitch + shakeY);
    this.camera.quaternion.copy(qYaw).multiply(qPitch);
    this.camera.rotateY(shakeX);
  }

  checkInteractions() {
    if (!this.player.canMove) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const interactableMeshes = this.interactables.map(i => i.mesh);
    const intersects = this.raycaster.intersectObjects(interactableMeshes, true);

    let found = null;
    if (intersects.length > 0) {
      const hit = intersects[0];
      const dist = hit.distance;
      const item = this.interactables.find(i => {
        let isMatch = false;
        i.mesh.traverse(child => { if (child === hit.object) isMatch = true; });
        return isMatch || i.mesh === hit.object;
      });

      if (item && dist <= item.range) {
        found = item;
      }
    }

    if (found !== this.hoveredItem) {
      this.hoveredItem = found;
      if (found) {
        gameState.set({ interactionPrompt: found.prompt });
      } else {
        gameState.set({ interactionPrompt: null });
      }
    }
  }

  updateLogic(dt) {
    const state = gameState.state;
    const time = this.clock.getElapsedTime();

    this.updateDarkParticles(dt);

    if (state.entityFirstManifestation && this.entityState === 'DORMANT' && !state.negativeSource2Discovered) {
      this.entityState = 'MANIFESTING';
      this.entityGroup.position.set(0, 0, -20);
      this.entityLight.intensity = 0.5;
      this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_manifestation') || "It saw you. Be careful.");
      
      setTimeout(() => {
        if (this.entityState === 'MANIFESTING') {
          this.entityGroup.position.set(0, -100, 0);
          this.entityState = 'DORMANT';
        }
      }, 5000);
    }

    if (state.entityFollowing && this.entityState === 'DORMANT' && !state.chaseStarted) {
      this.entityState = 'FOLLOWING';
      this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_following') || "It's following you. Don't look at it for too long.");
    }

    if (state.chaseStarted && this.entityState !== 'HUNTING' && !state.chaseCompleted) {
      this.entityState = 'HUNTING';
      this.entityLight.intensity = 1.0;
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
      this.entityGroup.position.copy(this.camera.position).add(dir.multiplyScalar(8));
      this.entityGroup.position.y = 0;
      this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l9_chase') || "Run! Get to the switch!");
    }

    if (state.chaseCompleted && this.entityState === 'HUNTING') {
      this.entityState = 'RETREATING';
      this.entityGroup.position.set(0, -100, 0);
      this.triggerDialogue('UNKNOWN GUIDE', "It stopped... but it's not gone.");
    }

    if (state.entityAbsorptionStarted && this.entityState !== 'ABSORBING' && !state.entityEmpowered) {
      this.entityState = 'ABSORBING';
      this.entityGroup.position.copy(this.coreMesh.position);
      this.entityGroup.position.z += 3;
      this.entityGroup.position.y = 0;
      this.entityLight.intensity = 2.0;
      this.triggerDialogue('UNKNOWN GUIDE', "It's absorbing the core's negative energy!");
      this.ambientLight.intensity = 0.1;
      this.hemiLight.intensity = 0.2;
      this.coreLight.intensity = 5.0;
    }

    if (state.entityEmpowered && this.entityState !== 'EMPOWERED') {
      this.entityState = 'EMPOWERED';
      this.entityMesh.scale.set(1.5, 1.5, 1.5);
      this.entityAura.scale.set(2, 2, 2);
      this.entityAura.material.opacity = 0.6;
      this.entityLight.intensity = 5.0;
      this.entityLight.color.setHex(0xff0000);
      this.triggerDialogue('UNKNOWN GUIDE', "It's much stronger now! We have to find a way out!");
      this.ambientLight.intensity = 0.3;
      this.hemiLight.intensity = 0.4;
      this.shakeIntensity = 0.3;
    }

    // Entity behavior
    if (this.entityState !== 'DORMANT' && this.entityState !== 'RETREATING') {
      this.entityMesh.position.y = 1.3 + Math.sin(time * 2) * 0.1;
      this.entityAura.rotation.y = time;
      this.entityGroup.lookAt(this.camera.position.x, this.entityGroup.position.y, this.camera.position.z);

      const distToPlayer = this.entityGroup.position.distanceTo(this.camera.position);

      if (this.entityState === 'FOLLOWING') {
        const cameraDir = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDir);
        const toEntity = new THREE.Vector3().subVectors(this.entityGroup.position, this.camera.position).normalize();
        
        const dot = cameraDir.dot(toEntity);
        const isLooking = dot > 0.5 && distToPlayer < 20;

        if (!isLooking && distToPlayer > 10) {
          this.entityGroup.position.add(toEntity.multiplyScalar(-2 * dt));
        } else if (isLooking && distToPlayer < 15) {
          this.entityGroup.position.set(0, -100, 0);
          setTimeout(() => {
            if (this.entityState === 'FOLLOWING') {
              const newDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion).multiplyScalar(-15);
              this.entityGroup.position.copy(this.camera.position).add(newDir);
              this.entityGroup.position.y = 0;
              soundManager.playEntityWhisper();
            }
          }, 2000);
        }

        if (distToPlayer < 6) {
          gameState.startChaseL9();
        }
      }

      if (this.entityState === 'HUNTING') {
        const toPlayer = new THREE.Vector3().subVectors(this.camera.position, this.entityGroup.position).normalize();
        toPlayer.y = 0;
        this.entityGroup.position.add(toPlayer.multiplyScalar(4 * dt));

        if (distToPlayer < 2) {
          soundManager.playHorrorStinger();
          this.camera.rotation.z = Math.PI / 4;
          this.shakeIntensity = 1.0;
          gameState.setToast('IT CAUGHT YOU! RUN FASTER!');
          this.camera.position.add(toPlayer.multiplyScalar(-2));
        }
      }

      if (this.entityState === 'ABSORBING') {
        this.coreMesh.scale.setScalar(1 + Math.sin(time * 10) * 0.2);
        this.coreMesh.material.emissiveIntensity = 1 + Math.sin(time * 10) * 2;
      }
    }
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onClick);
    window.removeEventListener('resize', this.onResize);
    
    if (this.firstPersonFlashlight) this.firstPersonFlashlight.destroy();
    if (this.renderer) this.renderer.dispose();
  }
}
