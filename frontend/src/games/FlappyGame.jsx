import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const FlappyGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    birdY: 300,
    birdVel: 0,
    pipes: [{ x: 800, gap: 200, gapY: 200 }],
    score: 0,
    gameOver: false
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if ((action === 'up' || action === 'fire') && pressed && !stateRef.current.gameOver) {
        stateRef.current.birdVel = -8;
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const gameLoop = () => {
      if (state.gameOver) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '48px monospace';
        ctx.fillText('GAME OVER', 250, 300);
        ctx.font = '24px monospace';
        ctx.fillText('Press SPACE to restart', 220, 350);
        return;
      }

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, 800, 600);

      // Update bird
      state.birdVel += 0.5;
      state.birdY += state.birdVel;

      if (state.birdY <= 0 || state.birdY >= 580) state.gameOver = true;

      // Update pipes
      state.pipes.forEach(pipe => {
        pipe.x -= 3;
        if (pipe.x < -60 && pipe.x > -65) {
          state.score++;
          onScoreChange(state.score * 10);
          if (state.score % 5 === 0) onCoachTrigger('Keep going!');
        }
      });

      // Add new pipes
      if (state.pipes[state.pipes.length - 1].x < 500) {
        state.pipes.push({ 
          x: 800, 
          gap: 180, 
          gapY: Math.random() * 200 + 100 
        });
      }

      // Remove off-screen pipes
      state.pipes = state.pipes.filter(p => p.x > -100);

      // Collision
      state.pipes.forEach(pipe => {
        if (pipe.x < 100 && pipe.x > 20) {
          if (state.birdY < pipe.gapY || state.birdY > pipe.gapY + pipe.gap) {
            state.gameOver = true;
          }
        }
      });

      // Draw pipes
      ctx.fillStyle = '#228B22';
      state.pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, 60, pipe.gapY);
        ctx.fillRect(pipe.x, pipe.gapY + pipe.gap, 60, 600);
      });

      // Draw bird
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(50, state.birdY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw score
      ctx.fillStyle = '#000';
      ctx.font = '32px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 40);

      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        if (state.gameOver) {
          state.gameOver = false;
          state.birdY = 300;
          state.birdVel = 0;
          state.score = 0;
          state.pipes = [{ x: 800, gap: 180, gapY: 200 }];
        } else {
          state.birdVel = -8;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: 'auto' }} />;
});

export default FlappyGame;