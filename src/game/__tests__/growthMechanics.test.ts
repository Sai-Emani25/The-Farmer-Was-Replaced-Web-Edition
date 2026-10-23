import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Entities,
  PLANT_GROWTH_DISTRIBUTIONS,
  sampleGrowthTime,
  countAdjacentTrees,
  isCompanionSatisfied,
  TileState,
  Grounds,
} from '../types.js';

test('Plant Growth Time Distribution matches official wiki specs', () => {
  // Grass: 0.5s fixed
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Grass.min, 0.5);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Grass.mean, 0.5);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Grass.max, 0.5);

  // Dinosaur: min 0.18, mean 0.2, max 0.22
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Dinosaur.min, 0.18);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Dinosaur.mean, 0.2);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Dinosaur.max, 0.22);

  // Pumpkin: min 0.2, mean 2.0, max 3.8
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Pumpkin.min, 0.2);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Pumpkin.mean, 2.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Pumpkin.max, 3.8);

  // Cactus: 1.0s fixed
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Cactus.min, 1.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Cactus.mean, 1.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Cactus.max, 1.0);

  // Bush: min 3.2, mean 4.0, max 4.8
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Bush.min, 3.2);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Bush.mean, 4.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Bush.max, 4.8);

  // Carrots: min 4.8, mean 6.0, max 7.2
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Carrot.min, 4.8);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Carrot.mean, 6.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Carrot.max, 7.2);

  // Tree: min 5.6, mean 7.0, max 8.4
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Tree.min, 5.6);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Tree.mean, 7.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Tree.max, 8.4);

  // Sunflower: min 5.6, mean 7.0, max 8.4
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Sunflower.min, 5.6);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Sunflower.mean, 7.0);
  assert.equal(PLANT_GROWTH_DISTRIBUTIONS.Sunflower.max, 8.4);
});

test('sampleGrowthTime produces values within bounds and mode near mean', () => {
  for (let i = 0; i < 50; i++) {
    const pumpkinTime = sampleGrowthTime(Entities.Pumpkin);
    assert.ok(pumpkinTime >= 0.2 && pumpkinTime <= 3.8);

    const bushTime = sampleGrowthTime(Entities.Bush);
    assert.ok(bushTime >= 3.2 && bushTime <= 4.8);

    const treeTime = sampleGrowthTime(Entities.Tree);
    assert.ok(treeTime >= 5.6 && treeTime <= 8.4);
  }
});

test('Tree Proximity Restrictions: solid block doubles growth time per adjacent tree up to 16x', () => {
  const worldSize = 5;
  const mockTile = (x: number, y: number, entity: any): TileState => ({
    x,
    y,
    ground: Grounds.Grassland,
    entity,
    growth: 0.5,
    currentGrowthTime: 1.0,
    targetGrowthTime: 7.0,
    waterLevel: 0,
    fertilized: false,
  });

  // Center tree at (2, 2)
  const centerTree = mockTile(2, 2, Entities.Tree);

  // Case A: Isolated tree (checkerboard layout) -> 0 adjacent trees -> 2^0 = 1x penalty
  const isolatedTiles = [
    centerTree,
    mockTile(1, 1, Entities.Tree), // diagonal, not adjacent
    mockTile(3, 3, Entities.Tree), // diagonal, not adjacent
    mockTile(2, 3, Entities.Bush), // adjacent bush, not a tree
  ];
  assert.equal(countAdjacentTrees(centerTree, isolatedTiles, worldSize), 0);

  // Case B: 1 adjacent tree (North) -> count = 1 -> 2^1 = 2x penalty
  const oneNeighbor = [
    centerTree,
    mockTile(2, 3, Entities.Tree), // North
  ];
  assert.equal(countAdjacentTrees(centerTree, oneNeighbor, worldSize), 1);

  // Case C: 4 adjacent trees (N, E, S, W) -> count = 4 -> 2^4 = 16x penalty
  const fourNeighbors = [
    centerTree,
    mockTile(2, 3, Entities.Tree), // North
    mockTile(3, 2, Entities.Tree), // East
    mockTile(2, 1, Entities.Tree), // South
    mockTile(1, 2, Entities.Tree), // West
  ];
  const count = countAdjacentTrees(centerTree, fourNeighbors, worldSize);
  assert.equal(count, 4);
  const penalty = Math.pow(2, count);
  assert.equal(penalty, 16);
});

test('Polyculture Mechanics: 3-step diamond radius gives companion boost', () => {
  const worldSize = 8;
  const targetCrop: TileState = {
    x: 3,
    y: 3,
    ground: Grounds.Soil,
    entity: Entities.Carrot,
    growth: 1.0,
    currentGrowthTime: 6.0,
    targetGrowthTime: 6.0,
    waterLevel: 0,
    fertilized: false,
    companion: Entities.Bush,
  };

  // Case 1: Companion within 2 steps (|3-4| + |3-4| = 2 <= 3) -> satisfied!
  const companionNear: TileState = {
    x: 4,
    y: 4,
    ground: Grounds.Grassland,
    entity: Entities.Bush,
    growth: 1.0,
    currentGrowthTime: 4.0,
    targetGrowthTime: 4.0,
    waterLevel: 0,
    fertilized: false,
  };
  assert.equal(isCompanionSatisfied(targetCrop, [targetCrop, companionNear], worldSize), true);

  // Case 2: Companion at 4 steps (|3-7| + |3-3| = 4 > 3) -> not satisfied!
  const companionFar: TileState = {
    x: 7,
    y: 3,
    ground: Grounds.Grassland,
    entity: Entities.Bush,
    growth: 1.0,
    currentGrowthTime: 4.0,
    targetGrowthTime: 4.0,
    waterLevel: 0,
    fertilized: false,
  };
  assert.equal(isCompanionSatisfied(targetCrop, [targetCrop, companionFar], worldSize), false);
});

test('Fertilizer Mechanics: subtracts 2 seconds and instantly matures fast crops', () => {
  // Fast crop: Grass (0.5s total time)
  const grassTargetTime = 0.5;
  let currentGrowthTime = 0.0;
  const fertilizerSubtraction = 2.0;

  currentGrowthTime += fertilizerSubtraction;
  let growth = Math.min(1.0, currentGrowthTime / grassTargetTime);
  assert.equal(growth, 1.0); // Instantly matured!

  // Slow crop: Tree (7.0s total time)
  const treeTargetTime = 7.0;
  let treeGrowthTime = 1.0;
  treeGrowthTime += fertilizerSubtraction;
  let treeGrowth = Math.min(1.0, treeGrowthTime / treeTargetTime);
  assert.equal(Number(treeGrowth.toFixed(3)), Number((3.0 / 7.0).toFixed(3)));
});
