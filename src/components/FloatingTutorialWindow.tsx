import React, { useState, useRef } from 'react';
import { Minus, X, CornerUpLeft, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';

export interface TutorialLesson {
  id: number;
  title: string;
  subtitle: string;
  paragraphs: string[];
  suggestedCode?: string;
  codeSnippetTitle?: string;
  requiredUnlock?: string;
}

export const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: 1,
    title: 'First Program',
    subtitle: 'Text editor',
    paragraphs: [
      'All programming is done in code windows. Each code window corresponds to a text file containing code. You can rename the file by clicking on its name at the top of the window.',
      'The code can be edited like in any text editor as long as it is not running. You can execute the program directly by pressing the green play button in the code window.',
      'You can create more code files using the "+" button in the upper right corner of the screen.',
      'You will notice that once you start typing, a simple code completion window will pop up. Press Tab to insert the code completion.',
      'Try clicking the green Play button now to execute harvest(). Harvesting your first grass will earn 1 Hay, unlocking the Tech Tree!',
    ],
    suggestedCode: 'harvest()\n',
    codeSnippetTitle: 'Single Harvest',
  },
  {
    id: 2,
    title: 'The Loop',
    subtitle: 'Infinite Automation',
    paragraphs: [
      'Notice that running harvest() once only reaps one crop. In programming, we use loops to repeat instructions forever.',
      'Once you unlock "while" in the Unlocks tree, you can write a loop. In Python, code inside a loop must be indented by 4 spaces.',
      'Press Tab inside the editor to automatically indent your code.',
    ],
    suggestedCode: 'while True:\n    harvest()\n',
    codeSnippetTitle: 'Continuous Harvest Loop',
    requiredUnlock: 'while',
  },
  {
    id: 3,
    title: 'Grid Navigation',
    subtitle: 'Movement & Expansion',
    paragraphs: [
      'After unlocking Expand in the Tech Tree, your farm grows beyond a single tile!',
      'To harvest crops across the land, you need to navigate the drone using move(Direction). Supported directions are North, East, South, and West.',
      'If the drone walks off the edge, it wraps seamlessly around to the opposite side of the field.',
    ],
    suggestedCode: 'while True:\n    harvest()\n    move(North)\n',
    codeSnippetTitle: 'Harvest & Step',
    requiredUnlock: 'expand',
  },
  {
    id: 4,
    title: 'Tilling & Planting',
    subtitle: 'Entities & Ground',
    paragraphs: [
      'Different crops yield different resources needed for higher tier tech. Wood comes from Bushes and Trees; Carrots from carrot seeds.',
      'To plant a seed, use plant(Entities.Bush) or plant(Entities.Carrot). If the ground is green grass turf, till() converts it to fertile soil.',
      'Wood is needed to upgrade drone Speed and expand your territory further.',
    ],
    suggestedCode: 'while True:\n    if can_harvest():\n        harvest()\n    plant(Entities.Bush)\n    move(North)\n',
    codeSnippetTitle: 'Planting Bushes',
    requiredUnlock: 'plant',
  },
  {
    id: 5,
    title: 'Full Farm Sweeper',
    subtitle: 'Nested Loops & Coordinates',
    paragraphs: [
      'get_world_size() returns the current width and height of the farm.',
      'By nesting two for-loops, your drone can systematically traverse every single coordinate in the entire grid without missing a tile.',
    ],
    suggestedCode: 'while True:\n    for x in range(get_world_size()):\n        for y in range(get_world_size()):\n            if can_harvest():\n                harvest()\n            move(North)\n        move(East)\n',
    codeSnippetTitle: '2D Grid Sweeper',
    requiredUnlock: 'operators',
  },
  {
    id: 6,
    title: 'Cycle Safety & Growth Times',
    subtitle: 'Premature Harvesting Penalty',
    paragraphs: [
      'Different crops have varying base growth distributions (Grass: 0.5s, Pumpkin: 0.2-3.8s, Bush: 3.2-4.8s, Carrots: 4.8-7.2s, Trees: 5.6-8.4s).',
      'Premature Harvesting Penalty: If your drone executes harvest() before growth completes, the crop is destroyed entirely with 0 yield!',
      'To safely manage cycles, always check if can_harvest(): before harvesting.',
    ],
    suggestedCode: 'while True:\n    if can_harvest():\n        harvest()\n    else:\n        do_a_flip()\n',
    codeSnippetTitle: 'Safe Cycle Check',
  },
  {
    id: 7,
    title: 'Tree Proximity Mechanics',
    subtitle: 'Checkerboard Optimization',
    paragraphs: [
      'Trees feature a unique layout mechanic: if a tree is planted directly adjacent (N, E, S, W) to another tree, its growth time doubles for every neighbor (up to 16x slower!).',
      'Optimization: Plant trees on a checkerboard pattern (where (x + y) % 2 == 0) or alternate with bushes to avoid triggering the growth penalty.',
    ],
    suggestedCode: 'while True:\n    for x in range(get_world_size()):\n        for y in range(get_world_size()):\n            if can_harvest():\n                harvest()\n            if (get_pos_x() + get_pos_y()) % 2 == 0:\n                plant(Entities.Tree)\n            else:\n                plant(Entities.Bush)\n            move(North)\n        move(East)\n',
    codeSnippetTitle: 'Checkerboard Tree Farm',
    requiredUnlock: 'trees',
  },
  {
    id: 8,
    title: 'Water Saturation',
    subtitle: 'Up to 5x Acceleration',
    paragraphs: [
      'Using use_item(Items.Water) or use_item(Items.Water_Tank) saturates the soil tile.',
      'Maintaining optimal watering accelerates crop cycles up to 5x faster! Water evaporates gradually as crops grow.',
    ],
    suggestedCode: 'while True:\n    use_item(Items.Water)\n    if can_harvest():\n        harvest()\n    plant(Entities.Carrot)\n    move(North)\n',
    codeSnippetTitle: 'Water-Boosted Farming',
    requiredUnlock: 'watering',
  },
  {
    id: 9,
    title: 'Polyculture & Fertilizer',
    subtitle: '5x Yield & Instant Growth',
    paragraphs: [
      'get_companion() returns a plant\'s random companion preference. Planting the companion within a 3-step diamond radius gives a 5x harvest yield boost!',
      'Items.Fertilizer bypasses the standard time distribution entirely, instantly subtracting 2 seconds or maturing fast crops immediately.',
    ],
    suggestedCode: 'while True:\n    comp = get_companion()\n    use_item(Items.Fertilizer)\n    if can_harvest():\n        harvest()\n    move(North)\n',
    codeSnippetTitle: 'Polyculture & Fertilizer',
    requiredUnlock: 'fertilizer',
  },
];

