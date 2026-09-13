import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager.js';

export const AI_STATES = {
  IDLE: 'IDLE',
  WATCH: 'WATCH',
  FOLLOW: 'FOLLOW',
  CHASE: 'CHASE',
  RETREAT: 'RETREAT',
  VANISHED: 'VANISHED',
};

/**
 * EntityAI: Lightweight adaptive State Machine AI for the Supernatural Entity in Level 3.
 * Manages states: IDLE, WATCH, FOLLOW, CHASE, RETREAT, and VANISHED.
 * Adapts speed and aggression dynamically based on player sprint, speed, flashlight, and distance.
 */
export class EntityAI {
  constructor(scene, player, waypoints = []) {
    this.scene = scene;
    this.player = player; // Reference to player state { position, isSprinting, velocity, flashlight }
    this.waypoints = waypoints;
    this.currentWaypointIndex = 0;

    this.state = AI_STATES.IDLE;
    this.previousState = AI_STATES.IDLE;

    // Movement & Adaptation Parameters
    this.position = new THREE.Vector3(0, 1.8, -50);
    this.targetPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.baseSpeed = 3.6;
    this.chaseSpeed = 7.2; // Player sprint is 9.2, standard speed is 5.8
    this.currentSpeed = 3.6;
    this.aggressionFactor = 1.0;

    // Player Behavior Tracking
    this.playerSprintTimer = 0;
    this.playerStillTimer = 0;
    this.heartbeatTimer = 0;
    this.whisperTimer = 0;
    this.floatTimer = 0;

    // Visibility & Fade
    this.targetOpacity = 0.92;
    this.currentOpacity = 0.0;
    this.isVanishing = false;
    this.isReappearing = false;

    // Build the 3D Supernatural Entity Model
    this.mesh = this.buildEntityMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  buildEntityMesh() {
    const root = new THREE.Group();

    // 1. Ghostly Ethereal Cloak Material (Dark void with subtle rim edge glow for recognizable silhouette)
    this.cloakMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e17,
      emissive: 0x160814,
      emissiveIntensity: 0.35,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });

    // Main hooded shroud (elongated hollow supernatural figure)
    const shroudGeo = new THREE.ConeGeometry(0.75, 2.6, 16, 8, true);
    this.shroudMesh = new THREE.Mesh(shroudGeo, this.cloakMat);
    this.shroudMesh.position.y = 1.3;
    root.add(this.shroudMesh);

    // Inner shadow torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.6, 16);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.cloakMat);
    this.torsoMesh.position.y = 1.2;
    root.add(this.torsoMesh);

    // Hood / Cowl head
    const hoodGeo = new THREE.SphereGeometry(0.38, 16, 16);
    this.hoodMesh = new THREE.Mesh(hoodGeo, this.cloakMat);
    this.hoodMesh.position.y = 2.15;
    root.add(this.hoodMesh);

