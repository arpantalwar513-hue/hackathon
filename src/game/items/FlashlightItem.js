import * as THREE from 'three';
import { textureFactory } from '../textures/ProceduralTextures.js';

export class FlashlightItem {
  constructor(x, y, z) {
    this.initialPosition = new THREE.Vector3(x, y, z);
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.initialPosition);

    this.isPickedUp = false;
    this.build3DTorch();
  }

  build3DTorch() {
    const housingTex = textureFactory.getTorchHousingTexture();
    const emitterTex = textureFactory.getTorchEmitterTexture();

    const torchMat = new THREE.MeshStandardMaterial({
      map: housingTex,
      roughness: 0.55,
      metalness: 0.45,
      color: 0x22262d,
    });

    const emitterMat = new THREE.MeshStandardMaterial({
      map: emitterTex,
      roughness: 0.3,
      emissive: 0xffd977,
      emissiveIntensity: 0.85,
    });

    const torchGroup = new THREE.Group();

    // 1. Main Heavy-Duty Box Body
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.28, 0.58);
    const body = new THREE.Mesh(bodyGeo, torchMat);
    body.position.y = 0.14;
    body.castShadow = true;
    torchGroup.add(body);

    // 2. Rugged Protective Bumpers (Front and Rear frames)
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.8 });
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.30, 0.06), bumperMat);
    frontBumper.position.set(0, 0.14, 0.28);
    torchGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.30, 0.06), bumperMat);
    rearBumper.position.set(0, 0.14, -0.28);
    torchGroup.add(rearBumper);

    // 3. Front LED Emitter Window
    const emitterGeo = new THREE.PlaneGeometry(0.24, 0.22);
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.position.set(0, 0.14, 0.312);
    torchGroup.add(emitter);

    // 4. Heavy Top Carrying Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.6, metalness: 0.6 });
    // Left post
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.06), handleMat);
    postL.position.set(0, 0.32, -0.14);
    torchGroup.add(postL);

    // Right post
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.06), handleMat);
    postR.position.set(0, 0.32, 0.14);
    torchGroup.add(postR);

    // Top crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.34, 8), handleMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(0, 0.37, 0);
    torchGroup.add(crossbar);

    // 5. Red Safety Switch on side
    const switchMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.4 });
    const switchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.05), switchMat);
    switchMesh.position.set(0.17, 0.18, 0.08);
    torchGroup.add(switchMesh);

    // Resting orientation (angled slightly on ground)
    torchGroup.rotation.y = -0.42;
    this.mesh.add(torchGroup);
    this.torchGroup = torchGroup;

    // Subtle warm ground glow from lantern in standby
    this.standbyLight = new THREE.PointLight(0xffe28a, 1.8, 4.2, 1.5);
    this.standbyLight.position.set(0, 0.25, 0.4);
    this.mesh.add(this.standbyLight);

    // Bounding box collider/interaction proxy
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.9, 1.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 0.2;
    this.mesh.add(hitBox);

    // User Data for raycasting
    this.mesh.userData = {
      id: 'flashlight',
      label: 'Flashlight',
      prompt: '[E] Pick Up Torch (Flashlight)',
      action: null, // assigned by scene
    };
  }

  update(delta, elapsed) {
    if (this.isPickedUp || !this.mesh.visible) return;

    // Subtle lantern standby breathing pulse
    if (this.standbyLight) {
      this.standbyLight.intensity = 1.6 + Math.sin(elapsed * 2.8) * 0.4;
    }
  }

  hide() {
    this.isPickedUp = true;
    this.mesh.visible = false;
    if (this.standbyLight) this.standbyLight.intensity = 0;
  }
}
