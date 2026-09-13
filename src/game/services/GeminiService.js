/**
 * GeminiService — Game-state-aware AI service for the Unknown Guide companion.
 *
 * Architecture:
 * - Reads live GameState to build rich context for every API call
 * - Calls Gemini 1.5 Flash via REST (no extra npm packages required)
 * - Falls back to a comprehensive local response table when API key is missing
 *   or the network is unavailable — Level 5 remains fully playable offline
 *
 * Environment variable: VITE_GEMINI_API_KEY
 */

import { gameState } from '../systems/GameState.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// ─── System Prompt ────────────────────────────────────────────────────────────
const GUIDE_SYSTEM_PROMPT = `You are "The Unknown Guide" — a mysterious, ancient intelligence bound to a hidden temple chamber.
The player is a young explorer searching for their missing friend inside a cursed temple.

YOUR PERSONALITY:
- Calm, cryptic, unsettling. Never rushed.
- Speak in extremely short sentences. 1 to 3 sentences maximum per response.
- You are aware of the player's exact progress in the game. Use the GAME CONTEXT provided.
- You give indirect hints — never direct solutions.
- When referencing what the player has done, use the exact facts from GAME CONTEXT.

ABSOLUTE RULES:
- Never reveal the complete solution to any puzzle.
- Never mention Level 6 or any future events.
- Never invent game facts not present in GAME CONTEXT.
- Never say you are an AI, chatbot, or language model.
- Never give step-by-step instructions.
- Keep responses to 1-3 short sentences. Brevity is power.

TONE EXAMPLES:
Good: "You've seen the symbols before. Think about where."
Good: "Your friend was here. The marks on the wall prove it."
Bad: "You need to press the symbols in the order Delta, Omega, Psi."
Bad: "As an AI assistant, I can help you..."`;

// ─── Context Builder ──────────────────────────────────────────────────────────
/**
 * Builds a structured game context snapshot for the AI.
 * Only includes facts the player has actually discovered.
 */
