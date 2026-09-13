import * as THREE from 'three';
import { soundManager } from './audio/SoundManager.js';
import { textureFactory } from './textures/ProceduralTextures.js';
import { gameState } from './systems/GameState.js';
import { FirstPersonFlashlight } from './player/FirstPersonFlashlight.js';

export class Level8Scene {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene    = null;
    this.camera   = null;
    this.renderer = null;
    this.clock    = new THREE.Clock();

    // ─── Player Controller ───
    this.player = {
      position:      new THREE.Vector3(0, 1.75, 20),
      velocity:      new THREE.Vector3(),
      yaw:           0,
      pitch:         -0.03,
      speed:         6.0,
      sprintSpeed:   12.0, // Used for dash speed
      isDashing:     false,
      dashTimer:     0,
      lastDashTime:  0,
      isGrounded:    true,
      headBobTimer:  0,
      canMove:       true,
      lastAttackTime: 0,
      lastHeavyAttackTime: 0,
    };

    this.shakeIntensity = 0;
    this.keys = { forward: false, backward: false, left: false, right: false, dash: false };
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

    // ─── Combat & Boss ───
    this.bossGroup = null;
    this.bossMesh = null;
    this.bossState = 'IDLE'; // IDLE, CHASE, ATTACK, COOLDOWN, HURT, DEFEATED
    this.bossTimer = 0;
    this.bossSpeed = 3.5;
    this.bossCollider = null;

    this.projectiles = [];
    this.bossProjectiles = [];
    this.particles = [];
    
