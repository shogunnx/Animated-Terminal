import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const SimplePinballGame = forwardRef(({ onScoreChange }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    ball: { x: 750, y: 500, vx: 0, vy: 0 },
    score: 0,
    flippers: { left: 0, right: 0 },
    bumpers: [
      { x: 200, y: 200, hit: false },
      { x: 400, y: 150, hit: false },
      { x: 600, y: 200, hit: false }
    ],
    keys: {}
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'left') stateRef.current.keys.ArrowLeft = pressed;
      if (action === 'right') stateRef.current.keys.ArrowRight = pressed;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const gameLoop = () => {
      ctx.fillStyle = '#1a1a3e';
      ctx.fillRect(0, 0, 800, 600);

      // Gravity and physics
      state.ball.vy += 0.3;
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;
      state.ball.vx *= 0.99;
      state.ball.vy *= 0.99;

      // Wall bounce
      if (state.ball.x < 30 || state.ball.x > 770) state.ball.vx *= -1;
      if (state.ball.y < 30) state.ball.vy *= -1;

      // Lose condition
      if (state.ball.y > 580) {
        state.ball = { x: 750, y: 500, vx: -5, vy: -5 };
      }

      // Flippers
      if (state.keys.ArrowLeft) state.flippers.left = Math.min(0.5, state.flippers.left + 0.1);
      else state.flippers.left = Math.max(0, state.flippers.left - 0.1);
      
      if (state.keys.ArrowRight) state.flippers.right = Math.min(0.5, state.flippers.right + 0.1);
      else state.flippers.right = Math.max(0, state.flippers.right - 0.1);

      // Flipper collision
      if (state.ball.y > 520 && state.ball.y < 550) {
        if ((state.ball.x < 350 && state.flippers.left > 0.3) || 
            (state.ball.x > 450 && state.flippers.right > 0.3)) {
          state.ball.vy = -15;
          state.ball.vx += (Math.random() - 0.5) * 5;
        }
      }

      // Bumpers
      state.bumpers.forEach(bumper => {
        const dist = Math.hypot(state.ball.x - bumper.x, state.ball.y - bumper.y);
        if (dist < 40) {
          const angle = Math.atan2(state.ball.y - bumper.y, state.ball.x - bumper.x);
          state.ball.vx = Math.cos(angle) * 8;
          state.ball.vy = Math.sin(angle) * 8;
          state.score += 50;
          onScoreChange(state.score);
          bumper.hit = true;
          setTimeout(() => { bumper.hit = false; }, 200);
        }

        ctx.fillStyle = bumper.hit ? '#ff0' : '#f44';
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, 30, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw flippers
      ctx.fillStyle = '#0ff';
      ctx.save();
      ctx.translate(300, 540);
      ctx.rotate(-state.flippers.left);
      ctx.fillRect(-10, -10, 100, 20);
      ctx.restore();

      ctx.save();
      ctx.translate(500, 540);
      ctx.rotate(state.flippers.right);
      ctx.fillRect(-90, -10, 100, 20);
      ctx.restore();

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 30);
      ctx.fillText('Use Arrow Keys for Flippers', 20, 590);

      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => { state.keys[e.key] = true; };
    const handleKeyUp = (e) => { state.keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    state.ball.vx = -5;
    state.ball.vy = -5;
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onScoreChange]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto' }} />;
});

export default SimplePinballGame;