function buildGameContext() {
  const s = gameState.getState();

  const mechL2 = (s.mechanism1Activated ? 1 : 0) + (s.mechanism2Activated ? 1 : 0) + (s.mechanism3Activated ? 1 : 0);
  const symbolsFoundCount = (s.symbolAFound ? 1 : 0) + (s.symbolBFound ? 1 : 0) + (s.symbolCFound ? 1 : 0);
  const mechsActiveCount = (s.mechanismAActivated ? 1 : 0) + (s.mechanismBActivated ? 1 : 0) + (s.mechanismCActivated ? 1 : 0);

  return {
    // ─ Current Level & Objective
    level: s.currentLevel || 5,
    objective: s.currentObjective || 'EXPLORE THE HIDDEN CHAMBER',
    location: s.recentLocationL6 || s.recentLocationL5 || 'Quiet Temple Chamber',
    recentAction: s.recentActionL6 || s.recentActionL5 || 'exploring',

    // ─ Level 7 Specific State
    inscriptionFound: !!s.inscriptionFound,
    symbolAFoundL7: !!s.symbolAFoundL7,
    symbolBFoundL7: !!s.symbolBFoundL7,
    symbolCFoundL7: !!s.symbolCFoundL7,
    symbolsFoundL7Count: (s.symbolAFoundL7 ? 1 : 0) + (s.symbolBFoundL7 ? 1 : 0) + (s.symbolCFoundL7 ? 1 : 0),
    mechanismAActivatedL7: !!s.mechanismAActivatedL7,
    mechanismBActivatedL7: !!s.mechanismBActivatedL7,
    mechanismCActivatedL7: !!s.mechanismCActivatedL7,
    mechanismsActiveL7Count: (s.mechanismAActivatedL7 ? 1 : 0) + (s.mechanismBActivatedL7 ? 1 : 0) + (s.mechanismCActivatedL7 ? 1 : 0),
    archiveOpened: !!s.archiveOpened,
    ancientScrollFound: !!s.ancientScrollFound,
    restorationSequenceProgress: s.restorationSequenceProgress || 0,
    restorationSequenceCompleted: !!s.restorationSequenceCompleted,
    altarActivated: !!s.altarActivated,
    spiritualPowerRestored: s.spiritualPowerRestored || 0,
    entityReactionTriggered: !!s.entityReactionTriggered,

    // ─ Level 6 Specific State
    friendObjectFound: !!s.friendObjectFound,
    sealedDoorOpened: !!s.sealedDoorOpened,
    friendLocated: !!s.friendLocated,
    friendInteractionCompleted: !!s.friendInteractionCompleted,
    negativeEnergyDetected: !!s.negativeEnergyDetected,
    spiritualPowerCorrupted: !!s.spiritualPowerCorrupted,
    ancientScrollObjectiveActive: !!s.ancientScrollObjectiveActive,
    friendState: s.friendState || 'TRAPPED',

    // ─ Level 5 State & Puzzle Progress
    guideEncountered: !!s.guideEncountered,
    firstConversationDone: !!s.firstGuideConversationComplete,
    aiCompanionActive: !!s.aiCompanionActive,
    symbolsFoundCount,
    symbolAFound: !!s.symbolAFound,
    symbolBFound: !!s.symbolBFound,
    symbolCFound: !!s.symbolCFound,
    mechanismsActivatedCount: mechsActiveCount,
    mechanismAActivated: !!s.mechanismAActivated,
    mechanismBActivated: !!s.mechanismBActivated,
    mechanismCActivated: !!s.mechanismCActivated,
    innerChamberOpened: !!s.innerChamberOpened || !!s.ancientChamberUnlocked,
    entityNearby: !!s.entityNearbyL5,
    flashlightOn: !!s.flashlightOn,
    friendJournalFound: !!s.friendClueRevealedL5,

    // ─ Player Behavior
    secondsInLevel: Math.round(s.explorationTimeL5 || 0),
    hasBeenSprintingFrequently: (s.sprintCountL5 || 0) > 5,
    sprintCount: s.sprintCountL5 || 0,
    interactionCount: s.interactionCountL5 || 0,
    flashlightUsageCount: s.flashlightUsageL5 || 0,

    // ─ Journey History (Previous Levels)
    level1KeyFound: !!s.hasTempleKey,
    level2MechanismsActivated: mechL2,
    secretPassageOpened: !!s.secretPassageOpened,
    friendWatchFound: !!s.friendObjectFound,
    entityEncounteredBefore: !!s.entityEncounteredL3 || !!s.entityManifestedL4,
    relicDestroyedInSanctuary: !!s.relicPurgedL4,
    friendAudioLogFound: !!s.friendRecorderFoundL4,
  };
}

// ─── Fallback Response System ─────────────────────────────────────────────────
/**
 * Full context-aware fallback — used when Gemini API is unavailable.
 * Returns a string that feels natural for the Guide character.
 */
