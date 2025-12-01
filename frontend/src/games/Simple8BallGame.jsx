import { useEffect, useRef, forwardRef } from 'react';

const Simple8BallGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    cueBall: { x: 200, y: 300, vx: 0, vy: 0 },
    balls: [],
    aiming: false,
    aimAngle: 0,
    power: 0,
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize balls in triangle
    const colors = ['#ff0', '#00f', '#f00', '#800080', '#ffa500', '#008000', '#800000', '#000'];
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i <= row; i++) {
        if (ballIndex < 8) {
          state.balls.push({
            x: 550 + row * 25,
            y: 300 - row * 12 + i * 24,
            vx: 0,
            vy: 0,
            color: colors[ballIndex],
            pocketed: false
          });
          ballIndex++;
        }
      }
    }

    const gameLoop = () => {
      ctx.fillStyle = '#0a5a0a';
      ctx.fillRect(0, 0, 800, 600);

      // Table
      ctx.fillStyle = '#228B22';
      ctx.fillRect(50, 50, 700, 500);

      // Pockets
      const pockets = [[60, 60], [400, 60], [740, 60], [60, 540], [400, 540], [740, 540]];
      ctx.fillStyle = '#000';
      pockets.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update balls
      [state.cueBall, ...state.balls].forEach(ball => {
        if (!ball.pocketed) {
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.vx *= 0.98;
          ball.vy *= 0.98;

          // Wall bounce
          if (ball.x < 70 || ball.x > 730) ball.vx *= -0.8;
          if (ball.y < 70 || ball.y > 530) ball.vy *= -0.8;

          // Check pockets
          pockets.forEach(([px, py]) => {
            const dist = Math.hypot(ball.x - px, ball.y - py);
            if (dist < 20 && ball !== state.cueBall) {
              ball.pocketed = true;
              state.score += 10;
              onScoreChange(state.score);
              onCoachTrigger('Nice shot!');
            }
          });
        }
      });

      // Draw balls
      state.balls.forEach(ball => {
        if (!ball.pocketed) {
          ctx.fillStyle = ball.color;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }
      });

      // Draw cue ball
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(state.cueBall.x, state.cueBall.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw aim line
      if (state.aiming && Math.abs(state.cueBall.vx) < 0.1) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(state.cueBall.x, state.cueBall.y);
        ctx.lineTo(
          state.cueBall.x + Math.cos(state.aimAngle) * (50 + state.power),
          state.cueBall.y + Math.sin(state.aimAngle) * (50 + state.power)
        );
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 30);
      ctx.fillText('Click and drag to aim & shoot', 250, 30);

      requestAnimationFrame(gameLoop);
    };

    let dragStart = null;

    const handleMouseDown = (e) => {
      if (Math.abs(state.cueBall.vx) < 0.1 && Math.abs(state.cueBall.vy) < 0.1) {
        state.aiming = true;
        dragStart = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e) => {
      if (state.aiming && dragStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        state.aimAngle = Math.atan2(y - state.cueBall.y, x - state.cueBall.x);
        state.power = Math.min(100, Math.hypot(x - state.cueBall.x, y - state.cueBall.y) / 2);
      }
    };

    const handleMouseUp = () => {
      if (state.aiming) {
        state.cueBall.vx = Math.cos(state.aimAngle) * state.power * 0.2;
        state.cueBall.vy = Math.sin(state.aimAngle) * state.power * 0.2;
        state.aiming = false;
        state.power = 0;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    gameLoop();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: 'auto' }} />;
});

export default Simple8BallGame;