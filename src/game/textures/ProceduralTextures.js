import * as THREE from 'three';

// Procedural Canvas Texture Generator for complete offline fidelity & zero missing assets
class TextureFactory {
  constructor() {
    this.cache = new Map();
  }

  createNoise(ctx, width, height, amount = 25) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() - 0.5) * amount;
      data[i] = Math.min(255, Math.max(0, data[i] + v));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + v));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + v));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- 1. Road Texture (Asphalt with white center lines) ---
  getRoadTexture() {
    if (this.cache.has('road')) return this.cache.get('road');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark asphalt base
    ctx.fillStyle = '#22252a';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered asphalt patches
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${25 + Math.random() * 20}, ${28 + Math.random() * 20}, ${32 + Math.random() * 20}, 0.25)`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 15 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // White dashed center line
    ctx.fillStyle = '#e5eaef';
    const dashW = 12;
    const dashH = 70;
    const gap = 55;
    for (let y = 15; y < 512; y += dashH + gap) {
      ctx.fillRect(256 - dashW / 2, y, dashW, dashH);
    }

    // Outer edge solid lines
    ctx.fillStyle = '#d1d8e0';
    ctx.fillRect(35, 0, 8, 512);
    ctx.fillRect(512 - 43, 0, 8, 512);

    this.createNoise(ctx, 512, 512, 30);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('road', texture);
    return texture;
  }

  // --- 2. Highway Curb Texture (Black & White alternating blocks) ---
  getCurbTexture() {
    if (this.cache.has('curb')) return this.cache.get('curb');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const blockW = 64;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#eceff1' : '#263238';
      ctx.fillRect(i * blockW, 0, blockW, 64);
    }
    this.createNoise(ctx, 256, 64, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('curb', texture);
    return texture;
  }

  // --- 3. Grand Entrance Gate Yellow Spotted Arch Texture (Image 1 reference) ---
  getGateYellowTexture() {
    if (this.cache.has('gateYellow')) return this.cache.get('gateYellow');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base golden-yellow
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#e5a823');
    grad.addColorStop(0.5, '#f4ba34');
    grad.addColorStop(1, '#d89b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Decorative dark spots / perforations matching reference gate
    ctx.fillStyle = '#2c2214';
    const rows = 12;
    const cols = 12;
    const rx = 512 / cols;
    const ry = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * rx + rx / 2 + (r % 2) * (rx / 4);
        const cy = r * ry + ry / 2;
        const rad = 7 + (Math.sin(r + c) + 1) * 3;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.createNoise(ctx, 512, 512, 25);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('gateYellow', texture);
    return texture;
  }

  // --- 4. Gate Sign Banner Texture ("HARYANA / अम्बाला") ---
  getGateSignTexture() {
    if (this.cache.has('gateSign')) return this.cache.get('gateSign');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9e1c1c';
    ctx.fillRect(0, 0, 512, 128);

    // Border
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    // Red arch typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Cinzel", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H A R Y A N A', 256, 45);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 30px "Arial", sans-serif';
    ctx.fillText('अ म्बा ला  •  AMBALA', 256, 92);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('gateSign', texture);
    return texture;
  }

  // --- 5. Warm Indian Sandstone Texture (Image 2 reference) ---
  getSandstoneTexture() {
    if (this.cache.has('sandstone')) return this.cache.get('sandstone');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich warm reddish-amber sandstone gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#a85832');
    grad.addColorStop(0.5, '#b9653a');
    grad.addColorStop(1, '#974d2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Stone blocks & ashlar joints
    ctx.strokeStyle = '#6e341c';
    ctx.lineWidth = 3;
    const rows = 8;
    const rh = 512 / rows;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rh);
      ctx.lineTo(512, r * rh);
      ctx.stroke();

      const offset = (r % 2) * 64;
      for (let x = offset; x < 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, r * rh);
        ctx.lineTo(x, (r + 1) * rh);
        ctx.stroke();
      }
    }

    // Weathering and grain
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${50 + Math.random() * 30}, ${30 + Math.random() * 20}, 0.2)`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 50, 0, Math.PI * 2);
      ctx.fill();
    }

    this.createNoise(ctx, 512, 512, 35);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('sandstone', texture);
    return texture;
  }

  // --- 6. Temple Lintel Inscription Banner ("ॐ श्री सनातन धर्म मन्दिर ॐ") ---
  getTempleBannerTexture() {
    if (this.cache.has('templeBanner')) return this.cache.get('templeBanner');
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Sandstone lintel panel
    ctx.fillStyle = '#6b3017';
    ctx.fillRect(0, 0, 1024, 128);

    // Gold filigree border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, 1008, 112);

    // Carved Hindi Inscription exactly matching Image 2
    ctx.fillStyle = '#f5c542';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 44px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ॐ श्री सनातन धर्म मन्दिर ॐ', 512, 64);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('templeBanner', texture);
    return texture;
  }

  // --- 7. Ornate Jali Lattice Screen Texture (Image 2 upper facade) ---
  getJaliTexture() {
    if (this.cache.has('jali')) return this.cache.get('jali');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Warm dark background
    ctx.fillStyle = '#1e120b';
    ctx.fillRect(0, 0, 256, 256);

    // Geometrical star-and-hex lattice (Rajput Jali pattern)
    ctx.strokeStyle = '#c47844';
    ctx.lineWidth = 3;
    const step = 32;
    for (let x = 0; x < 256; x += step) {
      for (let y = 0; y < 256; y += step) {
        ctx.strokeRect(x + 4, y + 4, step - 8, step - 8);
        ctx.beginPath();
        ctx.arc(x + step / 2, y + step / 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9933';
        ctx.fill();
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('jali', texture);
    return texture;
  }

  // --- 8. Temple Forecourt Pavement (Flagstone Plaza) ---
  getPavementTexture() {
    if (this.cache.has('pavement')) return this.cache.get('pavement');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a342e';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#25201c';
    ctx.lineWidth = 4;
    const sz = 64;
    for (let x = 0; x < 512; x += sz) {
      for (let y = 0; y < 512; y += sz) {
        ctx.strokeRect(x, y, sz, sz);
      }
    }
    this.createNoise(ctx, 512, 512, 30);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('pavement', texture);
    return texture;
  }

  // --- 9. Festive Door Drapes Texture (Colorful fabric valance in doorway) ---
  getDrapesTexture() {
    if (this.cache.has('drapes')) return this.cache.get('drapes');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Alternating festive scallops (Magenta, Blue, Gold) matching Image 2
    const colors = ['#e91e63', '#00bcd4', '#ffeb3b', '#9c27b0', '#ff5722'];
    const w = 256 / colors.length;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(i * w + w / 2, 20, w / 2, 0, Math.PI);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('drapes', texture);
    return texture;
  }

  // --- 10. Notice Board Poster Texture (Matching Image 2 poster board) ---
  getNoticeBoardTexture() {
    if (this.cache.has('noticeBoard')) return this.cache.get('noticeBoard');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');

    // Rich saffron & yellow festival banner
    ctx.fillStyle = '#ff8f00';
    ctx.fillRect(0, 0, 256, 384);

    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 376);

    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('श्री गणेश उत्सव', 128, 48);

    ctx.fillStyle = '#212121';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillText('सनातन धर्म मन्दिर', 128, 80);
    ctx.fillText('महा आरती एवं दर्शन', 128, 110);

    // Decorative lines representing text
    ctx.fillStyle = '#424242';
    for (let y = 140; y < 340; y += 16) {
      ctx.fillRect(24, y, 208, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('noticeBoard', texture);
    return texture;
  }

  // --- 11. Antique Studded Temple Door Texture (Image 5 reference) ---
  getTempleDoorTexture() {
    if (this.cache.has('templeDoor')) return this.cache.get('templeDoor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep dark aged teak/sheesham wood base
    const woodGrad = ctx.createLinearGradient(0, 0, 512, 0);
    woodGrad.addColorStop(0, '#2a1a10');
    woodGrad.addColorStop(0.5, '#382215');
    woodGrad.addColorStop(1, '#23150d');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, 512, 1024);

    // Vertical plank grooves
    ctx.strokeStyle = '#120b07';
    ctx.lineWidth = 4;
    const planks = 4;
    const pw = 512 / planks;
    for (let p = 1; p < planks; p++) {
      ctx.beginPath();
      ctx.moveTo(p * pw, 0);
      ctx.lineTo(p * pw, 1024);
      ctx.stroke();
    }

    // Heavy wrought-iron reinforcement bands (horizontal straps)
    const strapY = [80, 260, 480, 720, 920];
    strapY.forEach((sy) => {
      // Dark iron band
      ctx.fillStyle = '#1c1e22';
      ctx.fillRect(8, sy, 496, 32);

      // Iron band highlight & shadow
      ctx.fillStyle = '#3a3e46';
      ctx.fillRect(8, sy, 496, 3);
      ctx.fillStyle = '#0e0f11';
      ctx.fillRect(8, sy + 29, 496, 3);

      // Brass / forged iron studs along the band
      for (let x = 40; x < 500; x += 65) {
        // Stud drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(x + 2, sy + 18, 10, 0, Math.PI * 2);
        ctx.fill();

        // Brass stud head
        const studGrad = ctx.createRadialGradient(x - 3, sy + 13, 2, x, sy + 16, 9);
        studGrad.addColorStop(0, '#f5d061');
        studGrad.addColorStop(0.6, '#b8860b');
        studGrad.addColorStop(1, '#5c4308');
        ctx.fillStyle = studGrad;
        ctx.beginPath();
        ctx.arc(x, sy + 16, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Central Ornate Carved Brass Mandala Plate
    const cx = 256;
    const cy = 500;
    const plateGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 110);
    plateGrad.addColorStop(0, '#e5b842');
    plateGrad.addColorStop(0.7, '#966d18');
    plateGrad.addColorStop(1, '#4a3306');
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 105, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Om symbol or ring in the center
    ctx.strokeStyle = '#2b1b06';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#2b1b06';
    ctx.font = 'bold 64px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ॐ', cx, cy);

    this.createNoise(ctx, 512, 1024, 20);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('templeDoor', texture);
    return texture;
  }

  // --- 12. Tactical Box Torch Housing Texture (Image 4 reference) ---
  getTorchHousingTexture() {
    if (this.cache.has('torchHousing')) return this.cache.get('torchHousing');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rugged matte black/charcoal tactical polymer body
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 512, 512);

    // Cooling ribs / horizontal armor ridges
    for (let y = 30; y < 480; y += 32) {
      ctx.fillStyle = '#2c313a';
      ctx.fillRect(20, y, 472, 16);
      ctx.fillStyle = '#111317';
      ctx.fillRect(20, y + 16, 472, 6);
    }

    // Yellow / Red Warning & Power Switch Decals
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(420, 256, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // High lumen badge
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HEAVY DUTY • 5000 LM', 40, 490);

    this.createNoise(ctx, 512, 512, 25);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('torchHousing', texture);
    return texture;
  }

  // --- 13. Flashlight Front LED Emitter Matrix Grid (Image 4 reference) ---
  getTorchEmitterTexture() {
    if (this.cache.has('torchEmitter')) return this.cache.get('torchEmitter');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Warm bright yellow luminous diode background
    ctx.fillStyle = '#fffae6';
    ctx.fillRect(0, 0, 256, 256);

    // 6x6 Matrix of intense glowing LED dies
    const size = 256 / 6;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const x = c * size;
        const y = r * size;

        // Individual diode yellow center
        const dieGrad = ctx.createRadialGradient(x + size / 2, y + size / 2, 2, x + size / 2, y + size / 2, size / 2);
        dieGrad.addColorStop(0, '#ffffff');
        dieGrad.addColorStop(0.35, '#fff6b0');
        dieGrad.addColorStop(0.85, '#f5c518');
        dieGrad.addColorStop(1, '#d49b06');
        ctx.fillStyle = dieGrad;
        ctx.fillRect(x + 3, y + 3, size - 6, size - 6);

        // Dark micro grid borders
        ctx.strokeStyle = '#22252a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, size, size);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('torchEmitter', texture);
    return texture;
  }

  // Retain legacy textures for compatibility
  getStoneTexture() {
    return this.getSandstoneTexture();
  }
  getRuneTexture() {
    return this.getJaliTexture();
  }
  getWoodTexture() {
    return this.getPavementTexture();
  }

  // --- Real Temple Textures matching Image 1 ---
  getSheetlaTempleSignTexture() {
    if (this.cache.has('sheetlaSign')) return this.cache.get('sheetlaSign');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Warm Saffron/Orange Banner Background
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.5, '#ea580c');
    grad.addColorStop(1, '#c2410c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

    // Ornate Golden Border
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 484, 100);

    // Decorative Floral Corner Accents
    ctx.fillStyle = '#fef08a';
    [ [20, 20], [492, 20], [20, 108], [492, 108] ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sacred Devanagari Inscription: "श्री माँ शीतलायै नमः"
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Yatra One", "Samarkan", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('श्री माँ शीतलायै नमः', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('sheetlaSign', texture);
    return texture;
  }

  getPrasadShopSignTexture() {
    if (this.cache.has('prasadSign')) return this.cache.get('prasadSign');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Bright White Board Background
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, 512, 128);

    // Red Border
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('प्रसाद की सरकारी दुकान', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('prasadSign', texture);
    return texture;
  }

  getTempleWhitePlasterTexture() {
    if (this.cache.has('whitePlaster')) return this.cache.get('whitePlaster');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Off-white limestone plaster base
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stone ashlar seams
    ctx.strokeStyle = '#e2ded5';
    ctx.lineWidth = 2;
    const rows = 8;
    const rh = 512 / rows;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rh);
      ctx.lineTo(512, r * rh);
      ctx.stroke();

      const offset = (r % 2) * (512 / 4);
      for (let c = 0; c <= 4; c++) {
        const x = (c * (512 / 2) + offset) % 512;
        ctx.beginPath();
        ctx.moveTo(x, r * rh);
        ctx.lineTo(x, (r + 1) * rh);
        ctx.stroke();
      }
    }

    this.createNoise(ctx, 512, 512, 12);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('whitePlaster', texture);
    return texture;
  }

  getTempleTerracottaTexture() {
    if (this.cache.has('templeTerracotta')) return this.cache.get('templeTerracotta');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Saffron-orange terracotta base
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#ea580c');
    grad.addColorStop(0.5, '#f97316');
    grad.addColorStop(1, '#c2410c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Carved molding horizontal relief bands
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 4;
    for (let y = 32; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Small repeating lotus petal notches
      for (let x = 16; x < 512; x += 32) {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.createNoise(ctx, 512, 512, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('templeTerracotta', texture);
    return texture;
  }

  getMandalaReliefTexture() {
    if (this.cache.has('mandalaRelief')) return this.cache.get('mandalaRelief');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // White plaster background
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, 512, 512);

    // Saffron Sunburst / Chakra Outer Ring
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.fill();

    // 24 Radial Sun Rays
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x1 = 256 + Math.cos(angle) * 210;
      const y1 = 256 + Math.sin(angle) * 210;
      const x2 = 256 + Math.cos(angle + 0.1) * 240;
      const y2 = 256 + Math.sin(angle + 0.1) * 240;
      const x3 = 256 + Math.cos(angle - 0.1) * 240;
      const y3 = 256 + Math.sin(angle - 0.1) * 240;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    }

    // Inner White Ring
    ctx.fillStyle = '#f8f6f0';
    ctx.beginPath();
    ctx.arc(256, 256, 175, 0, Math.PI * 2);
    ctx.fill();

    // Inner Saffron 8-Pointed Star / Yantra
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const outerA = (p / 8) * Math.PI * 2;
      const innerA = outerA + Math.PI / 8;
      const ox = 256 + Math.cos(outerA) * 150;
      const oy = 256 + Math.sin(outerA) * 150;
      const ix = 256 + Math.cos(innerA) * 75;
      const iy = 256 + Math.sin(innerA) * 75;

      if (p === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();

    // Center Gold Boss
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(256, 256, 35, 0, Math.PI * 2);
    ctx.fill();

    this.createNoise(ctx, 512, 512, 15);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('mandalaRelief', texture);
    return texture;
  }

  getCourtyardFlagstoneTexture() {
    if (this.cache.has('courtyardStone')) return this.cache.get('courtyardStone');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Grey courtyard stone base
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 512, 512);

    // Flagstone tile grid
    const cols = 6;
    const rows = 6;
    const cw = 512 / cols;
    const ch = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * ch;
        const tone = 140 + Math.floor(Math.sin(r * 3 + c * 5) * 20);
        ctx.fillStyle = `rgb(${tone - 5}, ${tone}, ${tone + 10})`;
        ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      }
    }

    // Mortar joints
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cw, 0);
      ctx.lineTo(c * cw, 512);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * ch);
      ctx.lineTo(512, r * ch);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 25);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('courtyardStone', texture);
    return texture;
  }

  getOrnateTempleGateTexture() {
    if (this.cache.has('ornateTempleGate')) return this.cache.get('ornateTempleGate');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark teakwood/bronze door base
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#2d1810');
    grad.addColorStop(0.5, '#3e2316');
    grad.addColorStop(1, '#25140d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Carved panels
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 5;
    for (let y = 30; y < 512; y += 115) {
      ctx.strokeRect(30, y, 452, 95);

      // Brass round studs (Ghungroo rivets)
      for (let x = 60; x < 460; x += 65) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(x, y + 47, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    this.createNoise(ctx, 512, 512, 18);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('ornateTempleGate', texture);
    return texture;
  }

  // --- Closed Double Entrance Temple Gate Texture (Level 2 Rear Wall) ---
  getTempleGateTexture() {
    if (this.cache.has('templeGate')) return this.cache.get('templeGate');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich aged dark teakwood base with vertical wood grain
    const woodGrad = ctx.createLinearGradient(0, 0, 512, 0);
    woodGrad.addColorStop(0, '#26150c');
    woodGrad.addColorStop(0.25, '#3b2214');
    woodGrad.addColorStop(0.5, '#22120a'); // Center seam between double doors
    woodGrad.addColorStop(0.75, '#3b2214');
    woodGrad.addColorStop(1, '#26150c');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, 512, 1024);

    // Vertical plank grooves
    ctx.strokeStyle = '#120905';
    ctx.lineWidth = 3;
    [128, 256, 384].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    });

    // Deep center door seam (Double Doors)
    ctx.fillStyle = '#0a0503';
    ctx.fillRect(253, 0, 6, 1024);

    // Carved panels with gold/brass trim (matching temple aesthetic)
    ctx.strokeStyle = '#c59a3f';
    ctx.lineWidth = 4;
    const panelY = [40, 280, 520, 760];
    const panelH = 200;

    panelY.forEach((py) => {
      // Left door panel
      ctx.strokeRect(24, py, 210, panelH);
      ctx.strokeStyle = '#855d1a';
      ctx.strokeRect(32, py + 8, 194, panelH - 16);
      ctx.strokeStyle = '#c59a3f';

      // Right door panel
      ctx.strokeRect(278, py, 210, panelH);
      ctx.strokeStyle = '#855d1a';
      ctx.strokeRect(286, py + 8, 194, panelH - 16);
      ctx.strokeStyle = '#c59a3f';

      // Brass corner braces and floral studs
      [py + 20, py + panelH - 20].forEach((sy) => {
        [44, 214, 298, 468].forEach((sx) => {
          ctx.fillStyle = '#f5c542';
          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#6e4a0d';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      });
    });

    // Heavy brass pull rings / handles on center seam
    [520].forEach((hy) => {
      [230, 282].forEach((hx) => {
        // Brass mount plate
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(hx, hy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78540d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Brass ring handle
        ctx.beginPath();
        ctx.arc(hx, hy + 22, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
    });

    // Fine organic noise
    this.createNoise(ctx, 512, 1024, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('templeGate', texture);
    return texture;
  }

  // --- Level 2: Real Temple Interior Textures matching Reference Image ---
  getTempleHallFloorTexture() {
    if (this.cache.has('templeHallFloor')) return this.cache.get('templeHallFloor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Polished dark slate / charcoal tile base
    ctx.fillStyle = '#262a30';
    ctx.fillRect(0, 0, 512, 512);

    const tiles = 4;
    const ts = 512 / tiles;

    for (let r = 0; r < tiles; r++) {
      for (let c = 0; c < tiles; c++) {
        const x = c * ts;
        const y = r * ts;

        // Subtle tile surface gradient (polished stone sheen)
        const grad = ctx.createLinearGradient(x, y, x + ts, y + ts);
        const baseShade = 38 + ((r + c) % 2) * 5;
        grad.addColorStop(0, `rgb(${baseShade + 6}, ${baseShade + 8}, ${baseShade + 10})`);
        grad.addColorStop(1, `rgb(${baseShade - 4}, ${baseShade - 2}, ${baseShade})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
      }
    }

    // Thin dark grout joints
    ctx.strokeStyle = '#121417';
    ctx.lineWidth = 3;
    for (let i = 0; i <= tiles; i++) {
      ctx.beginPath();
      ctx.moveTo(i * ts, 0);
      ctx.lineTo(i * ts, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * ts);
      ctx.lineTo(512, i * ts);
      ctx.stroke();
    }

    // White / Cream Diamond Corner Cabochons at every intersection (Key feature in reference photo!)
    ctx.fillStyle = '#f1ece1';
    ctx.strokeStyle = '#b8b2a5';
    ctx.lineWidth = 1;

    for (let r = 0; r <= tiles; r++) {
      for (let c = 0; c <= tiles; c++) {
        const cx = c * ts;
        const cy = r * ts;
        const size = 9;

        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    this.createNoise(ctx, 512, 512, 10);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('templeHallFloor', texture);
    return texture;
  }

  getSanctumArchTexture() {
    if (this.cache.has('sanctumArch')) return this.cache.get('sanctumArch');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // White plaster base
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, 512, 512);

    // Deep Red / Saffron chevron zig-zag stripes (matching the inner archway)
    ctx.fillStyle = '#b91c1c';
    const numStripes = 8;
    const sh = 512 / numStripes;

    for (let s = 0; s < numStripes; s += 2) {
      ctx.beginPath();
      const y1 = s * sh;
      const y2 = (s + 1) * sh;

      for (let x = 0; x <= 512; x += 32) {
        if (x === 0) ctx.moveTo(x, y1 + 16);
        else ctx.lineTo(x, (x / 32) % 2 === 0 ? y1 : y2);
      }
      ctx.lineTo(512, y2);
      ctx.lineTo(0, y2);
      ctx.closePath();
      ctx.fill();
    }

    // Terracotta decorative relief border lines
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    for (let y = 0; y <= 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 16);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('sanctumArch', texture);
    return texture;
  }

  getPilasterPatternTexture() {
    if (this.cache.has('pilasterPattern')) return this.cache.get('pilasterPattern');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 256, 512);

    // Vertical column of red diamond lozenges (matching the pilasters flanking the arch in the photo)
    ctx.fillStyle = '#b91c1c';
    const diamonds = 6;
    const dh = 512 / diamonds;

    for (let i = 0; i < diamonds; i++) {
      const cy = i * dh + dh / 2;
      ctx.beginPath();
      ctx.moveTo(128, cy - dh * 0.42);
      ctx.lineTo(200, cy);
      ctx.lineTo(128, cy + dh * 0.42);
      ctx.lineTo(56, cy);
      ctx.closePath();
      ctx.fill();

      // Inner white eye
      ctx.fillStyle = '#fdfbf7';
      ctx.beginPath();
      ctx.arc(128, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
    }

    // Outer border lines
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 0, 232, 512);

    this.createNoise(ctx, 256, 512, 12);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('pilasterPattern', texture);
    return texture;
  }

  getToranFlagTexture() {
    if (this.cache.has('toranFlag')) return this.cache.get('toranFlag');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 128);

    // Top cord
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(512, 8);
    ctx.stroke();

    // Saffron-orange triangular pennant bunting flags
    const flags = 8;
    const fw = 512 / flags;

    for (let f = 0; f < flags; f++) {
      const fx = f * fw;
      ctx.fillStyle = f % 2 === 0 ? '#ea580c' : '#f97316';
      ctx.beginPath();
      ctx.moveTo(fx + 2, 8);
      ctx.lineTo(fx + fw - 2, 8);
      ctx.lineTo(fx + fw / 2, 115);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('toranFlag', texture);
    return texture;
  }

  getFootprintTexture() {
    if (this.cache.has('footprint')) return this.cache.get('footprint');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // Dusty boot prints (left & right)
    ctx.fillStyle = 'rgba(235, 215, 185, 0.65)';

    // Left boot
    ctx.beginPath();
    ctx.ellipse(95, 100, 24, 45, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(92, 175, 20, 24, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Right boot (ahead and right)
    ctx.beginPath();
    ctx.ellipse(165, 60, 24, 45, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(168, 135, 20, 24, 0.08, 0, Math.PI * 2);
    ctx.fill();

    this.createNoise(ctx, 256, 256, 25);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('footprint', texture);
    return texture;
  }

  getWallMarkingTexture() {
    if (this.cache.has('wallMarking')) return this.cache.get('wallMarking');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // Mysterious carved chalk/pigment occult glyph
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 10;

    // Outer sacred circle
    ctx.beginPath();
    ctx.arc(128, 128, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Inverted sacred triangle & vertical trident eye
    ctx.beginPath();
    ctx.moveTo(128, 205);
    ctx.lineTo(50, 75);
    ctx.lineTo(206, 75);
    ctx.closePath();
    ctx.stroke();

    // Inner eye / trident
    ctx.beginPath();
    ctx.arc(128, 120, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(128, 55);
    ctx.lineTo(128, 185);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('wallMarking', texture);
    return texture;
  }

  getSecretDoorTexture() {
    if (this.cache.has('secretDoor')) return this.cache.get('secretDoor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient carved stone wall slab
    ctx.fillStyle = '#eae5d9';
    ctx.fillRect(0, 0, 512, 512);

    // Stone seams
    ctx.strokeStyle = '#b5ae9e';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 480, 480);
    ctx.strokeRect(40, 40, 432, 432);

    // Subtle ancient carved wheel/mandala motif
    ctx.strokeStyle = '#998e7c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.stroke();

    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(ang) * 140, 256 + Math.sin(ang) * 140);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 22);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('secretDoor', texture);
    return texture;
  }
  // Tactical Flashlight Torch Body Texture
  getTorchHousingTexture() {
    if (this.cache.has('torchHousing')) return this.cache.get('torchHousing');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e232a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#2d3748';
    for (let y = 10; y < 256; y += 24) {
      ctx.fillRect(10, y, 236, 12);
    }
    this.createNoise(ctx, 256, 256, 15);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('torchHousing', texture);
    return texture;
  }

  // Tactical Flashlight Emitter Window Texture
  getTorchEmitterTexture() {
    if (this.cache.has('torchEmitter')) return this.cache.get('torchEmitter');
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#fef08a');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('torchEmitter', texture);
    return texture;
  }

  // --- Level 2: The Ancient Temple Exploration Textures ---
  // 1. Sun Symbol (Surya): Golden radiant disc with 12 flame rays
  getSunSymbolTexture() {
    if (this.cache.has('sunSymbol')) return this.cache.get('sunSymbol');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Weathered stone tablet background
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 256, 256);

    // Carved decorative border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 232);

    // Outer glow ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 75, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Radiant Surya Rays
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x1 = 128 + Math.cos(angle) * 45;
      const y1 = 128 + Math.sin(angle) * 45;
      const x2 = 128 + Math.cos(angle) * 88;
      const y2 = 128 + Math.sin(angle) * 88;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Central Sun Disc
    const grad = ctx.createRadialGradient(128, 128, 5, 128, 128, 42);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 42, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Devanagari / Bindu Dot
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(128, 128, 8, 0, Math.PI * 2);
    ctx.fill();

    this.createNoise(ctx, 256, 256, 18);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('sunSymbol', texture);
    return texture;
  }

  // 2. Moon Symbol (Chandra): Ethereal silver-cyan crescent moon with star dots
  getMoonSymbolTexture() {
    if (this.cache.has('moonSymbol')) return this.cache.get('moonSymbol');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Weathered dark slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    // Carved decorative border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 232);

    // Outer subtle circle
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred Crescent Moon (Chandra)
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#bae6fd';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Cutout to form crescent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(150, 115, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Celestial Star Dots
    ctx.fillStyle = '#e0f2fe';
    const stars = [
      [80, 75, 3], [190, 70, 4], [195, 175, 3], [75, 185, 3.5], [165, 130, 5]
    ];
    stars.forEach(([sx, sy, r]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    this.createNoise(ctx, 256, 256, 18);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('moonSymbol', texture);
    return texture;
  }

  // 3. Trishul Symbol (Sacred Trident): Divine 3-pronged spear with damru knot
  getTrishulSymbolTexture() {
    if (this.cache.has('trishulSymbol')) return this.cache.get('trishulSymbol');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Weathered dark crimson stone background
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, 256, 256);

    // Carved decorative border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 232, 232);

    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 128, 75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Central Prong (Tallest)
    ctx.beginPath();
    ctx.moveTo(128, 200);
    ctx.lineTo(128, 48);
    ctx.stroke();

    // Arrowhead tip for central prong
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(128, 36);
    ctx.lineTo(118, 56);
    ctx.lineTo(138, 56);
    ctx.closePath();
    ctx.fill();

    // Left Prong (Curving outward then inward)
    ctx.beginPath();
    ctx.moveTo(128, 120);
    ctx.quadraticCurveTo(80, 110, 85, 65);
    ctx.stroke();
    // Left tip
    ctx.beginPath();
    ctx.moveTo(85, 55);
    ctx.lineTo(76, 72);
    ctx.lineTo(94, 72);
    ctx.closePath();
    ctx.fill();

    // Right Prong (Curving outward then inward)
    ctx.beginPath();
    ctx.moveTo(128, 120);
    ctx.quadraticCurveTo(176, 110, 171, 65);
    ctx.stroke();
    // Right tip
    ctx.beginPath();
    ctx.moveTo(171, 55);
    ctx.lineTo(162, 72);
    ctx.lineTo(180, 72);
    ctx.closePath();
    ctx.fill();

    // Damru (Hourglass knot in middle)
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.moveTo(112, 140);
    ctx.lineTo(144, 140);
    ctx.lineTo(112, 165);
    ctx.lineTo(144, 165);
    ctx.closePath();
    ctx.fill();

    this.createNoise(ctx, 256, 256, 18);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('trishulSymbol', texture);
    return texture;
  }

  // 4. Ancient Scroll Texture: Weathered parchment with burned edges and Sanskrit markings
  getAncientScrollTexture() {
    if (this.cache.has('ancientScroll')) return this.cache.get('ancientScroll');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Aged parchment yellow-amber base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#e2c58a');
    grad.addColorStop(0.5, '#f5e4bc');
    grad.addColorStop(1, '#cb9a54');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Weathered burnt edges
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 498);

    // Outer decorative floral border lines
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 452, 452);
    ctx.strokeRect(36, 36, 440, 440);

    // Sacred Devanagari heading header
    ctx.fillStyle = '#4a2511';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('॥ श्री प्राचीन मन्दिर पत्र ॥', 256, 80);

    // Ancient Sanskrit imitation scripture lines
    ctx.strokeStyle = '#5c381d';
    ctx.lineWidth = 2;
    for (let y = 120; y < 440; y += 28) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(452, y);
      ctx.stroke();

      // Little scriptural dots and ticks
      for (let x = 70; x < 440; x += 35) {
        if (Math.random() > 0.3) {
          ctx.beginPath();
          ctx.arc(x, y - 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    this.createNoise(ctx, 512, 512, 26);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('ancientScroll', texture);
    return texture;
  }

  // 5. Sealed Temple Door Texture with glowing runic glyphs
  getSealedDoorTexture() {
    if (this.cache.has('sealedDoor')) return this.cache.get('sealedDoor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Heavy dark ancient stone base
    ctx.fillStyle = '#1e1c18';
    ctx.fillRect(0, 0, 512, 1024);

    // Massive stone slabs border
    ctx.strokeStyle = '#38342c';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 496, 1008);

    // Center vertical split line
    ctx.strokeStyle = '#12100d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.stroke();

    // Concentric Carved Sacred Mandalas
    [280, 720].forEach((cy) => {
      ctx.strokeStyle = '#524a3e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(256, cy, 140, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#786c58';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(256, cy, 90, 0, Math.PI * 2);
      ctx.stroke();

      // Inscribed 8-point star
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(256, cy);
        ctx.lineTo(256 + Math.cos(a) * 140, cy + Math.sin(a) * 140);
        ctx.stroke();
      }
    });

    // Glowing spiritual runes in center
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(180, 460, 152, 120);

    this.createNoise(ctx, 512, 1024, 25);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('sealedDoor', texture);
    return texture;
  }

  // --- Level 3 Textures: The Hidden Path (Reference Art Matching) ---
  // 1. Dark Crypt Wall Texture: Weathered ancient stone with carved hieroglyphic markings & moss seams
  getCryptStoneWallTexture() {
    if (this.cache.has('cryptStoneWall')) return this.cache.get('cryptStoneWall');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient dark stone base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1c1b18');
    grad.addColorStop(0.5, '#282520');
    grad.addColorStop(1, '#181714');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Ashlar stone block courses
    ctx.strokeStyle = '#0e0d0b';
    ctx.lineWidth = 4;
    const rows = 6;
    const rowH = 512 / rows;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(512, r * rowH);
      ctx.stroke();

      if (r < rows) {
        const offset = (r % 2) * (rowH * 0.8);
        for (let x = offset; x < 512; x += rowH * 1.6) {
          ctx.beginPath();
          ctx.moveTo(x, r * rowH);
          ctx.lineTo(x, (r + 1) * rowH);
          ctx.stroke();
        }
      }
    }

    // Weathered ancient script / hieroglyph incisions (matching reference panel 1)
    ctx.strokeStyle = '#3d3830';
    ctx.lineWidth = 2;
    for (let y = 30; y < 490; y += 45) {
      for (let x = 20; x < 490; x += 60) {
        if (Math.random() > 0.35) {
          ctx.beginPath();
          ctx.arc(x + 10, y + 10, 8, 0, Math.PI);
          ctx.moveTo(x + 10, y);
          ctx.lineTo(x + 10, y + 25);
          ctx.stroke();
        }
      }
    }

    // Moss / damp greenish patches in corner crevices
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(${25 + Math.random() * 20}, ${45 + Math.random() * 25}, ${25 + Math.random() * 20}, 0.25)`;
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 30, 0, Math.PI * 2);
      ctx.fill();
    }

    this.createNoise(ctx, 512, 512, 28);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('cryptStoneWall', texture);
    return texture;
  }

  // 2. Corrupted Wall Texture: Creeping dark shadow tendrils and claw scratches (reference panel 2 & 3)
  getCorruptedWallTexture() {
    if (this.cache.has('corruptedWall')) return this.cache.get('corruptedWall');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark subterranean stone base
    ctx.fillStyle = '#171513';
    ctx.fillRect(0, 0, 512, 512);

    // Stone joints
    ctx.strokeStyle = '#090807';
    ctx.lineWidth = 3;
    for (let y = 0; y <= 512; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Creeping shadowy black tendrils / roots across masonry
    ctx.strokeStyle = '#050404';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      let x = Math.random() * 512;
      let y = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 40;
        y += 20 + Math.random() * 35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Menacing claw scratches / blood red stains (reference panel 3)
    ctx.strokeStyle = '#4a0e0e';
    ctx.lineWidth = 3;
    for (let g = 0; g < 4; g++) {
      const gx = 80 + Math.random() * 320;
      const gy = 100 + Math.random() * 300;
      for (let s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.moveTo(gx + s * 14, gy);
        ctx.lineTo(gx + s * 14 + 40, gy + 75);
        ctx.stroke();
      }
    }

    this.createNoise(ctx, 512, 512, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('corruptedWall', texture);
    return texture;
  }

  // 3. Crypt Floor with Glossy Water Puddles (reference panel 1)
  getCryptFloorPuddleTexture() {
    if (this.cache.has('cryptFloorPuddle')) return this.cache.get('cryptFloorPuddle');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Weathered dark flagstone floor
    ctx.fillStyle = '#22201c';
    ctx.fillRect(0, 0, 512, 512);

    // Stone tile grid
    ctx.strokeStyle = '#11100e';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Murky reflective water puddle spots
    const puddles = [
      [140, 160, 65, 45],
      [360, 320, 80, 55],
      [240, 420, 70, 40],
    ];
    puddles.forEach(([px, py, rx, ry]) => {
      const puddleGrad = ctx.createRadialGradient(px, py, 5, px, py, rx);
      puddleGrad.addColorStop(0, '#0a0d10');
      puddleGrad.addColorStop(0.7, '#14181c');
      puddleGrad.addColorStop(1, '#22201c');
      ctx.fillStyle = puddleGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Subtle cyan/green murky highlight reflection
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px - 10, py - 6, rx * 0.45, ry * 0.35, Math.PI / 6, 0, Math.PI);
      ctx.stroke();
    });

    this.createNoise(ctx, 512, 512, 22);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('cryptFloorPuddle', texture);
    return texture;
  }

  // 4. Strange Ancient Carved Wall Symbol (Level 3 Clue)
  getAncientCarvedSymbolTexture() {
    if (this.cache.has('ancientCarvedSymbol')) return this.cache.get('ancientCarvedSymbol');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    // Weathered dark background
    ctx.fillStyle = '#1c1815';
    ctx.fillRect(0, 0, 512, 512);

    // Archaic charcoal / ochre carved emblem
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;

    // Concentric celestial circles
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Ancient sacred triangular ward & central watchful eye
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(256, 110);
    ctx.lineTo(130, 340);
    ctx.lineTo(382, 340);
    ctx.closePath();
    ctx.stroke();

    // Central all-seeing eye with vertical slit pupil
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(256, 260, 55, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(256, 260, 14, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Radiant occult ward lines
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(angle) * 180, 256 + Math.sin(angle) * 180);
      ctx.lineTo(256 + Math.cos(angle) * 215, 256 + Math.sin(angle) * 215);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 16);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('ancientCarvedSymbol', texture);
    return texture;
  }

  // 5. Massive Ancient Inner Stone Chamber Door
  getInnerDoorTexture() {
    if (this.cache.has('innerDoor')) return this.cache.get('innerDoor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Heavy weathered ashlar granite slab
    ctx.fillStyle = '#1e1c19';
    ctx.fillRect(0, 0, 512, 1024);

    // Deep stone beveled perimeter
    ctx.strokeStyle = '#3a342c';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 492, 1004);

    // Center vertical split line
    ctx.strokeStyle = '#0e0d0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.stroke();

    // Sacred geometric mandala reliefs
    [260, 760].forEach((cy) => {
      ctx.strokeStyle = '#635848';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(256, cy, 130, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, cy, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Cross bars
      ctx.beginPath();
      ctx.moveTo(256 - 130, cy);
      ctx.lineTo(256 + 130, cy);
      ctx.moveTo(256, cy - 130);
      ctx.lineTo(256, cy + 130);
      ctx.stroke();
    });

    // Heavy iron reinforcement bands across door
    [120, 512, 900].forEach((by) => {
      ctx.fillStyle = '#121110';
      ctx.fillRect(20, by - 16, 472, 32);
      ctx.strokeStyle = '#423d35';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, by - 16, 472, 32);

      // Iron bolt rivets
      for (let bx = 50; bx < 480; bx += 70) {
        ctx.fillStyle = '#5c5448';
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d0c0b';
        ctx.stroke();
      }
    });

    this.createNoise(ctx, 512, 1024, 25);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('innerDoor', texture);
    return texture;
  }

  // 6. Dusty Footprints on Stone Floor (Decal Texture)
  getFootprintsTexture() {
    if (this.cache.has('footprints')) return this.cache.get('footprints');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // Subtle shoe print imprint (left and right tread in ancient dust)
    ctx.fillStyle = 'rgba(215, 195, 160, 0.45)';

    // Left Boot Sole
    ctx.beginPath();
    ctx.ellipse(90, 110, 22, 42, -0.08, 0, Math.PI * 2);
    ctx.fill();
    // Left Boot Heel
    ctx.beginPath();
    ctx.ellipse(88, 175, 18, 22, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Right Boot Sole (staggered forward)
    ctx.beginPath();
    ctx.ellipse(165, 70, 22, 42, 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Right Boot Heel
    ctx.beginPath();
    ctx.ellipse(168, 135, 18, 22, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Subtle tread grooves
    ctx.strokeStyle = 'rgba(25, 20, 15, 0.25)';
    ctx.lineWidth = 3;
    for (let ty = 85; ty <= 135; ty += 12) {
      ctx.beginPath();
      ctx.moveTo(75, ty);
      ctx.lineTo(105, ty);
      ctx.moveTo(150, ty - 40);
      ctx.lineTo(180, ty - 40);
      ctx.stroke();
    }

    this.createNoise(ctx, 256, 256, 12);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('footprints', texture);
    return texture;
  }

  // 7. Friend's Dropped Expedition Pocket Watch / Compass Face
  getExpeditionWatchTexture() {
    if (this.cache.has('expeditionWatch')) return this.cache.get('expeditionWatch');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vintage aged ivory parchment dial
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.75, '#fef3c7');
    grad.addColorStop(1, '#d97706');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Brass inner bezel
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 128, 116, 0, Math.PI * 2);
    ctx.stroke();

    // Minute / Hour tick ring
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isHour = i % 5 === 0;
      const len = isHour ? 14 : 6;
      ctx.lineWidth = isHour ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(angle) * (110 - len), 128 + Math.sin(angle) * (110 - len));
      ctx.lineTo(128 + Math.cos(angle) * 110, 128 + Math.sin(angle) * 110);
      ctx.stroke();
    }

    // Compass Rose in center
    ctx.fillStyle = '#b91c1c'; // North red point
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(122, 128);
    ctx.lineTo(128, 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#451a03'; // South black point
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(134, 128);
    ctx.lineTo(128, 208);
    ctx.closePath();
    ctx.fill();

    // Roman Numerals 12, 3, 6, 9
    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XII', 128, 38);
    ctx.fillText('III', 218, 128);
    ctx.fillText('VI', 128, 218);
    ctx.fillText('IX', 38, 128);

    // Watch Hands (frozen at 3:42 AM)
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Hour hand toward 3:42
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(180, 142);
    ctx.stroke();
    // Minute hand
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(82, 195);
    ctx.stroke();

    // Center pivot jewel
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(128, 128, 5, 0, Math.PI * 2);
    ctx.fill();

    this.createNoise(ctx, 256, 256, 12);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('expeditionWatch', texture);
    return texture;
  }

  // 8. Hanging Cobweb Texture
  getCobwebTexture() {
    if (this.cache.has('cobweb')) return this.cache.get('cobweb');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(230, 235, 245, 0.42)';
    ctx.lineWidth = 1.2;

    // Radial spokes radiating from top-left corner
    const spokes = 8;
    for (let i = 0; i <= spokes; i++) {
      const angle = (i / spokes) * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 250, Math.sin(angle) * 250);
      ctx.stroke();
    }

    // Concentric web spirals
    for (let r = 30; r < 250; r += 28) {
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const angle = (i / spokes) * (Math.PI / 2);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('cobweb', texture);
    return texture;
  }

  // --- Level 4: The Deep Sanctum Procedural Textures ---
  getSanctumAstralFloorTexture() {
    if (this.cache.has('sanctum_astral_floor')) return this.cache.get('sanctum_astral_floor');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep midnight basalt tile base
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, 0, 512, 512);

    // Large interlocking circular stone slabs
    ctx.strokeStyle = 'rgba(45, 60, 85, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 512, 512);

    // Astral constellation lines and star nodes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.arc(256, 256, 90, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Celestial radiating rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(angle) * 90, 256 + Math.sin(angle) * 90);
      ctx.lineTo(256 + Math.cos(angle) * 180, 256 + Math.sin(angle) * 180);
      ctx.stroke();

      // Gold star points
      ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.beginPath();
      ctx.arc(256 + Math.cos(angle) * 180, 256 + Math.sin(angle) * 180, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    this.createNoise(ctx, 512, 512, 20);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('sanctum_astral_floor', texture);
    return texture;
  }

  getSanctumRuneWallTexture() {
    if (this.cache.has('sanctum_rune_wall')) return this.cache.get('sanctum_rune_wall');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient dark sanctum ashlar masonry
    ctx.fillStyle = '#161c28';
    ctx.fillRect(0, 0, 512, 512);

    // Stone block mortar lines
    ctx.strokeStyle = '#0c1018';
    ctx.lineWidth = 3;
    const rows = 4;
    const cols = 2;
    const rowH = 512 / rows;
    const colW = 512 / cols;

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(512, r * rowH);
      ctx.stroke();

      const offset = (r % 2) * (colW / 2);
      for (let c = 0; c <= cols; c++) {
        const x = (c * colW + offset) % 512;
        ctx.beginPath();
        ctx.moveTo(x, r * rowH);
        ctx.lineTo(x, (r + 1) * rowH);
        ctx.stroke();
      }
    }

    // Carved glowing sacred sigils on blocks
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.moveTo(cx - 16, cy);
        ctx.lineTo(cx + 16, cy);
        ctx.moveTo(cx, cy - 16);
        ctx.lineTo(cx, cy + 16);
        ctx.stroke();
      }
    }

    this.createNoise(ctx, 512, 512, 25);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('sanctum_rune_wall', texture);
    return texture;
  }

  getAstralDialRingTexture() {
    if (this.cache.has('astral_dial_ring')) return this.cache.get('astral_dial_ring');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c2331';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.arc(256, 256, 170, 0, Math.PI * 2);
    ctx.stroke();

    // 12 Astrological notches
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 175, 256 + Math.sin(a) * 175);
      ctx.lineTo(256 + Math.cos(a) * 225, 256 + Math.sin(a) * 225);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 20);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('astral_dial_ring', texture);
    return texture;
  }

  getCrystallineCoreTexture() {
    if (this.cache.has('crystalline_core')) return this.cache.get('crystalline_core');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Facet highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(128, 20);
    ctx.lineTo(236, 128);
    ctx.lineTo(128, 236);
    ctx.lineTo(20, 128);
    ctx.closePath();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('crystalline_core', texture);
    return texture;
  }

  // --- Level 4 & 5 Textures: Sanctuary & Crypt Textures ---

  // 1. Sanctuary Grand Arch Inscription
  getSanctuaryArchInscriptionTexture() {
    if (this.cache.has('arch_inscription_l4')) return this.cache.get('arch_inscription_l4');
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#3a3632');
    grad.addColorStop(0.5, '#48443e');
    grad.addColorStop(1, '#2f2c28');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.strokeStyle = '#1a1816';
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 952, 952);
    ctx.strokeStyle = '#25221e';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, 904, 904);

    ctx.strokeStyle = 'rgba(20, 18, 16, 0.45)';
    ctx.lineWidth = 4;
    for (let y = 140; y < 1000; y += 140) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(964, y);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 52px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#0f0e0c';
    ctx.fillText('BEWARE, SEEKER:', 512, 172);
    ctx.fillStyle = '#1c1815';
    ctx.fillText('BEWARE, SEEKER:', 510, 170);

    ctx.font = 'bold 36px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#141210';
    ctx.fillText('UNCOVER THE PAST,', 512, 260);
    ctx.fillText('UNLEASH THE HORROR.', 512, 320);

    ctx.font = 'bold 48px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#2a0c0e';
    ctx.fillText('THESE HALLS', 512, 420);
    ctx.fillText('BREATHE MADNESS.', 512, 480);

    ctx.font = 'italic 28px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#221e1a';
    ctx.fillText('ECHOES OF A SANCTUARY', 512, 570);
    ctx.fillText('LOST TO CORRUPTION', 512, 615);

    ctx.font = 'bold 22px "Cinzel", "Times New Roman", serif';
    ctx.fillStyle = '#1a1714';
    ctx.fillText('← DARK CRYPT PASSAGE', 260, 780);
    ctx.fillText('CORRUPTED HALLWAY ↑', 512, 780);
    ctx.fillText('SPIRALING DESCENT →', 760, 780);

    ctx.fillStyle = 'rgba(90, 12, 16, 0.25)';
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.arc(100 + Math.random() * 824, 150 + Math.random() * 700, 8 + Math.random() * 24, 0, Math.PI * 2);
      ctx.fill();
    }

    this.createNoise(ctx, 1024, 1024, 25);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('arch_inscription_l4', texture);
    return texture;
  }

  // 2. Open Ancient Grimoire / Tome of Arcane Seals
  getGrimoireOpenTexture() {
    if (this.cache.has('grimoire_open_l4')) return this.cache.get('grimoire_open_l4');
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#2d2218');
    grad.addColorStop(0.2, '#dfc599');
    grad.addColorStop(0.5, '#7a6042');
    grad.addColorStop(0.8, '#d9bf92');
    grad.addColorStop(1, '#2d2218');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#18100c';
    ctx.fillRect(0, 0, 30, 512);
    ctx.fillRect(994, 0, 30, 512);
    ctx.fillRect(0, 0, 1024, 20);
    ctx.fillRect(0, 492, 1024, 20);

    ctx.fillStyle = '#1e140d';
    ctx.fillRect(506, 20, 12, 472);

    ctx.strokeStyle = '#8a2be2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(260, 240, 130, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(260, 240, 110, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = 260 + Math.cos(angle) * 110;
      const y1 = 240 + Math.sin(angle) * 110;
      const x2 = 260 + Math.cos(angle + (Math.PI * 3) / 4) * 110;
      const y2 = 240 + Math.sin(angle + (Math.PI * 3) / 4) * 110;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𐕣 ᛟ 𐕣', 260, 240);

    ctx.fillStyle = '#2a170e';
    ctx.font = 'bold 22px "Cinzel", "Times New Roman", serif';
    ctx.fillText('LIBER CORRUPTIO', 760, 80);

    ctx.fillStyle = '#3a2618';
    ctx.font = 'italic 16px serif';
    const lines = [
      'To still the heartbeat of this cursed realm,',
      'the Seeker must breach two ancient wing seals:',
      '1. The Dark Crypt Lever to the west.',
      '2. The Spiraling Descent Rotary Seal to the east.',
      'Only then may the Corrupted Core be cleansed,',
      'unsealing the Sanctuary Gates to salvation.',
      'Heed this: The Stalker awakeneth upon the purge.',
    ];
    lines.forEach((line, idx) => {
      ctx.fillText(line, 760, 140 + idx * 36);
    });

    ctx.fillStyle = 'rgba(180, 20, 30, 0.45)';
    ctx.beginPath();
    ctx.arc(780, 420, 32, 0, Math.PI * 2);
    ctx.fill();

    this.createNoise(ctx, 1024, 512, 22);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('grimoire_open_l4', texture);
    return texture;
  }

  // 3. Corrupted Flesh / Crimson Vine Tendril Texture
  getCorruptedFleshVineTexture() {
    if (this.cache.has('corrupted_vine_l4')) return this.cache.get('corrupted_vine_l4');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#2b0709');
    grad.addColorStop(0.5, '#4a0f14');
    grad.addColorStop(1, '#1e0507');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.lineWidth = 4;
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = i % 3 === 0 ? '#b91c1c' : i % 2 === 0 ? '#7f1d1d' : '#991b1b';
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 45;
        y += 20 + Math.random() * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < 15; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const rGrad = ctx.createRadialGradient(px, py, 2, px, py, 12);
      rGrad.addColorStop(0, '#f87171');
      rGrad.addColorStop(0.6, '#dc2626');
      rGrad.addColorStop(1, 'rgba(153, 27, 27, 0)');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    this.createNoise(ctx, 512, 512, 18);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('corrupted_vine_l4', texture);
    return texture;
  }

  // 4. Sanctuary Stone Floor Flagstones: Visible large slabs with clear grout lines
  getSanctuaryFloorTexture() {
    if (this.cache.has('sanctuary_floor_l4')) return this.cache.get('sanctuary_floor_l4');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#242220';
    ctx.fillRect(0, 0, 512, 512);

    const slabSize = 256;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = c * slabSize;
        const y = r * slabSize;
        const shade = 38 + ((r + c) % 2) * 8 + Math.floor(Math.random() * 6);
        ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 4})`;
        ctx.fillRect(x + 4, y + 4, slabSize - 8, slabSize - 8);

        ctx.strokeStyle = '#151312';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, slabSize - 8, slabSize - 8);

        if ((r + c) % 2 === 0) {
          ctx.strokeStyle = '#1b1918';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 30, y + 20);
          ctx.lineTo(x + 180, y + 210);
          ctx.stroke();
        }
      }
    }

    ctx.strokeStyle = '#100f0e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(70, 14, 18, 0.35)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 100);
    ctx.quadraticCurveTo(240, 220, 360, 440);
    ctx.stroke();

    this.createNoise(ctx, 512, 512, 26);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('sanctuary_floor_l4', texture);
    return texture;
  }

  // 5. Altar Relief Carved Stone Texture
  getRelicAltarReliefTexture() {
    if (this.cache.has('altar_relief_l4')) return this.cache.get('altar_relief_l4');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b2723';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#141210';
    ctx.lineWidth = 4;
    for (let x = 32; x < 512; x += 112) {
      ctx.beginPath();
      ctx.moveTo(x, 480);
      ctx.lineTo(x, 180);
      ctx.arc(x + 48, 180, 48, Math.PI, 0);
      ctx.lineTo(x + 96, 480);
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + 6, 474);
      ctx.lineTo(x + 6, 184);
      ctx.arc(x + 48, 184, 42, Math.PI, 0);
      ctx.lineTo(x + 90, 474);
      ctx.fill();

      ctx.strokeStyle = '#8a2528';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 48, 220);
      ctx.lineTo(x + 48, 360);
      ctx.moveTo(x + 28, 260);
      ctx.lineTo(x + 68, 260);
      ctx.stroke();
    }

    this.createNoise(ctx, 512, 512, 24);
    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('altar_relief_l4', texture);
    return texture;
  }
}

export const textureFactory = new TextureFactory();