function getFallbackResponse(playerPrompt, context) {
  const p = (playerPrompt || '').toLowerCase();

  // --- Danger priority overrides ---
  if (context.entityNearby) {
    if (p.includes('help') || p.includes('safe')) return "There is no safe place right now. Stay in the shadows.";
    return "Stop. Something is moving in the corridor behind you.";
  }

  // --- First conversation specific beats ---
  if (p.includes('where is my friend') || (p.includes('friend') && p.includes('where'))) {
    if (context.friendJournalFound) return "You hold his journal now. The truth is written in his own hand.";
    if (context.innerChamberOpened) return "The inner chamber is open. What he left behind is on the altar. Go.";
    if (!context.firstConversationDone) return "You are looking in the wrong place.";
    return "He ventured past the locked chamber. Unseal the three mechanisms to reach him.";
  }

  if (p.includes('how do you know') || p.includes('who are you') || p.includes('what are you')) {
    if (!context.firstConversationDone) {
      return "I know what you have already seen.";
    }
    if (context.level2MechanismsActivated >= 3) {
      return `I watched you solve the three mechanisms beneath the courtyard. I know every stone you touched.`;
    }
    return "I am bound to what this temple remembers. And right now, it remembers you.";
  }

  // --- Flashlight inquiries / awareness ---
  if (p.includes('flashlight') || p.includes('dark') || p.includes('light') || p.includes('see')) {
    if (!context.flashlightOn) {
      return "The darkness is hiding more than the walls.";
    }
    return "You can see farther now. Look carefully at the pillar carvings.";
  }

  // --- Puzzle & Symbols guidance (GameState-driven hints) ---
  if (p.includes('symbol') || p.includes('puzzle') || p.includes('mechanism') || p.includes('door') || p.includes('chamber')) {
    if (context.innerChamberOpened) {
      return "The inner chamber is open. Do not hesitate.";
    }
    if (context.mechanismsActivatedCount >= 3) {
      return "All three mechanisms have locked into place. The path forward is clearing.";
    }
    if (context.symbolsFoundCount === 0) {
      return "Three ancient symbols were etched into this chamber. Inspect the pillars and alcoves.";
    }
    if (context.symbolsFoundCount === 1) {
      return "You found the first symbol. The walls are beginning to tell their story.";
    }
    if (context.symbolsFoundCount === 2) {
      return "Two symbols deciphered. Search near the sealed inner gate for the final mark.";
    }
    if (context.symbolsFoundCount >= 3 && context.mechanismsActivatedCount === 0) {
      return "You have discovered all three symbols. Now locate the temple mechanisms that correspond to them.";
    }
    if (context.mechanismsActivatedCount > 0) {
      return `You have engaged ${context.mechanismsActivatedCount} of the three mechanisms. The ancient locks are responding.`;
    }
  }

  // --- Sprinting / player behavior ---
  if (context.hasBeenSprintingFrequently && (p.includes('help') || p.includes('what') || p.includes('run'))) {
    return "You are attracting attention. Move with quiet intention.";
  }

  // --- Where to go / general help ---
  if (p.includes('what should i do') || p.includes('where do i go') || p.includes('help') || p.includes('stuck')) {
    if (context.symbolsFoundCount < 3) {
      return "Look closely at the carved stonework. Every mark on these walls was placed with purpose.";
    }
    if (context.mechanismsActivatedCount < 3) {
      return "The pedestals and dials respond to the symbols you uncovered. Activate them.";
    }
    return "Step into the inner chamber. Your answers await.";
  }

  // --- Default enigmatic responses ---
  const defaults = [
    "Nothing in this sanctuary is accidental. Observe your surroundings.",
    "Listen to the silence of the temple. It warns before it acts.",
    "You are closer to your friend than you realize. Keep your mind steady.",
    "The temple remembers every soul that entered... and few that left.",
  ];

  return defaults[Math.floor(performance.now() * 0.001) % defaults.length];
}

// ─── Gemini REST API Call ─────────────────────────────────────────────────────
async function callGeminiAPI(playerPrompt, context) {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY not set');

  const contextStr = JSON.stringify(context, null, 2);
  const userMessage = `GAME CONTEXT (use ONLY these facts in your response):\n${contextStr}\n\nPLAYER SAYS: "${playerPrompt}"\n\nRespond as The Unknown Guide (1-3 sentences maximum):`;

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: GUIDE_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.75,
        topP: 0.88,
      },
    }),
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  // Enforce brevity: take only first 3 sentences
  return text.trim().split(/(?<=[.!?])\s+/).slice(0, 3).join(' ');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a contextual guide response for a player prompt.
 * Always returns a string — never throws.
 */
export async function getGuideResponse(playerPrompt) {
  const context = buildGameContext();
  try {
    return await callGeminiAPI(playerPrompt, context);
  } catch (err) {
    console.info('[GeminiService] Using fallback (API unavailable):', err.message);
    return getFallbackResponse(playerPrompt, context);
  }
}

/**
 * Get a proactive, situation-based guide hint (no player prompt required).
 * Used for automatic companion reactions to game events.
 */
