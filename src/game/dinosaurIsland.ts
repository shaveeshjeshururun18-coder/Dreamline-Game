import type { AabbCollider } from './terrain';
import type { DinosaurIslandHudState, SafariCarState } from './types';

export const DINOSAUR_ISLAND_CENTER = { x: 296, z: 128 };
export const DINOSAUR_ISLAND_RADIUS = 30.5;
export const DINOSAUR_ISLAND_LAND_RADIUS = 28.0;

export const DINOSAUR_ARENA_CENTER = { x: 298, z: 130 };
export const DINOSAUR_ARENA_HALF_SIZE = 13.5;

export const DINOSAUR_STATION_APPROX = { x: 280, z: 106 };
export const DINOSAUR_HEADLAND_CENTER = { x: 280, z: 107 };
export const DINOSAUR_EXPLORER_SPAWN = { x: 293.0, z: 123.5 };
export const SAFARI_CAR_SPAWN = { x: 291.5, z: 128.5, heading: 1.15 };

export const DINO_MAX_HP = 350;
export const EXPLORER_MAX_HP = 150;
export const AK47_BURST_DAMAGE = 175;
export const WALL_BREAK_INTERVAL = 0.42;

export interface DinosaurIslandState extends DinosaurIslandHudState {
  dinoX: number;
  dinoZ: number;
  dinoHeading: number;
  dinoRunPhase: number;
  dinoCollapse: number; // 0 = standing, 1 = fully collapsed
  dinoRoarTimer: number;
  wallBreakActive: boolean;
  wallBreakTimer: number;
  akCooldown: number;
  tracerTimer: number;
  tracerFromX: number;
  tracerFromY: number;
  tracerFromZ: number;
  tracerToX: number;
  tracerToY: number;
  tracerToZ: number;
  safariCar: SafariCarState;
}

export interface DinosaurStepEvents {
  wallJustBrokenStage: number | null; // 1..4 when a wall shatters this frame
  dinoJustDefeated: boolean;
  dinoRoared: boolean;
}

export function isOnDinosaurIsland(x: number, z: number): boolean {
  return Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z) <= DINOSAUR_ISLAND_RADIUS;
}

export function isInsideDinosaurIslandLand(x: number, z: number): boolean {
  return Math.hypot(x - DINOSAUR_ISLAND_CENTER.x, z - DINOSAUR_ISLAND_CENTER.z) <= DINOSAUR_ISLAND_LAND_RADIUS;
}

export function createInitialDinosaurIslandState(): DinosaurIslandState {
  return {
    onIsland: false,
    explorerHp: EXPLORER_MAX_HP,
    explorerMaxHp: EXPLORER_MAX_HP,
    dinoHp: DINO_MAX_HP,
    dinoMaxHp: DINO_MAX_HP,
    dinoAlive: true,
    kills: 0,
    brokenWalls: 0,
    wallsIntact: [true, true, true, true],
    bannerText: 'PAD-01N · CLOSED T-REX BREAKOUT ARENA',
    statusLine: 'Kill T-Rex with AK-47 to shatter walls 1→4 & unlock Endless Chase!',
    dinoX: DINOSAUR_ARENA_CENTER.x + 7.5,
    dinoZ: DINOSAUR_ARENA_CENTER.z + 5.5,
    dinoHeading: -2.2,
    dinoRunPhase: 0,
    dinoCollapse: 0,
    dinoRoarTimer: 0,
    wallBreakActive: false,
    wallBreakTimer: 0,
    akCooldown: 0,
    tracerTimer: 0,
    tracerFromX: 0,
    tracerFromY: 0,
    tracerFromZ: 0,
    tracerToX: 0,
    tracerToY: 0,
    tracerToZ: 0,
    safariCar: {
      x: SAFARI_CAR_SPAWN.x,
      z: SAFARI_CAR_SPAWN.z,
      heading: SAFARI_CAR_SPAWN.heading,
      speed: 0,
      speedKmh: 0,
      steerAngle: 0,
      wheelSpin: 0,
    },
  };
}

