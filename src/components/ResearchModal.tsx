import React, { useState } from 'react';
import { RESEARCH_NODES, canUnlock } from '../game/research';
import { ResearchNode, UnlockLevels, Inventory, UnlockType, ItemType } from '../game/types';
import { X, Check, Lock, Sparkles, BookOpen, Cpu, Grid } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: UnlockLevels;
  inventory: Inventory;
  onUnlock: (node: ResearchNode) => void;
  isSandbox: boolean;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  levels,
  inventory,
  onUnlock,
  isSandbox,
}) => {
  const [activeTab, setActiveTab] = useState<'farming' | 'coding' | 'expansion' | 'cosmetics'>('farming');

  if (!isOpen) return null;

  const filteredNodes = RESEARCH_NODES.filter((n) => n.category === activeTab);

  const handleUnlockClick = (node: ResearchNode) => {
    onUnlock(node);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 select-none">
      <div className="bg-[#16181d] border border-slate-700/80 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Research & Tech Tree</h2>
              <p className="text-xs text-slate-400">
                Unlock new crops, advanced Python coding structures, speed, and farm expansions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-[#131518] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('farming')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'farming'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Farming & Crops</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coding')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'coding'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={14} />
            <span>Coding Constructs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expansion')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'expansion'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid size={14} />
            <span>Speed & World Expansion</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cosmetics')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'cosmetics'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} />
            <span>Drone Hats & Cosmetics</span>
          </button>
        </div>

        {/* Nodes Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#16181d]">
          {filteredNodes.map((node) => {
            const currentLevel = levels[node.id] || 0;
            const isMaxed = currentLevel >= node.maxLevel;
            const { can, reason } = canUnlock(node, currentLevel, levels, inventory);
            const nextLevel = currentLevel + 1;
            const cost = node.costs[nextLevel] || {};

            return (
              <div
                key={node.id}
                className={`p-4 rounded-lg border transition-all ${
                  isMaxed
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                    : can || isSandbox
                    ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{node.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                        Lv. {currentLevel}/{node.maxLevel}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {node.description}
                    </p>
                  </div>

                  {isMaxed && (
                    <span className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      <Check size={16} />
                    </span>
                  )}
                </div>

                {/* Prerequisites Warning */}
                {node.requires && node.requires.some((r) => (levels[r.id] || 0) < r.level) && (
                  <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1.5 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/40">
                    <Lock size={12} />
                    <span>
                      Requires:{' '}
                      {node.requires
                        .map((r) => `${r.id} Lv. ${r.level}`)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Upgrade Cost & Action */}
                {!isMaxed && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Cost:</span>
                      {Object.entries(cost).map(([item, amt]) => {
                        const hasEnough = (inventory[item as ItemType] || 0) >= (amt as number);
                        return (
                          <span
                            key={item}
                            className={`text-xs px-2 py-0.5 rounded font-mono border ${
                              hasEnough
                                ? 'bg-slate-800 text-slate-200 border-slate-700'
                                : 'bg-red-950/40 text-red-300 border-red-800/40'
                            }`}
                          >
                            {amt} {item}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!can && !isSandbox}
                      onClick={() => handleUnlockClick(node)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        can || isSandbox
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title={reason}
                    >
                      Research
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
