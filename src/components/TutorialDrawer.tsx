import React, { useState } from 'react';
import { TUTORIAL_LESSONS, TutorialLesson } from '../game/defaultScripts';
import { X, BookOpen, CheckCircle, ChevronRight, Code, ArrowRight } from 'lucide-react';

interface TutorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCode: (code: string) => void;
}

export const TutorialDrawer: React.FC<TutorialDrawerProps> = ({
  isOpen,
  onClose,
  onLoadCode,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<TutorialLesson>(TUTORIAL_LESSONS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px] select-none">
      <div className="w-full max-w-lg bg-[#16181d] border-l border-slate-700/80 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#121418]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Official Academy & Tutorial</h2>
              <p className="text-[11px] text-slate-400">
                Step-by-step automation guides from thefarmerwasreplaced.com
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

        {/* Content Split: Lesson Selector and Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Lessons list horizontal pills */}
          <div className="flex items-center gap-1.5 p-3 overflow-x-auto bg-[#131518] border-b border-slate-800/80 scrollbar-none">
            {TUTORIAL_LESSONS.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLesson(lesson)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedLesson.id === lesson.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{lesson.title}</span>
              </button>
            ))}
          </div>

          {/* Active Lesson Details */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <div>
              <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Objective
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedLesson.objective}</h3>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>{selectedLesson.instructions}</p>
            </div>

            {/* Code Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Code size={13} className="text-emerald-400" />
                  <span>Starter Script</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onLoadCode(selectedLesson.starterCode);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <span>Load into Editor</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <pre className="p-3 bg-[#0f1114] rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                <code>{selectedLesson.starterCode}</code>
              </pre>
            </div>

            {/* Hint Box */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 mr-1.5">💡 Strategy Hint:</span>
              {selectedLesson.solutionHint}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