/**
 * Returns active AABB colliders for whichever of the 4 containment walls remain intact.
 * Includes a ranger access gateway on the North wall (x: 156.5..162.5) so travelers arriving
 * via the Sea Railway Bridge / SSJ Dinosaur Island Station can walk right into the arena!
 */
export function getActiveArenaWallColliders(state: DinosaurIslandState): AabbCollider[] {
  const cx = DINOSAUR_ARENA_CENTER.x;
  const cz = DINOSAUR_ARENA_CENTER.z;
  const hs = DINOSAUR_ARENA_HALF_SIZE;
  const thick = 0.85;
  const colliders: AabbCollider[] = [];

  // Stage 1: West Wall
  if (state.wallsIntact[0]) {
    colliders.push({
      id: 'dino_wall_west',
      minX: cx - hs - thick,
      maxX: cx - hs + thick,
      minZ: cz - hs,
      maxZ: cz + hs,
      maxY: 6.5,
    });
  }

  // Stage 2: North Wall (split around the NW station access gate x: 156.2..162.0)
  if (state.wallsIntact[1]) {
    colliders.push({
      id: 'dino_wall_north_right',
      minX: cx - 5.2,
      maxX: cx + hs,
      minZ: cz - hs - thick,
      maxZ: cz - hs + thick,
      maxY: 6.5,
    });
  }

  // Stage 3: East Wall
  if (state.wallsIntact[2]) {
    colliders.push({
      id: 'dino_wall_east',
      minX: cx + hs - thick,
      maxX: cx + hs + thick,
      minZ: cz - hs,
      maxZ: cz + hs,
      maxY: 6.5,
    });
  }

  // Stage 4: South Wall
  if (state.wallsIntact[3]) {
    colliders.push({
      id: 'dino_wall_south',
      minX: cx - hs,
      maxX: cx + hs,
      minZ: cz + hs - thick,
      maxZ: cz + hs + thick,
      maxY: 6.5,
    });
  }

  return colliders;
}

export interface Ak47FireResult {
  state: DinosaurIslandState;
  fired: boolean;
  killedDino: boolean;
  damageDealt: number;
}

/**
 * Fires a high-velocity AK-47 5-round burst toward the chasing T-Rex.
 * Works on foot AND while driving the Safari Car.
 */
export function fireDinosaurIslandAk47(
  state: DinosaurIslandState,
  shooterX: number,
  shooterY: number,
  shooterZ: number
): Ak47FireResult {
  if (state.akCooldown > 0) {
    return { state, fired: false, killedDino: false, damageDealt: 0 };
  }

  const targetX = state.dinoX;
  const targetY = state.dinoAlive ? 2.6 : 1.0;
  const targetZ = state.dinoZ;

  let nextDinoHp = state.dinoHp;
  let nextDinoAlive = state.dinoAlive;
  let nextKills = state.kills;
  let nextWallBreakActive = state.wallBreakActive;
  let nextWallBreakTimer = state.wallBreakTimer;
  let nextBanner = state.bannerText;
  let nextStatus = state.statusLine;
  let killedDino = false;
  let damageDealt = 0;

  if (state.dinoAlive) {
    damageDealt = AK47_BURST_DAMAGE;
    nextDinoHp = Math.max(0, state.dinoHp - damageDealt);
    if (nextDinoHp <= 0) {
      nextDinoAlive = false;
      killedDino = true;
      nextKills += 1;
      if (state.brokenWalls < 4) {
        nextWallBreakActive = true;
        nextWallBreakTimer = 0.08; // shatter first wall almost immediately, then every 0.42s
        nextBanner = 'T-REX DEFEATED · WALLS SHATTERING 1→4!';
        nextStatus = `T-Rex #${nextKills} eliminated! Containment walls breaking open for Endless Chase!`;
      } else {
        nextBanner = `T-REX #${nextKills} DEFEATED · ENDLESS CHASE READY`;
        nextStatus = 'Press Next Endless Dino Chase [N] for another roaring T-Rex wave!';
      }
    } else {
      nextStatus = `AK-47 burst hit! T-Rex HP ${nextDinoHp} / ${state.dinoMaxHp} — fire again to finish!`;
    }
  } else {
    nextStatus = 'T-Rex already down! Trigger Next Endless Dino Chase [N] for a new wave.';
  }

  return {
    fired: true,
    killedDino,
    damageDealt,
    state: {
      ...state,
      dinoHp: nextDinoHp,
      dinoAlive: nextDinoAlive,
      kills: nextKills,
      wallBreakActive: nextWallBreakActive,
      wallBreakTimer: nextWallBreakTimer,
      bannerText: nextBanner,
      statusLine: nextStatus,
      akCooldown: 0.14,
      tracerTimer: 0.16,
      tracerFromX: shooterX,
      tracerFromY: shooterY,
      tracerFromZ: shooterZ,
      tracerToX: targetX,
      tracerToY: targetY,
      tracerToZ: targetZ,
    },
  };
}

