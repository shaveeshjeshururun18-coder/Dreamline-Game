import type { CompanionMemory, CompanionState, FrostyEmote, RegionId } from './types';

export interface DialogueEntry {
  id: string;
  context:
    | RegionId
    | 'home'
    | 'igloo'
    | 'train'
    | 'bus'
    | 'boat'
    | 'campfire'
    | 'night'
    | 'general';
  text: string;
}

const DIALOGUE_POOL: DialogueEntry[] = [
  // Coastal World — explores beach, watches ocean, rests in shade
  {
    id: 'coast_1',
    context: 'coastal',
    text: 'Ooh, salty sea sparkles! Do not worry, my magic snow stays frosty even by Kadalkarai beach!',
  },
  {
    id: 'coast_2',
    context: 'coastal',
    text: 'I love watching the turquoise waves from under a shady umbrella. Shall we row the harbour boat?',
  },
  {
    id: 'coast_3',
    context: 'coastal',
    text: 'Look at the lighthouse beam spinning across the ocean! *happy snow-wiggle*',
  },
  // Snowy Mountain World — excited, plays with snow, builds tiny sculptures
  {
    id: 'snow_1',
    context: 'snow',
    text: 'SNOW! Fresh powder everywhere in Panimalai! Watch me sculpt a tiny snow buddy!',
  },
  {
    id: 'snow_2',
    context: 'snow',
    text: '*bounces excitedly* The frozen lake shines like a giant crystal mirror! Best day ever!',
  },
  {
    id: 'snow_3',
    context: 'snow',
    text: 'My ice crystals are tingling with joy up here! Let us explore every snowy pine cabin!',
  },
  // Cherry Blossom Region — watches falling petals curiously
  {
    id: 'sakura_1',
    context: 'sakura',
    text: '*tilts head curiously* A pink blossom petal just landed right on my crystal nose!',
  },
  {
    id: 'sakura_2',
    context: 'sakura',
    text: 'Pink snow drifting over ஷவீஷ் ஜெஷுருன் சா station! Well, petals — even prettier!',
  },
  // Green Countryside — follows through fields & observes butterflies
  {
    id: 'country_1',
    context: 'countryside',
    text: '*waddles happily* Did you see that golden butterfly? It circled my blue scarf twice!',
  },
  {
    id: 'country_2',
    context: 'countryside',
    text: 'The cool mist from Pachai Vayal Waterfall feels refreshing! Let us watch the cascade.',
  },
  // Lake & Camping — sits beside player, watches stars
  {
    id: 'lake_1',
    context: 'lake_camp',
    text: 'Neelam Lake reflects every star like a magic ice pond. I will sit right here beside you.',
  },
  {
    id: 'lake_2',
    context: 'lake_camp',
    text: 'Nothing beats quiet lakeside camping with my favourite travelling friend.',
  },
  // Personal Home & Frosty's Igloo Corner
  {
    id: 'home_1',
    context: 'home',
    text: 'Home sweet En Illam! My cozy igloo corner and snowflake lamp are waiting just inside!',
  },
  {
    id: 'home_2',
    context: 'home',
    text: 'You brew warm Filter Kaapi and I will chill on my blue cushion — perfect teamwork!',
  },
  {
    id: 'igloo_1',
    context: 'igloo',
    text: '*snuggles onto blue cushion* My tiny igloo bed is so soft and cool... zzz...',
  },
  {
    id: 'igloo_2',
    context: 'igloo',
    text: '*stretches icy hands* All rested and sparkly! Ready for our next peaceful journey!',
  },
  // Vehicles & Campfire
  {
    id: 'train_1',
    context: 'train',
    text: 'All aboard! My blue scarf is ready — let us watch the whole valley roll past the window!',
  },
  {
    id: 'bus_1',
    context: 'bus',
    text: 'Window seat on the village bus! *waves icy mittens at passing blossom trees*',
  },
  {
    id: 'boat_1',
    context: 'boat',
    text: 'Captain Frosty reporting from the bow! Look at the sparkling ripples ahead!',
  },
  {
    id: 'fire_1',
    context: 'campfire',
    text: 'Sitting at a safe frosty distance from the campfire, watching golden embers float to the stars!',
  },
  {
    id: 'night_1',
    context: 'night',
    text: 'Look! My ice crystals glow soft cyan at night so we never lose our way together.',
  },
  {
    id: 'gen_1',
    context: 'general',
    text: '*happy little bounce* Wherever the road or railway takes us next, Frosty is right behind you!',
  },
];

