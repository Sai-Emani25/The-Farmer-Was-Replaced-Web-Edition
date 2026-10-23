import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Minus, X, ChevronRight, CornerDownLeft } from 'lucide-react';
import { sound } from '../game/audio';

interface FloatingCodeWindowProps {
  fileName: string;
  code: string;
  activeLine?: number;
  error?: string | null;
  isRunning: boolean;
  onUpdateCode: (code: string) => void;
  onRenameFile?: (newName: string) => void;
  onToggleRun: () => void;
  onClose?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  speed: number;
  onChangeSpeed?: (speed: number) => void;
  initialPos?: { x: number; y: number };
}

// Built-in Python API keywords for autocomplete
const COMPLETIONS = [
  { label: 'harvest()', insert: 'harvest()', desc: 'Harvest current crop' },
  { label: 'can_harvest()', insert: 'can_harvest()', desc: 'True if plant ready' },
  { label: 'move(North)', insert: 'move(North)', desc: 'Move drone 1 tile North' },
  { label: 'move(East)', insert: 'move(East)', desc: 'Move drone 1 tile East' },
  { label: 'move(South)', insert: 'move(South)', desc: 'Move drone 1 tile South' },
  { label: 'move(West)', insert: 'move(West)', desc: 'Move drone 1 tile West' },
  { label: 'till()', insert: 'till()', desc: 'Till ground or reset to soil' },
  { label: 'plant(Entities.Grass)', insert: 'plant(Entities.Grass)', desc: 'Plant grass' },
  { label: 'plant(Entities.Bush)', insert: 'plant(Entities.Bush)', desc: 'Plant bush' },
  { label: 'plant(Entities.Carrot)', insert: 'plant(Entities.Carrot)', desc: 'Plant carrot' },
  { label: 'plant(Entities.Tree)', insert: 'plant(Entities.Tree)', desc: 'Plant tree' },
  { label: 'plant(Entities.Pumpkin)', insert: 'plant(Entities.Pumpkin)', desc: 'Plant pumpkin' },
  { label: 'swap(East)', insert: 'swap(East)', desc: 'Swap with adjacent tile' },
  { label: 'measure()', insert: 'measure()', desc: 'Measure petal/stalk count' },
  { label: 'get_world_size()', insert: 'get_world_size()', desc: 'Width of farm grid' },
  { label: 'get_pos_x()', insert: 'get_pos_x()', desc: 'Drone X coordinate' },
  { label: 'get_pos_y()', insert: 'get_pos_y()', desc: 'Drone Y coordinate' },
  { label: 'get_ground_type()', insert: 'get_ground_type()', desc: 'Grounds.Soil/Turf' },
  { label: 'get_entity_type()', insert: 'get_entity_type()', desc: 'Current plant entity' },
  { label: 'do_a_flip()', insert: 'do_a_flip()', desc: 'Perform a drone aerial flip' },
  { label: 'quick_print()', insert: 'quick_print()', desc: 'Print message' },
  { label: 'while True:', insert: 'while True:\n    ', desc: 'Continuous loop' },
  { label: 'for i in range():', insert: 'for i in range():\n    ', desc: 'Iterate count' },
];

