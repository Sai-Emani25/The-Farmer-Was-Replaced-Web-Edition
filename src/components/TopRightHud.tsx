import React from 'react';
import { Plus } from 'lucide-react';

interface TopRightHudProps {
  fileCount: number;
  activeFileIndex: number;
  hasAvailableUnlocks: boolean;
  onNewFile: () => void;
  onToggleFileList?: () => void;
  onOpenUnlocks: () => void;
  onOpenTutorial: () => void;
}

export const TopRightHud: React.FC<TopRightHudProps> = ({
  fileCount,
  activeFileIndex,
  hasAvailableUnlocks,
  onNewFile,
  onToggleFileList,
  onOpenUnlocks,
  onOpenTutorial,
}) => {
  return (
    <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 select-none font-sans">
      {/* Tutorial / Help Quick Button if closed */}
      <button
        type="button"
        onClick={onOpenTutorial}
        className="h-7 px-2.5 bg-[#4d5d1c] hover:bg-[#5b6f22] active:bg-[#435218] text-[#e2edba] hover:text-white text-xs font-semibold rounded-[4px] shadow-sm border border-[#3b4715] transition-all flex items-center justify-center cursor-pointer"
        title="Toggle Academy Guide"
      >
        Guide
      </button>

      {/* New file "+" button */}
      <button
        type="button"
        onClick={onNewFile}
        className="w-7 h-7 bg-[#596d21] hover:bg-[#688026] active:bg-[#4b5c1c] text-white text-sm font-bold rounded-[4px] shadow-sm border border-[#445318] flex items-center justify-center transition-all cursor-pointer"
        title="Create new code window (+)"
      >
        <Plus size={15} strokeWidth={3} />
      </button>

      {/* File counter / switcher */}
      <button
        type="button"
        onClick={onToggleFileList}
        className="h-7 min-w-[28px] px-2 bg-[#596d21] hover:bg-[#688026] active:bg-[#4b5c1c] text-white text-xs font-mono font-bold rounded-[4px] shadow-sm border border-[#445318] flex items-center justify-center transition-all cursor-pointer"
        title={`File ${activeFileIndex + 1} of ${fileCount}`}
      >
        {activeFileIndex + 1}
      </button>

      {/* Unlocks button matching official game screenshot */}
      <button
        type="button"
        onClick={onOpenUnlocks}
        className={`h-7 px-3 text-xs font-bold rounded-[4px] shadow-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
          hasAvailableUnlocks
            ? 'bg-[#739226] hover:bg-[#82a52b] text-white border-[#556e1b] ring-2 ring-[#a4d436]/60 animate-pulse'
            : 'bg-[#596d21] hover:bg-[#688026] active:bg-[#4b5c1c] text-white border-[#445318]'
        }`}
        title="Open Tech Tree & Research"
      >
        <span>Unlocks</span>
        {hasAvailableUnlocks && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
        )}
      </button>
    </div>
  );
};
