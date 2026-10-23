/**
 * The Farmer Was Replaced - Core Types & Enums
 * 1-to-1 fidelity with official Steam game & thefarmerwasreplaced.com wiki
 */

export const Direction = {
  North: 'North',
  East: 'East',
  South: 'South',
  West: 'West',
} as const;

export type DirectionType = (typeof Direction)[keyof typeof Direction];

export const Entities = {
  Grass: 'Grass',
  Bush: 'Bush',
  Carrot: 'Carrot',
  Tree: 'Tree',
  Pumpkin: 'Pumpkin',
  Sunflower: 'Sunflower',
  Cactus: 'Cactus',
  Hedge: 'Hedge',
  Treasure: 'Treasure',
  Dinosaur: 'Dinosaur',
} as const;

export type EntityType = (typeof Entities)[keyof typeof Entities];

export const Grounds = {
  Grassland: 'Grassland',
  Soil: 'Soil',
} as const;

export type GroundType = (typeof Grounds)[keyof typeof Grounds];

export const Items = {
  Hay: 'Hay',
  Wood: 'Wood',
  Carrot: 'Carrot',
  Pumpkin: 'Pumpkin',
  Power: 'Power',
  Cactus: 'Cactus',
  Water: 'Water',
  Water_Tank: 'Water_Tank',
  Fertilizer: 'Fertilizer',
  Bones: 'Bones',
} as const;

export type ItemType = (typeof Items)[keyof typeof Items];

export interface GrowthDistribution {
  min: number;
  mean: number;
  max: number;
}

/**
 * Official Plant Growth Time Distribution (seconds)
 * Grass: 0.5s (min 0.5, mean 0.5, max 0.5)
 * Dinosaur: min 0.18, mean 0.2, max 0.22
 * Pumpkin: min 0.2, mean 2.0, max 3.8
 * Cactus: min 1.0, mean 1.0, max 1.0
 * Bush: min 3.2, mean 4.0, max 4.8
 * Carrots: min 4.8, mean 6.0, max 7.2
 * Tree: min 5.6, mean 7.0, max 8.4
 * Sunflower: min 5.6, mean 7.0, max 8.4
 */
export const PLANT_GROWTH_DISTRIBUTIONS: Record<string, GrowthDistribution> = {
  Grass: { min: 0.5, mean: 0.5, max: 0.5 },
  Dinosaur: { min: 0.18, mean: 0.2, max: 0.22 },
  Pumpkin: { min: 0.2, mean: 2.0, max: 3.8 },
  Cactus: { min: 1.0, mean: 1.0, max: 1.0 },
  Bush: { min: 3.2, mean: 4.0, max: 4.8 },
  Carrot: { min: 4.8, mean: 6.0, max: 7.2 },
  Carrots: { min: 4.8, mean: 6.0, max: 7.2 },
  Tree: { min: 5.6, mean: 7.0, max: 8.4 },
  Sunflower: { min: 5.6, mean: 7.0, max: 8.4 },
  Hedge: { min: 1.0, mean: 1.0, max: 1.0 },
  Treasure: { min: 1.0, mean: 1.0, max: 1.0 },
};

export function sampleGrowthTime(entity: EntityType): number {
  const dist = PLANT_GROWTH_DISTRIBUTIONS[entity] || { min: 1.0, mean: 1.0, max: 1.0 };
  if (dist.min === dist.max) return dist.min;
  // Symmetric triangular distribution with mode at mean
  const u1 = Math.random();
  const u2 = Math.random();
  const t = (u1 + u2) * 0.5;
  return Number((dist.min + t * (dist.max - dist.min)).toFixed(3));
}

/**
 * Counts cardinal adjacent trees (N, E, S, W)
 * Growth speed doubles in time (halves in speed) for each adjacent tree (2^k up to 16x)
 */
