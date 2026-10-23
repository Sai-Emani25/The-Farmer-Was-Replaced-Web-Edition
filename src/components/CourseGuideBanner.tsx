import React, { useState } from 'react';
import {
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
} from 'lucide-react';

export interface CourseChapter {
  id: number;
  title: string;
  concept: string;
  objective: string;
  explanation: string;
  suggestedCode: string;
  unlockRequirementId?: string;
}

export const COURSE_CHAPTERS: CourseChapter[] = [
  {
    id: 1,
    title: '1. The Single Action',
    concept: 'Commands & Functions',
    objective: 'Call harvest() to reap your first Hay.',
    explanation:
      'Computer programs are sequences of commands executed by machines. Type `harvest()` and click Run to perform your first automated harvest.',
    suggestedCode: '# Chapter 1: Basic command execution\nharvest()\n',
  },
  {
    id: 2,
    title: '2. The Infinite Loop (while)',
    concept: 'Loops & Automation',
    objective: 'Unlock `while` and run continuous harvesting.',
    explanation:
      'Instead of running a command once, automation uses loops. In Python, `while True:` keeps your drone running endlessly.',
    suggestedCode: '# Chapter 2: Automated repetition\nwhile True:\n    if can_harvest():\n        harvest()\n',
    unlockRequirementId: 'while',
  },
  {
    id: 3,
    title: '3. Spatial Navigation',
    concept: 'Directions & Boundaries',
    objective: 'Expand farm to 3x3 and navigate with move(North).',
    explanation:
      'The farm wraps around like a torus! Use `move(North)` and `move(East)` to visit every plot of land.',
    suggestedCode: '# Chapter 3: Grid patrol\nwhile True:\n    if can_harvest():\n        harvest()\n    move(North)\n',
    unlockRequirementId: 'expand',
  },
  {
    id: 4,
    title: '4. Conditionals & Soil (till)',
    concept: 'Branching Logic (if/else)',
    objective: 'Unlock Carrots, till() the earth, and plant.',
    explanation:
      'Crops need the right environment. Check `if get_ground_type() != Grounds.Soil: till()` before planting Carrots.',
    suggestedCode: 'while True:\n    if get_ground_type() != Grounds.Soil:\n        till()\n    if can_harvest():\n        harvest()\n    plant(Entities.Carrot)\n    move(North)\n',
    unlockRequirementId: 'carrots',
  },
  {
    id: 5,
    title: '5. Expressions & Math (1 + 1)',
    concept: 'Arithmetic & Comparisons',
    objective: 'Calculate column offsets with modulo and comparisons.',
    explanation:
      'Use mathematical operators (+, -, *, %, //) and comparisons (==, !=, <, >) to determine what action to take.',
    suggestedCode: 'while True:\n    if get_pos_x() % 2 == 0:\n        plant(Entities.Bush)\n    else:\n        plant(Entities.Grass)\n    move(North)\n',
    unlockRequirementId: 'operators',
  },
  {
    id: 6,
    title: '6. State & Memory (x = 2)',
    concept: 'Variables',
    objective: 'Create a variable counter to track harvested items.',
    explanation:
      'Variables store values in memory across execution ticks. Create variables like `count = 0` to track your harvest yield.',
    suggestedCode: 'count = 0\nwhile True:\n    if can_harvest():\n        harvest()\n        count += 1\n        quick_print("Total harvested:", count)\n    move(North)\n',
    unlockRequirementId: 'variables',
  },
  {
    id: 7,
    title: '7. Reusable Modules (def f():)',
    concept: 'Custom Functions',
    objective: 'Define a custom function with def.',
    explanation:
      'Break complex code into modular, readable functions using `def function_name():`. Call them whenever needed.',
    suggestedCode: 'def harvest_row():\n    for y in range(get_world_size()):\n        if can_harvest():\n            harvest()\n        move(North)\n\nwhile True:\n    harvest_row()\n    move(East)\n',
    unlockRequirementId: 'functions',
  },
  {
    id: 8,
    title: '8. Data Sequences ([1, 2, 3])',
    concept: 'Lists & For Loops',
    objective: 'Iterate over lists of directions.',
    explanation:
      'Lists store ordered collections. Use `for d in [North, East, South, West]:` to coordinate multi-directional patrols.',
    suggestedCode: 'pattern = [North, North, East, South, South, East]\nwhile True:\n    for direction in pattern:\n        if can_harvest():\n            harvest()\n        move(direction)\n',
    unlockRequirementId: 'lists',
  },
  {
    id: 9,
    title: '9. Sorting Algorithms (swap)',
    concept: 'In-Place Bubble Sort',
    objective: 'Sort the cactus patch using swap().',
    explanation:
      'Sort cacti by height (0 to 9) using the `swap()` command so smaller cacti are South/West and larger are North/East for maximum n^2 rewards!',
    suggestedCode: 'while True:\n    if get_ground_type() != Grounds.Soil:\n        till()\n    plant(Entities.Cactus)\n    cur = measure()\n    move(East)\n    next_val = measure()\n    move(West)\n    if cur > next_val:\n        swap(East)\n    move(North)\n',
    unlockRequirementId: 'cacti',
  },
];