export const FloatingCodeWindow: React.FC<FloatingCodeWindowProps> = ({
  fileName,
  code,
  activeLine,
  error,
  isRunning,
  onUpdateCode,
  onRenameFile,
  onToggleRun,
  onClose,
  initialPos = { x: 420, y: 160 },
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(fileName.replace(/\.py$/, ''));

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Autocomplete state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestion, setSuggestion] = useState<{ label: string; insert: string; desc: string } | null>(null);
  const [cursorWord, setCursorWord] = useState('');

  // Update name if prop changes
  useEffect(() => {
    setNameValue(fileName.replace(/\.py$/, ''));
  }, [fileName]);

  // Window drag handlers
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 300, moveEvent.clientX - dragStartRef.current.x)),
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

  // Autocomplete & key handler for text area
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;

      if (suggestion) {
        // Replace current typed prefix with completion
        const start = ta.selectionStart;
        const beforePrefix = code.slice(0, start - cursorWord.length);
        const afterPrefix = code.slice(start);
        const newCode = beforePrefix + suggestion.insert + afterPrefix;
        onUpdateCode(newCode);
        setSuggestion(null);

        // Put cursor right after inserted text
        setTimeout(() => {
          if (textareaRef.current) {
            const nextCursor = beforePrefix.length + suggestion.insert.length;
            textareaRef.current.selectionStart = nextCursor;
            textareaRef.current.selectionEnd = nextCursor;
          }
        }, 0);
        return;
      }

      // Default Tab: 4 spaces indent
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onUpdateCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    } else if (e.key === 'Escape') {
      setSuggestion(null);
    }
  };

  // Detect word under cursor for autocomplete popup
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onUpdateCode(val);

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);

    if (match && match[1].length >= 2) {
      const word = match[1];
      setCursorWord(word);
      const found = COMPLETIONS.find((c) =>
        c.label.toLowerCase().startsWith(word.toLowerCase()) && c.label !== word
      );
      setSuggestion(found || null);
    } else {
      setSuggestion(null);
      setCursorWord('');
    }
  };

  const handleApplySuggestion = (insert: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const beforePrefix = code.slice(0, start - cursorWord.length);
    const afterPrefix = code.slice(start);
    const newCode = beforePrefix + insert + afterPrefix;
    onUpdateCode(newCode);
    setSuggestion(null);
    ta.focus();
  };

  const lines = code.split('\n');

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="absolute z-20 flex flex-col rounded-md shadow-2xl border border-[#1e1f21] overflow-hidden select-none font-mono"
    >
      {/* Authentic Title Bar matching screenshot */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="h-10 bg-[#36383b] flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-[#232426]"
      >
        {/* Left: Play/Pause button + File Name */}
        <div className="flex items-center gap-2">
          {/* Green Square Play / Pause Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onToggleRun();
            }}
            className={`w-7 h-7 rounded-[3px] flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-[#c97a20] hover:bg-[#d8892d] text-white'
                : 'bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] text-white'
            }`}
            title={isRunning ? 'Pause Program' : 'Execute Program'}
          >
            {isRunning ? (
              <Pause size={14} className="fill-white" />
            ) : (
              <Play size={14} className="fill-white ml-0.5" />
            )}
          </button>

          {/* Outline triangle icon + File title */}
          <div className="flex items-center text-white text-sm font-bold tracking-tight">
            <span className="text-white/80 mr-1.5 text-xs">▷</span>
            {isRenaming ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={() => {
                  setIsRenaming(false);
                  if (onRenameFile && nameValue.trim()) {
                    onRenameFile(nameValue.trim() + '.py');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsRenaming(false);
                    if (onRenameFile && nameValue.trim()) {
                      onRenameFile(nameValue.trim() + '.py');
                    }
                  }
                }}
                autoFocus
                className="bg-[#242527] text-white px-1 py-0.5 rounded outline-none border border-[#628422] text-xs"
              />
            ) : (
              <span
                onClick={() => setIsRenaming(true)}
                className="hover:underline cursor-pointer"
                title="Click to rename"
              >
                {nameValue}
              </span>
            )}
          </div>
        </div>

        {/* Right: Green square Minimize and Close buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="w-6 h-6 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus size={13} strokeWidth={2.8} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClose) onClose();
            }}
            className="w-6 h-6 bg-[#628422] hover:bg-[#729a28] active:bg-[#53701c] rounded-[3px] flex items-center justify-center text-white cursor-pointer"
            title="Close Window"
          >
            <X size={13} strokeWidth={2.8} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {!isMinimized && (
        <div className="relative bg-[#25272a] text-gray-100 flex flex-col w-[380px] sm:w-[420px] max-w-[90vw]">
          <div className="relative min-h-[160px] max-h-[380px] flex overflow-hidden">
            {/* Minimal left gutter */}
            <div className="w-9 py-3 bg-[#202124] text-[#6b7280] text-xs select-none text-right pr-2 flex flex-col font-mono border-r border-[#1a1b1d]">
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`h-5 leading-5 text-[11px] ${
                    activeLine === i + 1 ? 'text-[#84cc16] font-bold' : ''
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea & Execution Highlight */}
            <div className="relative flex-1 p-2">
              {/* Active Line Glow Indicator */}
              {isRunning && activeLine && activeLine <= lines.length && (
                <div
                  style={{ top: `${(activeLine - 1) * 20 + 8}px` }}
                  className="absolute left-0 right-0 h-5 bg-[#628422]/20 border-l-2 border-[#84cc16] pointer-events-none transition-all"
                />
              )}

              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full h-full min-h-[150px] bg-transparent text-white font-mono text-[13px] leading-5 resize-none outline-none overflow-y-auto selection:bg-[#628422]/50 whitespace-pre"
                placeholder="# Enter Python commands..."
              />
            </div>
          </div>

          {/* Autocomplete Popup Popup (as seen in official game tutorial!) */}
          {suggestion && (
            <div className="absolute left-12 bottom-9 z-30 bg-[#1e2023] border border-[#628422] rounded shadow-xl p-1.5 flex items-center justify-between text-xs text-white max-w-[280px]">
              <div className="flex flex-col">
                <span className="font-bold text-[#a3e635]">{suggestion.label}</span>
                <span className="text-[10px] text-gray-400">{suggestion.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => handleApplySuggestion(suggestion.insert)}
                className="ml-3 px-2 py-0.5 bg-[#628422] hover:bg-[#729a28] text-white rounded text-[10px] flex items-center gap-1 cursor-pointer font-sans"
              >
                <span>Tab</span>
                <CornerDownLeft size={10} />
              </button>
            </div>
          )}

          {/* Error Banner if error occurs */}
          {error && (
            <div className="bg-[#591b1b] border-t border-[#802626] text-[#fca5a5] px-3 py-1.5 text-xs font-mono flex items-center justify-between">
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
