import * as THREE from 'three';

/**
 * TempleKeyItem represents the antique golden skeleton key shown in Reference Image 2:
 * - Crown/trefoil ornate bow with filigree loops
 * - Turned brass/gold collars and ring details
 * - Cylindrical solid shank
 * - Precision notched skeleton key bit
 * - Warm golden glow and floating micro-animation
 */
export class TempleKeyItem {
  constructor(x, y, z) {
    this.initialPosition = new THREE.Vector3(x, y, z);
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.initialPosition);

    this.isPickedUp = false;
    this.buildAntiqueGoldenKey();
  }

  buildAntiqueGoldenKey() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b738,
      metalness: 0.94,
      roughness: 0.18,
      emissive: 0x664408,
      emissiveIntensity: 0.35,
    });

    const darkGoldMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.9,
      roughness: 0.3,
    });

    const keyGroup = new THREE.Group();

    // 1. Ornate Bow (Crown / Trefoil Skeleton Key Handle)
    const bowGroup = new THREE.Group();
    bowGroup.position.y = 0.28;

    // Main circular central loop
    const centerRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.024, 16, 32), goldMat);
    centerRing.castShadow = true;
    bowGroup.add(centerRing);

    // Left & Right lobed rings (trefoil / cartouche)
    const leftLobe = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 14, 24), goldMat);
    leftLobe.position.set(-0.11, 0.05, 0);
    bowGroup.add(leftLobe);

    const rightLobe = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 14, 24), goldMat);
    rightLobe.position.set(0.11, 0.05, 0);
    bowGroup.add(rightLobe);

    // Top crown crest / finial tip
    const crownTop = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 8), goldMat);
    crownTop.position.set(0, 0.19, 0);
    bowGroup.add(crownTop);

    // Small spheres on lobe crests
    [-0.11, 0.11].forEach(lx => {
      const tipSph = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), goldMat);
      tipSph.position.set(lx, 0.13, 0);
      bowGroup.add(tipSph);
    });

    keyGroup.add(bowGroup);

    // 2. Upper Turned Collars & Neck Ring
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.08, 16), goldMat);
    neck.position.y = 0.12;
    keyGroup.add(neck);

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.014, 12, 24), darkGoldMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.14;
    keyGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 12, 24), darkGoldMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.09;
    keyGroup.add(ring2);

    // 3. Main Shaft / Stem (Cylindrical classical shank)
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.52, 16), goldMat);
    shank.position.y = -0.19;
    shank.castShadow = true;
    keyGroup.add(shank);

    // Lower Collar Ring
    const lowerRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.01, 12, 20), darkGoldMat);
    lowerRing.rotation.x = Math.PI / 2;
    lowerRing.position.y = -0.36;
    keyGroup.add(lowerRing);

    // 4. Bit / Flange (Classical skeleton key notches)
    const bitShape = new THREE.Shape();
    bitShape.moveTo(0, 0);
    bitShape.lineTo(0.16, 0);
    bitShape.lineTo(0.16, 0.07);
    bitShape.lineTo(0.08, 0.07);
    bitShape.lineTo(0.08, 0.12);
    bitShape.lineTo(0.15, 0.12);
    bitShape.lineTo(0.15, 0.20);
    bitShape.lineTo(0, 0.20);
    bitShape.closePath();

    const extrudeSettings = { depth: 0.026, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 };
    const bitGeo = new THREE.ExtrudeGeometry(bitShape, extrudeSettings);
    const bit = new THREE.Mesh(bitGeo, goldMat);
    bit.position.set(0.015, -0.44, -0.013);
    bit.castShadow = true;
    keyGroup.add(bit);

    // Rounded tip at base of shank
    const tipEnd = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 12), goldMat);
    tipEnd.position.y = -0.45;
    keyGroup.add(tipEnd);

    // Orientation & resting angle on the prasad counter
    keyGroup.scale.set(0.95, 0.95, 0.95);
    keyGroup.rotation.x = Math.PI / 2.3;
    keyGroup.rotation.z = 0.4;

    this.mesh.add(keyGroup);
    this.keyGroup = keyGroup;

    // Golden ambient point light
    this.glowLight = new THREE.PointLight(0xfacc15, 2.2, 3.8, 1.4);
    this.glowLight.position.set(0, 0.25, 0);
    this.mesh.add(this.glowLight);

    // Bounding box collider/interaction proxy (Transparent raycastable material)
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitBox.position.y = 0.2;
    this.mesh.add(hitBox);
    this.hitBox = hitBox;

    // User Data for raycasting & interaction
    this.mesh.userData = {
      id: 'templeKey',
      label: 'Temple Key',
      prompt: '[E] PICK UP KEY',
      action: null,
    };
    hitBox.userData = this.mesh.userData;
  }

  update(delta, elapsed) {
    if (this.isPickedUp || !this.mesh.visible) return;

    // Gentle floating bob and golden pulse
    this.keyGroup.rotation.y = Math.sin(elapsed * 1.6) * 0.2 + 0.4;
    this.mesh.position.y = this.initialPosition.y + Math.sin(elapsed * 2.4) * 0.035;
    this.glowLight.intensity = 1.8 + Math.sin(elapsed * 3.8) * 0.5;
  }

  hide() {
    this.isPickedUp = true;
    this.mesh.visible = false;
    if (this.glowLight) this.glowLight.intensity = 0;
  }
}
