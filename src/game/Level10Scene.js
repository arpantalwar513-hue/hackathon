import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';
import { getProactiveHint } from './services/GeminiService.js';

export class Level10Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 40),
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         0,
      speed:         6.0,
      sprintSpeed:   10.0,
      isSprinting:   false,
      isGrounded:    true,
      headBobTimer:  0,
      canMove:       true,
    };

    this.shakeIntensity = 0;
    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false, blast: false };
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

    // ─── Arena & Points ───
    this.spiritualPoints = [];
    this.centralAltar = null;
    this.altarInteractable = null;

    // ─── Boss Entity ───
    this.bossGroup = null;
    this.bossMesh = null;
    this.bossAura = null;
    this.bossLight = null;
    this.bossShieldMesh = null;
    
    this.projectiles = [];
    this.groundWaves = [];
    this.spiritualBlasts = [];

    this.lastDialogueTime = 0;
    this.lastAttackTime = 0;
    
    // Boss behaviors
    this.bossState = 'IDLE'; // IDLE, PHASE1, PHASE2, PHASE3, DEFEATED
    this.bossSpeed = 2.0;

    // Setup events
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp   = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown   = this.handleMouseDown.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onResize  = this.handleResize.bind(this);
    
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
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
    this.scene.background = new THREE.Color(0x050205);
    this.scene.fog = new THREE.FogExp2(0x050205, 0.02);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.scene, this.camera);

    this.setupLighting();
    this.buildEnvironment();

    this.update = this.update.bind(this);
    this.renderer.setAnimationLoop(this.update);

    // Initial dialogue
    setTimeout(() => {
      if (!gameState.state.level10Started) {
        gameState.startLevel10();
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l10_start') || "This is it. The central arena. The entity is feeding on the main core. We have to stop it!");
      }
    }, 2000);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x2a1030, 0.3); 
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x2a1040, 0x050210, 0.5);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);
  }

  buildEnvironment() {
    const floorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const wallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x0a0a0a,
      roughness: 0.9,
    });

    // Main Arena (Circular)
    const arenaRadius = 45;
    const arenaGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 1, 32);
    const floor = new THREE.Mesh(arenaGeo, floorMat);
    floor.position.set(0, 0, 0);
    this.scene.add(floor);
    
    // Add border walls
    const wallGeo = new THREE.CylinderGeometry(arenaRadius + 1, arenaRadius + 1, 20, 32, 1, true);
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.set(0, 10, 0);
    walls.material.side = THREE.BackSide;
    this.scene.add(walls);

    // Add a simple collision bounds check in updatePlayerPhysics instead of box colliders for circle

    this.buildSpiritualPoints(wallMat);
    this.buildCentralAltar(wallMat);
    this.buildBoss();
  }

  buildSpiritualPoints(wallMat) {
    const radius = 25;
    const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    const letters = ['A', 'B', 'C'];
    const colors = [0x00aaff, 0xffaa00, 0x00ffaa];

    angles.forEach((angle, i) => {
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 2, 8), wallMat);
      pedestal.position.set(x, 1, z);
      this.scene.add(pedestal);

      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.5, 0),
        new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x000000, transparent: true, opacity: 0.8 })
      );
      gem.position.set(x, 3, z);
      this.scene.add(gem);

      const light = new THREE.PointLight(colors[i], 0, 10);
      light.position.set(x, 4, z);
      this.scene.add(light);

      this.spiritualPoints.push({
        id: letters[i],
        mesh: gem,
        light: light,
        baseColor: colors[i],
        active: false,
        corrupted: false
      });

      this.interactables.push({
        mesh: pedestal, // Interact with pedestal
        prompt: `[E] ACTIVATE SPIRITUAL POINT ${letters[i]}`,
        range: 6,
        id: letters[i],
        action: () => {
          this.handleSpiritualPointActivation(letters[i]);
        }
      });
      
      this.colliders.push({ type: 'box', minX: x - 1.5, maxX: x + 1.5, minZ: z - 1.5, maxZ: z + 1.5 });
    });
  }

  buildCentralAltar(wallMat) {
    const altar = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), wallMat);
    altar.position.set(0, 0.75, 0);
    this.scene.add(altar);
    this.centralAltar = altar;
    this.colliders.push({ type: 'box', minX: -2, maxX: 2, minZ: -2, maxZ: 2 });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffaa00, emissiveIntensity: 0.1 })
    );
    core.position.set(0, 2.5, 0);
    this.scene.add(core);

    this.altarInteractable = {
      mesh: altar,
      prompt: '[E] FIRE FINAL BLAST',
      range: 8,
      action: () => {
        if (gameState.state.finalCoreExposed && !gameState.state.bossDefeated) {
          this.triggerFinalDefeatSequence();
        } else {
          gameState.setToast("The altar is dormant. We must expose the final core first.");
        }
      }
    };
    this.interactables.push(this.altarInteractable);
  }

  buildBoss() {
    this.bossGroup = new THREE.Group();
    this.bossGroup.position.set(0, 3, -15);
    
    this.bossMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.0, 3.0, 4, 16),
      new THREE.MeshStandardMaterial({ color: 0x050011, transparent: true, opacity: 0.9, emissive: 0x110000 })
    );
    this.bossGroup.add(this.bossMesh);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 1.5, 0.9);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.3, 1.5, 0.9);
    this.bossGroup.add(leftEye, rightEye);

    this.bossAura = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.2, wireframe: true })
    );
    this.bossGroup.add(this.bossAura);

    // Shield sphere
    this.bossShieldMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x5500aa, transparent: true, opacity: 0.4, emissive: 0x220055, side: THREE.DoubleSide })
    );
    this.bossGroup.add(this.bossShieldMesh);

    this.bossLight = new THREE.PointLight(0xff0000, 3, 20);
    this.bossGroup.add(this.bossLight);

    this.scene.add(this.bossGroup);
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

  handleSpiritualPointActivation(pointId) {
    const state = gameState.state;
    if (state.bossDefeated) return;

    const pointIndex = pointId === 'A' ? 0 : pointId === 'B' ? 1 : 2;
    const pt = this.spiritualPoints[pointIndex];

    if (pt.active) {
      if (pt.corrupted) {
        // Restoring corrupted point
        gameState.restoreSpiritualPointL10();
        pt.corrupted = false;
        pt.mesh.material.emissive.setHex(pt.baseColor);
        pt.light.color.setHex(pt.baseColor);
        pt.light.intensity = 2;
        soundManager.playSymbolActivate();
        this.triggerDialogue('UNKNOWN GUIDE', "You cleansed it! The shield is down again!");
      } else {
        gameState.setToast(`Spiritual Point ${pointId} is already active.`);
      }
      return;
    }

    gameState.activateSpiritualPointL10(pointId);
    pt.active = true;
    pt.mesh.material.emissive.setHex(pt.baseColor);
    pt.light.intensity = 2;
    soundManager.playSymbolActivate();

    if (gameState.state.allSpiritualPointsActivated && !gameState.state.bossCoreExposed) {
      // Shield drops
      this.dropBossShield();
    } else {
      this.triggerDialogue('UNKNOWN GUIDE', `Good! ${3 - this.getActivePointsCount()} more to drop its shield.`);
    }
  }

  getActivePointsCount() {
    const state = gameState.state;
    return (state.spiritualPointAActivated ? 1 : 0) + 
           (state.spiritualPointBActivated ? 1 : 0) + 
           (state.spiritualPointCActivated ? 1 : 0);
  }

  dropBossShield() {
    this.bossShieldMesh.material.opacity = 0;
    soundManager.playShieldBreak();
    this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l10_shield_down') || "Its shield is down! Right-click or press SPACE to fire a Spiritual Blast at its core!");
  }

  fireSpiritualBlast() {
    if (!gameState.state.bossCoreExposed || gameState.state.bossDefeated) return;

    soundManager.playSpiritualBlast();
    const blast = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    
    // Fire from camera position towards camera direction
    blast.position.copy(this.camera.position);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    blast.velocity = dir.multiplyScalar(30);
    this.scene.add(blast);
    this.spiritualBlasts.push(blast);

    // Recoil
    this.player.pitch += 0.05;
    this.shakeIntensity = 0.2;
  }

  fireBossProjectile() {
    soundManager.playBossAttackProjectile();
    const proj = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    proj.position.copy(this.bossGroup.position);
    proj.position.y += 2;
    
    // Aim at player
    const dir = new THREE.Vector3().subVectors(this.camera.position, proj.position).normalize();
    proj.velocity = dir.multiplyScalar(15);
    this.scene.add(proj);
    this.projectiles.push(proj);
  }

  fireGroundWave() {
    soundManager.playEnergyWave();
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.2, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xaa00ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    wave.rotation.x = Math.PI / 2;
    wave.position.copy(this.bossGroup.position);
    wave.position.y = 0.5;
    wave.scaleSpeed = 15;
    this.scene.add(wave);
    this.groundWaves.push(wave);
  }

  triggerFinalDefeatSequence() {
    gameState.completeLevel10();
    soundManager.playBossDefeat();
    this.shakeIntensity = 2.0;
    
    // Remove boss completely
    this.scene.remove(this.bossGroup);
    
    // Change lighting
    this.ambientLight.color.setHex(0x332211);
    this.ambientLight.intensity = 1.0;
    this.hemiLight.color.setHex(0xffddaa);
    this.hemiLight.groundColor.setHex(0x221100);
    this.hemiLight.intensity = 1.5;

    // Turn all points golden
    this.spiritualPoints.forEach(pt => {
      pt.mesh.material.emissive.setHex(0xffdd55);
      pt.light.color.setHex(0xffdd55);
      pt.light.intensity = 3;
    });

    // Central altar glow
    const divineGlow = new THREE.PointLight(0xffdd55, 5, 50);
    divineGlow.position.set(0, 5, 0);
    this.scene.add(divineGlow);

    setTimeout(() => {
      soundManager.playDivineEnergyChime();
      this.triggerDialogue('UNKNOWN GUIDE', "It's over. The darkness is gone... but what is this new, pure energy? A Guardian?");
    }, 3000);
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
        if (gameState.state.bossCoreExposed) {
          this.fireSpiritualBlast();
        } else if (this.player.isGrounded) {
          this.player.velocity.y = 5.0;
        }
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

  handleMouseDown(e) {
    if (!this.isPointerLocked && !gameState.state.activeGuideDialogue && !gameState.state.cinematicIntroActive && !gameState.state.cinematicOutroActive) {
      this.canvas.requestPointerLock();
      return;
    }
    
    if (this.isPointerLocked && this.player.canMove) {
      // Right click to blast
      if (e.button === 2 && gameState.state.bossCoreExposed) {
        this.fireSpiritualBlast();
      }
    }
  }

  handleMouseUp(e) {}

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

    // Arena boundary check (circular)
    const distFromCenter = Math.sqrt(nextPos.x * nextPos.x + nextPos.z * nextPos.z);
    if (distFromCenter < 44) {
      this.player.position.x = nextPos.x;
      this.player.position.z = nextPos.z;
    }

    // Box colliders (for altars/pillars)
    const pRadius = 0.4;
    let collidedX = false;
    let collidedZ = false;

    this.colliders.forEach(c => {
      if (
        this.player.position.x + pRadius > c.minX && this.player.position.x - pRadius < c.maxX &&
        this.player.position.z + pRadius > c.minZ && this.player.position.z - pRadius < c.maxZ
      ) {
        // Simple pushback
      }
    });

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
      if (this.shakeIntensity < 0.01) this.shakeIntensity = 0;
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
        // Special case: don't show prompt if point is active and not corrupted
        if (['A', 'B', 'C'].includes(found.id)) {
          const pt = this.spiritualPoints.find(p => p.id === found.id);
          if (pt.active && !pt.corrupted) {
            gameState.set({ interactionPrompt: null });
            return;
          }
        }
        gameState.set({ interactionPrompt: found.prompt });
      } else {
        gameState.set({ interactionPrompt: null });
      }
    }
  }

  updateLogic(dt) {
    const state = gameState.state;
    if (state.bossDefeated) return;

    const time = this.clock.getElapsedTime();

    // ─── Boss Behavior ───
    if (this.bossGroup) {
      this.bossMesh.position.y = Math.sin(time * 3) * 0.5;
      this.bossAura.rotation.y = time;
      if (state.bossCoreExposed) {
        this.bossShieldMesh.material.opacity = 0;
      } else {
        this.bossShieldMesh.material.opacity = 0.4 + Math.sin(time * 5) * 0.1;
      }

      // Boss Movement & Attacking
      if (state.bossStarted) {
        this.bossGroup.lookAt(this.camera.position.x, this.bossGroup.position.y, this.camera.position.z);
        
        // Move towards center or hover
        const targetPos = new THREE.Vector3(
          Math.sin(time * 0.5) * 10,
          3 + Math.sin(time) * 2,
          Math.cos(time * 0.5) * 10
        );
        this.bossGroup.position.lerp(targetPos, dt * this.bossSpeed);

        // Attacks
        if (time - this.lastAttackTime > (state.bossPhase === 2 ? 2.5 : 4.0)) {
          if (!state.bossCoreExposed) {
            if (Math.random() > 0.5) {
              this.fireBossProjectile();
            } else {
              this.fireGroundWave();
            }
          }
          this.lastAttackTime = time;
        }
      }

      // Phase 2 Transition Logic
      if (state.bossPhase === 2 && !this.phase2Triggered) {
        this.phase2Triggered = true;
        this.bossSpeed = 4.0;
        this.bossMesh.material.color.setHex(0x550000);
        this.bossLight.color.setHex(0xff5500);
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l10_phase2') || "It's enraged! It corrupted one of the spiritual points! Reactivate it!");
        
        // Corrupt a random active point
        const pt = this.spiritualPoints[Math.floor(Math.random() * 3)];
        gameState.corruptSpiritualPointL10();
        pt.corrupted = true;
        pt.mesh.material.emissive.setHex(0xff0000);
        pt.light.color.setHex(0xff0000);
        this.bossShieldMesh.material.opacity = 0.8;
      }

      // Phase 3 Final Core Logic
      if (state.bossPhase === 3 && !state.finalCoreExposed) {
        gameState.triggerFinalEventL10();
        this.bossSpeed = 0.5; // Stunned
        this.bossGroup.position.set(0, 3, 0); // Move to center
        this.triggerDialogue('UNKNOWN GUIDE', getProactiveHint('l10_phase3') || "Its core is permanently exposed! Use the central altar to channel all spiritual points into one final blast!");
      }
    }

    // ─── Projectiles ───
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.position.addScaledVector(p.velocity, dt);
      
      // Collision with player
      if (p.position.distanceTo(this.camera.position) < 1.5) {
        this.shakeIntensity = 0.5;
        this.scene.remove(p);
        this.projectiles.splice(i, 1);
        // We don't have player health, but we can play a hit sound/effect
        soundManager.playPuzzleFail(); 
        continue;
      }

      if (p.position.length() > 50 || p.position.y < 0) {
        this.scene.remove(p);
        this.projectiles.splice(i, 1);
      }
    }

    // ─── Ground Waves ───
    for (let i = this.groundWaves.length - 1; i >= 0; i--) {
      const w = this.groundWaves[i];
      w.scale.addScalar(dt * w.scaleSpeed);
      w.material.opacity -= dt * 0.5;
      
      // Check collision (if player is on ground and wave passes through)
      const dist = w.scale.x; // approximate radius since base radius is 1
      const playerDist = Math.sqrt(this.player.position.x**2 + this.player.position.z**2);
      if (Math.abs(dist - playerDist) < 1.0 && this.player.isGrounded) {
        this.shakeIntensity = 0.8;
        this.player.velocity.y = 8.0; // Knock up
        soundManager.playPuzzleFail();
      }

      if (w.material.opacity <= 0) {
        this.scene.remove(w);
        this.groundWaves.splice(i, 1);
      }
    }

    // ─── Spiritual Blasts (Player) ───
    for (let i = this.spiritualBlasts.length - 1; i >= 0; i--) {
      const b = this.spiritualBlasts[i];
      b.position.addScaledVector(b.velocity, dt);

      if (this.bossGroup && b.position.distanceTo(this.bossGroup.position) < 4.0) {
        // Hit Boss
        gameState.damageBossL10(20);
        this.scene.remove(b);
        this.spiritualBlasts.splice(i, 1);
        soundManager.playShieldBreak();
        
        // Visual feedback
        this.bossMesh.material.emissiveIntensity = 5;
        setTimeout(() => { if(this.bossMesh) this.bossMesh.material.emissiveIntensity = 1; }, 200);
        continue;
      }

      if (b.position.length() > 60) {
        this.scene.remove(b);
        this.spiritualBlasts.splice(i, 1);
      }
    }
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
    
    if (this.firstPersonFlashlight) this.firstPersonFlashlight.destroy();
    if (this.renderer) this.renderer.dispose();
  }
}
