import React, { useState, useEffect } from 'react';

export default function BootScreen({ onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  const fullText = [
    "INITIALIZING — THE SAIYAN VICTORIA ARCHIVE",
    "Synching Time Displacement Logs...",
    "Loading Sister Profiles...",
    "Unsealing Classified Files...",
    "Detecting Power Signatures...",
    "Binary Energy Spike Detected — Containing...",
    "Verifying NexusBridge Connection...",
    "Connection Established."
  ].join('\n');

  useEffect(() => {
    let index = 0;
    // Use a ref to track index if we wanted to be strict-mode safe with intervals, 
    // but for a simple effect, just clearing on unmount is usually enough.
    // However, in StrictMode, this effect runs twice. 
    // The first one starts, then cleanup runs (clearing interval), then second starts.
    // So it should be fine.
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        // Calculate expected length based on index would be better, 
        // but appending is fine if we ensure we don't go over.
        if (prev.length < fullText.length) {
           return prev + fullText.charAt(prev.length);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (displayedText.length >= fullText.length) {
      const timer = setTimeout(() => setIsComplete(true), 500);
      return () => clearTimeout(timer);
    }
  }, [displayedText, fullText.length]);

  useEffect(() => {
    if (isComplete) {
      const handleKeyPress = () => onComplete();
      window.addEventListener('keydown', handleKeyPress);
      window.addEventListener('click', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('click', handleKeyPress);
      };
    }
  }, [isComplete, onComplete]);

  return (
    <div className="fixed inset-0 bg-black text-primary font-mono p-8 flex flex-col items-center justify-center z-50">
      <div className="max-w-2xl w-full">
        <pre className="whitespace-pre-wrap text-lg md:text-xl leading-relaxed text-primary/80 shadow-primary/50 drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">
          {displayedText}
          <span className="animate-pulse">_</span>
        </pre>
        
        {isComplete && (
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
