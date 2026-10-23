/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * The Farmer Was Replaced - Web Edition
 * Authentic 1-to-1 recreation with full-screen 3D farm viewport and floating desktop windows.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FarmScene } from './game/FarmScene';
import { FloatingCodeWindow } from './components/FloatingCodeWindow';
import { FloatingTutorialWindow, TUTORIAL_LESSONS } from './components/FloatingTutorialWindow';
import { TopRightHud } from './components/TopRightHud';
import { TechTreeCanvas } from './components/TechTreeCanvas';
import {
  Direction,
  Entities,
  Grounds,
  Items,
  Hats,
  DirectionType,
  EntityType,
  ItemType,
  TileState,
  DroneState,
  Inventory,
  UnlockLevels,
  sampleGrowthTime,
  countAdjacentTrees,
  isCompanionSatisfied,
  PLANT_GROWTH_DISTRIBUTIONS,
} from './game/types';
import { TECH_TREE_NODES, TechTreeNode } from './game/techTreeData';
import { WORLD_SIZES_BY_EXPAND_LEVEL } from './game/research';
import { ScriptFile } from './game/defaultScripts';
import { DroneInterpreter, StepResult } from './game/interpreter';
import { sound } from './game/audio';
import { Trash2 } from 'lucide-react';

const INITIAL_INVENTORY: Inventory = {
  Hay: 0,
  Wood: 0,
  Carrot: 0,
  Pumpkin: 0,
  Power: 0,
  Cactus: 0,
  Water: 5,
  Water_Tank: 1,
  Fertilizer: 3,
  Bones: 0,
};

// Starts at 1x1, basic harvest only (true slow-drip learning!)
const INITIAL_UNLOCKS: UnlockLevels = {
  Speed: 1,
  Expand: 0, // Starts at 1x1!
  Plant: 0,
  Grass: 1,
  Bushes: 0,
  Carrots: 0,
  Trees: 0,
  Pumpkins: 0,
  Sunflowers: 0,
  Cacti: 0,
  Watering: 0,
  Fertilizer: 0,
  Variables: 0,
  Loops: 0, // while/for locked until Chapter 2!
  Functions: 0,
  Lists: 0,
  Dictionaries: 0,
  Senses: 0,
  Operators: 0,
  Hats: 0,
  Polyculture: 0,
  MultiDrone: 0,
};

const NODE_TO_UNLOCK_KEY: Record<string, keyof UnlockLevels> = {
  while: 'Loops',
  speed: 'Speed',
  expand: 'Expand',
  plant: 'Plant',
  grass: 'Bushes',
  carrots: 'Carrots',
  watering: 'Watering',
  trees: 'Trees',
  operators: 'Operators',
  coordinates: 'Senses',
  variables: 'Variables',
  fertilizer: 'Fertilizer',
  pumpkins: 'Pumpkins',
  lists: 'Lists',
  functions: 'Functions',
  sunflowers: 'Sunflowers',
  cacti: 'Cacti',
  dicts: 'Dictionaries',
  dinosaur: 'MultiDrone',
  companion: 'Hats',
};