export function createInitialCompanionState(startX: number, startY: number, startZ: number): CompanionState {
  return {
    name: 'Frosty',
    tamilName: 'ஃபிராஸ்டி',
    x: startX - 1.45,
    y: startY,
    z: startZ + 0.55,
    heading: Math.PI * 0.88,
    speed: 0,
    activity: 'idle',
    emote: 'wave',
    emoteTimer: 3.2,
    restingInIgloo: false,
    regionMood: 'sakura',
    currentLine: null,
    lineTimer: 0,
    cooldownTimer: 3.5,
  };
}

export function createInitialCompanionMemory(): CompanionMemory {
  return {
    visitedRegions: ['sakura'],
    trainRides: 0,
    busRides: 0,
    boatRides: 0,
    campingNights: 0,
    homeVisits: 0,
    snowSculpturesBuilt: 0,
    memoriesLog: ['Met Frosty the Ice Companion at ஷவீஷ் ஜெஷுருன் சா Station.'],
    spokenIds: [],
  };
}

export function recordRegionVisit(memory: CompanionMemory, regionId: RegionId, label: string): boolean {
  if (memory.visitedRegions.includes(regionId)) return false;
  memory.visitedRegions.push(regionId);
  memory.memoriesLog.unshift(`Explored ${label} together with Frosty.`);
  if (memory.memoriesLog.length > 16) memory.memoriesLog.length = 16;
  return true;
}

export function recordCompanionMilestone(
  memory: CompanionMemory,
  kind: 'train' | 'bus' | 'boat' | 'camp' | 'home' | 'sculpture' | 'camper',
  note: string
): void {
  if (kind === 'train') memory.trainRides += 1;
  else if (kind === 'bus') memory.busRides += 1;
  else if (kind === 'boat') memory.boatRides += 1;
  else if (kind === 'camp') memory.campingNights += 1;
  else if (kind === 'home') memory.homeVisits += 1;
  else if (kind === 'sculpture') memory.snowSculpturesBuilt = (memory.snowSculpturesBuilt ?? 0) + 1;

  if (memory.memoriesLog[0] !== note) {
    memory.memoriesLog.unshift(note);
    if (memory.memoriesLog.length > 16) memory.memoriesLog.length = 16;
  }
}

export function pickContextualDialogue(
  context: DialogueEntry['context'],
  memory: CompanionMemory,
  force = false
): string | null {
  const candidates = DIALOGUE_POOL.filter((d) => d.context === context);
  const pool = candidates.length > 0 ? candidates : DIALOGUE_POOL.filter((d) => d.context === 'general');
  const unheard = pool.filter((d) => !memory.spokenIds.includes(d.id));

  let chosen: DialogueEntry | undefined;
  if (unheard.length > 0) {
    chosen = unheard[0];
  } else if (force) {
    const idx = memory.spokenIds.length % pool.length;
    chosen = pool[idx];
  } else {
    return null;
  }

  if (!chosen) return null;
  if (!memory.spokenIds.includes(chosen.id)) {
    memory.spokenIds.push(chosen.id);
  }
  return chosen.text;
}

export function triggerFrostyEmote(
  state: CompanionState,
  emote: FrostyEmote,
  durationSeconds = 3.6
): CompanionState {
  return {
    ...state,
    emote,
    emoteTimer: durationSeconds,
    restingInIgloo: emote === 'sleeping' ? state.restingInIgloo : false,
  };
}

/**
 * Pure AI companion steering & follow kinematics for Frosty:
 * - Waddles smoothly to a natural shoulder offset beside/behind the player
 * - Gently steers around water and obstacles (radial detour probes)
 * - Recovers cleanly if separated across long distances or fast travel
 * - Runs subtle ambient regional reactions (excited bouncing in snow, curious head-tilts in blossoms/fields)
 */
