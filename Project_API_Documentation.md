# Ancient Shadows – Final Project & API Documentation

## 1. Final Idea Summary
**Ancient Shadows** is a first-person 3D horror and adventure game built entirely for the browser. Set within the ancient ruins inspired by the **Shri Maa Sheetla Devi Mandir**, the game follows a young explorer searching for their missing friend. 

As the player progresses through **12 complete levels**, they must solve environmental puzzles, uncover ancient symbols, restore corrupted spiritual energy, and battle supernatural entities. The game emphasizes atmosphere, narrative, and real-time 3D exploration without relying on heavy game engines like Unity or Unreal.

### Key Highlights:
*   **Zero-Plugin 3D Experience:** Runs natively in the browser using WebGL.
*   **Dynamic AI Companion:** Integrates LLM capabilities to provide real-time, context-aware hints.
*   **Custom Game Engine Architecture:** Features a custom state machine, audio manager, and combat system built from scratch.

---

## 2. Tech Stack & Technologies Used
*   **Frontend Framework:** React 18
*   **3D Rendering:** Three.js / React Three Fiber (@react-three/fiber, @react-three/drei)
*   **Build Tool:** Vite
*   **Styling:** Vanilla CSS
*   **Artificial Intelligence:** Google Gemini 1.5 Flash API

---

## 3. API Documentation (Generative AI Integration)

The core API integration in this project is the **Gemini 1.5 Flash API**, which powers **"The Unknown Guide"**—an enigmatic, context-aware AI companion that assists the player dynamically based on their in-game progress.

### 3.1. Endpoint Details
*   **API Provider:** Google Generative AI (Gemini)
*   **Model Used:** `gemini-1.5-flash`
*   **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=[API_KEY]`
*   **Authentication:** API Key injected via environment variables (`VITE_GEMINI_API_KEY`).

### 3.2. Context-Aware Prompt Architecture (`GeminiService.js`)
Instead of acting as a simple chatbot, the API is heavily integrated into the game's internal state machine (`GameState.js`). 

Before every API call, the system builds a **Snapshot Payload** containing exact game metrics, ensuring the AI only references facts the player has already discovered:
*   **Current Level & Objective:** (e.g., Level 5, Objective: "Explore the hidden chamber")
*   **Puzzle Progress:** Number of symbols found, mechanisms activated, doors opened.
*   **Player Behavior:** Number of seconds in the level, flashlight usage, sprint frequency.
*   **Proximity Alerts:** Is a hostile entity currently nearby?

**Example Request Payload Structure:**
```json
{
  "system_instruction": {
    "parts": [{ "text": "You are 'The Unknown Guide'. Speak in extremely short sentences. You are aware of the player's exact progress..." }]
  },
  "contents": [
    {
      "role": "user",
      "parts": [{ 
        "text": "GAME CONTEXT: {\"level\": 5, \"symbolsFoundCount\": 2, \"entityNearby\": true}\n\nPLAYER SAYS: \"Where do I go?\"" 
      }]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 100,
    "temperature": 0.75
  }
}
```

### 3.3. Offline Fallback System
To ensure a seamless user experience during network failures or API limits, the `GeminiService` includes a robust **heuristic fallback system**. If the API request fails, the game intercepts the player's prompt and matches it against the current `GameState` to return pre-written, context-accurate responses.

---

## 4. Internal System Architecture (Core Modules)

While the game doesn't expose external REST APIs, it relies on a strict modular architecture internally:

*   **`GameState.js` (Singleton):** Acts as the central nervous system of the game. Tracks inventory, puzzle states, health, and current levels. Triggers React state updates when variables change.
*   **`EntityAI.js`:** A custom finite state machine (FSM) for enemies. States include: `IDLE`, `CHASE`, `ATTACK`, `COOLDOWN`, `HURT`, and `DEFEATED`. Calculates distance to the player using 3D vector math.
*   **`SoundManager.js`:** Handles spatial audio, background ambiance, combat SFX, and seamless transitions between level themes.
*   **`FirstPersonFlashlight.js`:** Controls player movement (WASD + Mouse), jump physics, and collision detection using Raycasters against the Three.js scene graph.

---

## 5. Submission Details
*   **Repository:** GitHub 
*   **Platform Target:** Web Browser (Desktop optimized)
*   **Input Method:** Keyboard (WASD) and Mouse (Pointer Lock)
