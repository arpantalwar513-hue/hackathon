import * as THREE from 'three';
import { textureFactory } from '../textures/ProceduralTextures.js';

/**
 * CompanionRelic: The ancient awakened crystalline AI core left behind
 * by the hooded figure in Level 4. Supports first-person inspection
 * and floating shoulder-companion mode.
 */
export class CompanionRelic {
  static create(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const coreTex = textureFactory.getCrystallineCoreTexture();

    // 1. Ancient Gold Filigree Gimbal / Cage
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Outer gimbal ring
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.016, 16, 32), goldMat);
    outerRing.rotation.x = Math.PI / 2;
    group.add(outerRing);

    // Inner gimbal ring
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 16, 32), goldMat);
    innerRing.rotation.y = Math.PI / 3;
    group.add(innerRing);

    // 2. Central Luminescent Crystal Core (Octahedron / Icosahedron)
    const crystalMat = new THREE.MeshStandardMaterial({
      map: coreTex,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.95,
    });

    const crystalGeo = new THREE.OctahedronGeometry(0.12, 1);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    group.add(crystal);

    // 3. Floating Orbital Runes
    const runeOrbit = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const rMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.04, 0.015),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
      );
      rMesh.position.set(Math.cos(angle) * 0.28, Math.sin(angle) * 0.06, Math.sin(angle) * 0.28);
      runeOrbit.add(rMesh);
    }
    group.add(runeOrbit);

    // 4. Soft Cyan Guiding Light (Illuminates player's immediate surroundings)
    const companionLight = new THREE.PointLight(0x38bdf8, 2.2, 7.5, 1.8);
    companionLight.position.set(0, 0.05, 0);
    group.add(companionLight);

    // Store references on group for dynamic animation in scene loop
    group.userData = {
      label: 'Awakened Companion Core',
      isPickupable: true,
      prompt: '[E] AWAKEN COMPANION CORE',
      type: 'companion_core',
      crystal,
      outerRing,
      innerRing,
      runeOrbit,
      companionLight,
    };

    return group;
  }
}
