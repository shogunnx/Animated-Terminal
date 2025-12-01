import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UNLOCK_THRESHOLDS = {
  likes: 10,
  timeSpent: 15 * 60 * 1000, // 15 minutes in milliseconds
  hotspotClicks: 50
};

export default function UnlockTracker({ onUnlock }) {
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [progress, setProgress] = useState({
    likes: 0,
    timeSpent: 0,
    hotspotClicks: 0
  });

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem('tsv_secret_unlocked') === 'true';
    if (unlocked) return;

    // Load progress from localStorage
    const loadProgress = () => {
      const likes = parseInt(localStorage.getItem('tsv_total_likes') || '0');
      const timeSpent = parseInt(localStorage.getItem('tsv_time_spent') || '0');
      const hotspotClicks = parseInt(localStorage.getItem('tsv_hotspot_clicks') || '0');
      
      setProgress({ likes, timeSpent, hotspotClicks });
      
      // Check if any threshold is met
      if (likes >= UNLOCK_THRESHOLDS.likes || 
          timeSpent >= UNLOCK_THRESHOLDS.timeSpent || 
          hotspotClicks >= UNLOCK_THRESHOLDS.hotspotClicks) {
        triggerUnlock();
      }
    };

    const triggerUnlock = () => {
      localStorage.setItem('tsv_secret_unlocked', 'true');
      setShowUnlockNotification(true);
      onUnlock();
      
      // Hide notification after 10 seconds
      setTimeout(() => {
        setShowUnlockNotification(false);
      }, 10000);
    };

    // Track time spent
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const currentTimeSpent = parseInt(localStorage.getItem('tsv_time_spent') || '0');
      const newTimeSpent = currentTimeSpent + 1000;
      localStorage.setItem('tsv_time_spent', newTimeSpent.toString());
      loadProgress();
    }, 1000);

    // Initial load
    loadProgress();

    // Listen for storage changes (likes, hotspot clicks from other components)
    window.addEventListener('storage', loadProgress);
    window.addEventListener('tsv_progress_update', loadProgress);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('storage', loadProgress);
      window.removeEventListener('tsv_progress_update', loadProgress);
    };
  }, [onUnlock]);

  return (
    <AnimatePresence>
      {showUnlockNotification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', duration: 0.6 }}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            maxWidth: '500px',
            width: '90%'
          }}
        >
          <div 
            className="tsv-glass tsv-glow tsv-scanlines"
            style={{
              padding: 24,
              background: 'rgba(10,10,18,0.98)',
              border: '2px solid #ff4444',
              borderRadius: 12,
              boxShadow: '0 8px 40px rgba(255,0,0,.6), 0 0 80px rgba(255,75,75,.4)',
              textAlign: 'center',
              animation: 'glitchPulse 0.5s ease-in-out 3'
            }}
          >
            <div style={{
              fontSize: 48,
              marginBottom: 16,
              animation: 'bounce 1s ease-in-out infinite'
            }}>
              🔓
            </div>
            
            <div className="tsv-title" style={{ 
              fontSize: 18, 
              color: '#ff4444',
              textShadow: '0 0 20px #ff4444, 0 0 40px #B000FF',
              marginBottom: 12
            }}>
              CLASSIFIED ACCESS GRANTED
            </div>
            
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>
              You've demonstrated exceptional dedication to the Time Patrol.
              <br />
              <span style={{ color: '#ff4444' }}>Subject EVIL_VICTORIA</span> has been unlocked.
            </div>
            
            <div style={{
              padding: 12,
              background: 'rgba(255,0,0,.1)',
              border: '1px solid rgba(255,0,0,.3)',
              borderRadius: 8,
              fontSize: 11,
              opacity: 0.8
            }}>
              ⚠️ WARNING: This subject is classified as EXTREMELY DANGEROUS.
              <br />
              Proceed with maximum caution.
            </div>
          </div>

          <style>{`
            @keyframes glitchPulse {
              0%, 100% { filter: none; }
              25% { filter: hue-rotate(90deg); }
              50% { filter: invert(1); }
              75% { filter: hue-rotate(-90deg); }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
