import { useEffect, useRef, forwardRef } from 'react';

const SimpleBowlingGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    ball: { x: 400, y: 500, vx: 0, vy: 0, thrown: false },
    pins: [],
    score: 0,
    power: 0,
    charging: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Set up pins
    const setupPins = () => {
      state.pins = [];
      for (let row = 0; row < 4; row++) {
        for (let i = 0; i <= row; i++) {
          state.pins.push({
            x: 400 - row * 15 + i * 30,
            y: 100 + row * 40,
            standing: true
          });
        }
      }
    };
    setupPins();

    const gameLoop = () => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 800, 600);

      // Lane
      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(300, 0, 200, 600);

      // Update ball
      if (state.ball.thrown) {
        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;

        // Check pin collisions
        state.pins.forEach(pin => {
          if (pin.standing) {
            const dist = Math.hypot(pin.x - state.ball.x, pin.y - state.ball.y);
            if (dist < 25) {
              pin.standing = false;
              state.score += 10;
              onScoreChange(state.score);
            }
          }
        });

        if (state.ball.y < 50) {
          state.ball = { x: 400, y: 500, vx: 0, vy: 0, thrown: false };
          if (state.pins.every(p => !p.standing)) {
            onCoachTrigger('STRIKE!');
            setupPins();
          }
        }
      }

      // Power charge
      if (state.charging) {
        state.power = Math.min(100, state.power + 2);
      }

      // Draw pins
      state.pins.forEach(pin => {
        if (pin.standing) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw ball
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw power meter
      if (!state.ball.thrown) {
        ctx.fillStyle = '#000';
        ctx.fillRect(20, 500, 100, 20);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(20, 500, state.power, 20);
      }

      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 40);
      ctx.fillText('Hold SPACE to charge, release to throw', 150, 560);

      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => {
      if (e.key === ' ' && !state.ball.thrown) {
        state.charging = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' && state.charging) {
        state.charging = false;
        state.ball.thrown = true;
        state.ball.vx = 0;
        state.ball.vy = -(state.power / 10) - 5;
        state.power = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ display: 'block', width: '100%', maxWidth: '100vw', height: 'auto' }} />;
});

export default SimpleBowlingGame;