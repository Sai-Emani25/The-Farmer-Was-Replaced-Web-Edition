import React from 'react';
import { Inventory, ItemType, DroneState } from '../game/types';
import {
  Wheat,
  TreeDeciduous,
  Carrot,
  Zap,
  Droplets,
  Sparkles,
  Compass,
  Grid,
  Flame,
} from 'lucide-react';

interface TopResourceBarProps {
  inventory: Inventory;
  drone: DroneState;
  worldSize: number;
  isSandbox: boolean;
  onToggleSandbox: () => void;
  onOpenResearch: () => void;
  unlockedCount: number;
  totalUnlocks: number;
}

export const TopResourceBar: React.FC<TopResourceBarProps> = ({
  inventory,
  drone,
  worldSize,
  isSandbox,
  onToggleSandbox,
  onOpenResearch,
  unlockedCount,
  totalUnlocks,
}) => {
  const resourceConfigs: {
    key: ItemType;
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }[] = [
    {
      key: 'Hay',
      label: 'Hay',
      icon: <Wheat size={14} className="text-amber-300" />,
      color: 'text-amber-200',
      bg: 'bg-amber-950/40 border-amber-800/40',
    },
    {
      key: 'Wood',
      label: 'Wood',
      icon: <TreeDeciduous size={14} className="text-emerald-400" />,
      color: 'text-emerald-200',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
    },
    {
      key: 'Carrot',
      label: 'Carrot',
      icon: <Carrot size={14} className="text-orange-400" />,
      color: 'text-orange-200',
      bg: 'bg-orange-950/40 border-orange-800/40',
    },
    {
      key: 'Pumpkin',
      label: 'Pumpkin',
      icon: <Flame size={14} className="text-amber-500" />,
      color: 'text-amber-300',
      bg: 'bg-amber-950/50 border-amber-700/50',
    },
    {
      key: 'Power',
      label: 'Power',
      icon: <Zap size={14} className="text-yellow-400" />,
      color: 'text-yellow-200',
      bg: 'bg-yellow-950/40 border-yellow-800/40',
    },
    {
      key: 'Cactus',
      label: 'Cactus',
      icon: <TreeDeciduous size={14} className="text-green-500" />,
      color: 'text-green-200',
      bg: 'bg-green-950/40 border-green-800/40',
    },
    {
      key: 'Water',
      label: 'Water',
      icon: <Droplets size={14} className="text-sky-400" />,
      color: 'text-sky-200',
      bg: 'bg-sky-950/40 border-sky-800/40',
    },
    {
      key: 'Fertilizer',
      label: 'Fertilizer',
      icon: <Sparkles size={14} className="text-purple-400" />,
      color: 'text-purple-200',
      bg: 'bg-purple-950/40 border-purple-800/40',
    },
  ];

  return (
    <header className="h-12 bg-[#121418]/95 border-b border-slate-800/90 px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Farm Specs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-xs">TF</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-tight">
              The Farmer Was Replaced
            </span>
          </div>
        </div>

        {/* Drone Pos & Grid Dimensions */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <Compass size={13} className="text-emerald-400" />
            <span>
              Pos: ({drone.x}, {drone.y})
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <Grid size={13} className="text-sky-400" />
            <span>
              Size: {worldSize}×{worldSize}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Inventory Counters */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {resourceConfigs.map((res) => {
          const val = inventory[res.key] || 0;
          return (
            <div
              key={res.key}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${res.bg} text-xs font-mono transition-all`}
              title={`${res.label}: ${val.toLocaleString()}`}
            >
              {res.icon}
              <span className={`font-semibold tabular-nums ${res.color}`}>
                {val > 99999 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mode & Research Action */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSandbox}
          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
            isSandbox
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:text-white'
          }`}
          title="Sandbox grants all research unlocks immediately"
        >
          {isSandbox ? 'Sandbox Mode' : 'Campaign Mode'}
        </button>

        <button
          type="button"
          onClick={onOpenResearch}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles size={13} />
          <span>Research ({unlockedCount}/{totalUnlocks})</span>
        </button>
      </div>
    </header>
  );
};
