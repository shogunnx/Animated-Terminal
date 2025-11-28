import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function BootScreen({ onComplete }) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0);
  
  const lines = [
    "INITIALIZING — THE SAIYAN VICTORIA ARCHIVE",
    "Synching Time Displacement Logs...",
    "Loading Sister Profiles...",
    "Unsealing Classified Files...",
    "Detecting Power Signatures...",
    "Binary Energy Spike Detected — Containing...",
    "Verifying NexusBridge Connection...",
    "Connection Established."
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let timeout;

    const typeWriter = () => {
      if (currentLine >= lines.length) {
        setPhase(1);
        return;
      }

      const line = lines[currentLine];
      
      if (currentChar < line.length) {
        setText(prev => {
          // If it's a new line, add a newline character
          if (currentChar === 0 && currentLine > 0) {
            return prev + '\n' + line[currentChar];
          }
          return prev + line[currentChar];
        });
        currentChar++;
        timeout = setTimeout(typeWriter, 30); // Typing speed
      } else {
        currentLine++;
        currentChar = 0;
        timeout = setTimeout(typeWriter, 400); // Pause between lines
      }
    };

    timeout = setTimeout(typeWriter, 500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      const handleKeyPress = () => onComplete();
      window.addEventListener('keydown', handleKeyPress);
      window.addEventListener('click', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('click', handleKeyPress);
      };
    }
  }, [phase, onComplete]);

  return (
    <div className="fixed inset-0 bg-black text-primary font-mono p-8 flex flex-col items-center justify-center z-50">
      <div className="max-w-2xl w-full">
        <pre className="whitespace-pre-wrap text-lg md:text-xl leading-relaxed text-primary/80 shadow-primary/50 drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">
          {text}
          <span className="animate-pulse">_</span>
        </pre>
        
        {phase === 1 && (
          <div className="mt-12 text-center animate-pulse">
            <p className="text-2xl font-bold glitch-text" data-text=">> PRESS ANY KEY TO ENTER">
              &gt;&gt; PRESS ANY KEY TO ENTER
            </p>
          </div>
        )}
      </div>
      
      {/* Scanlines */}
      <div className="scanlines"></div>
    </div>
  );
}