    // 2. Piercing Glowing Eyes (Eerie Red/Cyan twin embers)
    this.eyesMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.0,
    });

    const eyeGeo = new THREE.SphereGeometry(0.045, 12, 12);
    this.leftEye = new THREE.Mesh(eyeGeo, this.eyesMat);
    this.leftEye.position.set(-0.11, 2.18, -0.32);
    root.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyesMat);
    this.rightEye.position.set(0.11, 2.18, -0.32);
    root.add(this.rightEye);

    // Eye glow point light (increased range and presence)
    this.eyeGlow = new THREE.PointLight(0xd97706, 0.0, 5.5, 1.8);
    this.eyeGlow.position.set(0, 2.18, -0.4);
    root.add(this.eyeGlow);

    // 3. Dark Shadow Tendrils extending downwards
    this.tendrilGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tGeo = new THREE.BoxGeometry(0.06, 0.9, 0.06);
      const tendril = new THREE.Mesh(tGeo, this.cloakMat);
      tendril.position.set(Math.cos(angle) * 0.35, 0.45, Math.sin(angle) * 0.35);
      tendril.rotation.z = (Math.random() - 0.5) * 0.2;
      this.tendrilGroup.add(tendril);
    }
    root.add(this.tendrilGroup);

    return root;
  }

  setState(newState) {
    if (this.state === newState) return;
    this.previousState = this.state;
    this.state = newState;

    if (newState === AI_STATES.WATCH) {
      this.targetOpacity = 0.88;
      this.eyesMat.color.setHex(0xf59e0b); // Ominous amber watcher
    } else if (newState === AI_STATES.FOLLOW) {
      this.targetOpacity = 0.92;
      this.eyesMat.color.setHex(0xf97316); // Alert orange stalker
    } else if (newState === AI_STATES.CHASE) {
      this.targetOpacity = 1.0;
      this.eyesMat.color.setHex(0xdc2626); // Furious crimson predator
      soundManager.startChaseDrone();
    } else if (newState === AI_STATES.RETREAT || newState === AI_STATES.VANISHED) {
      this.targetOpacity = 0.0;
      soundManager.stopChaseDrone();
    }
  }

  vanish(duration = 0.6) {
    this.isVanishing = true;
    this.targetOpacity = 0.0;
    setTimeout(() => {
      this.isVanishing = false;
      this.setState(AI_STATES.VANISHED);
      this.mesh.visible = false;
    }, duration * 1000);
  }

  reappear(newPos, duration = 0.8) {
    if (newPos) {
      this.position.copy(newPos);
      this.mesh.position.copy(newPos);
    }
    this.mesh.visible = true;
    this.isReappearing = true;
    this.targetOpacity = 0.92;
    setTimeout(() => {
      this.isReappearing = false;
    }, duration * 1000);
  }

  update(delta) {
    if (!this.player || !this.player.position) return;

    this.floatTimer += delta * 2.2;
    const pPos = this.player.position;
    const distToPlayer = this.position.distanceTo(pPos);

    // --- 1. Track Player Behavior & Adapt AI Parameters ---
    const isPlayerSprinting = this.player.isSprinting;
    const isPlayerMoving = this.player.velocity && (Math.abs(this.player.velocity.x) > 0.1 || Math.abs(this.player.velocity.z) > 0.1);

    if (isPlayerSprinting) {
      this.playerSprintTimer += delta;
      this.playerStillTimer = 0;
      // Continuous sprint increases entity aggression slightly (up to +15%)
      this.aggressionFactor = THREE.MathUtils.clamp(1.0 + this.playerSprintTimer * 0.025, 1.0, 1.18);
    } else if (!isPlayerMoving) {
      this.playerStillTimer += delta;
      this.playerSprintTimer = Math.max(0, this.playerSprintTimer - delta * 2);
      this.aggressionFactor = 1.0;
    } else {
      this.playerSprintTimer = Math.max(0, this.playerSprintTimer - delta);
      this.playerStillTimer = 0;
      this.aggressionFactor = 1.0;
    }

    // --- 2. State Machine Logic & Dynamic Reactions ---
    switch (this.state) {
      case AI_STATES.IDLE:
        // Stand still, wait for player proximity
        if (distToPlayer < 24.0) {
          this.setState(AI_STATES.WATCH);
        }
        break;

      case AI_STATES.WATCH:
        // Watch player from distance. If player stays still too long, entity creeps closer
        if (this.playerStillTimer > 4.5 && distToPlayer > 12.0) {
          const dir = new THREE.Vector3().subVectors(pPos, this.position).normalize();
          this.position.addScaledVector(dir, delta * 1.2);
        }
        // Face the player
        this.lookTowards(pPos, delta * 4.0);
        break;

      case AI_STATES.FOLLOW: {
        // Stalk the player along waypoints or directly, maintaining a 7-12m buffer
        const desiredBuffer = isPlayerSprinting ? 6.5 : 9.5;
        this.currentSpeed = this.baseSpeed * this.aggressionFactor;

        this.lookTowards(pPos, delta * 3.5);

        if (distToPlayer > desiredBuffer) {
          const moveDir = this.getNextMoveDirection(pPos);
          this.position.addScaledVector(moveDir, this.currentSpeed * delta);
        }

        // Periodic sinister whisper audio
        this.whisperTimer += delta;
        if (this.whisperTimer > 8.0 && distToPlayer < 18.0) {
          this.whisperTimer = 0;
          soundManager.playEntityWhisper();
        }
        break;
      }

      case AI_STATES.CHASE: {
        // Dynamic Pursuit Sequence
        this.currentSpeed = this.chaseSpeed * this.aggressionFactor;
        this.lookTowards(pPos, delta * 5.0);

        const moveDir = this.getNextMoveDirection(pPos);
        this.position.addScaledVector(moveDir, this.currentSpeed * delta);

        // Cardiac Heartbeat Audio (accelerates when closer)
        this.heartbeatTimer += delta;
        const heartbeatInterval = THREE.MathUtils.lerp(0.42, 0.85, THREE.MathUtils.clamp(distToPlayer / 20.0, 0, 1));
        if (this.heartbeatTimer >= heartbeatInterval) {
          this.heartbeatTimer = 0;
          soundManager.playHeartbeat(true);
        }

        // Distance protection: entity never teleports or clips right into player's camera
        if (distToPlayer < 3.2) {
          const pushBack = new THREE.Vector3().subVectors(this.position, pPos).normalize();
          this.position.addScaledVector(pushBack, (3.2 - distToPlayer));
        }
        break;
      }

      case AI_STATES.RETREAT: {
        // Move backward into shadows
        const retreatDir = new THREE.Vector3().subVectors(this.position, pPos).normalize();
        this.position.addScaledVector(retreatDir, delta * 4.0);
        if (distToPlayer > 30.0) {
          this.vanish();
        }
        break;
      }

      case AI_STATES.VANISHED:
        // Inactive
        break;
    }

    // --- 3. Smooth Floating Sine Wave Animation ---
    const bobOffset = Math.sin(this.floatTimer) * 0.12;
    this.mesh.position.set(this.position.x, this.position.y + bobOffset, this.position.z);

    // Animate shadowy tendrils
    if (this.tendrilGroup) {
      this.tendrilGroup.children.forEach((tendril, idx) => {
        tendril.rotation.z = Math.sin(this.floatTimer * 1.5 + idx) * 0.18;
      });
    }

    // --- 4. Smooth Fade Interpolation ---
    this.currentOpacity = THREE.MathUtils.lerp(this.currentOpacity, this.targetOpacity, delta * 4.5);
    if (this.cloakMat) this.cloakMat.opacity = this.currentOpacity;
    if (this.eyesMat) this.eyesMat.opacity = this.currentOpacity;
    if (this.eyeGlow) this.eyeGlow.intensity = this.currentOpacity * 2.8;
  }

  getNextMoveDirection(targetPos) {
    // If waypoints are provided, navigate smoothly along corridor waypoints toward target
    if (this.waypoints.length > 0) {
      const wp = this.waypoints[this.currentWaypointIndex];
      const distToWp = this.position.distanceTo(wp);

      if (distToWp < 2.5) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
      return new THREE.Vector3().subVectors(wp, this.position).normalize();
    }

    // Otherwise navigate directly towards target on XZ plane
    const dir = new THREE.Vector3().subVectors(targetPos, this.position);
    dir.y = 0;
    if (dir.lengthSq() > 0) dir.normalize();
    return dir;
  }

  lookTowards(targetPos, lerpSpeed) {
    const targetAngle = Math.atan2(targetPos.x - this.position.x, targetPos.z - this.position.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, THREE.MathUtils.clamp(lerpSpeed, 0, 1));
  }

  destroy() {
    soundManager.stopChaseDrone();
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}
