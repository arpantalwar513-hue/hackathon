import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';

export class Level11Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    // Start at the entrance of the arena, looking inward
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 40),
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         0,
      speed:         5.0,
      sprintSpeed:   8.0,
      isSprinting:   false,
      isGrounded:    true,
      headBobTimer:  0,
      canMove:       true,
    };

    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
    this.isPointerLocked = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // ─── Interaction & Physics ───
    this.interactables = [];
    this.colliders     = [];
    this.hoveredItem   = null;
    this.raycaster     = new THREE.Raycaster();

    // ─── Entities ───
    this.firstPersonFlashlight = null; // Included but kept off
    this.centralAltar = null;
    this.friendMesh = null;
    
    // Guardian
    this.guardianGroup = null;
    this.guardianMesh = null;
    this.guardianAura = null;
    this.guardianLight = null;
    this.guardianState = 'DORMANT'; // DORMANT, MANIFESTING, OBSERVING, RECOGNIZING, COMPANION
    this.guardianFloatTimer = 0;

    // Exit
    this.exitPortal = null;

    // Setup events
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp   = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
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
    // Brighter tone mapping for daytime
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    // Bright sky blue background
    this.scene.background = new THREE.Color(0x87CEEB);
    // Light, airy fog
    this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.scene, this.camera);
    // Ensure flashlight starts off in daytime
    this.firstPersonFlashlight.toggle(false);

    this.setupLighting();
    this.buildEnvironment();

    soundManager.setPeacefulAmbience(true);

    this.update = this.update.bind(this);
    this.renderer.setAnimationLoop(this.update);

    setTimeout(() => {
      if (!gameState.state.level11Started) {
        gameState.startLevel11();
      }
    }, 1000);
  }

  setupLighting() {
    // Bright ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    this.scene.add(this.ambientLight);

    // Warm hemisphere light (sky color, ground color, intensity)
    this.hemiLight = new THREE.HemisphereLight(0xfff0dd, 0x556655, 0.8);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Main sun directional light
    this.sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    this.sunLight.position.set(20, 50, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 150;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.scene.add(this.sunLight);
  }

  buildEnvironment() {
    // Much brighter materials than Level 10
    const floorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0xcccccc,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const wallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0xddddcc,
      roughness: 0.8,
    });

    // Main Arena (Circular)
    const arenaRadius = 45;
    const arenaGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 1, 32);
    const floor = new THREE.Mesh(arenaGeo, floorMat);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Add border walls - lower for Level 11 to let in sky
    const wallGeo = new THREE.CylinderGeometry(arenaRadius + 1, arenaRadius + 1, 8, 32, 1, true);
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.set(0, 4, 0);
    walls.material.side = THREE.BackSide;
    walls.receiveShadow = true;
    this.scene.add(walls);

    this.buildCentralAltar(wallMat);
    this.buildFriend();
    this.buildGuardian();
    this.buildExit();
  }

  buildCentralAltar(wallMat) {
    const altar = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), wallMat);
    altar.position.set(0, 0.75, 0);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.scene.add(altar);
    this.centralAltar = altar;
    this.colliders.push({ type: 'box', minX: -2, maxX: 2, minZ: -2, maxZ: 2 });
  }

  buildFriend() {
    // Exhausted friend near the entrance
    const friendGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const friendMat = new THREE.MeshStandardMaterial({ color: 0x2244aa });
    this.friendMesh = new THREE.Mesh(friendGeo, friendMat);
    
    // Sitting / slumped on the floor near the entrance
    this.friendMesh.position.set(-3, 0.6, 35);
    this.friendMesh.rotation.x = Math.PI / 8; 
    this.friendMesh.castShadow = true;
    this.scene.add(this.friendMesh);

    this.colliders.push({ type: 'box', minX: -4, maxX: -2, minZ: 34, maxZ: 36 });

    this.interactables.push({
      mesh: this.friendMesh,
      prompt: '[E] CHECK ON FRIEND',
      range: 4,
      action: () => {
        if (!gameState.state.divineEnergyDetectedL11) {
          // First interaction: Friend is weak, mentions positive energy
          gameState.detectDivineEnergyL11();
          gameState.triggerGuideDialogue({
            speakerName: 'FRIEND',
            message: 'I... I survived... The negative presence is gone, but... do you feel that warmth coming from the altar?'
          });
          setTimeout(() => {
            gameState.triggerGuideDialogue({
              speakerName: 'AI GUIDE',
              message: 'The entity\'s destruction has left a pure, divine energy vacuum. It is coalescing at the center. You should investigate.'
            });
            this.guardianState = 'MANIFESTING';
            soundManager.playDivineEnergyChime();
          }, 5000);
        } else if (gameState.state.guardianJoined && !gameState.state.friendRecovered) {
          // Friend recovers after Guardian joins
          gameState.recoverFriendL11();
          this.friendMesh.rotation.x = 0; // Stand up
          this.friendMesh.position.y = 0.9;
          gameState.triggerGuideDialogue({
            speakerName: 'FRIEND',
            message: 'I feel... renewed. The light from that Guardian... it healed me. Let\'s get out of here.'
          });
          setTimeout(() => {
            gameState.startExitObjectiveL11();
            this.exitPortal.visible = true; // Show exit
          }, 4000);
        } else if (gameState.state.friendRecovered) {
          gameState.triggerGuideDialogue({
            speakerName: 'FRIEND',
            message: 'I am ready to leave. The exit has appeared.'
          });
        } else {
          gameState.setToast("He is too weak to move right now. Investigate the energy.");
        }
      }
    });
  }

  buildGuardian() {
    this.guardianGroup = new THREE.Group();
    this.guardianGroup.position.set(0, 3, 0); // Above the altar
    
    // Elegant, glowing humanoid shape
    this.guardianMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.8, 2.0, 4, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.0, // Invisible initially
        emissive: 0x88ccff,
        emissiveIntensity: 0.8
      })
    );
    this.guardianGroup.add(this.guardianMesh);

    // Aura rings
    this.guardianAura = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.05, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
    );
    this.guardianAura.rotation.x = Math.PI / 2;
    this.guardianGroup.add(this.guardianAura);

    this.guardianLight = new THREE.PointLight(0x88ccff, 0, 15);
    this.guardianLight.position.set(0, 0, 0);
    this.guardianGroup.add(this.guardianLight);

    this.scene.add(this.guardianGroup);
  }

  buildExit() {
    const exitGeo = new THREE.BoxGeometry(4, 6, 0.5);
    const exitMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8
    });
    this.exitPortal = new THREE.Mesh(exitGeo, exitMat);
    this.exitPortal.position.set(0, 3, -40);
    this.exitPortal.visible = false; // Hidden until the end
    this.scene.add(this.exitPortal);
  }

  // --- Input & Physics ---

  handleKeyDown(e) {
    if (gameState.state.aiCompanionOpen || gameState.state.cinematicIntroActive || gameState.state.cinematicOutroActive) return;
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.keys.sprint = true; break;
      case 'KeyE': this.checkInteraction(); break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'ShiftLeft':
      case 'ShiftRight': this.keys.sprint = false; break;
    }
  }

  handleMouseMove(e) {
    if (document.pointerLockElement === this.canvas) {
      this.mouseDeltaX -= e.movementX * 0.002;
      this.mouseDeltaY -= e.movementY * 0.002;
      this.mouseDeltaY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseDeltaY));
    }
  }

  handleMouseDown(e) {
    if (gameState.state.aiCompanionOpen || gameState.state.cinematicIntroActive || gameState.state.cinematicOutroActive) return;
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock();
    }
  }

  handleMouseUp(e) {}

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  checkInteraction() {
    if (this.hoveredItem && this.hoveredItem.action) {
      this.hoveredItem.action();
    }
  }

  updatePlayerPhysics(dt) {
    if (!this.player.canMove || gameState.state.aiCompanionOpen || gameState.state.cinematicOutroActive) return;

    this.player.yaw = this.mouseDeltaX;
    this.player.pitch = this.mouseDeltaY;
    
    // Smooth camera rotation
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');

    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    if (this.keys.forward) direction.z -= 1;
    if (this.keys.backward) direction.z += 1;
    if (this.keys.left) right.x -= 1;
    if (this.keys.right) right.x += 1;

    direction.normalize();
    right.normalize();

    // Rotate movement vectors to match camera yaw
    direction.applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
    right.applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);

    const moveVector = new THREE.Vector3().addVectors(direction, right).normalize();
    
    this.player.isSprinting = this.keys.sprint;
    const currentSpeed = this.player.isSprinting ? this.player.sprintSpeed : this.player.speed;
    
    this.player.velocity.x = moveVector.x * currentSpeed;
    this.player.velocity.z = moveVector.z * currentSpeed;

    // Apply movement
    const prevPos = this.player.position.clone();
    this.player.position.x += this.player.velocity.x * dt;
    this.player.position.z += this.player.velocity.z * dt;

    // Circular arena bounds check (radius ~ 43)
    const distFromCenter = Math.sqrt(this.player.position.x ** 2 + this.player.position.z ** 2);
    if (distFromCenter > 43) {
      const angle = Math.atan2(this.player.position.x, this.player.position.z);
      this.player.position.x = Math.sin(angle) * 43;
      this.player.position.z = Math.cos(angle) * 43;
    }

    // Box Collisions
    for (const collider of this.colliders) {
      if (collider.type === 'box') {
        if (this.player.position.x > collider.minX && this.player.position.x < collider.maxX &&
            this.player.position.z > collider.minZ && this.player.position.z < collider.maxZ) {
          this.player.position.copy(prevPos);
        }
      }
    }

    // Head bob
    if (moveVector.length() > 0 && this.player.isGrounded) {
      this.player.headBobTimer += dt * (this.player.isSprinting ? 12 : 8);
      const bobAmount = this.player.isSprinting ? 0.12 : 0.08;
      this.player.position.y = 1.75 + Math.sin(this.player.headBobTimer) * bobAmount;
      if (Math.sin(this.player.headBobTimer) < -0.9) {
        soundManager.playFootstep(this.player.isSprinting);
      }
    } else {
      this.player.position.y = THREE.MathUtils.lerp(this.player.position.y, 1.75, dt * 10);
    }

    this.camera.position.copy(this.player.position);
    this.firstPersonFlashlight.update();
  }

  updateRaycaster() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.raycaster.set(this.camera.position, dir);

    let closest = null;
    let minTargetDist = Infinity;

    for (const item of this.interactables) {
      // Basic distance check first
      const dist = this.camera.position.distanceTo(item.mesh.position);
      if (dist < item.range) {
        const intersects = this.raycaster.intersectObject(item.mesh, true);
        if (intersects.length > 0 && intersects[0].distance < minTargetDist) {
          closest = item;
          minTargetDist = intersects[0].distance;
        }
      }
    }

    this.hoveredItem = closest;
    if (this.hoveredItem) {
      document.body.style.cursor = 'pointer';
      // In a real app we'd trigger a 3D UI prompt here, but we rely on a central HUD toast or crosshair change
      if (gameState.state.toastMessage !== this.hoveredItem.prompt) {
         // Optionally show prompt in UI
      }
    } else {
      document.body.style.cursor = 'default';
    }
  }

  updateGuardian(dt) {
    if (this.guardianState === 'DORMANT') return;

    this.guardianFloatTimer += dt;
    const baseFloat = Math.sin(this.guardianFloatTimer * 2) * 0.2;
    
    // Guardian animations based on state
    switch (this.guardianState) {
      case 'MANIFESTING':
        // Fade in
        this.guardianMesh.material.opacity = THREE.MathUtils.lerp(this.guardianMesh.material.opacity, 0.8, dt * 0.5);
        this.guardianAura.material.opacity = THREE.MathUtils.lerp(this.guardianAura.material.opacity, 0.6, dt * 0.5);
        this.guardianLight.intensity = THREE.MathUtils.lerp(this.guardianLight.intensity, 2, dt * 0.5);
        this.guardianGroup.position.y = 3 + baseFloat;
        this.guardianAura.rotation.z += dt;
        
        if (this.guardianMesh.material.opacity > 0.75) {
          this.guardianState = 'OBSERVING';
          gameState.manifestGuardianL11();
          
          // Add guardian to interactables once manifested
          this.interactables.push({
            mesh: this.guardianMesh,
            prompt: '[E] SPEAK WITH GUARDIAN',
            range: 6,
            action: () => {
              if (this.guardianState === 'OBSERVING') {
                this.guardianState = 'RECOGNIZING';
                gameState.recognizePlayerL11();
                gameState.triggerGuideDialogue({
                  speakerName: 'DIVINE GUARDIAN',
                  message: 'You have driven the darkness from this sacred place. I am the remnant of its ancient light.'
                });
                setTimeout(() => {
                  gameState.triggerGuideDialogue({
                    speakerName: 'DIVINE GUARDIAN',
                    message: 'I shall lend you my strength until you are safely outside.'
                  });
                  this.guardianState = 'COMPANION';
                  gameState.joinGuardianL11();
                }, 4000);
              }
            }
          });
        }
        break;

      case 'OBSERVING':
      case 'RECOGNIZING':
        this.guardianGroup.position.y = 3 + baseFloat;
        this.guardianAura.rotation.z += dt * 0.5;
        // Slowly rotate to face player
        const targetRot = Math.atan2(this.player.position.x - this.guardianGroup.position.x, this.player.position.z - this.guardianGroup.position.z);
        this.guardianGroup.rotation.y = THREE.MathUtils.lerp(this.guardianGroup.rotation.y, targetRot, dt * 2);
        break;

      case 'COMPANION':
        // Follow player gracefully
        const followTarget = this.player.position.clone();
        // Hover behind and above
        const offset = new THREE.Vector3(0, 0, 4).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
        followTarget.add(offset);
        followTarget.y = 3 + baseFloat;

        this.guardianGroup.position.lerp(followTarget, dt * 2);
        this.guardianAura.rotation.z += dt * 1.5;
        break;
    }
  }

  checkExit() {
    if (gameState.state.exitObjectiveStarted && this.exitPortal) {
      const dist = this.player.position.distanceTo(this.exitPortal.position);
      if (dist < 3.0) {
        // Complete the level!
        if (!gameState.state.level11Completed) {
          gameState.completeLevel11();
        }
      }
    }
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    this.updatePlayerPhysics(dt);
    this.updateRaycaster();
    this.updateGuardian(dt);
    this.checkExit();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
    
    this.scene.clear();
    this.renderer.dispose();
  }
}