interface CourseGuideBannerProps {
  currentChapterId: number;
  unlockedLevels: Record<string, number>;
  onSelectChapter: (id: number) => void;
  onLoadCode: (code: string) => void;
  onOpenTechTree: () => void;
}

export const CourseGuideBanner: React.FC<CourseGuideBannerProps> = ({
  currentChapterId,
  unlockedLevels,
  onSelectChapter,
  onLoadCode,
  onOpenTechTree,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const curChapter =
    COURSE_CHAPTERS.find((c) => c.id === currentChapterId) || COURSE_CHAPTERS[0];

  const isRequirementMet = !curChapter.unlockRequirementId || (unlockedLevels[curChapter.unlockRequirementId] || 0) >= 1;

  return (
    <div className="bg-[#12151a] border-b border-amber-500/30 text-slate-200 select-none z-20">
      {/* Top Accordion Header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
            <GraduationCap size={15} />
            <span>Course: Lesson {curChapter.id}/{COURSE_CHAPTERS.length}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-white text-xs tracking-tight">
              {curChapter.title}
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">{curChapter.concept}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRequirementMet && (
            <button
              type="button"
              onClick={onOpenTechTree}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse"
            >
              <Sparkles size={13} />
              <span>Unlock in Tech Tree</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            <span>{isExpanded ? 'Hide Lesson' : 'View Lesson'}</span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Lesson Guide Drawer */}
      {isExpanded && (
        <div className="px-4 py-3 bg-[#0e1014] border-t border-slate-800/80 flex flex-col md:flex-row items-start gap-4 text-xs font-sans animate-in slide-in-from-top-2 duration-150">
          {/* Chapter Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            {COURSE_CHAPTERS.map((ch) => {
              const isDone = ch.id < currentChapterId;
              const isCur = ch.id === currentChapterId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChapter(ch.id)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isCur
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : isDone
                      ? 'bg-slate-800/80 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {isDone && <CheckCircle2 size={11} />}
                  <span>Ch. {ch.id}</span>
                </button>
              );
            })}
          </div>

          {/* Lesson Details & Load Code CTA */}
          <div className="flex-1 flex flex-col sm:flex-row items-start justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 w-full">
            <div className="space-y-1">
              <div className="font-bold text-white text-xs">{curChapter.objective}</div>
              <p className="text-slate-300 text-[12px] leading-relaxed max-w-2xl">
                {curChapter.explanation}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onLoadCode(curChapter.suggestedCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs whitespace-nowrap shadow-sm transition-all self-end sm:self-center"
            >
              <Code2 size={13} />
              <span>Load Lesson Code</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
