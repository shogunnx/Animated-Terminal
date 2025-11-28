import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function TerminalWindow({ title, children, className }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (cmd) {
        setHistory(prev => [...prev, `> ${cmd}`, `Processing command: ${cmd}...`, `ACCESS DENIED: Level 5 Clearance Required.`]);
        setInput('');
      }
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className={cn(
      "border border-primary/30 bg-black/40 backdrop-blur-md rounded-sm overflow-hidden flex flex-col shadow-[0_0_20px_rgba(var(--primary),0.1)]",
      className
    )}>
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/30 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
        <div className="text-xs font-mono text-primary/70 uppercase tracking-widest">{title || 'TERMINAL_VIEWER_V2'}</div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
        {children}
      </div>

      {/* Command Line (Optional footer) */}
      <div className="border-t border-primary/20 p-2 bg-black/60 font-mono text-sm flex items-center gap-2">
        <span className="text-primary animate-pulse">{'>'}</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          className="bg-transparent border-none outline-none text-primary/80 w-full placeholder:text-primary/30"
          placeholder="ENTER COMMAND..."
        />
      </div>
    </div>
  );
}