/**
 * Spawns a fresh full-HP chasing T-Rex wave on Dinosaur Island (endless mode!).
 */
export function spawnNextDinoWave(
  state: DinosaurIslandState,
  playerX: number,
  playerZ: number
): DinosaurIslandState {
  // Spawn across the arena/island at a dramatic charging distance (~14-18m away, inside island bounds)
  const angleFromCenter = Math.atan2(
    playerZ - DINOSAUR_ARENA_CENTER.z,
    playerX - DINOSAUR_ARENA_CENTER.x
  );
  const spawnAngle = angleFromCenter + Math.PI + (state.kills % 2 === 0 ? 0.35 : -0.35);
  const spawnRadius = state.brokenWalls >= 4 ? 16.5 : 10.2;
  const spawnX = DINOSAUR_ARENA_CENTER.x + Math.cos(spawnAngle) * spawnRadius;
  const spawnZ = DINOSAUR_ARENA_CENTER.z + Math.sin(spawnAngle) * spawnRadius;
  const heading = Math.atan2(playerX - spawnX, playerZ - spawnZ);

  return {
    ...state,
    dinoHp: DINO_MAX_HP,
    dinoMaxHp: DINO_MAX_HP,
    dinoAlive: true,
    dinoX: spawnX,
    dinoZ: spawnZ,
    dinoHeading: heading,
    dinoCollapse: 0,
    dinoRoarTimer: 1.2,
    bannerText:
      state.brokenWalls >= 4
        ? `ENDLESS OPEN-ISLAND CHASE · WAVE ${state.kills + 1}`
        : `PAD-01N ARENA · WAVE ${state.kills + 1}`,
    statusLine: `Fresh T-Rex Wave #${state.kills + 1} charging! Fire AK-47 [K/F] or evade in the Safari Car!`,
  };
}

/**
 * Steps the Dinosaur Island simulation: T-Rex chase AI, sequential wall breaking (1→4),
 * collapse animation, cooldowns, and tracer fade.
 */
