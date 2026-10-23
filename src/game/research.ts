import { ResearchNode, Unlocks, Items, UnlockType, ItemType } from './types';

export const RESEARCH_NODES: ResearchNode[] = [
  // Coding Unlocks
  {
    id: Unlocks.Variables,
    name: 'Variables',
    category: 'coding',
    description: 'Allows assigning and referencing variables like `x = 5`.',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 5 },
    },
  },
  {
    id: Unlocks.Operators,
    name: 'Operators',
    category: 'coding',
    description: 'Allows math (+, -, *, /, %) and comparison (==, !=, <, >, <=, >=) operators.',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 10 },
    },
    requires: [{ id: Unlocks.Variables, level: 1 }],
  },
  {
    id: Unlocks.Loops,
    name: 'Loops',
    category: 'coding',
    description: 'Allows `while` and `for` loops for continuous automation.',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 20 },
    },
    requires: [{ id: Unlocks.Variables, level: 1 }],
  },
  {
    id: Unlocks.Senses,
    name: 'Senses',
    category: 'coding',
    description: 'Enables sensing functions: get_pos_x(), get_pos_y(), get_world_size(), can_harvest(), get_entity_type(), get_ground_type().',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 15 },
    },
  },
  {
    id: Unlocks.Functions,
    name: 'Functions',
    category: 'coding',
    description: 'Enables custom function definitions using `def my_function():`.',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 40 },
    },
    requires: [{ id: Unlocks.Loops, level: 1 }],
  },
  {
    id: Unlocks.Lists,
    name: 'Lists',
    category: 'coding',
    description: 'Enables array lists, indexing `list[0]`, and `len()`.',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 80 },
    },
    requires: [{ id: Unlocks.Functions, level: 1 }],
  },
  {
    id: Unlocks.Dictionaries,
    name: 'Dictionaries',
    category: 'coding',
    description: 'Enables key-value dictionaries and get_cost() inspection.',
    maxLevel: 1,
    costs: {
      1: { [Items.Carrot]: 100 },
    },
    requires: [{ id: Unlocks.Lists, level: 1 }],
  },

  // Farming Unlocks
  {
    id: Unlocks.Plant,
    name: 'Planting',
    category: 'farming',
    description: 'Enables the plant() command to sow new crops on tiles.',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 10 },
    },
  },
  {
    id: Unlocks.Bushes,
    name: 'Bushes & Wood',
    category: 'farming',
    description: 'Unlocks planting Entities.Bush, harvesting Wood.',
    maxLevel: 1,
    costs: {
      1: { [Items.Hay]: 30 },
    },
    requires: [{ id: Unlocks.Plant, level: 1 }],
  },
  {
    id: Unlocks.Carrots,
    name: 'Carrots & Tilling',
    category: 'farming',
    description: 'Unlocks till() to cultivate Grounds.Soil, and planting Entities.Carrot.',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 50 },
    },
    requires: [{ id: Unlocks.Bushes, level: 1 }],
  },
  {
    id: Unlocks.Watering,
    name: 'Watering & Irrigation',
    category: 'farming',
    description: 'Enables use_item(Items.Water) and get_water(). Soil moisture accelerates growth 3x.',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 60, [Items.Carrot]: 40 },
    },
    requires: [{ id: Unlocks.Carrots, level: 1 }],
  },
  {
    id: Unlocks.Trees,
    name: 'Trees',
    category: 'farming',
    description: 'Unlocks Entities.Tree for harvesting abundant Wood (best grown in checkerboard patterns).',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 100, [Items.Carrot]: 50 },
    },
    requires: [{ id: Unlocks.Bushes, level: 1 }],
  },
  {
    id: Unlocks.Pumpkins,
    name: 'Pumpkins',
    category: 'farming',
    description: 'Unlocks Entities.Pumpkin. Fully grown adjacent 2x2 or 3x3 pumpkins fuse into Mega Pumpkins!',
    maxLevel: 1,
    costs: {
      1: { [Items.Carrot]: 150 },
    },
    requires: [{ id: Unlocks.Carrots, level: 1 }],
  },
  {
    id: Unlocks.Sunflowers,
    name: 'Sunflowers & Solar Power',
    category: 'farming',
    description: 'Unlocks Entities.Sunflower. Harvest the flower with the highest measured petals for Power!',
    maxLevel: 1,
    costs: {
      1: { [Items.Pumpkin]: 200 },
    },
    requires: [{ id: Unlocks.Pumpkins, level: 1 }],
  },
  {
    id: Unlocks.Cacti,
    name: 'Cacti & Sorting (swap)',
    category: 'farming',
    description: 'Unlocks Entities.Cactus and the swap(direction) command. Sort cactus heights 0-9 for massive n^2 yields!',
    maxLevel: 1,
    costs: {
      1: { [Items.Power]: 100, [Items.Pumpkin]: 150 },
    },
    requires: [{ id: Unlocks.Sunflowers, level: 1 }],
  },
  {
    id: Unlocks.Polyculture,
    name: 'Polyculture & Companions',
    category: 'farming',
    description: 'Enables get_companion() to match adjacent crop species for symbiotic growth bonus.',
    maxLevel: 1,
    costs: {
      1: { [Items.Wood]: 150, [Items.Carrot]: 150 },
    },
    requires: [{ id: Unlocks.Carrots, level: 1 }],
  },
  {
    id: Unlocks.Fertilizer,
    name: 'Fertilizer',
    category: 'farming',
    description: 'Enables use_item(Items.Fertilizer) to instantly mature any crop.',
    maxLevel: 1,
    costs: {
      1: { [Items.Carrot]: 200, [Items.Pumpkin]: 100 },
    },
    requires: [{ id: Unlocks.Pumpkins, level: 1 }],
  },

  // Expansion & Speed Unlocks
  {
    id: Unlocks.Speed,
    name: 'Drone Overclocking',
    category: 'expansion',
    description: 'Upgrades the internal processor clock and movement speed of your drone.',
    maxLevel: 5,
    costs: {
      1: { [Items.Hay]: 20 },
      2: { [Items.Wood]: 50 },
      3: { [Items.Carrot]: 120 },
      4: { [Items.Pumpkin]: 250 },
      5: { [Items.Power]: 150 },
    },
  },
  {
    id: Unlocks.Expand,
    name: 'Farm Expansion',
    category: 'expansion',
    description: 'Expands the farm grid dimensions (1x1 -> 3x3 -> 4x4 -> 5x5 -> 6x6 -> 8x8 -> 10x10).',
    maxLevel: 6,
    costs: {
      1: { [Items.Hay]: 30 },
      2: { [Items.Wood]: 60 },
      3: { [Items.Carrot]: 150 },
      4: { [Items.Pumpkin]: 300 },
      5: { [Items.Power]: 200 },
      6: { [Items.Cactus]: 250 },
    },
  },
  {
    id: Unlocks.MultiDrone,
    name: 'Multi-Drone Swarm',
    category: 'expansion',
    description: 'Unlocks spawn_drone() and num_drones() to coordinate multiple drones in parallel!',
    maxLevel: 2,
    costs: {
      1: { [Items.Power]: 200, [Items.Pumpkin]: 200 },
      2: { [Items.Cactus]: 300, [Items.Power]: 400 },
    },
    requires: [{ id: Unlocks.Sunflowers, level: 1 }],
  },

  // Cosmetics
  {
    id: Unlocks.Hats,
    name: 'Drone Wardrobe & Hats',
    category: 'cosmetics',
    description: 'Unlock adorable hats for your farming drone: Straw Hat, Cowboy Hat, Top Hat, and Wizard Crown!',
    maxLevel: 4,
    costs: {
      1: { [Items.Hay]: 25, [Items.Wood]: 10 },
      2: { [Items.Wood]: 50, [Items.Carrot]: 25 },
      3: { [Items.Pumpkin]: 80 },
      4: { [Items.Power]: 50, [Items.Cactus]: 50 },
    },
  },
];

export const WORLD_SIZES_BY_EXPAND_LEVEL = [1, 3, 4, 5, 6, 8, 10];

export function canUnlock(
  node: ResearchNode,
  currentLevel: number,
  levels: Record<UnlockType, number>,
  inventory: Record<ItemType, number>
): { can: boolean; reason?: string } {
  if (currentLevel >= node.maxLevel) {
    return { can: false, reason: 'Max level reached' };
  }

  // Check prerequisites
  if (node.requires) {
    for (const req of node.requires) {
      if ((levels[req.id] || 0) < req.level) {
        const reqNode = RESEARCH_NODES.find((n) => n.id === req.id);
        return {
          can: false,
          reason: `Requires ${reqNode?.name || req.id} Lv. ${req.level}`,
        };
      }
    }
  }

  // Check cost
  const nextLevel = currentLevel + 1;
  const cost = node.costs[nextLevel] || {};
  for (const [item, amount] of Object.entries(cost)) {
    if ((inventory[item as ItemType] || 0) < (amount as number)) {
      return {
        can: false,
        reason: `Need ${(amount as number) - (inventory[item as ItemType] || 0)} more ${item}`,
      };
    }
  }

  return { can: true };
}
