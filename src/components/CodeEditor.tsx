import React, { useRef } from 'react';
import { ScriptFile } from '../game/defaultScripts';
import {
  Terminal,
  Plus,
  X,
  Trash2,
  FileCode,
  Play,
  Pause,
  StepForward,
  RotateCcw,
} from 'lucide-react';

interface CodeEditorProps {
  files: ScriptFile[];
  activeFileIndex: number;
  onSelectFile: (index: number) => void;
  onUpdateCode: (index: number, newCode: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (index: number) => void;
  activeLine: number | null;
  error: { message: string; line: number } | null;
  logs: string[];
  onClearLogs: () => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFileIndex,
  onSelectFile,
  onUpdateCode,
  onAddFile,
  onDeleteFile,
  activeLine,
  error,
  logs,
  onClearLogs,
  isRunning,
  onToggleRun,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeFile = files[activeFileIndex] || files[0];
  const [showConsole, setShowConsole] = React.useState(true);
  const [newFileName, setNewFileName] = React.useState('');
  const [isAddingFile, setIsAddingFile] = React.useState(false);

  const lines = (activeFile?.code || '').split('\n');

  // Handle Tab and Auto-indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;

      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onUpdateCode(activeFileIndex, newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    } else if (e.key === 'Enter') {
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const value = ta.value;

      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const curLine = value.substring(lineStart, start);
      const matchIndent = curLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : '';

      if (curLine.trim().endsWith(':')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const end = ta.selectionEnd;
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(end);
        onUpdateCode(activeFileIndex, newValue);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
          }
        }, 0);
      }
    }
  };

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.endsWith('.py')) name += '.py';
    onAddFile(name);
    setNewFileName('');
    setIsAddingFile(false);
  };

  /**
   * Authentic Python token coloring
   */
  const renderHighlightedLine = (lineText: string) => {
    if (!lineText) return ' ';

    // Split out comments
    const commentIdx = lineText.indexOf('#');
    let codePart = commentIdx !== -1 ? lineText.slice(0, commentIdx) : lineText;
    const commentPart = commentIdx !== -1 ? lineText.slice(commentIdx) : '';

    // Token regex for Python keywords, builtins, strings, numbers
    const tokenRegex =
      /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|while|for|in|if|elif|else|return|break|continue|pass|True|False|None|and|or|not)\b|\b(?:move|swap|harvest|plant|till|use_item|trade|can_harvest|get_pos_x|get_pos_y|get_world_size|get_ground_type|get_entity_type|get_water|measure|get_companion|get_time|random|num_drones|unlock|num_unlocked|get_cost|do_a_flip|print|quick_print|clear|range|len|min|max|abs|str|int|float|bool)\b|\b(?:North|East|South|West|Entities|Grounds|Items|Unlocks)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*|[^\s\w]+|\s+)/g;

    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = tokenRegex.exec(codePart)) !== null) {
      const word = match[0];
      const key = `${idx}-${word}`;
      idx++;

      if (/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')$/.test(word)) {
        tokens.push(<span key={key} className="text-[#98c379]">{word}</span>);
      } else if (
        /^(def|while|for|in|if|elif|else|return|break|continue|pass|True|False|None|and|or|not)$/.test(word)
      ) {
        tokens.push(<span key={key} className="text-[#ff79c6] font-semibold">{word}</span>);
      } else if (
        /^(move|swap|harvest|plant|till|use_item|trade|can_harvest|get_pos_x|get_pos_y|get_world_size|get_ground_type|get_entity_type|get_water|measure|get_companion|get_time|random|num_drones|unlock|num_unlocked|get_cost|do_a_flip|print|quick_print|clear|range|len|min|max|abs|str|int|float|bool)$/.test(word)
      ) {
        tokens.push(<span key={key} className="text-[#00e5ff]">{word}</span>);
      } else if (/^(North|East|South|West|Entities|Grounds|Items|Unlocks)$/.test(word)) {
        tokens.push(<span key={key} className="text-[#c678dd] font-semibold">{word}</span>);
      } else if (/^\d+(\.\d+)?$/.test(word)) {
        tokens.push(<span key={key} className="text-[#d19a66]">{word}</span>);
      } else {
        tokens.push(<span key={key} className="text-slate-200">{word}</span>);
      }
    }

    if (commentPart) {
      tokens.push(
        <span key="comment" className="text-[#5c6370] italic">
          {commentPart}
        </span>
      );
    }

    return tokens;
  };

  return (
    <div className="flex flex-col h-full bg-[#181a1f] text-slate-200 border-r border-slate-800 select-none">
      {/* File Tabs Header */}
      <div className="flex items-center bg-[#131518] px-2 pt-2 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none">
        {files.map((file, idx) => (
          <div
            key={file.name + idx}
            onClick={() => onSelectFile(idx)}
            className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t cursor-pointer border-t-2 transition-colors ${
              activeFileIndex === idx
                ? 'bg-[#181a1f] text-emerald-400 border-emerald-500 font-semibold'
                : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <FileCode size={13} className={activeFileIndex === idx ? 'text-emerald-400' : 'text-slate-500'} />
            <span>{file.name}</span>
            {files.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(idx);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {isAddingFile ? (
          <form onSubmit={handleAddFileSubmit} className="flex items-center gap-1 px-1">
            <input
              type="text"
              autoFocus
              placeholder="filename.py"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsAddingFile(false)}
              className="bg-slate-900 border border-emerald-500/50 rounded px-2 py-0.5 text-xs font-mono text-emerald-300 outline-none w-28"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingFile(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded transition-colors"
            title="Create new Python script"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* Action Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1c1f24] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRun}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium shadow-sm transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isRunning ? 'Pause' : 'Run Script'}</span>
          </button>

          <button
            type="button"
            onClick={onStep}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded font-medium transition-colors"
            title="Execute one tick step"
          >
            <StepForward size={14} />
            <span>Step</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            title="Reset code pointer and stop"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Speed:</span>
          {[1, 2, 5, 10, 25, 50].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                speed === s
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Editor Body: Line Numbers + Highlighting Overlay + Input Area */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] leading-[22px]">
        {/* Line Numbers Column */}
        <div className="w-12 bg-[#131518] text-slate-600 py-3 select-none flex flex-col items-end pr-3 border-r border-slate-800/80 z-10">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isCur = activeLine === lineNum;
            const isErr = error && error.line === lineNum;
            return (
              <div
                key={lineNum}
                className={`relative flex items-center justify-end w-full h-[22px] ${
                  isErr
                    ? 'text-red-400 font-bold'
                    : isCur
                    ? 'text-emerald-400 font-bold'
                    : ''
                }`}
              >
                {isCur && (
                  <span className="absolute -left-1 text-emerald-400 text-[10px]">▶</span>
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Active Line Execution Glowing Bar */}
        {activeLine && activeLine <= lines.length && (
          <div
            className="absolute left-12 right-0 pointer-events-none bg-emerald-500/15 border-l-2 border-emerald-400 z-0 transition-all duration-75"
            style={{
              top: `${(activeLine - 1) * 22 + 12}px`,
              height: '22px',
            }}
          />
        )}

        {/* Error Line Highlight Bar */}
        {error && error.line && error.line <= lines.length && (
          <div
            className="absolute left-12 right-0 pointer-events-none bg-red-500/20 border-l-2 border-red-500 z-0 transition-all duration-75"
            style={{
              top: `${(error.line - 1) * 22 + 12}px`,
              height: '22px',
            }}
          />
        )}

        {/* Highlighting Viewport Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Highlighted Render (Backdrop) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 p-3 pointer-events-none whitespace-pre font-mono leading-[22px] overflow-hidden select-none"
          >
            {lines.map((lineText, idx) => (
              <div key={idx} className="h-[22px] whitespace-pre">
                {renderHighlightedLine(lineText)}
              </div>
            ))}
          </div>

          {/* Interactive Text Area (Transparent Frontdrop) */}
          <textarea
            ref={textareaRef}
            value={activeFile?.code || ''}
            onChange={(e) => onUpdateCode(activeFileIndex, e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 p-3 bg-transparent text-transparent caret-emerald-400 outline-none resize-none overflow-y-auto whitespace-pre font-mono leading-[22px] selection:bg-emerald-500/30 z-10"
            placeholder="# Write Python-like code to control your drone..."
          />
        </div>
      </div>

      {/* Error Alert Bar */}
      {error && (
        <div className="bg-red-950/80 border-t border-red-500/40 px-3 py-2 text-xs text-red-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
              Line {error.line}
            </span>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* Drone Terminal Drawer */}
      <div className="border-t border-slate-800 bg-[#131518] z-20">
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center gap-1.5 hover:text-slate-200"
          >
            <Terminal size={13} className="text-emerald-400" />
            <span className="font-semibold">Drone Terminal ({logs.length})</span>
          </button>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={onClearLogs}
                className="flex items-center gap-1 hover:text-slate-200 text-[11px]"
              >
                <Trash2 size={11} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {showConsole && (
          <div className="h-28 overflow-y-auto p-2.5 font-mono text-[12px] text-emerald-400/90 space-y-1 bg-[#101214]">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">No output yet. Call print(...) in your script to see logs.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-slate-500 mr-2">&gt;</span>
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
