import React, { useState } from 'react';
import { X, Search, Terminal, Code2 } from 'lucide-react';

interface ApiReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiItem {
  name: string;
  category: 'Drone Actions' | 'Sensors & Coordinates' | 'Items & Trade' | 'Constants & Enums';
  syntax: string;
  description: string;
  example: string;
}

const API_ITEMS: ApiItem[] = [
  // Drone Actions
  {
    name: 'harvest()',
    category: 'Drone Actions',
    syntax: 'harvest() -> bool',
    description: 'Harvests the plant on the current tile. Adds resources (Hay, Wood, Carrot, etc.) to inventory.',
    example: 'if can_harvest():\n    harvest()',
  },
  {
    name: 'plant(entity)',
    category: 'Drone Actions',
    syntax: 'plant(Entities.<Type>) -> bool',
    description: 'Plants an entity on the current tile. Carrots require tilled Soil. Trees should have spacing.',
    example: 'plant(Entities.Bush)\nplant(Entities.Carrot)',
  },
  {
    name: 'till()',
    category: 'Drone Actions',
    syntax: 'till() -> bool',
    description: 'Toggles the ground type between Grounds.Grassland and Grounds.Soil.',
    example: 'if get_ground_type() != Grounds.Soil:\n    till()',
  },
  {
    name: 'move(direction)',
    category: 'Drone Actions',
    syntax: 'move(North | East | South | West) -> bool',
    description: 'Moves the drone 1 tile in the specified direction. The farm grid wraps around toroidally.',
    example: 'move(North)\nmove(East)',
  },
  {
    name: 'swap(direction)',
    category: 'Drone Actions',
    syntax: 'swap(North | East | South | West) -> bool',
    description: 'Swaps the entity and plant data on the current tile with the adjacent tile. Essential for cactus sorting algorithms!',
    example: 'if measure() > next_size:\n    swap(East)',
  },
  {
    name: 'do_a_flip()',
    category: 'Drone Actions',
    syntax: 'do_a_flip()',
    description: 'Performs a celebratory 360-degree aerial flip.',
    example: 'do_a_flip()',
  },
  {
    name: 'quick_print(*args)',
    category: 'Drone Actions',
    syntax: 'quick_print(...args)',
    description: 'Instantly logs messages or variable states to the Drone Console without costing simulation ticks.',
    example: 'quick_print("X:", get_pos_x(), "Y:", get_pos_y())',
  },

  // Sensors & Coordinates
  {
    name: 'can_harvest()',
    category: 'Sensors & Coordinates',
    syntax: 'can_harvest() -> bool',
    description: 'Returns True if the crop on the current tile is fully grown and ready to harvest.',
    example: 'if can_harvest():\n    harvest()',
  },
  {
    name: 'get_pos_x()',
    category: 'Sensors & Coordinates',
    syntax: 'get_pos_x() -> int',
    description: 'Returns the current X coordinate of the drone (0 to world_size - 1).',
    example: 'x = get_pos_x()',
  },
  {
    name: 'get_pos_y()',
    category: 'Sensors & Coordinates',
    syntax: 'get_pos_y() -> int',
    description: 'Returns the current Y coordinate of the drone (0 to world_size - 1).',
    example: 'y = get_pos_y()',
  },
  {
    name: 'get_world_size()',
    category: 'Sensors & Coordinates',
    syntax: 'get_world_size() -> int',
    description: 'Returns the current size of the farm grid along one axis.',
    example: 'size = get_world_size()',
  },
  {
    name: 'get_entity_type()',
    category: 'Sensors & Coordinates',
    syntax: 'get_entity_type() -> Entity or None',
    description: 'Returns the type of plant/entity currently on this tile.',
    example: 'if get_entity_type() == Entities.Carrot:\n    pass',
  },
  {
    name: 'get_ground_type()',
    category: 'Sensors & Coordinates',
    syntax: 'get_ground_type() -> Grounds.Grassland | Grounds.Soil',
    description: 'Returns the ground state of the current tile.',
    example: 'if get_ground_type() == Grounds.Soil:\n    plant(Entities.Carrot)',
  },
  {
    name: 'get_water()',
    category: 'Sensors & Coordinates',
    syntax: 'get_water() -> float',
    description: 'Returns moisture level of current tile from 0.0 to 1.0. Watered crops grow 3x faster.',
    example: 'if get_water() < 0.2:\n    use_item(Items.Water)',
  },
  {
    name: 'measure()',
    category: 'Sensors & Coordinates',
    syntax: 'measure() -> int',
    description: 'Measures properties of current entity (petals for Sunflowers 7-15, or size for Cacti 1-9).',
    example: 'petals = measure()',
  },

  // Items & Trade
  {
    name: 'use_item(item)',
    category: 'Items & Trade',
    syntax: 'use_item(Items.<Name>, [amount]) -> bool',
    description: 'Uses an item on the current tile, e.g. Items.Water to hydrate or Items.Fertilizer.',
    example: 'use_item(Items.Water)',
  },
  {
    name: 'num_items(item)',
    category: 'Items & Trade',
    syntax: 'num_items(Items.<Name>) -> int',
    description: 'Returns the quantity of the given item currently held in your inventory.',
    example: 'if num_items(Items.Hay) >= 20:\n    print("Enough Hay!")',
  },
  {
    name: 'unlock(unlock_type)',
    category: 'Items & Trade',
    syntax: 'unlock(Unlocks.<Name>) -> bool',
    description: 'Programmatically purchases the specified tech tree upgrade if resources are available.',
    example: 'unlock(Unlocks.Carrots)',
  },
  {
    name: 'get_cost(thing)',
    category: 'Items & Trade',
    syntax: 'get_cost(item_or_entity) -> dict',
    description: 'Returns a dictionary mapping required Items to integer costs.',
    example: 'cost = get_cost(Entities.Carrot)',
  },

  // Constants & Enums
  {
    name: 'Entities.*',
    category: 'Constants & Enums',
    syntax: 'Entities.Grass, Entities.Bush, Entities.Carrot, Entities.Tree, Entities.Pumpkin, Entities.Sunflower, Entities.Cactus',
    description: 'All plantable or encounterable flora and structures on your farm grid.',
    example: 'plant(Entities.Sunflower)',
  },
  {
    name: 'Grounds.*',
    category: 'Constants & Enums',
    syntax: 'Grounds.Grassland, Grounds.Soil',
    description: 'Ground terrain classifications.',
    example: 'till()',
  },
  {
    name: 'Items.*',
    category: 'Constants & Enums',
    syntax: 'Items.Hay, Items.Wood, Items.Carrot, Items.Pumpkin, Items.Power, Items.Cactus, Items.Water, Items.Fertilizer',
    description: 'Harvested resources and usable farm tools.',
    example: 'num_items(Items.Wood)',
  },
];

export const ApiReferenceModal: React.FC<ApiReferenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Drone Actions', 'Sensors & Coordinates', 'Items & Trade', 'Constants & Enums'];

  const filtered = API_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.syntax.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 select-none">
      <div className="bg-[#16181d] border border-slate-700/80 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121418]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">API Cheatsheet & Documentation</h2>
              <p className="text-xs text-slate-400">
                Complete function signatures and examples for The Farmer Was Replaced
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-[#131518] flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search functions, parameters, or enums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5 bg-[#16181d]">
          {filtered.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-sm text-emerald-400">{item.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{item.description}</p>
              <div className="bg-[#101214] p-2 rounded border border-slate-800/80 font-mono text-[11px] text-amber-300">
                <div className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Signature</div>
                <div>{item.syntax}</div>
              </div>
              <div className="mt-2 bg-[#0c0d0f] p-2 rounded border border-slate-800/50 font-mono text-[11px] text-emerald-300/90 whitespace-pre">
                {item.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
