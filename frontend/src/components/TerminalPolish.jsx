import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Terminal Polish Component
 * Adds cursor sounds, glitch effects, and terminal warnings
 */
export default function TerminalPolish() {
  const [glitchActive, setGlitchActive] = useState(false);
  const [warning, setWarning] = useState(null);
  const [generateCount, setGenerateCount] = useState(0);
  const location = useLocation();

  // Cursor tick sound effect (using Web Audio API)
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let lastKeyTime = 0;
    
    const playTick = () => {
      const now = Date.now();
      // Throttle to avoid too many sounds
      if (now - lastKeyTime < 50) return;
      lastKeyTime = now;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.02);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.02);
    };

    // Listen for keypresses
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        playTick();
      }
    };

    document.addEventListener('keypress', handleKey);

    return () => {
      document.removeEventListener('keypress', handleKey);
    };
  }, []);

  // Glitch effect on Evil Victoria or Binary pages
  useEffect(() => {
    const shouldGlitch = location.pathname.includes('evil_victoria') || 
                        location.pathname.includes('binary');
    
    if (shouldGlitch) {
      const glitchInterval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 200);
      }, 5000 + Math.random() * 10000); // Random interval between 5-15s

      return () => clearInterval(glitchInterval);
    }
  }, [location]);

  // Track generation count for warnings
  useEffect(() => {
    const handleGeneration = () => {
      setGenerateCount(prev => {
        const newCount = prev + 1;
        
        if (newCount === 5) {
          setWarning({
            text: "WARNING: Elevated heart rate detected in multiple subjects. Recommend cooldown period.",
            type: "warning"
          });
          setTimeout(() => setWarning(null), 8000);
        } else if (newCount === 10) {
          setWarning({
            text: "CRITICAL: System thermal levels approaching maximum. Mandatory break required.",
            type: "critical"
          });
          setTimeout(() => setWarning(null), 10000);
        }
        
        return newCount;
      });
    };

    window.addEventListener('tsv_outfit_generated', handleGeneration);

    return () => {
      window.removeEventListener('tsv_outfit_generated', handleGeneration);
    };
  }, []);

  return (
    <>
      {/* Glitch Overlay */}
      {glitchActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
          background: `
            repeating-linear-gradient(
              0deg,
              rgba(255,0,0,0.1) 0px,
              transparent 2px,
              transparent 4px
            )
          `,
          animation: 'glitchFlash 0.2s steps(4)',
          mixBlendMode: 'difference'
        }} />
      )}

      {/* Terminal Warning */}
      {warning && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          maxWidth: '600px',
          width: '90%',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div 
            className="tsv-glass tsv-scanlines"
            style={{
              padding: 16,
              background: warning.type === 'critical' 
                ? 'rgba(255,0,0,0.15)' 
                : 'rgba(255,165,0,0.15)',
              border: `2px solid ${
                warning.type === 'critical' ? '#ff0000' : '#ffa500'
              }`,
              borderRadius: 8,
              boxShadow: `0 4px 20px ${warning.type === 'critical' ? 'rgba(255,0,0,0.3)' : 'rgba(255,165,0,0.3)'}`,
              animation: 'pulse 1s ease-in-out infinite'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                fontSize: 24,
                animation: 'bounce 0.5s ease-in-out infinite'
              }}>
                {warning.type === 'critical' ? '🚨' : '⚠️'}
              </div>
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: warning.type === 'critical' ? '#ff4444' : '#ffa500',
                  marginBottom: 4,
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '.1em'
                }}>
                  {warning.type === 'critical' ? 'SYSTEM CRITICAL' : 'SYSTEM WARNING'}
                </div>
                <div style={{
                  fontSize: 12,
                  opacity: 0.9,
                  fontFamily: 'ui-monospace, monospace',
                  lineHeight: 1.4
                }}>
                  {warning.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes glitchFlash {
          0% { opacity: 0; transform: translate(0, 0); }
          25% { opacity: 1; transform: translate(-5px, 5px); }
          50% { opacity: 0.5; transform: translate(5px, -5px); }
          75% { opacity: 1; transform: translate(-5px, -5px); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