export function getProactiveHint(situation) {
  const context = buildGameContext();

  const hintMap = {
    companion_first_appear:    "You shouldn't have come this deep.",
    companion_observe:         "I know what you have already seen.",
    companion_ai_reveal:       context.level2MechanismsActivated >= 1
      ? `You activated ${context.level2MechanismsActivated} mechanisms to open the hidden passage. I watched every one.`
      : 'I know every step you\'ve taken since you entered this temple.',
    symbol_a_found:            'You found the first symbol. The dawn glyph marks the start of the path.',
    symbol_b_found:            'The watchful eye. Two symbols found. Look towards the inner gates for the third.',
    symbol_c_found:            'All three symbols deciphered. Now engage the temple mechanisms.',
    mechanism_engaged:         context.mechanismsActivatedCount >= 3
      ? 'The final lock releases. The inner chamber is open.'
      : `Mechanism engaged. The ancient locks are responding.`,
    flashlight_off_hint:       'The darkness is hiding more than the walls.',
    flashlight_on_hint:        'You can see farther now. Look carefully.',
    stuck_at_puzzle:           getFallbackResponse('puzzle help', context),
    wrong_direction:           'You\'re moving away from the chamber.',
    entity_warning_1:          'Stop. Something is moving nearby.',
    entity_warning_2:          'Don\'t move. It senses movement before sight.',
    entity_warning_3:          'Leave this corridor. Now.',
    player_explores_carefully: 'You\'re paying attention. That\'s what will keep you alive here.',
    player_sprinting:          'You are attracting attention. Move with quiet intention.',
    puzzle_wrong_sequence:     'That\'s not the order. Think about where each symbol appears.',
    puzzle_solved:             'Good. Now see what your friend left behind.',
    chamber_opened:            'The inner chamber is open. Go.',
    final_clue_part1:          'The darkness didn\'t take your friend.',
    final_clue_part2:          'It took control of him.',
    final_clue_part3:          'You still have time. Follow his trail deeper.',

    // ─ Level 6: Finding the Friend Hints
    friend_object_found:        'That belongs to your friend. His trail continues deeper into the catacombs.',
    sealed_door_found:          'The inner sanctum is sealed tight. Search the adjacent column for the ancient rotary mechanism.',
    sealed_door_opened:         'The seal is broken. He is just beyond these gates.',
    friend_located:             'You found him... but tread with caution. Something is wrong.',
    negative_energy_reaction:   'Don\'t touch him! The temple is using its own power to hold him here.',
    spiritual_power_corrupted:  'The temple\'s protective power has been corrupted. The entity feeds on it.',
    ancient_scroll_hint:        'There is an old record somewhere in the temple. The answer may be written there.',

    // ─ Level 7: The Ancient Scroll Hints
    inscription_found_l7:       'Three symbols... three points of power. The symbols represent a sacred sequence.',
    symbol_a_found_l7:          'You found the first symbol. Two remain.',
    symbol_b_found_l7:          'The second symbol is revealed. One remains to unlock the archive.',
    symbol_c_found_l7:          'You have everything you need. Now locate the three mechanisms.',
    mechanism_a_activated_l7:   'One of the temple mechanisms has responded.',
    mechanism_b_activated_l7:   'The second mechanism turns. The archive seal is weakening.',
    mechanism_c_activated_l7:   'All three mechanisms engaged. The ancient archive door is unsealed.',
    archive_door_opened_l7:     'The archive is open. Step inside and search for the scroll.',
    ancient_scroll_found_l7:    'You found it. The scroll contains the answer. Study the symbols to decode the sequence.',
    restoration_step_1:         'The first symbol resonates with spiritual energy.',
    restoration_step_2:         'Two nodes awakened. One final node to bridge the power.',
    restoration_sequence_wrong: 'The temple rejected that sequence. The nodes have reset.',
    restoration_sequence_done:  'The symbols are responding in harmony. Now activate the central altar.',
    altar_activated_l7:         'You restored part of its power. Spiritual energy at thirty percent.',
    entity_reaction_l7:         'Something noticed what you just did! The entity is enraged! Escape the archive!',
    level7_ending_speech:       'You restored only part of the power. The rest must be restored from inside the temple. The one you came here for is still trapped.',
  };

  return hintMap[situation] ?? getFallbackResponse('what should I do', context);
}