interface FloatingTutorialWindowProps {
  currentLessonId: number;
  unlockedLevels: Record<string, number>;
  onSelectLesson: (id: number) => void;
  onLoadCode: (code: string) => void;
  onClose: () => void;
  initialPos?: { x: number; y: number };
}

export const FloatingTutorialWindow: React.FC<FloatingTutorialWindowProps> = ({
  currentLessonId,
  unlockedLevels,
  onSelectLesson,
  onLoadCode,
  onClose,
  initialPos = { x: 32, y: 32 },
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isMinimized, setIsMinimized] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const lesson = TUTORIAL_LESSONS.find((l) => l.id === currentLessonId) || TUTORIAL_LESSONS[0];

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 320, moveEvent.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 80, moveEvent.clientY - dragStartRef.current.y)),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handlePrevLesson = () => {
    if (currentLessonId > 1) {
      onSelectLesson(currentLessonId - 1);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonId < TUTORIAL_LESSONS.length) {
      onSelectLesson(currentLessonId + 1);
    }
  };

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="absolute z-20 flex flex-col rounded-md shadow-2xl border border-[#202224] overflow-hidden select-none font-sans"
    >
      {/* Authentic Title Bar matching official screenshot 419d275c */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-10 bg-[#36383b] flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-[#232426]"
      >
        {/* Left: Green Back Button (↩) */}
        <button
          type="button"
          onClick={handlePrevLesson}
          disabled={currentLessonId <= 1}
          className={`w-7 h-7 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white transition-all cursor-pointer shadow-sm ${
            currentLessonId <= 1 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="Previous Lesson"
        >
          <CornerUpLeft size={14} strokeWidth={2.5} />
        </button>

        {/* Center: Lesson index indicator */}
        <div className="flex items-center gap-1.5 text-xs text-white/70 font-mono">
          <span>Lesson {currentLessonId}/{TUTORIAL_LESSONS.length}</span>
        </div>

        {/* Right: Green Minimize (-) and Close (✕) Buttons */}
        <div className="flex items-center gap-1">
          {currentLessonId < TUTORIAL_LESSONS.length && (
            <button
              type="button"
              onClick={handleNextLesson}
              className="w-6 h-6 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white cursor-pointer mr-1"
              title="Next Lesson"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus size={13} strokeWidth={2.8} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white cursor-pointer"
            title="Close Tutorial"
          >
            <X size={13} strokeWidth={2.8} />
          </button>
        </div>
      </div>

      {/* Tutorial Body matching official screenshot styling */}
      {!isMinimized && (
        <div className="bg-[#292b2e] text-gray-200 p-5 w-[420px] sm:w-[480px] max-w-[90vw] max-h-[75vh] overflow-y-auto">
          {/* Main Title */}
          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
            {lesson.title}
          </h2>

          {/* Subtitle */}
          <h3 className="text-sm font-semibold text-gray-300 mb-3.5">
            {lesson.subtitle}
          </h3>

          {/* Paragraphs */}
          <div className="space-y-3 text-[13px] text-gray-200 leading-relaxed">
            {lesson.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Code snippet action button */}
          {lesson.suggestedCode && (
            <div className="mt-4 pt-3 border-t border-[#3b3d42] flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">
                {lesson.codeSnippetTitle || 'Example Code'}
              </span>
              <button
                type="button"
                onClick={() => onLoadCode(lesson.suggestedCode!)}
                className="px-2.5 py-1 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] text-white text-xs font-semibold rounded-[3px] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Load Snippet</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
