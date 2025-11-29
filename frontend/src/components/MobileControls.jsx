import { useEffect, useState } from "react";

export default function MobileControls({ gameId, onControl }) {
  const [activeButton, setActiveButton] = useState(null);

  const handlePress = (action) => {
    setActiveButton(action);
    onControl(action, true);
  };

  const handleRelease = (action) => {
    setActiveButton(null);
    onControl(action, false);
  };

  // Prevent touch scrolling on control buttons
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.target.closest('.mobile-control-btn')) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  const ControlButton = ({ action, label, style = {} }) => (
    <button
      className="mobile-control-btn"
      onTouchStart={() => handlePress(action)}
      onTouchEnd={() => handleRelease(action)}
      onMouseDown={() => handlePress(action)}
      onMouseUp={() => handleRelease(action)}
      onMouseLeave={() => handleRelease(action)}
      style={{
        padding: '16px 24px',
        fontSize: '18px',
        fontWeight: 'bold',
        background: activeButton === action ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 136, 0.2)',
        border: '2px solid #00ff88',
        borderRadius: '8px',
        color: '#00ff88',
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        transition: 'all 0.1s ease',
        fontFamily: 'monospace',
        textShadow: '0 0 10px #00ff88',
        boxShadow: activeButton === action ? '0 0 20px rgba(0, 255, 136, 0.6)' : '0 0 10px rgba(0, 255, 136, 0.3)',
        ...style
      }}
    >
      {label}
    </button>
  );

  // Tetris controls
  if (gameId === 'tetris') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ControlButton action="rotate" label="↻ ROTATE" />
          <ControlButton action="hardDrop" label="⬇ DROP" />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ControlButton action="left" label="◄" />
          <ControlButton action="down" label="▼" />
          <ControlButton action="right" label="►" />
        </div>
      </div>
    );
  }

  // Snake controls
  if (gameId === 'snake') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <ControlButton action="up" label="▲" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <ControlButton action="left" label="◄" />
          <ControlButton action="down" label="▼" />
          <ControlButton action="right" label="►" />
        </div>
      </div>
    );
  }

  // Breakout controls
  if (gameId === 'breakout') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <ControlButton action="left" label="◄ LEFT" style={{ flex: 1, maxWidth: '150px' }} />
        <ControlButton action="right" label="RIGHT ►" style={{ flex: 1, maxWidth: '150px' }} />
      </div>
    );
  }

  // Runner controls
  if (gameId === 'runner') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <ControlButton action="jump" label="JUMP" style={{ minWidth: '200px', padding: '20px 40px', fontSize: '20px' }} />
      </div>
    );
  }

  // MicroGames controls (just space for mash game)
  if (gameId === 'microgames') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <ControlButton action="action" label="ACTION" style={{ minWidth: '200px', padding: '20px 40px', fontSize: '20px' }} />
      </div>
    );
  }

  // Rhythm controls
  if (gameId === 'rhythm') {
    return (
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <ControlButton action="lane0" label="D" style={{ flex: 1, maxWidth: '80px', background: activeButton === 'lane0' ? 'rgba(255, 0, 136, 0.4)' : 'rgba(255, 0, 136, 0.2)', borderColor: '#ff0088', color: '#ff0088', textShadow: '0 0 10px #ff0088' }} />
        <ControlButton action="lane1" label="F" style={{ flex: 1, maxWidth: '80px', background: activeButton === 'lane1' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 255, 136, 0.2)', borderColor: '#00ff88', color: '#00ff88' }} />
        <ControlButton action="lane2" label="J" style={{ flex: 1, maxWidth: '80px', background: activeButton === 'lane2' ? 'rgba(255, 0, 255, 0.4)' : 'rgba(255, 0, 255, 0.2)', borderColor: '#ff00ff', color: '#ff00ff', textShadow: '0 0 10px #ff00ff' }} />
        <ControlButton action="lane3" label="K" style={{ flex: 1, maxWidth: '80px', background: activeButton === 'lane3' ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 255, 255, 0.2)', borderColor: '#00ffff', color: '#00ffff', textShadow: '0 0 10px #00ffff' }} />
      </div>
    );
  }

  return null;
}
