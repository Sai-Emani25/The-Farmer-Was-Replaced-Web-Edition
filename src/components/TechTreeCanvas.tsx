import React, { useState, useRef } from 'react';
import { TECH_TREE_NODES, TechTreeNode } from '../game/techTreeData';
import { Inventory, ItemType, Items } from '../game/types';
import {
  Wheat,
  TreeDeciduous,
  Carrot,
  Flame,
  Zap,
  Droplets,
  Sparkles,
  Lock,
  Check,
  X,
  Box,
  Compass,
  ArrowRight,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TechTreeCanvasProps {
  unlockedLevels: Record<string, number>;
  inventory: Inventory;
  onUnlockNode: (node: TechTreeNode) => void;
  onClose: () => void;
  onLoadLessonSnippet?: (snippet: string) => void;
}

export const TechTreeCanvas: React.FC<TechTreeCanvasProps> = ({
  unlockedLevels,
  inventory,
  onUnlockNode,
  onClose,
  onLoadLessonSnippet,
}) => {
  const [selectedNode, setSelectedNode] = useState<TechTreeNode | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 30 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Node dimensions and spacing on the canvas
  const nodeWidth = 92;
  const nodeHeight = 56;
  const colSpacing = 110;
  const rowSpacing = 92;

  // Inventory items matching top-left banner in the screenshot
  const topInventoryItems: { key: ItemType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: Items.Hay, label: 'Hay', icon: <Wheat size={14} className="text-amber-300" />, color: 'text-amber-200' },
    { key: Items.Wood, label: 'Wood', icon: <TreeDeciduous size={14} className="text-amber-700" />, color: 'text-amber-400' },
    { key: Items.Carrot, label: 'Carrot', icon: <Carrot size={14} className="text-orange-400" />, color: 'text-orange-300' },
    { key: Items.Pumpkin, label: 'Pumpkin', icon: <Flame size={14} className="text-amber-500" />, color: 'text-amber-400' },
    { key: Items.Power, label: 'Power', icon: <Zap size={14} className="text-yellow-400" />, color: 'text-yellow-300' },
    { key: Items.Cactus, label: 'Cactus', icon: <TreeDeciduous size={14} className="text-green-500" />, color: 'text-green-300' },
    { key: Items.Fertilizer, label: 'Fertilizer', icon: <Sparkles size={14} className="text-purple-400" />, color: 'text-purple-300' },
    { key: Items.Water, label: 'Water', icon: <Droplets size={14} className="text-sky-400" />, color: 'text-sky-300' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const isNodeUnlocked = (node: TechTreeNode) => {
    return (unlockedLevels[node.id] || 0) >= 1;
  };

  const isNodeAvailable = (node: TechTreeNode) => {
    if (isNodeUnlocked(node) && (unlockedLevels[node.id] || 0) >= node.maxLevel) {
      return false; // Already maxed
    }
    if (!node.parentId) return true; // Root node
    return (unlockedLevels[node.parentId] || 0) >= 1;
  };

  const canAfford = (node: TechTreeNode) => {
    const curLvl = unlockedLevels[node.id] || 0;
    const nextLvl = curLvl + 1;
    const cost = node.costs[nextLvl] || {};
    for (const [it, amt] of Object.entries(cost)) {
      if ((inventory[it as ItemType] || 0) < (amt as number)) return false;
    }
    return true;
  };

  const handleResearchClick = (node: TechTreeNode) => {
    onUnlockNode(node);
    try {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#637a8c] flex flex-col select-none overflow-hidden cursor-grab active:cursor-grabbing font-sans"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar matching screenshot */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-20 pointer-events-none">
        {/* Top-Left Resource Inventory Cluster */}
        <div className="flex items-center gap-3 pointer-events-auto bg-black/25 backdrop-blur-[2px] px-3.5 py-1.5 rounded-lg border border-white/10">
          {topInventoryItems.map((item) => {
            const count = inventory[item.key] || 0;
            return (
              <div key={item.key} className="flex items-center gap-1 text-xs font-mono font-bold" title={item.label}>
                {item.icon}
                <span className={item.color}>
                  {count > 99999 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Top-Right Green 3D Cube Button (Returns to Farm Simulation View) */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 rounded-lg bg-[#538734] hover:bg-[#5f9c3c] border-2 border-[#7fc84a] shadow-lg flex items-center justify-center text-white transition-all transform active:scale-95"
          title="Return to Farm 3D Simulation"
        >
          <Box size={20} className="stroke-[2.5]" />
        </button>
      </div>

      {/* SVG Canvas for Golden Connecting Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
        <g transform="translate(680, 70)">
          {TECH_TREE_NODES.map((node) => {
            if (!node.parentId) return null;
            const parent = TECH_TREE_NODES.find((n) => n.id === node.parentId);
            if (!parent) return null;

            const x1 = parent.col * colSpacing;
            const y1 = parent.row * rowSpacing + nodeHeight / 2;
            const x2 = node.col * colSpacing;
            const y2 = node.row * rowSpacing - nodeHeight / 2;

            const midY = (y1 + y2) / 2;
            const pathD = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

            const isParentUnlocked = (unlockedLevels[parent.id] || 0) >= 1;
            const isChildUnlocked = (unlockedLevels[node.id] || 0) >= 1;

            return (
              <path
                key={`${parent.id}->${node.id}`}
                d={pathD}
                fill="none"
                stroke={isChildUnlocked ? '#fbbf24' : isParentUnlocked ? '#c4a055' : '#475569'}
                strokeWidth={isChildUnlocked ? 2.5 : 1.8}
                strokeOpacity={isChildUnlocked ? 0.95 : 0.6}
              />
            );
          })}
        </g>
      </svg>

      {/* HTML Interactive Node Cards */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
        <div className="relative" style={{ left: '680px', top: '70px' }}>
          {TECH_TREE_NODES.map((node) => {
            const x = node.col * colSpacing - nodeWidth / 2;
            const y = node.row * rowSpacing - nodeHeight / 2;
            const curLvl = unlockedLevels[node.id] || 0;
            const isUnlocked = curLvl >= 1;
            const isMaxed = curLvl >= node.maxLevel;
            const isAvailable = isNodeAvailable(node);
            const canBuy = isAvailable && canAfford(node);
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                className={`absolute pointer-events-auto rounded flex flex-col items-center justify-between p-1.5 cursor-pointer transition-all duration-150 ${
                  isMaxed
                    ? 'bg-[#181a1f] border-2 border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                    : isUnlocked
                    ? 'bg-[#181a1f] border-2 border-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.25)]'
                    : isAvailable
                    ? 'bg-[#16181d] border-2 border-[#f59e0b]/80 hover:border-[#fbbf24] hover:scale-105 animate-pulse'
                    : 'bg-[#111317]/90 border border-slate-700/60 opacity-60'
                } ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${nodeWidth}px`,
                  height: `${nodeHeight}px`,
                }}
              >
                {/* Node Label / Icon */}
                <div className="flex-1 flex items-center justify-center font-mono text-center">
                  {node.iconType === 'speed' && <Zap size={18} className="text-yellow-400" />}
                  {node.iconType === 'expand' && <Wheat size={18} className="text-amber-400" />}
                  {node.iconType === 'plant' && <Wheat size={18} className="text-emerald-400" />}
                  {node.iconType === 'bush' && <TreeDeciduous size={18} className="text-emerald-400" />}
                  {node.iconType === 'carrot' && <Carrot size={18} className="text-orange-400" />}
                  {node.iconType === 'tree' && <TreeDeciduous size={18} className="text-emerald-500" />}
                  {node.iconType === 'pumpkin' && <Flame size={18} className="text-amber-500" />}
                  {node.iconType === 'sunflower' && <Zap size={18} className="text-yellow-400" />}
                  {node.iconType === 'cactus' && <TreeDeciduous size={18} className="text-green-500" />}
                  {node.iconType === 'water' && <Droplets size={18} className="text-sky-400" />}
                  {node.iconType === 'fertilizer' && <Sparkles size={18} className="text-purple-400" />}
                  {node.iconType === 'dinosaur' && <Sparkles size={18} className="text-amber-300" />}
                  {node.iconType === 'text' && (
                    <span className="text-[12px] font-bold text-amber-200 truncate px-1">
                      {node.label}
                    </span>
                  )}
                </div>

                {/* Level Tag matching screenshot (e.g. 1/1, 16/16, 0/5) */}
                <div className="text-[10px] font-mono font-bold text-amber-300/90 leading-none">
                  {curLvl}/{node.maxLevel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Node Inspection & Programming Lesson Card */}
      {selectedNode && (
        <div
          className="absolute bottom-6 right-6 w-96 bg-[#16181d]/95 border-2 border-amber-500/80 rounded-xl p-4 shadow-2xl z-30 font-sans text-slate-200 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-300">
                  {selectedNode.label}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                  Level {unlockedLevels[selectedNode.id] || 0}/{selectedNode.maxLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            >
              <X size={15} />
            </button>
          </div>

          {/* Programming Concept & Tutorial Snippet */}
          {selectedNode.programmingLesson && (
            <div className="mb-3 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                <span className="flex items-center gap-1">
                  <Code2 size={12} />
                  <span>
                    Lesson {selectedNode.programmingLesson.chapter}: {selectedNode.programmingLesson.title}
                  </span>
                </span>
                {onLoadLessonSnippet && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedNode.programmingLesson) {
                        onLoadLessonSnippet(selectedNode.programmingLesson.codeSnippet);
                        onClose();
                      }
                    }}
                    className="text-[10px] text-emerald-300 hover:underline flex items-center gap-0.5"
                  >
                    <span>Load Code</span>
                    <ArrowRight size={10} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedNode.programmingLesson.explanation}
              </p>
            </div>
          )}

          {/* Research Cost & Unlock Action */}
          {(unlockedLevels[selectedNode.id] || 0) < selectedNode.maxLevel ? (
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-1.5">Research Cost:</div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {Object.entries(
                  selectedNode.costs[(unlockedLevels[selectedNode.id] || 0) + 1] || {}
                ).map(([item, amt]) => {
                  const hasEnough = (inventory[item as ItemType] || 0) >= (amt as number);
                  return (
                    <span
                      key={item}
                      className={`text-xs px-2 py-0.5 rounded font-mono border ${
                        hasEnough
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-red-950/60 text-red-300 border-red-800/50'
                      }`}
                    >
                      {amt} {item} (have: {inventory[item as ItemType] || 0})
                    </span>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!isNodeAvailable(selectedNode) || !canAfford(selectedNode)}
                onClick={() => handleResearchClick(selectedNode)}
                className={`w-full py-2 rounded-lg font-bold text-xs shadow-md transition-all ${
                  isNodeAvailable(selectedNode) && canAfford(selectedNode)
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {!isNodeAvailable(selectedNode)
                  ? 'Locked by Prerequisite'
                  : !canAfford(selectedNode)
                  ? 'Need More Resources'
                  : 'Research Upgrade'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold bg-amber-950/40 p-2 rounded border border-amber-800/40">
              <Check size={14} />
              <span>Technology Fully Researched!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
