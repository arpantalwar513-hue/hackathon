import * as THREE from 'three';
import { textureFactory } from '../textures/ProceduralTextures.js';

export class FirstPersonFlashlight {
  constructor(camera) {
    this.camera = camera;
    this.root = new THREE.Group();
    this.equipped = false;
    this.isOn = false;

    // Resting transform in camera space (bottom right)
    this.basePosition = new THREE.Vector3(0.32, -0.28, -0.62);
    this.baseRotation = new THREE.Euler(0.08, -0.15, 0.05);

    this.currentOffset = new THREE.Vector3();
    this.targetOffset = new THREE.Vector3();

    this.swayYaw = 0;
    this.swayPitch = 0;

    this.build3DHandAndTorch();
    this.setupLights();

    this.root.visible = false;
    this.camera.add(this.root);
  }

  build3DHandAndTorch() {
    let housingTex = null;
    let emitterTex = null;
    try {
      if (textureFactory && typeof textureFactory.getTorchHousingTexture === 'function') {
        housingTex = textureFactory.getTorchHousingTexture();
      }
      if (textureFactory && typeof textureFactory.getTorchEmitterTexture === 'function') {
        emitterTex = textureFactory.getTorchEmitterTexture();
      }
    } catch (e) {
      console.warn('Flashlight texture loading fallback:', e);
    }

    const torchMat = new THREE.MeshStandardMaterial({
      map: housingTex || undefined,
      roughness: 0.55,
      metalness: 0.45,
      color: 0x22262d,
    });

    const emitterMat = new THREE.MeshStandardMaterial({
      map: emitterTex || undefined,
      roughness: 0.25,
      emissive: 0xfff0b3,
      emissiveIntensity: 1.2,
      color: 0xfff0b3,
    });
    this.emitterMat = emitterMat;

    const handMat = new THREE.MeshStandardMaterial({
      color: 0xc48c66, // Realistic natural skin tone
      roughness: 0.72,
      metalness: 0.08,
    });

    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x1a212d, // Dark dark exploration jacket sleeve
      roughness: 0.85,
    });

    this.holderGroup = new THREE.Group();

    // --- 1. Flashlight 3D Model ---
    const torchGroup = new THREE.Group();

    // Main rectangular body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.32), torchMat);
    body.castShadow = false;
    torchGroup.add(body);

    // Front bezel
    const frontBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.17, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.8 })
    );
    frontBezel.position.set(0, 0, -0.16);
    torchGroup.add(frontBezel);

    // Front LED Emitter Window
    const emitter = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.13), emitterMat);
    emitter.rotation.y = Math.PI; // Face forward along -Z
    emitter.position.set(0, 0, -0.181);
    torchGroup.add(emitter);

    // Top carrying handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.6, metalness: 0.6 });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.03), handleMat);
    postL.position.set(0, 0.11, -0.07);
    torchGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.03), handleMat);
    postR.position.set(0, 0.11, 0.07);
    torchGroup.add(postR);

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), handleMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(0, 0.14, 0);
    torchGroup.add(crossbar);

    this.holderGroup.add(torchGroup);

    // --- 2. Player Hand & Arm Holding Torch ---
    const armGroup = new THREE.Group();

    // Forearm / Jacket Sleeve
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.45, 12), sleeveMat);
    sleeve.rotation.x = 0.85;
    sleeve.rotation.z = -0.35;
    sleeve.position.set(0.14, -0.22, 0.22);
    armGroup.add(sleeve);

    // Wrist
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.12, 10), handMat);
    wrist.rotation.x = 0.85;
    wrist.rotation.z = -0.35;
    wrist.position.set(0.09, -0.12, 0.1);
    armGroup.add(wrist);

    // Palm & Hand Grip around flashlight
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.14), handMat);
    palm.position.set(0.07, -0.04, 0.02);
    palm.rotation.y = -0.2;
    armGroup.add(palm);

    // Fingers curled over handle / body
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.025, 0.08), handMat);
      finger.position.set(0.01, 0.055, -0.06 + f * 0.035);
      finger.rotation.x = 0.25;
      armGroup.add(finger);
    }

    // Thumb pressed along side
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.06, 0.03), handMat);
    thumb.position.set(0.095, 0.03, -0.02);
    thumb.rotation.z = 0.4;
    armGroup.add(thumb);

    this.holderGroup.add(armGroup);
    this.root.add(this.holderGroup);

    this.holderGroup.position.copy(this.basePosition);
    this.holderGroup.rotation.copy(this.baseRotation);
  }

  setupLights() {
    // Powerful Forward SpotLight (Calibrated reach and focused cone)
    this.spotLight = new THREE.SpotLight(0xfff5dd, 5.5, 75, Math.PI / 5.0, 0.42, 1.2);
    this.spotLight.position.set(0.32, -0.26, -0.65);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 0.5;
    this.spotLight.shadow.camera.far = 75;
    this.spotLight.shadow.bias = -0.0003;

    // The spotlight target must be added to the camera so it stays aimed forward
    this.spotLightTarget = new THREE.Object3D();
    this.spotLightTarget.position.set(0.32, -0.26, -20);
    this.camera.add(this.spotLightTarget);
    this.spotLight.target = this.spotLightTarget;

    this.camera.add(this.spotLight);

    // Soft Close-Range Fill Light (illuminates floor and immediate objects)
    this.fillLight = new THREE.PointLight(0xffeedd, 1.2, 6.0, 1.5);
    this.fillLight.position.set(0.32, -0.26, -0.65);
    this.camera.add(this.fillLight);

    // Initially disabled
    this.spotLight.intensity = 0;
    this.fillLight.intensity = 0;
  }

  equip() {
    this.equipped = true;
    this.root.visible = true;
    this.turnOn();
  }

  unequip() {
    this.turnOff();
    this.equipped = false;
    this.root.visible = false;
  }

  turnOn() {
    this.isOn = true;
    this.equipped = true;
    this.root.visible = true;
    if (this.spotLight) {
      this.spotLight.intensity = 5.5;
    }
    if (this.fillLight) {
      this.fillLight.intensity = 1.2;
    }
    if (this.emitterMat) {
      this.emitterMat.emissiveIntensity = 1.2;
    }
    return true;
  }

  turnOff() {
    this.isOn = false;
    if (this.spotLight) {
      this.spotLight.intensity = 0;
    }
    if (this.fillLight) {
      this.fillLight.intensity = 0;
    }
    if (this.emitterMat) {
      this.emitterMat.emissiveIntensity = 0;
    }
    // Preserves the 3D flashlight object in hand; only disables beam and LED emitter
    return false;
  }

  toggle() {
    if (this.isOn) {
      return this.turnOff();
    } else {
      return this.turnOn();
    }
  }

  update(delta, isMoving, isSprinting, headBobTimer, mouseDeltaX = 0, mouseDeltaY = 0) {
    if (!this.equipped || !this.root.visible) return;

    // 1. Mouse Look Sway (natural lag when turning)
    this.swayYaw = THREE.MathUtils.lerp(this.swayYaw, -mouseDeltaX * 0.0006, delta * 12);
    this.swayPitch = THREE.MathUtils.lerp(this.swayPitch, -mouseDeltaY * 0.0006, delta * 12);

    // 2. Walking / Sprinting Inertia & Bobbing
    let bobX = 0;
    let bobY = 0;
    let bobRotZ = 0;

    if (isMoving) {
      const bobMult = isSprinting ? 1.6 : 1.0;
      bobX = Math.cos(headBobTimer * 0.5) * 0.018 * bobMult;
      bobY = Math.abs(Math.sin(headBobTimer)) * 0.022 * bobMult;
      bobRotZ = Math.sin(headBobTimer * 0.5) * 0.04 * bobMult;
    } else {
      // Idle breathing
      const time = performance.now() * 0.0018;
      bobY = Math.sin(time) * 0.004;
      bobRotZ = Math.sin(time * 0.8) * 0.008;
    }

    this.targetOffset.set(
      this.basePosition.x + bobX + this.swayYaw,
      this.basePosition.y - bobY + this.swayPitch,
      this.basePosition.z
    );

    this.holderGroup.position.lerp(this.targetOffset, delta * 14);
    this.holderGroup.rotation.set(
      this.baseRotation.x + this.swayPitch * 1.5,
      this.baseRotation.y + this.swayYaw * 1.5,
      this.baseRotation.z + bobRotZ
    );
  }

  destroy() {
    if (this.camera) {
      this.camera.remove(this.root);
      if (this.spotLight) this.camera.remove(this.spotLight);
      if (this.spotLightTarget) this.camera.remove(this.spotLightTarget);
      if (this.fillLight) this.camera.remove(this.fillLight);
    }
  }
}