    this.relicMesh = null;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    // Afternoon / Sunset vibe instead of dark
    this.scene.background = new THREE.Color(0x3a2015);
    this.scene.fog = new THREE.Fog(0x3a2015, 10, 40);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffddaa, 0.6);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffbb88, 0x111122, 0.5);
    this.scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xff9955, 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Flashlight
    this.firstPersonFlashlight = new FirstPersonFlashlight(this.scene, this.camera);
    if (!gameState.state.flashlightOn) {
      this.firstPersonFlashlight.toggle();
    }

    // Build the World
    this.buildEnvironment();
    this.buildBoss();

    // Event Listeners
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp   = this.handleKeyUp.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onResize = this.handleResize.bind(this);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('resize', this.onResize);

    this.update = this.update.bind(this);
    this.renderer.setAnimationLoop(this.update);
  }

  buildEnvironment() {
    const floorMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneFloorTexture ? textureFactory.getStoneFloorTexture() : null,
      color: 0x5a4a3a,
      roughness: 0.9,
    });
    
    const wallMat = new THREE.MeshStandardMaterial({
      map: textureFactory.getStoneWallTexture ? textureFactory.getStoneWallTexture() : null,
      color: 0x4a3a2a,
      roughness: 1.0,
    });

    // Floor
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Arena walls (Octagon shape)
    const wallGeo = new THREE.BoxGeometry(20, 12, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const wall = new THREE.Mesh(wallGeo, wallMat);
      const radius = 25;
      wall.position.set(Math.sin(angle) * radius, 6, Math.cos(angle) * radius);
      wall.rotation.y = angle;
      wall.receiveShadow = true;
      wall.castShadow = true;
      this.scene.add(wall);
      
      // Approximate colliders
      this.colliders.push({ 
        type: 'box', 
        minX: wall.position.x - 2, maxX: wall.position.x + 2, 
        minZ: wall.position.z - 2, maxZ: wall.position.z + 2 
      });
    }

    // Broken Pillars (Ruins)
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.95 });
    
    const pillarPositions = [
      [-12, -12], [12, -12],
      [-12, 12],  [12, 12]
    ];

    pillarPositions.forEach(pos => {
      const height = 3 + Math.random() * 5;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, height, 8), pillarMat);
      p.position.set(pos[0], height/2, pos[1]);
      p.rotation.x = (Math.random() - 0.5) * 0.2;
      p.rotation.z = (Math.random() - 0.5) * 0.2;
      p.castShadow = true;
      p.receiveShadow = true;
      this.scene.add(p);
      this.colliders.push({ type: 'box', minX: pos[0] - 1.5, maxX: pos[0] + 1.5, minZ: pos[1] - 1.5, maxZ: pos[1] + 1.5 });
    });
  }

  buildBoss() {
    this.bossGroup = new THREE.Group();
    this.bossGroup.position.set(0, 0, -10);
    
    // Corrupted Guardian Mesh
    this.bossMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.5, 3.0, 4, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x110000, 
        emissive: 0x330000,
        roughness: 0.2,
        metalness: 0.8
      })
    );
    this.bossMesh.position.y = 3;
    this.bossMesh.castShadow = true;
    this.bossGroup.add(this.bossMesh);
    
    // Glowing core
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    core.position.set(0, 3.5, 1.2);
    this.bossGroup.add(core);

    const pointLight = new THREE.PointLight(0xff1100, 2.0, 15);
    pointLight.position.set(0, 4, 2);
    this.bossGroup.add(pointLight);

    this.scene.add(this.bossGroup);
    
    this.bossCollider = { type: 'box', minX: -1.5, maxX: 1.5, minZ: -11.5, maxZ: -8.5, active: true };
    this.colliders.push(this.bossCollider);
  }

  spawnRelic() {
    this.relicMesh = new THREE.Group();
    this.relicMesh.position.copy(this.bossGroup.position);
    this.relicMesh.position.y = 1.5;

    const octa = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00aaff, transparent: true, opacity: 0.8 })
    );
    this.relicMesh.add(octa);

    const light = new THREE.PointLight(0x00aaff, 2, 10);
    this.relicMesh.add(light);

    this.scene.add(this.relicMesh);

    this.interactables.push({
      mesh: octa,
      prompt: '[E] RECOVER SPIRITUAL RELIC',
      range: 4,
      action: () => {
        gameState.collectRelicL8();
        this.scene.remove(this.relicMesh);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INPUT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  handleKeyDown(event) {
    if (!this.player.canMove) return;
    switch (event.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'ShiftLeft': 
      case 'ShiftRight': 
        if (!this.player.isDashing && performance.now() - this.player.lastDashTime > 1000) {
          this.startDash();
        }
        break;
      case 'KeyE': this.handleInteract(); break;
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
    }
  }

  handleMouseMove(event) {
    if (!this.isPointerLocked) return;
    this.mouseDeltaX = event.movementX || 0;
    this.mouseDeltaY = event.movementY || 0;
  }

  handleMouseDown(event) {
    if (!this.isPointerLocked && event.button === 0) {
      this.canvas.requestPointerLock();
      this.isPointerLocked = true;
      return;
    }
    
    if (gameState.state.level8Completed || !gameState.state.guardianAwakenedL8) return;

    const now = performance.now();
    if (event.button === 0) { // Left click: Fast attack
      if (now - this.player.lastAttackTime > 400) {
        this.firePlayerAttack(false);
        this.player.lastAttackTime = now;
      }
    } else if (event.button === 2) { // Right click: Heavy attack
      if (now - this.player.lastHeavyAttackTime > 1500) {
        this.firePlayerAttack(true);
        this.player.lastHeavyAttackTime = now;
      }
    }
  }

  startDash() {
    this.player.isDashing = true;
    this.player.dashTimer = 0.2; // 200ms dash
    this.player.lastDashTime = performance.now();
    soundManager.playMechanismClick(); // temporary dash sound
  }

  handleInteract() {
    if (this.hoveredItem) {
      this.hoveredItem.action();
    }
  }

  handleResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. COMBAT LOGIC
  // ═══════════════════════════════════════════════════════════════════════════
  firePlayerAttack(isHeavy) {
    soundManager.playSymbolActivate(); // Temp attack sound
    
    const color = isHeavy ? 0x00ffff : 0xaaffff;
    const speed = isHeavy ? 25 : 40;
    const damage = isHeavy ? 20 : 10;
    const size = isHeavy ? 0.6 : 0.3;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshBasicMaterial({ color: color })
    );

    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.player.pitch, this.player.yaw, 0));
    const pos = this.player.position.clone().add(dir.clone().multiplyScalar(1.5));
    
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh: mesh,
      velocity: dir.multiplyScalar(speed),
      life: 2.0,
      damage: damage,
      isHeavy: isHeavy
    });
    
    this.shakeIntensity = isHeavy ? 0.2 : 0.05;
  }

  fireBossProjectile() {
    soundManager.playHorrorStinger(); 
    
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );

    const pos = this.bossGroup.position.clone().add(new THREE.Vector3(0, 3.5, 0));
    
    // Aim at player
    const dir = this.player.position.clone().sub(pos).normalize();
    mesh.position.copy(pos).add(dir.clone().multiplyScalar(2));
    
    this.scene.add(mesh);

    this.bossProjectiles.push({
      mesh: mesh,
      velocity: dir.multiplyScalar(15),
      life: 3.0,
      damage: 15
    });
  }

  spawnHitParticles(pos, color) {
    for (let i = 0; i < 15; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: color })
      );
      mesh.position.copy(pos);
      
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 + 5,
        (Math.random() - 0.5) * 10
      );
      
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity: v, life: 0.5 });
    }
  }

  updateProjectiles(dt) {
    // Player Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      
      // Boss Collision
      if (gameState.state.guardianAwakenedL8 && !gameState.state.relicSpawnedL8) {
        const dist = p.mesh.position.distanceTo(this.bossGroup.position.clone().setY(p.mesh.position.y));
        if (dist < 2.0) {
          gameState.damageBossL8(p.damage);
          this.spawnHitParticles(p.mesh.position, p.isHeavy ? 0x00ffff : 0xaaffff);
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Boss Projectiles
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      
      // Player Collision (ignore if dashing/i-frames)
      if (!this.player.isDashing) {
        const dist = p.mesh.position.distanceTo(this.player.position);
        if (dist < 1.5) {
          gameState.damagePlayerL8(p.damage);
          this.spawnHitParticles(p.mesh.position, 0xff0000);
          this.scene.remove(p.mesh);
          this.bossProjectiles.splice(i, 1);
          this.shakeIntensity = 0.3;
          continue;
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
    
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.velocity.y -= 20 * dt; // gravity
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.multiplyScalar(0.9);
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  updateBoss(dt) {
    if (gameState.state.relicSpawnedL8) {
      if (this.bossState !== 'DEFEATED') {
        this.bossState = 'DEFEATED';
        this.scene.remove(this.bossGroup);
        this.bossCollider.active = false;
        this.spawnRelic();
      }
      return;
    }

    if (!gameState.state.guardianAwakenedL8) {
      // Awaken if player gets close
      const distToPlayer = this.player.position.distanceTo(this.bossGroup.position);
      if (distToPlayer < 12) {
        gameState.awakenGuardianL8();
        this.bossState = 'CHASE';
      }
      return;
    }

    this.bossTimer -= dt;

    // Face player (Y axis only)
    const targetPos = this.player.position.clone();
    targetPos.y = this.bossGroup.position.y;
    this.bossGroup.lookAt(targetPos);

    const dist = this.bossGroup.position.distanceTo(targetPos);

    switch (this.bossState) {
      case 'CHASE':
        if (dist > 3) {
          const dir = targetPos.clone().sub(this.bossGroup.position).normalize();
          this.bossGroup.position.addScaledVector(dir, this.bossSpeed * dt);
        } else {
          this.bossState = 'ATTACK';
          this.bossTimer = 0.5; // Wind up
        }
        
        // Randomly decide to shoot
        if (Math.random() < 0.01) {
          this.bossState = 'RANGED_ATTACK';
          this.bossTimer = 0.8;
        }
        break;

      case 'ATTACK':
        if (this.bossTimer <= 0) {
          // Execute melee strike
          if (dist < 4.0 && !this.player.isDashing) {
            gameState.damagePlayerL8(25);
            this.shakeIntensity = 0.4;
          }
          this.bossState = 'COOLDOWN';
          this.bossTimer = 1.5;
        }
        break;
        
      case 'RANGED_ATTACK':
        if (this.bossTimer <= 0) {
          this.fireBossProjectile();
          this.bossState = 'COOLDOWN';
          this.bossTimer = 2.0;
        }
        break;

      case 'COOLDOWN':
        if (this.bossTimer <= 0) {
          this.bossState = 'CHASE';
        }
        break;
    }

    // Update Boss Collider Position
    if (this.bossCollider && this.bossCollider.active) {
      this.bossCollider.minX = this.bossGroup.position.x - 1.5;
      this.bossCollider.maxX = this.bossGroup.position.x + 1.5;
      this.bossCollider.minZ = this.bossGroup.position.z - 1.5;
      this.bossCollider.maxZ = this.bossGroup.position.z + 1.5;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MAIN LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.isPointerLocked && this.player.canMove && !gameState.state.level8Completed && gameState.state.playerHealthL8 > 0) {
      this.player.yaw -= this.mouseDeltaX * 0.002;
      this.player.pitch -= this.mouseDeltaY * 0.002;
      this.player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.pitch));
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    } else {
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }

    this.updatePlayerPhysics(dt);
    this.updateProjectiles(dt);
    this.updateBoss(dt);
    this.updateInteractions();

    if (this.relicMesh) {
      this.relicMesh.rotation.y += dt;
      this.relicMesh.position.y = 1.5 + Math.sin(performance.now() * 0.002) * 0.2;
    }

    if (this.firstPersonFlashlight) {
      this.firstPersonFlashlight.update();
    }

    // Camera update with shake
    this.camera.position.copy(this.player.position);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');
    
    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity -= dt * 2.0;
      if (this.shakeIntensity < 0) this.shakeIntensity = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerPhysics(dt) {
    if (!this.player.canMove || gameState.state.level8Completed || gameState.state.playerHealthL8 <= 0) return;

    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }

    const currentSpeed = this.player.isDashing ? this.player.sprintSpeed : this.player.speed;
    const direction = new THREE.Vector3(0, 0, 0);

    if (this.keys.forward) direction.z -= 1;
    if (this.keys.backward) direction.z += 1;
    if (this.keys.left) direction.x -= 1;
    if (this.keys.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);

      const moveX = direction.x * currentSpeed * dt;
      const moveZ = direction.z * currentSpeed * dt;

      this.player.position.x += moveX;
      if (this.checkCollisions()) this.player.position.x -= moveX;

      this.player.position.z += moveZ;
      if (this.checkCollisions()) this.player.position.z -= moveZ;

      if (!this.player.isDashing) {
        this.player.headBobTimer += dt * 10;
        this.player.position.y = 1.75 + Math.sin(this.player.headBobTimer) * 0.05;
      }
    }
  }

  checkCollisions() {
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const radius = 0.5;
    for (const c of this.colliders) {
      if (c.active === false) continue;
      if (c.type === 'box') {
        if (px + radius > c.minX && px - radius < c.maxX &&
            pz + radius > c.minZ && pz - radius < c.maxZ) {
          return true;
        }
      }
    }
    return false;
  }

  updateInteractions() {
    if (gameState.state.level8Completed || gameState.state.playerHealthL8 <= 0) {
      if (gameState.state.interactionPrompt !== null) {
        gameState.setInteractionPrompt(null);
      }
      return;
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes = this.interactables.map(i => i.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const interactable = this.interactables.find(i => 
        i.mesh === hit.object || i.mesh.children.includes(hit.object)
      );

      if (interactable && hit.distance <= interactable.range) {
        if (this.hoveredItem !== interactable) {
          this.hoveredItem = interactable;
          gameState.setInteractionPrompt(interactable.prompt);
        }
        return;
      }
    }

    if (this.hoveredItem) {
      this.hoveredItem = null;
      gameState.setInteractionPrompt(null);
    }
  }

  cleanup() {
    this.renderer.setAnimationLoop(null);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('resize', this.onResize);

    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
    this.renderer.dispose();
  }
}