export function stepDinosaurIslandState(
  state: DinosaurIslandState,
  targetX: number,
  targetZ: number,
  onIsland: boolean,
  dt: number
): { state: DinosaurIslandState; events: DinosaurStepEvents } {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  const events: DinosaurStepEvents = {
    wallJustBrokenStage: null,
    dinoJustDefeated: false,
    dinoRoared: false,
  };

  let {
    dinoX,
    dinoZ,
    dinoHeading,
    dinoRunPhase,
    dinoCollapse,
    dinoRoarTimer,
    brokenWalls,
    wallBreakActive,
    wallBreakTimer,
    akCooldown,
    tracerTimer,
    bannerText,
    statusLine,
  } = state;
  const wallsIntact: [boolean, boolean, boolean, boolean] = [...state.wallsIntact];

  akCooldown = Math.max(0, akCooldown - cdt);
  tracerTimer = Math.max(0, tracerTimer - cdt);
  dinoRoarTimer = Math.max(0, dinoRoarTimer - cdt);

  // Sequential 1-by-1 containment wall shattering (West -> North -> East -> South)
  if (wallBreakActive && brokenWalls < 4) {
    wallBreakTimer -= cdt;
    if (wallBreakTimer <= 0) {
      wallsIntact[brokenWalls] = false;
      brokenWalls += 1;
      events.wallJustBrokenStage = brokenWalls;
      if (brokenWalls < 4) {
        wallBreakTimer = WALL_BREAK_INTERVAL;
        bannerText = `CONTAINMENT BREACH · WALL ${brokenWalls}/4 SHATTERED`;
      } else {
        wallBreakActive = false;
        wallBreakTimer = 0;
        bannerText = 'ALL 4 WALLS BROKEN · ENDLESS OPEN-ISLAND CHASE!';
        statusLine = 'Breakout complete! Drive Safari Car freely or spawn Next Endless Dino Wave [N]!';
      }
    }
  }

  // T-Rex AI & animation
  if (state.dinoAlive) {
    dinoCollapse = Math.max(0, dinoCollapse - cdt * 3.5);
    if (onIsland) {
      const dx = targetX - dinoX;
      const dz = targetZ - dinoZ;
      const dist = Math.hypot(dx, dz);
      const desiredHeading = Math.atan2(dx, dz);

      // Smooth angular turn toward explorer/Safari Car
      let diff = desiredHeading - dinoHeading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      dinoHeading += diff * Math.min(1, cdt * 4.5);

      if (dist > 3.6) {
        const chaseSpeed = brokenWalls >= 4 ? 7.4 : 6.4;
        const step = Math.min(dist - 3.2, chaseSpeed * cdt);
        let nextX = dinoX + Math.sin(dinoHeading) * step;
        let nextZ = dinoZ + Math.cos(dinoHeading) * step;

        // Keep T-Rex inside intact arena walls, or across full Dinosaur Island once walls break!
        if (brokenWalls < 4) {
          const bound = DINOSAUR_ARENA_HALF_SIZE - 2.2;
          nextX = Math.max(DINOSAUR_ARENA_CENTER.x - bound, Math.min(DINOSAUR_ARENA_CENTER.x + bound, nextX));
          nextZ = Math.max(DINOSAUR_ARENA_CENTER.z - bound, Math.min(DINOSAUR_ARENA_CENTER.z + bound, nextZ));
        } else {
          const rFromIsland = Math.hypot(
            nextX - DINOSAUR_ISLAND_CENTER.x,
            nextZ - DINOSAUR_ISLAND_CENTER.z
          );
          const maxR = DINOSAUR_ISLAND_LAND_RADIUS - 3.2;
          if (rFromIsland > maxR) {
            const sc = maxR / rFromIsland;
            nextX = DINOSAUR_ISLAND_CENTER.x + (nextX - DINOSAUR_ISLAND_CENTER.x) * sc;
            nextZ = DINOSAUR_ISLAND_CENTER.z + (nextZ - DINOSAUR_ISLAND_CENTER.z) * sc;
          }
        }

        dinoX = nextX;
        dinoZ = nextZ;
        dinoRunPhase += cdt * 9.5;
      } else {
        // Snapping menacingly right next to the explorer (explorer has Immortal Armor!)
        dinoRunPhase += cdt * 3.8;
        if (dinoRoarTimer <= 0) {
          dinoRoarTimer = 3.2;
          events.dinoRoared = true;
        }
      }
    } else {
      // Gentle idle patrol pacing inside arena while explorer is away on the mainland/train
      dinoRunPhase += cdt * 2.2;
    }
  } else {
    // Smooth dramatic defeat collapse
    dinoCollapse = Math.min(1, dinoCollapse + cdt * 2.2);
  }

  return {
    events,
    state: {
      ...state,
      onIsland,
      dinoX,
      dinoZ,
      dinoHeading,
      dinoRunPhase,
      dinoCollapse,
      dinoRoarTimer,
      brokenWalls,
      wallsIntact,
      wallBreakActive,
      wallBreakTimer,
      akCooldown,
      tracerTimer,
      bannerText,
      statusLine,
    },
  };
}

/**
 * Steps the drivable Safari Car on SSJ Dinosaur Island.
 * Stays safely on dry island ground (and inside intact walls before breakout).
 */
