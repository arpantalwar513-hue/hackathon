// Procedural Horror Sound Engine powered by the Web Audio API
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.ambientWindGain = null;
    this.templeDroneGain = null;
    this.torchGain = null;
    this.heartbeatGain = null;
    this.isMuted = false;
    this.isInTemple = false;
    this.lastFootstepTime = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.setupAmbience();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupAmbience() {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    // --- 1. Exterior Wind & Crickets Ambience ---
    const windBufferSize = this.ctx.sampleRate * 2;
    const windBuffer = this.ctx.createBuffer(1, windBufferSize, this.ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windBufferSize; i++) {
      windData[i] = Math.random() * 2 - 1;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 350;
    windFilter.Q.value = 1.2;

    this.ambientWindGain = this.ctx.createGain();
    this.ambientWindGain.gain.value = 0.35;

    windSource.connect(windFilter);
    windFilter.connect(this.ambientWindGain);
    this.ambientWindGain.connect(this.masterGain);
    windSource.start();

    // Subtle cricket periodic chirp
    this.cricketInterval = setInterval(() => {
      if (!this.isInTemple && this.ctx && this.ctx.state === 'running') {
        this.playCricketChirp();
      }
    }, 2800);

    // --- 2. Temple Interior Cavernous Drone ---
    const droneOsc1 = this.ctx.createOscillator();
    const droneOsc2 = this.ctx.createOscillator();
    droneOsc1.type = 'sawtooth';
    droneOsc2.type = 'sine';
    droneOsc1.frequency.value = 46.25; // F#1
    droneOsc2.frequency.value = 45.0; // Detuned low beat

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 140;

    this.templeDroneGain = this.ctx.createGain();
    this.templeDroneGain.gain.value = 0.0; // Starts 0 outside

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(this.templeDroneGain);
    this.templeDroneGain.connect(this.masterGain);
    droneOsc1.start();
    droneOsc2.start();

    // --- 3. Torch Crackle Sound ---
    const torchBufferSize = this.ctx.sampleRate * 2;
    const torchBuffer = this.ctx.createBuffer(1, torchBufferSize, this.ctx.sampleRate);
    const torchData = torchBuffer.getChannelData(0);
    for (let i = 0; i < torchBufferSize; i++) {
      // Noise with random crackle pops
      let n = (Math.random() - 0.5) * 0.15;
      if (Math.random() < 0.003) {
        n += (Math.random() - 0.5) * 0.8;
      }
      torchData[i] = n;
    }

    const torchSource = this.ctx.createBufferSource();
    torchSource.buffer = torchBuffer;
    torchSource.loop = true;

    const torchFilter = this.ctx.createBiquadFilter();
    torchFilter.type = 'bandpass';
    torchFilter.frequency.value = 800;
    torchFilter.Q.value = 0.8;

    this.torchGain = this.ctx.createGain();
    this.torchGain.gain.value = 0.0; // Muted until torch acquired

    torchSource.connect(torchFilter);
    torchFilter.connect(this.torchGain);
    this.torchGain.connect(this.masterGain);
    torchSource.start();
  }

  playCricketChirp() {
    if (!this.ctx || this.isInTemple) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500, now);
    osc.frequency.exponentialRampToValueAtTime(5200, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(4600, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  setTempleInterior(inTemple) {
    this.isInTemple = inTemple;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (inTemple) {
      if (this.ambientWindGain) this.ambientWindGain.gain.linearRampToValueAtTime(0.05, now + 2);
      if (this.templeDroneGain) this.templeDroneGain.gain.linearRampToValueAtTime(0.65, now + 2);
    } else {
      if (this.ambientWindGain) this.ambientWindGain.gain.linearRampToValueAtTime(0.35, now + 2);
      if (this.templeDroneGain) this.templeDroneGain.gain.linearRampToValueAtTime(0.0, now + 2);
    }
  }

  setPeacefulAmbience(active) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (active) {
      if (this.ambientWindGain) this.ambientWindGain.gain.linearRampToValueAtTime(0.4, now + 2);
      if (this.templeDroneGain) this.templeDroneGain.gain.linearRampToValueAtTime(0.0, now + 2);
    } else {
      if (this.ambientWindGain) this.ambientWindGain.gain.linearRampToValueAtTime(0.05, now + 2);
      if (this.templeDroneGain) this.templeDroneGain.gain.linearRampToValueAtTime(0.65, now + 2);
    }
  }

  setMysteryIntensity(intensity) { // 0.0 (highway gate) to 1.0 (temple entrance)
    if (!this.ctx || this.isInTemple) return;
    const now = this.ctx.currentTime;
    const droneVol = THREE ? THREE.MathUtils.clamp(intensity * 0.35, 0, 0.4) : intensity * 0.3;
    if (this.templeDroneGain) {
      this.templeDroneGain.gain.linearRampToValueAtTime(droneVol, now + 0.5);
    }
  }

  playTempleBell() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [587.33, 880.0, 1174.66]; // D5 resonant harmonic chime
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  setTorchEquipped(equipped) {
    if (!this.ctx || !this.torchGain) return;
    const now = this.ctx.currentTime;
    this.torchGain.gain.linearRampToValueAtTime(equipped ? 0.35 : 0.0, now + 1);
  }

  playFootstep(isSprinting = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const stepInterval = isSprinting ? 0.32 : 0.52;
    if (now - this.lastFootstepTime < stepInterval) return;
    this.lastFootstepTime = now;

    // Gravel / Stone crunch noise burst
    const dur = 0.08;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = this.isInTemple ? 'lowpass' : 'bandpass';
    filter.frequency.value = this.isInTemple ? 450 : 700 + Math.random() * 150;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.22 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  playJump() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playTorchIgnite() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Whoosh + spark
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playClueInspect() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Eerie minor dissonance chord (C4, Eb4, Gb4)
    [261.63, 311.13, 369.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + 2.3);
    });
  }

  startHeartbeat(duration = 6.0) {
    if (!this.ctx) return;
    const startTime = this.ctx.currentTime;
    const beatInterval = 0.65; // ~92 bpm tense pulse

    const beatTimer = setInterval(() => {
      if (!this.ctx || this.ctx.currentTime - startTime > duration) {
        clearInterval(beatTimer);
        return;
      }
      this.playSingleHeartbeat();
    }, beatInterval * 1000);
  }

  playSingleHeartbeat() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Lub-dub
    [0, 0.14].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 68 : 54, now + offset);
      osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.12);

      gain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  }

  playStoneDoorGrind() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Heavy grinding stone slab sliding
    const dur = 3.2;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.4 + 0.2 * Math.sin(i * 0.005));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.linearRampToValueAtTime(280, now + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(120, now + dur);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.8);
    gain.gain.linearRampToValueAtTime(0.3, now + 2.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  playWhisperGhostSound() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Eerie descending breath/sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  playHorrorStinger() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Harsh metallic dissonant chime
    [220, 233.08, 440, 466.16].forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.2);
    });
  }

  silenceForHorror(duration = 4) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.ambientWindGain) this.ambientWindGain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    if (this.templeDroneGain) this.templeDroneGain.gain.linearRampToValueAtTime(0.05, now + 0.3);

    setTimeout(() => {
      if (this.ctx) {
        const restoreTime = this.ctx.currentTime;
        if (this.templeDroneGain && this.isInTemple) {
          this.templeDroneGain.gain.linearRampToValueAtTime(0.5, restoreTime + 2);
        }
      }
    }, duration * 1000);
  }

  // Golden Key Pickup: Sparkling ethereal harmonic chime
  playKeyPickup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [784.0, 987.77, 1174.66, 1567.98]; // G5, B5, D6, G6
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.18 / (idx + 1), now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 1.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 1.9);
    });
  }

  // Tactical Flashlight Pickup: Rugged mechanical switch click & capacitor charge
  playFlashlightPickup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Heavy tactile click 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.04);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Capacitor power hum up
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(480, now + 0.28);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.48);
  }

  // Temple Door Locked: Heavy rusted iron handle rattle
  playDoorLocked() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95 + Math.random() * 20, now + offset);
      osc.frequency.exponentialRampToValueAtTime(40, now + offset + 0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      gain.gain.setValueAtTime(0.28, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    });
  }

  // Ancient Temple Lock Opening: Mechanical lock tumblers rotating and latch releasing
  playDoorUnlock() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Tumbler rotation ticks
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 - i * 40, now + offset);
      osc.frequency.exponentialRampToValueAtTime(120, now + offset + 0.07);

      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.09);
    }

    // Heavy main bolt release clunk
    const clunkOsc = this.ctx.createOscillator();
    const clunkGain = this.ctx.createGain();
    clunkOsc.type = 'sawtooth';
    clunkOsc.frequency.setValueAtTime(160, now + 0.55);
    clunkOsc.frequency.exponentialRampToValueAtTime(35, now + 0.85);

    const clunkFilter = this.ctx.createBiquadFilter();
    clunkFilter.type = 'lowpass';
    clunkFilter.frequency.value = 320;

    clunkGain.gain.setValueAtTime(0.45, now + 0.55);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    clunkOsc.connect(clunkFilter);
    clunkFilter.connect(clunkGain);
    clunkGain.connect(this.masterGain);
    clunkOsc.start(now + 0.55);
    clunkOsc.stop(now + 0.96);
  }

  // Temple Door Open: Heavy stone slab sliding & hinge groan
  playDoorOpen() {
    this.playStoneDoorGrind();
  }

  // --- Level 2: The Forgotten Hall Audio Synthesizers ---
  // Tactile stone mechanism activation (ratchet teeth, counterweights, and latching bolt)
  playMechanismClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Triple gear tooth click
    [0, 0.09, 0.18].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 + idx * 60, now + offset);
      osc.frequency.exponentialRampToValueAtTime(70, now + offset + 0.06);

      gain.gain.setValueAtTime(0.24, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });

    // 2. Heavy iron bolt latching
    const boltOsc = this.ctx.createOscillator();
    const boltGain = this.ctx.createGain();
    boltOsc.type = 'sawtooth';
    boltOsc.frequency.setValueAtTime(140, now + 0.3);
    boltOsc.frequency.exponentialRampToValueAtTime(45, now + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    boltGain.gain.setValueAtTime(0.35, now + 0.3);
    boltGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    boltOsc.connect(filter);
    filter.connect(boltGain);
    boltGain.connect(this.masterGain);
    boltOsc.start(now + 0.3);
    boltOsc.stop(now + 0.56);
  }

  // Deep stone slab sliding open (secret door)
  playStoneDoorSlide() {
    this.playStoneDoorGrind();
  }

  // Distant hollow footsteps echoing in the empty temple hall
  playDistantFootsteps() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const steps = 4;

    for (let i = 0; i < steps; i++) {
      const offset = i * 0.58;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 + Math.random() * 20, now + offset);
      osc.frequency.exponentialRampToValueAtTime(42, now + offset + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240; // Muffled distant acoustics

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    }
  }

  // Faint eerie distant voice whisper ("Help me...")
  playFaintVoiceHelp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual formant synthesis for subtle distant human vocal resonance
    const formants = [500, 1500, 2500]; // Vowel formant peaks
    formants.forEach((f, idx) => {
      const noise = this.ctx.createBufferSource();
      const dur = 1.6;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / (this.ctx.sampleRate * dur)) * Math.PI);
      }
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = f;
      filter.Q.value = 5.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
    });
  }

  // Soft mystery clue chime
  playClueChime() {
    this.playClueInspect();
  }

  // --- Level 2: The Ancient Temple Exploration Synthesizers ---
  // Sacred Energy Crystal Pickup: Resonant crystalline harmonic chime with high-frequency shimmer
  playCrystalPickup() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const crystalFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5 major arpeggio
    crystalFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.04 + 1.2);

      gain.gain.setValueAtTime(0.18 / (idx + 1), now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 1.9);
    });
  }

  // Symbol Activation Chime: Resonant sacred bell gong with rising harmonic overtone
  playSymbolActivate() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [440.0, 659.25, 880.0]; // A4, E5, A5 resonant chord
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 1.2);

      gain.gain.setValueAtTime(0.14 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.7);
    });
  }

  // Puzzle Success: Triumphant sacred temple chime and glowing resonance
  playPuzzleSuccess() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66]; // G major celestial sequence
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.16 / (idx * 0.5 + 1), now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 2.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 2.5);
    });
  }

  // Puzzle Fail: Discordant low rumble & corrupted stone lock feedback
  playPuzzleFail() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Low jarring dissonant buzz
    [92.5, 98.0, 138.59].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  // Ancient Scroll Open: Parchment rustle with mystical shimmer
  playScrollOpen() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Gentle parchment noise sweep
    const dur = 0.35;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3 * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);

    // Ethereal subtle high chime
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, now + 0.05);
    oscGain.gain.setValueAtTime(0.06, now + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now + 0.05);
    osc.stop(now + 1.3);
  }

  // AI Companion Summon: Ethereal holographic hum and celestial chime
  playAICompanionSummon() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(554.37, now);
    osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  }

  setTempleInterior(isIn) {
    this.isInTemple = isIn;
    if (!this.ctx || !this.templeDroneGain) return;
    const now = this.ctx.currentTime;
    this.templeDroneGain.gain.linearRampToValueAtTime(isIn ? 0.35 : 0.0, now + 1.2);
  }

  // --- Level 3 Audio Synthesizers: The Hidden Path ---

  // Stone Wall Mechanism: Heavy gear friction, stone tumbler turn, and deep mechanical clunk
  playStoneMechanism() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Friction scraping noise
    const dur = 1.2;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / (this.ctx.sampleRate * dur)) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + dur);
    filter.Q.value = 3.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Heavy mechanical stone clunk at end
    setTimeout(() => {
      if (!this.ctx) return;
      const clunkNow = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const clunkGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, clunkNow);
      osc.frequency.exponentialRampToValueAtTime(32, clunkNow + 0.35);

      clunkGain.gain.setValueAtTime(0.45, clunkNow);
      clunkGain.gain.exponentialRampToValueAtTime(0.001, clunkNow + 0.4);

      osc.connect(clunkGain);
      clunkGain.connect(this.masterGain);
      osc.start(clunkNow);
      osc.stop(clunkNow + 0.45);
    }, 450);
  }

  // Stone Door Sliding Open: Deep subterranean low-frequency grinding slide
  playStoneDoorSlide() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = 3.0;

    // Subterranean rumble
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(42, now + dur);

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 160;

    oscGain.gain.setValueAtTime(0.32, now);
    oscGain.gain.linearRampToValueAtTime(0.28, now + dur * 0.7);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(rumbleFilter);
    rumbleFilter.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur);

    // Heavy scraping stone noise
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 320;
    noiseFilter.Q.value = 2.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.linearRampToValueAtTime(0.22, now + dur * 0.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // Supernatural Entity Whisper: Multi-formant binaural phantom whisper
  playEntityWhisper() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = 2.2;

    const formants = [450, 1100, 2300, 3100];
    formants.forEach((f, idx) => {
      const noise = this.ctx.createBufferSource();
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const envelope = Math.sin((i / (this.ctx.sampleRate * dur)) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(f, now);
      filter.frequency.linearRampToValueAtTime(f * 0.85, now + dur);
      filter.Q.value = 6.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09 / (idx * 0.5 + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
    });
  }

  // Supernatural Entity Glitch / Stinger: Sudden dissonant horror sting when entity appears
  playEntityGlitchDrone() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Harsh dissonant tritone frequencies
    [87.31, 123.47, 174.61].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 1.2);

      gain.gain.setValueAtTime(0.22 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  }

  // Cardiac Heartbeat Sound (Pulsing during chase sequence)
  playHeartbeat(isFast = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual lub-dub cardiac pulse
    [0, 0.16].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 58 : 46, now + offset);
      osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.12);

      gain.gain.setValueAtTime(isFast ? 0.38 : 0.26, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  }

  // Chase Tension Drone
  startChaseDrone() {
    if (!this.ctx || this.chaseOsc) return;
    const now = this.ctx.currentTime;

    this.chaseOsc = this.ctx.createOscillator();
    this.chaseOsc.type = 'sawtooth';
    this.chaseOsc.frequency.setValueAtTime(65.41, now); // C2

    this.chaseFilter = this.ctx.createBiquadFilter();
    this.chaseFilter.type = 'lowpass';
    this.chaseFilter.frequency.value = 240;

    this.chaseGain = this.ctx.createGain();
    this.chaseGain.gain.setValueAtTime(0.01, now);
    this.chaseGain.gain.linearRampToValueAtTime(0.22, now + 1.5);

    this.chaseOsc.connect(this.chaseFilter);
    this.chaseFilter.connect(this.chaseGain);
    this.chaseGain.connect(this.masterGain);
    this.chaseOsc.start(now);
  }

  stopChaseDrone() {
    if (!this.chaseOsc || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      this.chaseGain.gain.linearRampToValueAtTime(0.001, now + 1.0);
      setTimeout(() => {
        if (this.chaseOsc) {
          this.chaseOsc.stop();
          this.chaseOsc.disconnect();
          this.chaseOsc = null;
        }
      }, 1100);
    } catch (e) {
      this.chaseOsc = null;
    }
  }

  // Sacred Sanctuary Chime: Tranquil harmonic bells when entering safe exit
  playSanctuaryChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [528.0, 660.0, 792.0, 1056.0]; // Solfeggio 528Hz Love/Healing harmonic
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + idx * 0.12 + 2.5);

      gain.gain.setValueAtTime(0.18 / (idx * 0.6 + 1), now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 3.2);
    });
  }

  // Footprint Inspection Sound: Subtle soft stone dust shuffle
  playFootprintInspect() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = 0.4;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / (this.ctx.sampleRate * dur)) * Math.PI) * 0.2;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }
  // --- Level 10 Audio Synthesizers: The Final Battle ---
  playBossAttackProjectile() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Dark screeching noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playEnergyWave() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Low sweeping rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playSpiritualBlast() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // High bright blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playShieldBreak() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Shattering glass/energy sound
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(200, now + i * 0.05 + 0.2);

      gain.gain.setValueAtTime(0.2, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.25);
    }
  }

  playBossDefeat() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Massive explosion and fade
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2.0, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.5));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 2.0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  playDivineEnergyChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Pure, warm, angelic chord
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.2 / (idx + 1), now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 4.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 4.5);
    });
  }
}

export const soundManager = new SoundEngine();
