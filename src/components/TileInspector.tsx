import React from 'react';
import { TileState } from '../game/types';
import { Sprout, Droplets, Grid, Flower2, Sparkles } from 'lucide-react';

interface TileInspectorProps {
  tile: TileState | null;
}

export const TileInspector: React.FC<TileInspectorProps> = ({ tile }) => {
  if (!tile) return null;

  const isReady = tile.growth >= 0.98;

  return (
    <div className="absolute bottom-20 left-4 z-20 pointer-events-none select-none bg-[#131518]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono w-64 animate-in fade-in zoom-in-95 duration-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Grid size={13} className="text-emerald-400" />
          <span>Tile ({tile.x}, {tile.y})</span>
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            tile.ground === 'Soil'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
          }`}
        >
          {tile.ground}
        </span>
      </div>

      <div className="space-y-2">
        {/* Entity Readout */}
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-slate-500">Entity:</span>
          <span className="font-bold text-slate-100 flex items-center gap-1">
            <Sprout size={12} className="text-emerald-400" />
            {tile.entity || 'Empty'}
          </span>
        </div>

        {/* Growth Progress Bar */}
        {tile.entity && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500">Growth:</span>
              <span className={`font-bold ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.round(tile.growth * 100)}% {isReady ? '[READY]' : ''}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  isReady ? 'bg-emerald-500 shadow-sm' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.round(tile.growth * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Moisture Level */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Droplets size={11} className="text-sky-400" />
              <span>Moisture:</span>
            </span>
            <span className="text-sky-300 font-semibold">
              {Math.round(tile.waterLevel * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-150"
              style={{ width: `${Math.round(tile.waterLevel * 100)}%` }}
            />
          </div>
        </div>

        {/* Sunflower Petals or Cactus Size */}
        {tile.sunflowerPetals !== undefined && (
          <div className="flex items-center justify-between text-yellow-300 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Flower2 size={12} className="text-yellow-400" />
              <span>Petal Count:</span>
            </span>
            <span className="font-bold">{tile.sunflowerPetals} Petals</span>
          </div>
        )}

        {tile.cactusSize !== undefined && (
          <div className="flex items-center justify-between text-green-300 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Sparkles size={12} className="text-green-400" />
              <span>Cactus Height:</span>
            </span>
            <span className="font-bold">Size {tile.cactusSize}/9</span>
          </div>
        )}

        {tile.isMegaPumpkin && (
          <div className="bg-amber-950/60 border border-amber-700/60 text-amber-300 p-1 rounded text-center font-bold text-[10px]">
            ★ MEGA PUMPKIN ACTIVE ★
          </div>
        )}
      </div>
    </div>
  );
};