export function stepSafariCarState(
  car: SafariCarState,
  throttle: number,
  steerRight: number,
  boost: boolean,
  wallsIntact: [boolean, boolean, boolean, boolean],
  dt: number
): SafariCarState {
  const cdt = Math.min(Math.max(dt, 0), 0.1);
  let { x, z, heading, speed, steerAngle, wheelSpin } = car;

  const maxFwd = boost ? 16.5 : 12.2;
  const maxRev = -6.5;
  const targetSpeed =
    throttle > 0.05 ? throttle * maxFwd : throttle < -0.05 ? throttle * Math.abs(maxRev) : 0;
  const accel = Math.abs(throttle) > 0.05 ? 4.4 : 3.2;
  speed = speed + (targetSpeed - speed) * (1 - Math.exp(-accel * cdt));
  if (Math.abs(speed) < 0.05 && Math.abs(throttle) < 0.05) speed = 0;

  const targetSteer = -steerRight * 0.52;
  steerAngle = steerAngle + (targetSteer - steerAngle) * Math.min(1, cdt * 10);

  if (Math.abs(speed) > 0.15) {
    const dirSign = speed >= 0 ? 1 : -1;
    const turnRate = 2.15 * Math.min(1, Math.abs(speed) / 4.5);
    heading -= steerRight * turnRate * dirSign * cdt;
  }

  let nextX = x + Math.sin(heading) * speed * cdt;
  let nextZ = z + Math.cos(heading) * speed * cdt;

  const allBroken = !wallsIntact[0] && !wallsIntact[1] && !wallsIntact[2] && !wallsIntact[3];
  if (!allBroken) {
    const margin = DINOSAUR_ARENA_HALF_SIZE - 2.3;
    const minX = wallsIntact[0] ? DINOSAUR_ARENA_CENTER.x - margin : DINOSAUR_ISLAND_CENTER.x - 24;
    const maxX = wallsIntact[2] ? DINOSAUR_ARENA_CENTER.x + margin : DINOSAUR_ISLAND_CENTER.x + 24;
    const minZ = wallsIntact[1] ? DINOSAUR_ARENA_CENTER.z - margin : DINOSAUR_ISLAND_CENTER.z - 24;
    const maxZ = wallsIntact[3] ? DINOSAUR_ARENA_CENTER.z + margin : DINOSAUR_ISLAND_CENTER.z + 24;

    if (nextX < minX || nextX > maxX) {
      nextX = Math.max(minX, Math.min(maxX, nextX));
      speed *= 0.35;
    }
    if (nextZ < minZ || nextZ > maxZ) {
      nextZ = Math.max(minZ, Math.min(maxZ, nextZ));
      speed *= 0.35;
    }
  }

  // Always keep Safari Car on dry Dinosaur Island landmass (never plunges into deep sea)
  const rFromIsland = Math.hypot(
    nextX - DINOSAUR_ISLAND_CENTER.x,
    nextZ - DINOSAUR_ISLAND_CENTER.z
  );
  const maxCarR = DINOSAUR_ISLAND_LAND_RADIUS - 2.6;
  if (rFromIsland > maxCarR) {
    const sc = maxCarR / rFromIsland;
    nextX = DINOSAUR_ISLAND_CENTER.x + (nextX - DINOSAUR_ISLAND_CENTER.x) * sc;
    nextZ = DINOSAUR_ISLAND_CENTER.z + (nextZ - DINOSAUR_ISLAND_CENTER.z) * sc;
    speed *= 0.45;
  }

  x = nextX;
  z = nextZ;
  wheelSpin += speed * cdt * 2.4;

  return {
    x,
    z,
    heading,
    speed,
    speedKmh: Math.round(Math.abs(speed) * 3.6),
    steerAngle,
    wheelSpin,
  };
}

export function extractDinosaurIslandHud(state: DinosaurIslandState): DinosaurIslandHudState {
  return {
    onIsland: state.onIsland,
    explorerHp: state.explorerHp,
    explorerMaxHp: state.explorerMaxHp,
    dinoHp: state.dinoHp,
    dinoMaxHp: state.dinoMaxHp,
    dinoAlive: state.dinoAlive,
    kills: state.kills,
    brokenWalls: state.brokenWalls,
    wallsIntact: [...state.wallsIntact] as [boolean, boolean, boolean, boolean],
    bannerText: state.bannerText,
    statusLine: state.statusLine,
  };
}
