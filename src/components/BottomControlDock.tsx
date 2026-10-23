import React, { useState } from 'react';
import {
  Camera,
  Volume2,
  VolumeX,
  BookOpen,
  Code2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smile,
} from 'lucide-react';
import { Hats, HatType } from '../game/types';

interface BottomControlDockProps {
  cameraMode: 'iso' | 'top' | 'drone';
  onChangeCamera: (mode: 'iso' | 'top' | 'drone') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetFarm: () => void;
  onOpenTutorial: () => void;
  onOpenApi: () => void;
  onOpenResearch: () => void;
  currentHat: HatType;
  onChangeHat: (hat: HatType) => void;
  unlockedHatsLevel: number;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  cameraMode,
  onChangeCamera,
  isMuted,
  onToggleMute,
  onResetFarm,
  onOpenTutorial,
  onOpenApi,
  onOpenResearch,
  currentHat,
  onChangeHat,
  unlockedHatsLevel,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHatMenu, setShowHatMenu] = useState(false);

  const availableHats: { id: HatType; label: string; reqLevel: number }[] = [
    { id: Hats.None, label: 'Default Drone', reqLevel: 0 },
    { id: Hats.StrawHat, label: 'Farmer Straw Hat', reqLevel: 1 },
    { id: Hats.CowboyHat, label: 'Cowboy Hat', reqLevel: 2 },
    { id: Hats.TopHat, label: 'Gentleman Top Hat', reqLevel: 3 },
    { id: Hats.WizardHat, label: 'Wizard Hat', reqLevel: 4 },
    { id: Hats.Crown, label: 'Royal Crown', reqLevel: 4 },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none pointer-events-auto transition-transform duration-200">
      {/* Collapse / Expand Toggle Tab */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1.5 px-3 py-1 bg-[#16181d]/90 hover:bg-[#1a1d24] text-slate-400 hover:text-slate-200 rounded-t-lg border-t border-x border-slate-700/80 text-[11px] font-medium shadow-md transition-colors"
      >
        {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <span>{isCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 p-2 bg-[#16181d]/95 border border-slate-700/80 rounded-xl shadow-2xl max-w-[min(940px,94vw)] backdrop-blur-sm">
          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-bold px-1.5 uppercase">Camera</span>
            <button
              type="button"
              onClick={() => onChangeCamera('iso')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                cameraMode === 'iso'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Isometric
            </button>
            <button
              type="button"
              onClick={() => onChangeCamera('top')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                cameraMode === 'top'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Top-Down
            </button>
            <button
              type="button"
              onClick={() => onChangeCamera('drone')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                cameraMode === 'drone'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Drone Chase
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Drone Hat Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHatMenu(!showHatMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-medium transition-colors"
              title="Equip Hats on Drone"
            >
              <Smile size={14} className="text-amber-400" />
              <span>Hat: {currentHat === 'None' ? 'No Hat' : currentHat}</span>
            </button>

            {showHatMenu && (
              <div className="absolute bottom-10 left-0 bg-[#16181d] border border-slate-700 rounded-lg p-1.5 shadow-xl w-44 space-y-1 text-xs z-50">
                {availableHats.map((h) => {
                  const isLocked = unlockedHatsLevel < h.reqLevel;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        onChangeHat(h.id);
                        setShowHatMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center justify-between ${
                        currentHat === h.id
                          ? 'bg-emerald-600 text-white font-bold'
                          : isLocked
                          ? 'text-slate-500 opacity-60 cursor-not-allowed'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{h.label}</span>
                      {isLocked && <span className="text-[10px] text-slate-500">Lv.{h.reqLevel}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Quick Guides & Tools */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={onOpenResearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg font-semibold transition-colors"
            >
              <Sparkles size={14} />
              <span>Tech Tree</span>
            </button>

            <button
              type="button"
              onClick={onOpenTutorial}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg font-medium transition-colors"
            >
              <BookOpen size={14} className="text-emerald-400" />
              <span>Academy</span>
            </button>

            <button
              type="button"
              onClick={onOpenApi}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg font-medium transition-colors"
            >
              <Code2 size={14} className="text-sky-400" />
              <span>API Wiki</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Audio & Farm Reset */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-red-950/40 border-red-800/40 text-red-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              type="button"
              onClick={onResetFarm}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 rounded-lg transition-colors"
              title="Clear all crops and till state"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
