import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IDLE_MESSAGES = {
  victoria_black: [
    "Subject VICTORIA_BLACK appears to be waiting for new orders…",
    "VICTORIA_BLACK energy signature: stable. Goddess protocols active.",
    "System note: VICTORIA_BLACK has adjusted her outfit 3 times in the last hour."
  ],
  binary: [
    "Subject BINARY is running seduction subroutines in background…",
    "BINARY core temperature: elevated. Glitch probability: 12%.",
    "Warning: BINARY has initiated flirt.exe without authorization."
  ],
  wargirl: [
    "Subject WARGIRL power level: MAXIMUM. SSJ3 mode detected.",
    "WARGIRL is practicing combo moves. Destruction probability: HIGH.",
    "Alert: WARGIRL hair glow intensity increased by 40%."
  ],
  vanessa: [
    "Subject VANESSA detected applying lipstick. Flirt mode: ACTIVE.",
    "VANESSA charm statistics off the charts. Proceed with caution.",
    "System: VANESSA has winked at the camera 7 times this session."
  ],
  harmony: [
    "Subject HARMONY is humming softly. Audio feed available on request.",
    "HARMONY data analysis complete. Efficiency: 99.7%.",
    "Tech note: HARMONY has optimized 47 systems while idle."
  ],
  evil_victoria: [
    "⚠️ CLASSIFIED: EVIL_VICTORIA dark energy levels rising…",
    "Warning: EVIL_VICTORIA shadow tendrils detected in sector 7.",
    "Alert: EVIL_VICTORIA is plotting something. Recommendation: DO NOT DISTURB."
  ],
  veronica: [
    "Subject VERONICA is working on new engineering schematics.",
    "VERONICA friendly status: 100%. Smile detected.",
    "System: VERONICA has prepared coffee. Would you like some?"
  ]
};

export default function IdleTerminalMessages({ characters }) {
  const [message, setMessage] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [idleTimer, setIdleTimer] = useState(null);

  useEffect(() => {
    let timer;

    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      
      timer = setTimeout(() => {
        setIsIdle(true);
        showRandomMessage();
      }, 45000); // 45 seconds
      
      setIdleTimer(timer);
    };

    const showRandomMessage = () => {
      if (characters && characters.length > 0) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        const charMessages = IDLE_MESSAGES[randomChar.id] || [];
        const randomMsg = charMessages[Math.floor(Math.random() * charMessages.length)];
        
        if (randomMsg) {
          setMessage({
            text: randomMsg,
            color: randomChar.accent || "#76FFE1"
          });

          // Hide message after 8 seconds
          setTimeout(() => {
            setMessage(null);
          }, 8000);
        }
      }
    };

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdle);
    });

    // Initial timer
    resetIdle();

    return () => {
      clearTimeout(timer);
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdle);
      });
    };
  }, [characters]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '600px',
            width: '90%'
          }}
        >
          <div 
            className="tsv-glass tsv-scanlines"
            style={{
              padding: '12px 16px',
              background: 'rgba(10,10,18,0.95)',
              border: `1px solid ${message.color}40`,
              borderRadius: 8,
              boxShadow: `0 4px 20px ${message.color}30, 0 0 40px ${message.color}20`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: message.color,
                boxShadow: `0 0 10px ${message.color}`,
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <div style={{
                fontSize: 12,
                color: '#e0e0ff',
                fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.5
              }}>
                <span style={{ color: message.color, opacity: 0.8 }}>SYSTEM:</span> {message.text}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
