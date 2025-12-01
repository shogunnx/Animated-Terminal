import { useEffect, useRef, forwardRef } from 'react';

const BubbleShooterGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    bubbles: [],
    shooter: { x: 400, y: 550, angle: -Math.PI / 2 },
    currentBubble: null,
    score: 0,
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize bubbles
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        state.bubbles.push({
          x: 50 + col * 60 + (row % 2) * 30,
          y: 50 + row * 52,
          color: state.colors[Math.floor(Math.random() * 5)],
          popped: false
        });
      }
    }
    state.currentBubble = { x: 400, y: 550, vx: 0, vy: 0, color: state.colors[Math.floor(Math.random() * 5)] };

    const gameLoop = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 600);

      // Update current bubble
      if (state.currentBubble && state.currentBubble.vy !== 0) {
        state.currentBubble.x += state.currentBubble.vx;
        state.currentBubble.y += state.currentBubble.vy;

        // Wall bounce
        if (state.currentBubble.x <= 25 || state.currentBubble.x >= 775) {
          state.currentBubble.vx *= -1;
        }

        // Check collision with bubbles
        state.bubbles.forEach(bubble => {
          if (!bubble.popped) {
            const dist = Math.hypot(bubble.x - state.currentBubble.x, bubble.y - state.currentBubble.y);
            if (dist < 50) {
              if (bubble.color === state.currentBubble.color) {
                bubble.popped = true;
                state.score += 10;
                onScoreChange(state.score);
              }
              state.currentBubble = { x: 400, y: 550, vx: 0, vy: 0, color: state.colors[Math.floor(Math.random() * 5)] };
            }
          }
        });

        if (state.currentBubble.y <= 25) {
          state.currentBubble = { x: 400, y: 550, vx: 0, vy: 0, color: state.colors[Math.floor(Math.random() * 5)] };
        }
      }

      // Draw bubbles
      state.bubbles.forEach(bubble => {
        if (!bubble.popped) {
          ctx.fillStyle = bubble.color;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, 25, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw shooter
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(state.shooter.x, state.shooter.y);
      ctx.lineTo(
        state.shooter.x + Math.cos(state.shooter.angle) * 60,
        state.shooter.y + Math.sin(state.shooter.angle) * 60
      );
      ctx.stroke();

      // Draw current bubble
      if (state.currentBubble) {
        ctx.fillStyle = state.currentBubble.color;
        ctx.beginPath();
        ctx.arc(state.currentBubble.x, state.currentBubble.y, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 30);

      requestAnimationFrame(gameLoop);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      state.shooter.angle = Math.atan2(y - state.shooter.y, x - state.shooter.x);
    };

    const handleClick = () => {
      if (state.currentBubble && state.currentBubble.vy === 0) {
        state.currentBubble.vx = Math.cos(state.shooter.angle) * 8;
        state.currentBubble.vy = Math.sin(state.shooter.angle) * 8;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ display: 'block', width: '100%', maxWidth: '100vw', height: 'auto', background: '#1a1a2e' }} />;
});

export default BubbleShooterGame;