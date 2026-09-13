import * as THREE from 'three';
import { textureFactory } from '../textures/ProceduralTextures.js';

/**
 * ExpeditionWatch: The friend's dropped vintage pocket watch / compass.
 * A crucial personal clue dropped in the hidden crypt passage.
 * Fully compatible with the First-Person Object Attraction & Hold system.
 */
export class ExpeditionWatch {
  static create(x = 0, y = 0, z = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const dialTex = textureFactory.getExpeditionWatchTexture();

    // 1. Aged Antique Brass Casing Material
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc8963e,
      roughness: 0.38,
      metalness: 0.82,
    });

    // 2. Main Watch Body (Heavy circular watch case)
    const caseGeo = new THREE.CylinderGeometry(0.22, 0.23, 0.06, 32);
    const watchCase = new THREE.Mesh(caseGeo, brassMat);
    watchCase.castShadow = true;
    watchCase.receiveShadow = true;
    group.add(watchCase);

    // Beveled outer ring
    const rimGeo = new THREE.TorusGeometry(0.22, 0.022, 16, 32);
    const rim = new THREE.Mesh(rimGeo, brassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.025;
    group.add(rim);

    // 3. Dial Face with numerals, compass rose, and hands
    const dialGeo = new THREE.CircleGeometry(0.205, 32);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.45,
      metalness: 0.15,
    });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.032;
    group.add(dial);

    // 4. Protective Watch Crystal Glass Lens
    const glassGeo = new THREE.CircleGeometry(0.21, 32);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.08,
      metalness: 0.1,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = -Math.PI / 2;
    glass.position.y = 0.036;
    group.add(glass);

    // 5. Crown Winder & Hanging Ring Loop
    const crownGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 16);
    const crown = new THREE.Mesh(crownGeo, brassMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(0.24, 0, 0);
    group.add(crown);

    const loopGeo = new THREE.TorusGeometry(0.05, 0.012, 12, 24);
    const loop = new THREE.Mesh(loopGeo, brassMat);
    loop.rotation.y = Math.PI / 2;
    loop.position.set(0.29, 0, 0);
    group.add(loop);

    // 6. Weathered Leather Strap / Fob
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Dark brown leather
      roughness: 0.85,
      metalness: 0.05,
    });
    const strapGeo = new THREE.BoxGeometry(0.065, 0.012, 0.32);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0.42, -0.015, 0);
    strap.rotation.y = 0.2;
    group.add(strap);

    // 7. Subtle mysterious golden glint so player notices it in the dark crypt
    const glint = new THREE.PointLight(0xf59e0b, 1.8, 5.0, 1.8);
    glint.position.set(0, 0.25, 0);
    group.add(glint);

    // Set interactive userData for pickup and hold
    group.userData = {
      label: "Friend's Expedition Watch",
      isPickupable: true,
      prompt: "[E] EXAMINE FRIEND'S WATCH",
      type: 'friend_watch',
    };

    return group;
  }
}