export function stepCompanionFollow(
  state: CompanionState,
  targetX: number,
  targetY: number,
  targetZ: number,
  playerHeading: number,
  playerSpeed: number,
  dt: number,
  walkableHeightFn: (x: number, z: number) => number,
  isWaterFn: (x: number, z: number) => boolean,
  regionId: RegionId = state.regionMood,
  isBlockedFn?: (x: number, z: number, y: number) => boolean
): CompanionState {
  const clampedDt = Math.min(Math.max(dt, 0), 0.1);
  let {
    x,
    y,
    z,
    heading,
    speed,
    activity,
    emote,
    emoteTimer,
    restingInIgloo,
    currentLine,
    lineTimer,
    cooldownTimer,
  } = state;

  if (lineTimer > 0) {
    lineTimer = Math.max(0, lineTimer - clampedDt);
    if (lineTimer === 0) currentLine = null;
  }
  if (cooldownTimer > 0) {
    cooldownTimer = Math.max(0, cooldownTimer - clampedDt);
  }
  if (emoteTimer > 0) {
    emoteTimer = Math.max(0, emoteTimer - clampedDt);
    if (emoteTimer === 0 && !restingInIgloo) {
      emote = 'none';
    }
  }

  // If Frosty is peacefully sleeping in his En Illam igloo corner, stay curled up until player leaves home or wakes him
  if (restingInIgloo) {
    const distFromPlayer = Math.hypot(targetX - x, targetZ - z);
    if (distFromPlayer > 18) {
      restingInIgloo = false;
      emote = 'none';
      emoteTimer = 0;
    } else {
      return {
        ...state,
        speed: 0,
        activity: 'sleeping',
        emote: 'sleeping',
        emoteTimer: 1,
        restingInIgloo: true,
        regionMood: regionId,
        currentLine,
        lineTimer,
        cooldownTimer,
      };
    }
  }

  // Desired offset: 1.6m slightly behind & to the left shoulder of the player
  const sideAngle = playerHeading - Math.PI * 0.68;
  const goalX = targetX + Math.sin(sideAngle) * 1.65;
  const goalZ = targetZ + Math.cos(sideAngle) * 1.65;

  const dx = goalX - x;
  const dz = goalZ - z;
  const distToGoal = Math.hypot(dx, dz);
  const distToPlayer = Math.hypot(targetX - x, targetZ - z);

  const isPassable = (px: number, pz: number, py: number) => {
    if (isWaterFn(px, pz)) return false;
    if (isBlockedFn && isBlockedFn(px, pz, py)) return false;
    return true;
  };

  // Recovery if separated (teleport, fast ride, or stuck behind wall/stairs)
  if (distToPlayer > 24) {
    x = goalX;
    z = goalZ;
    y = walkableHeightFn(x, z);
    heading = playerHeading;
    speed = 0;
    activity = 'idle';
    emote = 'happy_bounce';
    emoteTimer = 2.0;
  } else if (distToGoal > 0.58) {
    const desiredSpeed =
      distToGoal > 5.5
        ? Math.max(8.8, playerSpeed * 1.16)
        : distToGoal > 2.2
        ? Math.max(4.9, playerSpeed * 1.05)
        : Math.min(3.5, distToGoal * 1.85);

    const blend = 1 - Math.exp(-7.5 * clampedDt);
    speed = speed + (desiredSpeed - speed) * blend;

    const baseAng = Math.atan2(dx, dz);
    const stepDist = speed * clampedDt;

    // Obstacle avoidance: try straight ahead, then ±35°, ±70° detours
    const probeOffsets = [0, 0.6, -0.6, 1.2, -1.2];
    let moved = false;
    for (const off of probeOffsets) {
      const ang = baseAng + off;
      const candX = x + Math.sin(ang) * stepDist;
      const candZ = z + Math.cos(ang) * stepDist;
      const candY = walkableHeightFn(candX, candZ);
      if (isPassable(candX, candZ, candY)) {
        x = candX;
        z = candZ;
        y = candY;
        moved = true;
        break;
      }
    }

    // Gentle fallback if wedged in tight geometry
    if (!moved && distToGoal > 6.0) {
      x = goalX;
      z = goalZ;
      y = walkableHeightFn(x, z);
    }

    // Keep polite personal space (> 1.0m) from player center
    const pdx = x - targetX;
    const pdz = z - targetZ;
    const pDist = Math.hypot(pdx, pdz);
    if (pDist < 1.0 && pDist > 1e-4) {
      x = targetX + (pdx / pDist) * 1.0;
      z = targetZ + (pdz / pDist) * 1.0;
    }

    const targetHeading = Math.atan2(dx, dz);
    let diff = targetHeading - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    heading += diff * (1 - Math.exp(-9.0 * clampedDt));
    y = walkableHeightFn(x, z);
    activity = 'following';
  } else {
    speed = speed * Math.exp(-10 * clampedDt);
    if (speed < 0.08) speed = 0;
    y = walkableHeightFn(x, z);
    activity = 'idle';

    // Ambient environmental reactions when Frosty pauses beside you
    if (emote === 'none' && cooldownTimer <= 0.15) {
      if (regionId === 'snow') {
        emote = 'happy_bounce';
        emoteTimer = 2.6;
        cooldownTimer = 9.0;
      } else if (regionId === 'sakura' || regionId === 'countryside') {
        emote = 'curious';
        emoteTimer = 3.0;
        cooldownTimer = 11.0;
      }
    }
  }

  return {
    ...state,
    x,
    y,
    z,
    heading,
    speed,
    activity,
    emote,
    emoteTimer,
    restingInIgloo,
    regionMood: regionId,
    currentLine,
    lineTimer,
    cooldownTimer,
  };
}
