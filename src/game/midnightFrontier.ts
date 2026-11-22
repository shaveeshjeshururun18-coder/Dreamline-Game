import { getTimePeriod } from './timeWeather';

/**
 * Exact unmodified asset path for "The Midnight Frontier" (preserved on disk).
 */
export const MIDNIGHT_FRONTIER_ASSET_URL =
  '/assets/aistudio/the-midnight-frontier-2nd-version__1__f447db31.html';

/**
 * Wide open moonlit meadow valley southwest of Nila Gramam & Pachai Vayal,
 * verified 85m clear of the railway loop, 43m clear of the bus road, and 100% dry land.
 * At Night, the entire Midnight Frontier materializes and glows here directly in-world
 * (no teleportation / no iframe); in the Morning it disappears completely!
 */
export const MIDNIGHT_FRONTIER_PORTAL_POS = {
  x: -72,
  z: 86,
} as const;

export const MIDNIGHT_FRONTIER_VALLEY_RADIUS = 46;

export interface MidnightFrontierDiscovery {
  id: string;
  title: string;
  category: 'Memory' | 'Homestead' | 'Wilderness' | 'Underground';
  localX: number;
  localZ: number;
  radius: number;
  promptText: string;
  loreText: string;
}

/**
 * Exact 8 discoveries from "The Midnight Frontier" (frontierLogic.ts) placed at exact relative coordinates.
 */
export const MIDNIGHT_FRONTIER_DISCOVERIES: MidnightFrontierDiscovery[] = [
  {
    id: 'dropped_compass',
    title: 'Cracked Brass Pocket Compass',
    category: 'Memory',
    localX: 0,
    localZ: 24,
    radius: 3.6,
    promptText: 'Inspect Cracked Compass in the Mud',
    loreText:
      'My lungs are still burning from running down the backroad. The compass needle spins wildly near these fields—whatever chased me past the highway stopped at the boundary stones.',
  },
  {
    id: 'holloway_porch_note',
    title: 'Holloway Farmhouse Porch Ledger',
    category: 'Homestead',
    localX: 18.5,
    localZ: 8,
    radius: 4.0,
    promptText: 'Read Weather-Stained Ledger on Porch',
    loreText:
      'November 14: "We leave the downstairs oil lamp burning in the window so the boy can find the porch if the fog rolls in from the river. Do not answer knocks after the owls go silent."',
  },
  {
    id: 'farmhouse_interior_radio',
    title: 'Warm Kitchen Hearth & Silent Radio',
    category: 'Homestead',
    localX: 24,
    localZ: 8,
    radius: 3.8,
    promptText: 'Examine Flickering Oil Lamp & Radio',
    loreText:
      'Inside the farmhouse, the tea kettle is still faintly warm, yet thick dust coats the floorboards. A frequency chart is pinned beside the window facing the northern mountains.',
  },
  {
    id: 'cornfield_scarecrow',
    title: 'The Watching Effigy in the Crops',
    category: 'Homestead',
    localX: -16,
    localZ: 18,
    radius: 4.0,
    promptText: 'Inspect Ragged Scarecrow & Survey Marker',
    loreText:
      'Deep among the dark stalks, an old survey map is stuffed inside a burlap coat. It marks a wooden bridge crossing northward into the Whispering Forest.',
  },
  {
    id: 'abandoned_barn_tractor',
    title: 'Rusted Harvester & Barn Journal',
    category: 'Homestead',
    localX: -21,
    localZ: 10,
    radius: 4.4,
    promptText: 'Examine Rusted Tractor & Barn Door',
    loreText:
      'The tractor engine was shut off mid-furrow years ago. Scratched into the iron fender: "The deer always stare toward the treeline before the bell tolls."',
  },
  {
    id: 'wooden_bridge_lantern',
    title: 'Old Timber River Bridge',
    category: 'Wilderness',
    localX: 0,
    localZ: -14,
    radius: 4.4,
    promptText: 'Inspect Bridge Post & River Markings',
    loreText:
      'Moonlight shimmers across the black water below. Rope tally marks are tied along the bridge rail—seven crossings outward, only one returning.',
  },
  {
    id: 'forest_owl_shrine',
    title: 'Hollow Oak & Stone Cairn',
    category: 'Wilderness',
    localX: -24,
    localZ: -34,
    radius: 4.4,
    promptText: 'Examine Mossy Cairn in the Clearing',
    loreText:
      'In the heart of the Whispering Forest, white owl feathers surround a carved boundary stone pointing toward a hidden root cellar beneath the eastern cliffs.',
  },
  {
    id: 'underground_cellar_hatch',
    title: 'Subterranean Root Cellar Hatch',
    category: 'Underground',
    localX: 30,
    localZ: -38,
    radius: 4.6,
    promptText: 'Inspect Iron Cellar Hatch & Underground Steps',
    loreText:
      'Cold air rises from the stone steps beneath the mountain ridge. Inside the subterranean vault lies an old brass key and a map leading back out of the valley.',
  },
];

/**
 * The Midnight Frontier materializes & glows strictly during Night hours
 * and vanishes completely in the Morning / Daytime.
 */
export function isMidnightFrontierOpen(timeHours: number): boolean {
  return getTimePeriod(timeHours) === 'night';
}

/**
 * Continuous visibility / glow factor [0..1] for The Midnight Frontier:
 * - Strictly 0 during Morning, Afternoon, Golden Hour, Sunset, and Evening (05:30–19:59) -> completely disappeared!
 * - Full 1.0 glowing presence throughout Night (20:00–04:45), fading smoothly before sunrise (04:45–05:30).
 */
export function computeMidnightFrontierVisibility(timeHours: number): number {
  const h = ((timeHours % 24) + 24) % 24;
  if (getTimePeriod(h) !== 'night') return 0;
  // Fade in smoothly right after 20:00 and fade out smoothly right before 05:30 sunrise
  if (h >= 20.0 && h < 20.35) {
    return (h - 20.0) / 0.35;
  }
  if (h >= 4.95 && h < 5.3) {
    return Math.max(0, (5.3 - h) / 0.35);
  }
  return 1.0;
}
