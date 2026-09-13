# 🏛️ Ancient Shadows — AI Heritage Horror Game

> A first-person horror/adventure game set inside an ancient Indian temple, built with React + Three.js

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 🎮 About the Game

**Ancient Shadows** is a browser-based 3D horror/adventure game built entirely with **React + Three.js** (no Unity, no Blender). You explore the ancient ruins of **Shri Maa Sheetla Devi Mandir**, uncovering a dark supernatural force that has corrupted its spiritual energy.

The game features **12 complete levels**, a full combat system, AI enemies, spiritual mechanics, and a rich narrative ending.

---

## 🗺️ Levels Overview

| Level | Title | Type |
|-------|-------|------|
| 1 | The Temple Key | Exploration |
| 2 | The Ancient Temple Exploration | Puzzle |
| 3 | The Hidden Path | Stealth / Escape |
| 4 | The Corrupted Sanctuary | Puzzle + Chase |
| 5 | The Unknown Guide | Mystery |
| 6 | Finding the Friend | Exploration |
| 7 | The Ancient Scroll | Puzzle |
| 8 | The Corrupted Guardian | **Combat Boss Fight** |
| 9 | The Negative Entity | Survival |
| 10 | The Final Battle | **Boss Fight** |
| 11 | The Divine Guardian | Narrative |
| 12 | The Final Escape | **Cinematic Ending** |

---

## ⚔️ Features

- 🕹️ **First-Person 3D Gameplay** — Full WASD + mouse controls with pointer lock
- 👾 **Combat System** — Left click (fast attack), Right click (heavy attack), Shift (dodge/dash)
- 🧠 **Enemy AI** — State machine driven (Idle → Chase → Attack → Cooldown → Defeated)
- ❤️ **Health System** — Player health, boss health bars, screen damage feedback
- 🔮 **Spiritual Mechanics** — Energy weapons, relic collection, seal activation
- 🎭 **Cinematic Intros/Outros** — Narrative cutscenes between levels
- 🔦 **Dynamic Lighting** — Torches, flashlight, volumetric fog
- 🔊 **Audio System** — Ambient, combat, and environmental sounds
- 📜 **Objective HUD** — Live objectives, inventory, and status indicators

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/arpantalwar513-hue/hackathon.git

# Navigate to project folder
cd hackathon

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W A S D` | Move |
| `Mouse` | Look around |
| `Left Click` | Fast spiritual attack |
| `Right Click` | Heavy charged attack |
| `Shift` | Dodge / Dash |
| `E` | Interact with objects |
| `F` | Toggle flashlight |
| `Escape` | Release mouse / Pause |

---

## 🛠️ Tech Stack

- **React 18** — UI and HUD components
- **Three.js** — 3D rendering engine
- **Vite** — Build tool and dev server
- **Vanilla CSS** — Styling

---

## 📁 Project Structure

```
src/
├── App.jsx                    # Main app, level router
├── index.css                  # Global styles
└── game/
    ├── Level1Scene.js         # Level 1–12 scenes
    ├── ...
    ├── Level12Scene.js
    ├── ai/
    │   └── EntityAI.js        # Enemy AI system
    ├── audio/
    │   └── SoundManager.js    # Audio engine
    ├── player/
    │   └── FirstPersonFlashlight.js
    ├── systems/
    │   └── GameState.js       # Central game state (singleton)
    ├── textures/
    │   └── ProceduralTextures.js
    └── ui/
        ├── ObjectiveHUD.jsx   # In-game HUD
        ├── LevelTransition.jsx
        ├── CinematicIntro.jsx
        └── ...
```

---

## 📸 Screenshots

> *Coming soon*

---

## 🙏 Credits

Inspired by the real heritage site **Shri Maa Sheetla Devi Mandir**.  
Built as a **Hackathon Project** exploring AI-assisted game development.

---

## 📄 License

MIT License — feel free to use and modify for educational purposes.