export function countAdjacentTrees(tile: { x: number; y: number }, allTiles: TileState[], worldSize: number): number {
  if (worldSize <= 1) return 0;
  const offsets = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  const targetCoords = new Set<string>();
  for (const [ox, oy] of offsets) {
    const nx = (tile.x + ox + worldSize) % worldSize;
    const ny = (tile.y + oy + worldSize) % worldSize;
    if (nx !== tile.x || ny !== tile.y) {
      targetCoords.add(`${nx},${ny}`);
    }
  }

  let count = 0;
  for (const other of allTiles) {
    if (other.entity === Entities.Tree && targetCoords.has(`${other.x},${other.y}`)) {
      count++;
    }
  }
  return count;
}

/**
 * Checks whether the companion requirement is met within a 3-step diamond radius:
 * Manhattan distance |dx| + |dy| <= 3 on toroidal grid.
 */
export function isCompanionSatisfied(tile: TileState, allTiles: TileState[], worldSize: number): boolean {
  if (!tile.companion || !tile.entity) return false;
  for (const other of allTiles) {
    if (other.x === tile.x && other.y === tile.y) continue;
    if (other.entity !== tile.companion) continue;

    let dx = Math.abs(tile.x - other.x);
    let dy = Math.abs(tile.y - other.y);
    if (worldSize > 1) {
      dx = Math.min(dx, worldSize - dx);
      dy = Math.min(dy, worldSize - dy);
    }
    if (dx + dy <= 3) {
      return true;
    }
  }
  return false;
}

export const Hats = {
  None: 'None',
  StrawHat: 'StrawHat',
  CowboyHat: 'CowboyHat',
  TopHat: 'TopHat',
  WizardHat: 'WizardHat',
  Crown: 'Crown',
} as const;

export type HatType = (typeof Hats)[keyof typeof Hats];

export const Unlocks = {
  Speed: 'Speed',
  Expand: 'Expand',
  Plant: 'Plant',
  Grass: 'Grass',
  Bushes: 'Bushes',
  Carrots: 'Carrots',
  Trees: 'Trees',
  Pumpkins: 'Pumpkins',
  Sunflowers: 'Sunflowers',
  Cacti: 'Cacti',
  Watering: 'Watering',
  Fertilizer: 'Fertilizer',
  Variables: 'Variables',
  Loops: 'Loops',
  Functions: 'Functions',
  Lists: 'Lists',
  Dictionaries: 'Dictionaries',
  Senses: 'Senses',
  Operators: 'Operators',
  Hats: 'Hats',
  Polyculture: 'Polyculture',
  MultiDrone: 'MultiDrone',
} as const;

export type UnlockType = (typeof Unlocks)[keyof typeof Unlocks];

export interface TileState {
  x: number;
  y: number;
  ground: GroundType;
  entity: EntityType | null;
  growth: number; // 0.0 to 1.0 (1.0 = fully grown)
  currentGrowthTime: number; // seconds accumulated towards maturity
  targetGrowthTime: number; // base growth time in seconds
  waterLevel: number; // 0.0 to 1.0 (soil saturation, up to 5x speed boost)
  fertilized: boolean;
  sunflowerPetals?: number; // 7 to 15
  cactusSize?: number; // 0 to 9
  isMegaPumpkin?: boolean;
  companion?: EntityType | null; // preferred companion entity for 5x yield bonus
}

export interface DroneState {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: DirectionType;
  rotation: number;
  isFlipping: boolean;
  flipProgress: number;
  actionProgress: number;
  currentAction: 'idle' | 'harvesting' | 'planting' | 'tilling' | 'watering' | 'moving' | 'swapping';
  hat: HatType;
  color: string;
}

export type Inventory = Record<ItemType, number>;
export type UnlockLevels = Record<UnlockType, number>;

export interface ResearchNode {
  id: UnlockType;
  name: string;
  category: 'farming' | 'coding' | 'expansion' | 'cosmetics';
  description: string;
  maxLevel: number;
  costs: Record<number, Partial<Record<ItemType, number>>>;
  requires?: { id: UnlockType; level: number }[];
}

export interface FloatingText {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  z: number;
  createdAt: number;
  duration: number;
}