const STARTER_FILES: ScriptFile[] = [
  {
    name: 'main.py',
    description: 'Chapter 1: The First Harvest',
    code: `# The Farmer Was Replaced
# Lesson 1: Run harvest() using the green Play button!
harvest()
`,
  },
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const farmSceneRef = useRef<FarmScene | null>(null);

  // Game Progression State
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [unlocks, setUnlocks] = useState<UnlockLevels>(INITIAL_UNLOCKS);
  const [currentLessonId, setCurrentLessonId] = useState(1);

  // Floating Windows Visibility
  const [showTutorial, setShowTutorial] = useState(true);
  const [showCodeWindow, setShowCodeWindow] = useState(true);
  const [showTechTreeCanvas, setShowTechTreeCanvas] = useState(false);
  const [showFileListPopover, setShowFileListPopover] = useState(false);

  // Derived World Size from Expansion Level
  const worldSize = WORLD_SIZES_BY_EXPAND_LEVEL[unlocks.Expand || 0] || 1;

  // Farm Tiles State (starts at 1x1!)
  const [tiles, setTiles] = useState<TileState[]>(() => [
    {
      x: 0,
      y: 0,
      ground: Grounds.Grassland,
      entity: Entities.Grass,
      growth: 1.0,
      currentGrowthTime: 0.5,
      targetGrowthTime: 0.5,
      waterLevel: 0.0,
      fertilized: false,
      companion: Entities.Bush,
    },
  ]);

  // Drone State
  const [drone, setDrone] = useState<DroneState>({
    id: 1,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    direction: Direction.North,
    rotation: 0,
    isFlipping: false,
    flipProgress: 0,
    actionProgress: 0,
    currentAction: 'idle',
    hat: Hats.None,
    color: '#00e676',
  });

  // Code Scripts & Editor State
  const [files, setFiles] = useState<ScriptFile[]>(STARTER_FILES);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [error, setError] = useState<{ message: string; line: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startTimeRef = useRef(Date.now());
  const interpreterRef = useRef<DroneInterpreter | null>(null);

  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;
  const droneRef = useRef(drone);
  droneRef.current = drone;
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const unlocksRef = useRef(unlocks);
  unlocksRef.current = unlocks;
  const worldSizeRef = useRef(worldSize);
  worldSizeRef.current = worldSize;

  // Initialize FarmScene WebGL once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const scene = new FarmScene(canvasMountRef.current);
    farmSceneRef.current = scene;

    return () => {
      scene.dispose();
      farmSceneRef.current = null;
    };
  }, []);

  // Update 3D Scene when tiles, drone or worldSize change
  useEffect(() => {
    if (farmSceneRef.current) {
      farmSceneRef.current.updateGrid(worldSize, tiles, drone);
    }
  }, [worldSize, tiles, drone]);

  // Adjust tiles when world size expands
  useEffect(() => {
    setTiles((prev) => {
      const next: TileState[] = [];
      for (let x = 0; x < worldSize; x++) {
        for (let y = 0; y < worldSize; y++) {
          const existing = prev.find((t) => t.x === x && t.y === y);
          if (existing) {
            next.push(existing);
          } else {
            next.push({
              x,
              y,
              ground: Grounds.Grassland,
              entity: Entities.Grass,
              growth: 1.0,
              currentGrowthTime: 0.5,
              targetGrowthTime: 0.5,
              waterLevel: 0.0,
              fertilized: false,
              companion: Entities.Bush,
            });
          }
        }
      }
      return next;
    });

    setDrone((d) => ({
      ...d,
      x: Math.min(d.x, worldSize - 1),
      y: Math.min(d.y, worldSize - 1),
      targetX: Math.min(d.targetX, worldSize - 1),
      targetY: Math.min(d.targetY, worldSize - 1),
    }));
  }, [worldSize]);

  // Natural Plant Growth Tick Loop with Exact Game Distribution & Modifiers
  useEffect(() => {
    let lastTime = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - lastTime) / 1000);
      lastTime = now;

      setTiles((prev) => {
        const curWorldSize = worldSizeRef.current;
        return prev.map((tile) => {
          // If empty grassland tile, regrow grass naturally after 0.5s cycle
          if (!tile.entity) {
            if (tile.ground === Grounds.Grassland) {
              return {
                ...tile,
                entity: Entities.Grass,
                growth: 0.0,
                currentGrowthTime: 0.0,
                targetGrowthTime: 0.5,
                companion: Entities.Bush,
              };
            }
            return tile;
          }

          if (tile.growth >= 1.0) return tile;

          // 2. Water boost: "boosting overall crop growth speed up to 5x faster"
          // Smoothly scales from 1.0x (dry) to 5.0x (fully saturated)
          const waterBoost = 1.0 + 4.0 * Math.min(1.0, tile.waterLevel);

          // 1. Tree proximity restrictions:
          // "If a tree is planted directly adjacent (North, East, South, or West) to another tree,
          // its growth time doubles for every adjacent tree (up to 16x penalty)"
          let treePenaltyFactor = 1.0;
          if (tile.entity === Entities.Tree) {
            const adjacentTrees = countAdjacentTrees(tile, prev, curWorldSize);
            treePenaltyFactor = Math.pow(2, adjacentTrees); // 1, 2, 4, 8, 16
          }

          const effectiveSpeed = waterBoost / treePenaltyFactor;
          const newCurrentGrowth = tile.currentGrowthTime + dt * effectiveSpeed;
          const target = Math.max(0.1, tile.targetGrowthTime || 0.5);
          const newGrowth = Math.min(1.0, newCurrentGrowth / target);

          // Water slowly evaporates during plant growth
          const newWater = Math.max(0, tile.waterLevel - 0.015 * dt);

          return {
            ...tile,
            currentGrowthTime: newCurrentGrowth,
            growth: newGrowth,
            waterLevel: newWater,
          };
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Execution Context actions for Python Interpreter
  const onMove = useCallback((dir: DirectionType) => {
    const size = worldSizeRef.current;
    let nextX = droneRef.current.x;
    let nextY = droneRef.current.y;

    if (dir === Direction.North) nextY = (nextY + 1) % size;
    else if (dir === Direction.East) nextX = (nextX + 1) % size;
    else if (dir === Direction.South) nextY = (nextY - 1 + size) % size;
    else if (dir === Direction.West) nextX = (nextX - 1 + size) % size;

    setDrone((d) => ({
      ...d,
      x: nextX,
      y: nextY,
      targetX: nextX,
      targetY: nextY,
      direction: dir,
      currentAction: 'moving',
    }));

    sound.playMove();
    return true;
  }, []);

  const onSwap = useCallback((dir: DirectionType) => {
    const size = worldSizeRef.current;
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;

    let targetX = curX;
    let targetY = curY;
    if (dir === Direction.North) targetY = (targetY + 1) % size;
    else if (dir === Direction.East) targetX = (targetX + 1) % size;
    else if (dir === Direction.South) targetY = (targetY - 1 + size) % size;
    else if (dir === Direction.West) targetX = (targetX - 1 + size) % size;

    setTiles((prev) => {
      const curTile = prev.find((t) => t.x === curX && t.y === curY);
      const tarTile = prev.find((t) => t.x === targetX && t.y === targetY);
      if (!curTile || !tarTile) return prev;

      return prev.map((t) => {
        if (t.x === curX && t.y === curY) {
          return {
            ...t,
            entity: tarTile.entity,
            growth: tarTile.growth,
            cactusSize: tarTile.cactusSize,
            sunflowerPetals: tarTile.sunflowerPetals,
            isMegaPumpkin: tarTile.isMegaPumpkin,
          };
        }
        if (t.x === targetX && t.y === targetY) {
          return {
            ...t,
            entity: curTile.entity,
            growth: curTile.growth,
            cactusSize: curTile.cactusSize,
            sunflowerPetals: curTile.sunflowerPetals,
            isMegaPumpkin: curTile.isMegaPumpkin,
          };
        }
        return t;
      });
    });

    sound.playMove();
    if (farmSceneRef.current) {
      farmSceneRef.current.addFloatingText('⇄ Swap', '#38bdf8', curX, curY, size);
    }
    return true;
  }, []);

  const onHarvest = useCallback(() => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;
    const curTile = tilesRef.current.find((t) => t.x === curX && t.y === curY);

    if (!curTile || !curTile.entity) {
      return { success: false };
    }

    // 5. Premature Harvesting Penalty:
    // If your drone executes a harvest() command before a plant has completed its growth cycle,
    // the crop is destroyed entirely, resulting in zero resource rewards.
    if (curTile.growth < 0.99) {
      setTiles((prev) =>
        prev.map((t) =>
          t.x === curX && t.y === curY
            ? {
                ...t,
                entity: null,
                growth: 0,
                currentGrowthTime: 0,
                isMegaPumpkin: false,
                companion: null,
              }
            : t
        )
      );
      sound.playError();
      if (farmSceneRef.current) {
        farmSceneRef.current.addFloatingText(
          '✗ Premature Harvest! (0 Yield)',
          '#ef4444',
          curX,
          curY,
          worldSizeRef.current
        );
      }
      return { success: false, penalty: true };
    }

    const entity = curTile.entity;
    let harvestedItem: ItemType = Items.Hay;
    let amount = 1;

    if (entity === Entities.Grass) harvestedItem = Items.Hay;
    else if (entity === Entities.Bush) harvestedItem = Items.Wood;
    else if (entity === Entities.Carrot) harvestedItem = Items.Carrot;
    else if (entity === Entities.Tree) {
      harvestedItem = Items.Wood;
      amount = 3;
    } else if (entity === Entities.Pumpkin) {
      harvestedItem = Items.Pumpkin;
      amount = curTile.isMegaPumpkin ? 8 : 1;
    } else if (entity === Entities.Sunflower) {
      harvestedItem = Items.Power;
      amount = (curTile.sunflowerPetals || 7) >= 12 ? 3 : 1;
    } else if (entity === Entities.Cactus) {
      harvestedItem = Items.Cactus;
      amount = Math.max(1, curTile.cactusSize || 1);
    } else if (entity === Entities.Dinosaur) {
      harvestedItem = Items.Bones;
      amount = 1;
    }

    // 3. Polyculture Mechanics:
    // Unlocking polyculture introduces companion plant mechanics.
    // Planting the preferred crop within a 3-step diamond radius gives a 5x increase in crop yield.
    const polycultureBoost = isCompanionSatisfied(curTile, tilesRef.current, worldSizeRef.current);
    if (polycultureBoost) {
      amount *= 5;
    }

    setInventory((inv) => ({
      ...inv,
      [harvestedItem]: (inv[harvestedItem] || 0) + amount,
    }));

    setTiles((prev) =>
      prev.map((t) =>
        t.x === curX && t.y === curY
          ? {
              ...t,
              entity: null,
              growth: 0,
              currentGrowthTime: 0,
              isMegaPumpkin: false,
              companion: null,
            }
          : t
      )
    );

    sound.playHarvest(harvestedItem);
    if (farmSceneRef.current) {
      const color = polycultureBoost
        ? '#38bdf8'
        : harvestedItem === Items.Power
        ? '#facc15'
        : harvestedItem === Items.Carrot
        ? '#fb923c'
        : harvestedItem === Items.Wood
        ? '#4ade80'
        : '#fef08a';
      const tag = polycultureBoost ? ' (5x Polyculture!)' : '';
      farmSceneRef.current.addFloatingText(
        `+${amount} ${harvestedItem}${tag}`,
        color,
        curX,
        curY,
        worldSizeRef.current
      );
    }

    // Advance to lesson 2 when first Hay is gathered
    if (currentLessonId === 1 && harvestedItem === Items.Hay) {
      setCurrentLessonId(2);
    }

    return { success: true, item: harvestedItem, amount };
  }, [currentLessonId]);

  const onPlant = useCallback((entity: EntityType) => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;
    const curTile = tilesRef.current.find((t) => t.x === curX && t.y === curY);

    if (!curTile) return false;

    if (
      (entity === Entities.Carrot || entity === Entities.Pumpkin || entity === Entities.Sunflower) &&
      curTile.ground !== Grounds.Soil
    ) {
      sound.playError();
      return false;
    }

    // Exact plant growth time distribution
    const targetGrowthTime = sampleGrowthTime(entity);

    // Polyculture companion preference assignment
    const candidateCompanions = [
      Entities.Grass,
      Entities.Bush,
      Entities.Carrot,
      Entities.Tree,
      Entities.Pumpkin,
      Entities.Sunflower,
      Entities.Cactus,
    ].filter((e) => e !== entity);
    const companion = candidateCompanions[Math.floor(Math.random() * candidateCompanions.length)];

    const petals = entity === Entities.Sunflower ? Math.floor(Math.random() * 9) + 7 : undefined;
    const cactusSize = entity === Entities.Cactus ? Math.floor(Math.random() * 9) + 1 : undefined;

    setTiles((prev) =>
      prev.map((t) =>
        t.x === curX && t.y === curY
          ? {
              ...t,
              entity,
              growth: 0.05,
              currentGrowthTime: 0.0,
              targetGrowthTime,
              companion,
              sunflowerPetals: petals,
              cactusSize,
            }
          : t
      )
    );

    sound.playPlant();
    return true;
  }, []);

  const onTill = useCallback(() => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;

    setTiles((prev) =>
      prev.map((t) =>
        t.x === curX && t.y === curY
          ? {
              ...t,
              ground: t.ground === Grounds.Soil ? Grounds.Grassland : Grounds.Soil,
              entity: null,
              growth: 0,
              currentGrowthTime: 0,
            }
          : t
      )
    );

    sound.playTill();
    return true;
  }, []);

  const onUseItem = useCallback((item: ItemType, amount: number = 1) => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;

    // 2. Water Mechanics: use_item(Items.Water) or use_item(Items.Water_Tank) saturates soil
    if (
      item === Items.Water ||
      (item as any) === 'Water' ||
      (item as any) === 'Water_Tank' ||
      (item as any) === Items.Water_Tank
    ) {
      if ((inventoryRef.current.Water || 0) < 1 && (inventoryRef.current.Water_Tank || 0) < 1) {
        sound.playError();
        return false;
      }
      setTiles((prev) =>
        prev.map((t) =>
          t.x === curX && t.y === curY
            ? { ...t, waterLevel: 1.0 }
            : t
        )
      );
      sound.playWater();
      setInventory((inv) => ({
        ...inv,
        Water: Math.max(0, (inv.Water || 0) - 1),
      }));
      if (farmSceneRef.current) {
        farmSceneRef.current.addFloatingText('💧 Saturated (5x Growth)', '#38bdf8', curX, curY, worldSizeRef.current);
      }
      return true;
    }

    // 4. Instant Growth (Fertilizer):
    // Subtrahend of 2 seconds from active growth cycle or instantly matures fast crops
    if (item === Items.Fertilizer || (item as any) === 'Fertilizer') {
      if ((inventoryRef.current.Fertilizer || 0) < 1) {
        sound.playError();
        return false;
      }
      setTiles((prev) =>
        prev.map((t) => {
          if (t.x === curX && t.y === curY && t.entity) {
            const added = 2.0; // Subtracts 2.0 seconds from active growth cycle
            const updatedCurrent = t.currentGrowthTime + added;
            const updatedGrowth = Math.min(1.0, updatedCurrent / (t.targetGrowthTime || 0.5));
            return {
              ...t,
              currentGrowthTime: updatedCurrent,
              growth: updatedGrowth,
              fertilized: true,
            };
          }
          return t;
        })
      );
      sound.playPlant();
      setInventory((inv) => ({
        ...inv,
        Fertilizer: Math.max(0, (inv.Fertilizer || 0) - 1),
      }));
      if (farmSceneRef.current) {
        const cur = tilesRef.current.find((t) => t.x === curX && t.y === curY);
        const tag = (cur && (cur.currentGrowthTime + 2.0) >= (cur.targetGrowthTime || 0.5))
          ? '⚡ Instantly Matured!'
          : '⚡ Fertilizer (-2.0s)';
        farmSceneRef.current.addFloatingText(tag, '#a855f7', curX, curY, worldSizeRef.current);
      }
      return true;
    }

    return false;
  }, []);

  const onTrade = useCallback((item: ItemType, amount: number = 1) => {
    if (
      item === Items.Water ||
      (item as any) === 'Water' ||
      (item as any) === 'Water_Tank' ||
      (item as any) === Items.Water_Tank
    ) {
      if ((inventoryRef.current.Wood || 0) >= 1) {
        setInventory((inv) => ({
          ...inv,
          Wood: inv.Wood - 1,
          Water: (inv.Water || 0) + amount,
        }));
        sound.playUnlock();
        return true;
      }
    }
    if (item === Items.Fertilizer || (item as any) === 'Fertilizer') {
      if ((inventoryRef.current.Pumpkin || 0) >= 5 || (inventoryRef.current.Carrot || 0) >= 10) {
        setInventory((inv) => {
          if ((inv.Pumpkin || 0) >= 5) {
            return { ...inv, Pumpkin: inv.Pumpkin - 5, Fertilizer: (inv.Fertilizer || 0) + amount };
          }
          return { ...inv, Carrot: (inv.Carrot || 0) - 10, Fertilizer: (inv.Fertilizer || 0) + amount };
        });
        sound.playUnlock();
        return true;
      }
    }
    return false;
  }, []);

  const onMeasure = useCallback(() => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;
    const tile = tilesRef.current.find((t) => t.x === curX && t.y === curY);
    if (tile?.entity === Entities.Sunflower) {
      return tile.sunflowerPetals || 10;
    }
    if (tile?.entity === Entities.Cactus) {
      return tile.cactusSize !== undefined ? tile.cactusSize : 5;
    }
    return 0;
  }, []);

  const onFlip = useCallback(() => {
    setDrone((d) => ({
      ...d,
      isFlipping: true,
      flipProgress: 0,
    }));
    sound.playFlip();

    let prog = 0;
    const flipTimer = setInterval(() => {
      prog += 0.08;
      if (prog >= 1.0) {
        clearInterval(flipTimer);
        setDrone((d) => ({ ...d, isFlipping: false, flipProgress: 0 }));
      } else {
        setDrone((d) => ({ ...d, flipProgress: prog }));
      }
    }, 25);
  }, []);

  const getTime = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const getCompanion = useCallback(() => {
    const curX = droneRef.current.x;
    const curY = droneRef.current.y;
    const tile = tilesRef.current.find((t) => t.x === curX && t.y === curY);
    return tile?.companion || null;
  }, []);

  const onClearFarm = useCallback(() => {
    setTiles((prev) =>
      prev.map((t) => ({
        ...t,
        ground: Grounds.Grassland,
        entity: null,
        growth: 0,
        waterLevel: 0,
        isMegaPumpkin: false,
      }))
    );
  }, []);

  // Unlock Node in Tech Tree
  const handleUnlockTreeNode = useCallback(
    (node: TechTreeNode) => {
      const nodeKey = NODE_TO_UNLOCK_KEY[node.id] || (node.id as keyof UnlockLevels);
      const curLvl = (unlocksRef.current[nodeKey] as number) || 0;
      const nextLvl = curLvl + 1;
      if (nextLvl > node.maxLevel) return;

      const cost = node.costs[nextLvl] || {};
      for (const [it, amt] of Object.entries(cost)) {
        if ((inventoryRef.current[it as ItemType] || 0) < (amt as number)) {
          sound.playError();
          return;
        }
      }

      setInventory((inv) => {
        const next = { ...inv };
        for (const [it, amt] of Object.entries(cost)) {
          next[it as ItemType] -= amt as number;
        }
        return next;
      });

      setUnlocks((u) => ({
        ...u,
        [nodeKey]: nextLvl,
      }));

      sound.playUnlock();

      // Advance tutorial lessons according to newly unlocked technology
      if (node.id === 'while' && currentLessonId < 2) setCurrentLessonId(2);
      if (node.id === 'expand' && currentLessonId < 3) setCurrentLessonId(3);
      if (node.id === 'plant' && currentLessonId < 4) setCurrentLessonId(4);
      if (node.id === 'operators' && currentLessonId < 5) setCurrentLessonId(5);
    },
    [currentLessonId]
  );

  // Compute node levels for TechTreeCanvas
  const treeNodeLevels: Record<string, number> = useMemo(() => {
    const res: Record<string, number> = {};
    TECH_TREE_NODES.forEach((n) => {
      const key = NODE_TO_UNLOCK_KEY[n.id] || (n.id as keyof UnlockLevels);
      res[n.id] = (unlocks[key] as number) || 0;
    });
    return res;
  }, [unlocks]);

  // Check if player has enough resources to unlock ANY node
  const hasAvailableUnlocks = useMemo(() => {
    return TECH_TREE_NODES.some((node) => {
      const nodeKey = NODE_TO_UNLOCK_KEY[node.id] || (node.id as keyof UnlockLevels);
      const curLvl = (unlocks[nodeKey] as number) || 0;
      if (curLvl >= node.maxLevel) return false;
      if (node.parentId) {
        const parentKey = NODE_TO_UNLOCK_KEY[node.parentId] || (node.parentId as keyof UnlockLevels);
        if (((unlocks[parentKey] as number) || 0) < 1) return false;
      }
      const nextLvl = curLvl + 1;
      const cost = node.costs[nextLvl] || {};
      return Object.entries(cost).every(
        ([item, amt]) => (inventory[item as ItemType] || 0) >= (amt as number)
      );
    });
  }, [unlocks, inventory]);

  // Instantiate Drone Interpreter
  const getInterpreter = useCallback(() => {
    if (!interpreterRef.current) {
      interpreterRef.current = new DroneInterpreter({
        getTile: (x, y) => tilesRef.current.find((t) => t.x === x && t.y === y),
        getDrone: () => droneRef.current,
        getWorldSize: () => worldSizeRef.current,
        getInventory: () => inventoryRef.current,
        getUnlocks: () => unlocksRef.current,
        isSandbox: false,
        onMove,
        onSwap,
        onHarvest,
        onPlant,
        onTill,
        onUseItem,
        onTrade,
        onUnlock: () => false,
        onMeasure,
        onFlip,
        onPrint: () => {},
        onQuickPrint: () => {},
        onClear: onClearFarm,
        getTime,
        getCompanion,
      });
    }
    return interpreterRef.current;
  }, [
    onMove,
    onSwap,
    onHarvest,
    onPlant,
    onTill,
    onUseItem,
    onTrade,
    onMeasure,
    onFlip,
    onClearFarm,
    getTime,
    getCompanion,
  ]);

  // Code Execution Stepping Loop (scaled with Speed unlock level)
  useEffect(() => {
    if (!isRunning) return;

    const interp = getInterpreter();
    const speedLvl = unlocks.Speed || 1;
    // Speed progression: 1 -> 250ms, 2 -> 160ms, 3 -> 100ms, 4 -> 60ms, 5 -> 30ms
    const intervalMs = Math.max(20, Math.floor(250 / (1 + (speedLvl - 1) * 0.75)));

    const timer = setInterval(() => {
      const stepRes: StepResult = interp.step();

      if (stepRes.type === 'action') {
        setActiveLine(stepRes.line);
        setError(null);
      } else if (stepRes.type === 'line') {
        setActiveLine(stepRes.line);
      } else if (stepRes.type === 'done') {
        setIsRunning(false);
        setActiveLine(null);
      } else if (stepRes.type === 'error') {
        setIsRunning(false);
        setError({ message: stepRes.message, line: stepRes.line });
        sound.playError();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, unlocks.Speed, getInterpreter]);

  // Handle Play/Pause
  const handleToggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      const activeCode = files[activeFileIndex]?.code || '';
      const interp = getInterpreter();
      const loadRes = interp.loadScript(activeCode);

      if (!loadRes.success) {
        setError({ message: loadRes.error || 'Syntax Error', line: 1 });
        sound.playError();
        return;
      }

      setError(null);
      setIsRunning(true);
    }
  };

  const handleUpdateCode = (idx: number, newCode: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, code: newCode } : f))
    );
  };

  const handleRenameFile = (newName: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIndex ? { ...f, name: newName } : f))
    );
  };

  const handleAddFile = () => {
    const num = files.length + 1;
    const newName = `script_${num}.py`;
    setFiles((prev) => [
      ...prev,
      {
        name: newName,
        description: 'New script',
        code: `# ${newName}\nharvest()\n`,
      },
    ]);
    setActiveFileIndex(files.length);
    setShowCodeWindow(true);
    sound.playClick();
  };

  const handleDeleteFile = (idx: number) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setActiveFileIndex(Math.max(0, idx - 1));
  };

  // Keyboard manual controls (WASD to move, Space to harvest, T to till, P to plant, F to flip)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore keys when focused inside inputs or code editors
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'w' || e.key === 'ArrowUp') {
        onMove(Direction.North);
      } else if (e.key === 'd' || e.key === 'ArrowRight') {
        onMove(Direction.East);
      } else if (e.key === 's' || e.key === 'ArrowDown') {
        onMove(Direction.South);
      } else if (e.key === 'a' || e.key === 'ArrowLeft') {
        onMove(Direction.West);
      } else if (e.key === ' ') {
        e.preventDefault();
        onHarvest();
      } else if (e.key === 't' || e.key === 'T') {
        onTill();
      } else if (e.key === 'p' || e.key === 'P') {
        onPlant(Entities.Grass);
      } else if (e.key === 'f' || e.key === 'F') {
        onFlip();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onMove, onHarvest, onTill, onPlant, onFlip]);

  const activeFile = files[activeFileIndex] || files[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#8598a6] select-none font-sans">
      {/* 100% Full-Screen 3D Farm Canvas */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top-Right HUD: Authentic [ Guide ] [ + ] [ 1 ] [ Unlocks ] bar */}
      <TopRightHud
        fileCount={files.length}
        activeFileIndex={activeFileIndex}
        hasAvailableUnlocks={hasAvailableUnlocks}
        onNewFile={handleAddFile}
        onToggleFileList={() => setShowFileListPopover(!showFileListPopover)}
        onOpenUnlocks={() => setShowTechTreeCanvas(true)}
        onOpenTutorial={() => setShowTutorial(true)}
      />

      {/* File List Popover (when clicking file indicator [ 1 ]) */}
      {showFileListPopover && (
        <div className="absolute top-12 right-12 z-30 bg-[#292b2e] border border-[#3b3d42] rounded-md shadow-2xl p-2 w-48 font-mono text-xs text-white">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 px-1">
            Scripts
          </div>
          <div className="space-y-1">
            {files.map((file, idx) => (
              <div
                key={file.name}
                onClick={() => {
                  setActiveFileIndex(idx);
                  setShowFileListPopover(false);
                  setShowCodeWindow(true);
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                  activeFileIndex === idx
                    ? 'bg-[#628422] text-white font-bold'
                    : 'hover:bg-[#36383b] text-gray-200'
                }`}
              >
                <span className="truncate">{file.name}</span>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(idx);
                    }}
                    className="text-gray-400 hover:text-red-400 p-0.5"
                    title="Delete script"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Tutorial Window (from screenshot 419d275c) */}
      {showTutorial && (
        <FloatingTutorialWindow
          currentLessonId={currentLessonId}
          unlockedLevels={treeNodeLevels}
          onSelectLesson={setCurrentLessonId}
          onLoadCode={(code) => {
            handleUpdateCode(activeFileIndex, code);
            setIsRunning(false);
            setActiveLine(null);
          }}
          onClose={() => setShowTutorial(false)}
          initialPos={{ x: 24, y: 24 }}
        />
      )}

      {/* Floating Code Window (from screenshot f9a640f3) */}
      {showCodeWindow && activeFile && (
        <FloatingCodeWindow
          fileName={activeFile.name}
          code={activeFile.code}
          activeLine={activeLine ?? undefined}
          error={error ? `${error.message} (line ${error.line})` : null}
          isRunning={isRunning}
          onUpdateCode={(newCode) => handleUpdateCode(activeFileIndex, newCode)}
          onRenameFile={handleRenameFile}
          onToggleRun={handleToggleRun}
          onClose={() => setShowCodeWindow(false)}
          speed={unlocks.Speed || 1}
          initialPos={{
            x: typeof window !== 'undefined' ? Math.max(380, window.innerWidth - 460) : 460,
            y: typeof window !== 'undefined' ? Math.max(160, window.innerHeight - 340) : 320,
          }}
        />
      )}

      {/* Subtle manual control hint in bottom-left corner */}
      <div className="absolute bottom-3 left-4 pointer-events-none select-none z-10 text-[11px] font-mono text-[#253238]/70 bg-white/20 backdrop-blur-[2px] px-2.5 py-1 rounded">
        WASD: Move • Space: Harvest • T: Till • P: Plant • F: Flip
      </div>

      {/* Full-Screen Tech Tree Canvas (matching screenshot d2143970) */}
      {showTechTreeCanvas && (
        <TechTreeCanvas
          unlockedLevels={treeNodeLevels}
          inventory={inventory}
          onUnlockNode={handleUnlockTreeNode}
          onClose={() => setShowTechTreeCanvas(false)}
          onLoadLessonSnippet={(code) => {
            handleUpdateCode(activeFileIndex, code);
            setIsRunning(false);
            setActiveLine(null);
          }}
        />
      )}
    </div>
  );
}
