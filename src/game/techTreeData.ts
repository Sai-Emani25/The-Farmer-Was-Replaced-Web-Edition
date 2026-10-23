/**
 * The Farmer Was Replaced - Exact Visual Tech Tree Data
 * Extracted directly from in-game screenshot (/public/assets/aistudio/image_d2143970.png)
 */

import { Items, ItemType } from './types';

export interface TechTreeNode {
  id: string;
  label: string;
  subLabel?: string;
  iconType:
    | 'text'
    | 'speed'
    | 'expand'
    | 'plant'
    | 'grass'
    | 'bush'
    | 'carrot'
    | 'tree'
    | 'pumpkin'
    | 'sunflower'
    | 'cactus'
    | 'dinosaur'
    | 'water'
    | 'fertilizer'
    | 'companion'
    | 'measure';
  category: 'farming' | 'coding' | 'system';
  maxLevel: number;
  costs: Record<number, Partial<Record<ItemType, number>>>;
  parentId?: string;
  // Visual layout coordinates for tree diagram (col: -6 to +6, row: 0 to 7)
  row: number;
  col: number;
  description: string;
  programmingLesson?: {
    chapter: number;
    title: string;
    concept: string;
    explanation: string;
    codeSnippet: string;
  };
}

export const TECH_TREE_NODES: TechTreeNode[] = [
  // Row 0: Root Node
  {
    id: 'while',
    label: 'while',
    iconType: 'text',
    category: 'coding',
    row: 0,
    col: 0,
    maxLevel: 1,
    costs: { 1: { [Items.Hay]: 1 } },
    description: 'Enables `while <condition>:` loops. Run code indefinitely without stopping.',
    programmingLesson: {
      chapter: 2,
      title: 'While Loops',
      concept: 'Indefinite repetition',
      explanation: 'In Python, `while True:` repeats whatever indented code is inside forever.',
      codeSnippet: 'while True:\n    harvest()',
    },
  },

  // Row 1: Speed and Expand
  {
    id: 'speed',
    label: 'Speed',
    iconType: 'speed',
    category: 'system',
    parentId: 'while',
    row: 1,
    col: -1,
    maxLevel: 5,
    costs: {
      1: { [Items.Hay]: 5 },
      2: { [Items.Wood]: 30 },
      3: { [Items.Carrot]: 100 },
      4: { [Items.Pumpkin]: 250 },
      5: { [Items.Power]: 150 },
    },
    description: 'Overclocks the drone processor for faster execution ticks.',
  },
  {
    id: 'expand',
    label: 'Expand',
    iconType: 'expand',
    category: 'system',
    parentId: 'while',
    row: 1,
    col: 1,
    maxLevel: 6,
    costs: {
      1: { [Items.Hay]: 5 },
      2: { [Items.Wood]: 40 },
      3: { [Items.Carrot]: 100 },
      4: { [Items.Pumpkin]: 200 },
      5: { [Items.Power]: 200 },
      6: { [Items.Cactus]: 300 },
    },
    description: 'Expands the farm grid dimensions (1x1 -> 3x3 -> 4x4 -> 5x5 -> 6x6 -> 8x8 -> 10x10).',
    programmingLesson: {
      chapter: 3,
      title: 'Grid Navigation',
      concept: 'Coordinates and Movement',
      explanation: 'As your farm grows, move your drone in cardinal directions: move(North), move(East), move(South), move(West).',
      codeSnippet: 'while True:\n    if can_harvest():\n        harvest()\n    move(North)',
    },
  },

  // Row 2: Plant & Grass/Bushes
  {
    id: 'plant',
    label: 'plant()',
    iconType: 'plant',
    category: 'farming',
    parentId: 'speed',
    row: 2,
    col: -1.5,
    maxLevel: 1,
    costs: { 1: { [Items.Hay]: 10 } },
    description: 'Enables the `plant(Entities.<Type>)` function to sow crops.',
  },
  {
    id: 'grass',
    label: 'Bushes',
    iconType: 'bush',
    category: 'farming',
    parentId: 'speed',
    row: 2,
    col: 0,
    maxLevel: 1,
    costs: { 1: { [Items.Hay]: 15 } },
    description: 'Unlocks Entities.Bush. Harvesting bushes yields Wood, needed for advanced upgrades.',
    programmingLesson: {
      chapter: 4,
      title: 'Resource Diversification',
      concept: 'Crop Economics',
      explanation: 'Different entities yield different materials. Plant bushes to collect Wood!',
      codeSnippet: 'while True:\n    if can_harvest():\n        harvest()\n    plant(Entities.Bush)\n    move(North)',
    },
  },

  // Row 3: Carrots, print(), and 1 + 1 (Operators)
  {
    id: 'carrots',
    label: 'Carrots',
    iconType: 'carrot',
    category: 'farming',
    parentId: 'grass',
    row: 3,
    col: -3.5,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 25 } },
    description: 'Unlocks `till()` to create Grounds.Soil, and planting Entities.Carrot.',
    programmingLesson: {
      chapter: 5,
      title: 'Conditionals & Terrain',
      concept: 'if/else State Checking',
      explanation: 'Carrots require Soil! Check get_ground_type() != Grounds.Soil and till().',
      codeSnippet: 'while True:\n    if get_ground_type() != Grounds.Soil:\n        till()\n    if can_harvest():\n        harvest()\n    plant(Entities.Carrot)\n    move(North)',
    },
  },
  {
    id: 'print',
    label: 'print()',
    iconType: 'text',
    category: 'coding',
    parentId: 'grass',
    row: 3,
    col: 0,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 20 } },
    description: 'Logs variables and messages to the Drone Console for debugging.',
    programmingLesson: {
      chapter: 6,
      title: 'Console Output & Diagnostics',
      concept: 'Debugging & Printing',
      explanation: 'Use print(...) to inspect values, coordinates, and diagnostics in real time.',
      codeSnippet: 'print("Drone active at:", get_pos_x(), get_pos_y())',
    },
  },
  {
    id: 'operators',
    label: '1 + 1',
    iconType: 'text',
    category: 'coding',
    parentId: 'grass',
    row: 3,
    col: 3.5,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 30 } },
    description: 'Unlocks arithmetic (+, -, *, /, %, //) and comparison (==, !=, <, >, <=, >=) operators.',
    programmingLesson: {
      chapter: 7,
      title: 'Operators & Math',
      concept: 'Expressions and Arithmetic',
      explanation: 'Perform calculations and boolean comparisons in your conditional logic.',
      codeSnippet: 'if get_pos_x() == 0 and get_pos_y() == 0:\n    do_a_flip()',
    },
  },

  // Row 4: Watering, Trees, set_speed(), get_time(), (x, y) Coordinates, x = 2 Variables
  {
    id: 'watering',
    label: 'Watering',
    iconType: 'water',
    category: 'farming',
    parentId: 'carrots',
    row: 4,
    col: -4.5,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 40, [Items.Carrot]: 25 } },
    description: 'Enables use_item(Items.Water) and get_water(). Moist soil grows crops 3x faster.',
  },
  {
    id: 'trees',
    label: 'Trees',
    iconType: 'tree',
    category: 'farming',
    parentId: 'carrots',
    row: 4,
    col: -2.5,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 60, [Items.Carrot]: 40 } },
    description: 'Unlocks Entities.Tree for harvesting large amounts of Wood (best spaced in checkerboards).',
  },
  {
    id: 'set_speed',
    label: 'set_speed()',
    iconType: 'text',
    category: 'coding',
    parentId: 'print',
    row: 4,
    col: -0.8,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 30 } },
    description: 'Enables setting drone operational clock speed programmatically via code.',
  },
  {
    id: 'get_time',
    label: 'get_time()',
    iconType: 'text',
    category: 'coding',
    parentId: 'print',
    row: 4,
    col: 0.8,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 30 } },
    description: 'Returns total elapsed simulation time in seconds for benchmarking.',
  },
  {
    id: 'coordinates',
    label: '(x, y)',
    iconType: 'text',
    category: 'coding',
    parentId: 'operators',
    row: 4,
    col: 2.5,
    maxLevel: 1,
    costs: { 1: { [Items.Wood]: 50, [Items.Carrot]: 30 } },
    description: 'Enables sensing functions: get_pos_x(), get_pos_y(), get_world_size(), can_harvest().',
    programmingLesson: {
      chapter: 8,
      title: 'Cartesian Navigation',
      concept: 'Grid Coordinates',
      explanation: 'Know where your drone is at all times with get_pos_x() and get_pos_y().',
      codeSnippet: 'if get_pos_x() == get_world_size() - 1:\n    move(North)',
    },
  },
  {
    id: 'variables',
    label: 'x = 2',
    iconType: 'text',
    category: 'coding',
    parentId: 'operators',
    row: 4,
    col: 4.5,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 40 } },
    description: 'Allows assigning and referencing variables in memory (e.g. `count = 0`).',
    programmingLesson: {
      chapter: 9,
      title: 'Variables & State',
      concept: 'Variable Assignment',
      explanation: 'Variables store values so your drone can remember counts and states across ticks.',
      codeSnippet: 'harvests = 0\nwhile True:\n    if can_harvest():\n        harvest()\n        harvests += 1\n    move(North)',
    },
  },

  // Row 5: Fertilizer, Pumpkins, measure(), [1, 2, 3] Lists, def f(): Functions
  {
    id: 'fertilizer',
    label: 'Fertilizer',
    iconType: 'fertilizer',
    category: 'farming',
    parentId: 'watering',
    row: 5,
    col: -5.5,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 100 } },
    description: 'Enables use_item(Items.Fertilizer) to instantly mature any crop.',
  },
  {
    id: 'pumpkins',
    label: 'Pumpkins',
    iconType: 'pumpkin',
    category: 'farming',
    parentId: 'trees',
    row: 5,
    col: -2.5,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 150 } },
    description: 'Unlocks Entities.Pumpkin. Fully grown adjacent 2x2 or 3x3 pumpkins fuse into Mega Pumpkins!',
  },
  {
    id: 'measure',
    label: 'measure()',
    iconType: 'measure',
    category: 'coding',
    parentId: 'get_time',
    row: 5,
    col: 0.8,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 80 } },
    description: 'Inspects properties of the current tile (Sunflowers petals: 7-15, Cactus size: 0-9).',
  },
  {
    id: 'lists',
    label: '[1, 2, 3]',
    iconType: 'text',
    category: 'coding',
    parentId: 'coordinates',
    row: 5,
    col: 2.5,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 80, [Items.Wood]: 80 } },
    description: 'Enables Python lists, indexing `arr[0]`, `len()`, and iterating with `for item in list:`.',
    programmingLesson: {
      chapter: 10,
      title: 'Lists & Sequences',
      concept: 'Data Structures & Iteration',
      explanation: 'Store sequences of directions or crop types in lists and loop through them!',
      codeSnippet: 'dirs = [North, East, South, West]\nfor d in dirs:\n    move(d)',
    },
  },
  {
    id: 'functions',
    label: 'def f():',
    iconType: 'text',
    category: 'coding',
    parentId: 'variables',
    row: 5,
    col: 4.8,
    maxLevel: 1,
    costs: { 1: { [Items.Carrot]: 100, [Items.Wood]: 100 } },
    description: 'Enables custom function definitions using `def my_func():`.',
    programmingLesson: {
      chapter: 11,
      title: 'Custom Functions',
      concept: 'Modular Decomposition',
      explanation: 'Organize complex farming routines into reusable functions with `def`.',
      codeSnippet: 'def harvest_row():\n    for y in range(get_world_size()):\n        if can_harvest():\n            harvest()\n        move(North)',
    },
  },

  // Row 6: Sunflowers, Cactus (swap), Companion, get_cost(), import, random()
  {
    id: 'sunflowers',
    label: 'Sunflowers',
    iconType: 'sunflower',
    category: 'farming',
    parentId: 'pumpkins',
    row: 6,
    col: -3.5,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 150 } },
    description: 'Unlocks Entities.Sunflower. Harvest the flower with the highest petals to reap Power!',
  },
  {
    id: 'cacti',
    label: 'Cactus & swap()',
    iconType: 'cactus',
    category: 'farming',
    parentId: 'pumpkins',
    row: 6,
    col: -1.8,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 200 } },
    description: 'Unlocks Entities.Cactus and `swap(direction)`. Sort cactus heights 0-9 for massive n^2 yields!',
  },
  {
    id: 'companion',
    label: 'Pet / Companion',
    iconType: 'companion',
    category: 'system',
    parentId: 'measure',
    row: 6,
    col: 0.8,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 150 } },
    description: 'Unlocks the farm companion dog that accompanies your drone across the fields.',
  },
  {
    id: 'dicts',
    label: 'get_cost() & { }',
    iconType: 'text',
    category: 'coding',
    parentId: 'lists',
    row: 6,
    col: 2.5,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 120 } },
    description: 'Enables key-value dictionaries `{}` and the `get_cost(item)` inspection function.',
  },
  {
    id: 'import',
    label: 'import',
    iconType: 'text',
    category: 'coding',
    parentId: 'functions',
    row: 6,
    col: 4.0,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 100 } },
    description: 'Allows importing functions and algorithms across different script files.',
  },
  {
    id: 'random',
    label: 'random()',
    iconType: 'text',
    category: 'coding',
    parentId: 'functions',
    row: 6,
    col: 5.6,
    maxLevel: 1,
    costs: { 1: { [Items.Pumpkin]: 100 } },
    description: 'Enables pseudo-random number generation for stochastic farming patterns.',
  },

  // Row 7: Dinosaur & Bones
  {
    id: 'dinosaur',
    label: 'Dinosaur',
    iconType: 'dinosaur',
    category: 'farming',
    parentId: 'cacti',
    row: 7,
    col: -1.8,
    maxLevel: 1,
    costs: { 1: { [Items.Cactus]: 200, [Items.Power]: 150 } },
    description: 'Unlocks Entities.Dinosaur and ancient prehistoric bone excavation.',
  },
];
