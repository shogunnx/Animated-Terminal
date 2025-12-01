import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const PacmanGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    pacX: 400,
    pacY: 300,
    direction: 0,
    dots: [],
    ghosts: [
      { x: 200, y: 200, color: '#ff0000' },
      { x: 600, y: 200, color: '#00ffff' },
      { x: 200, y: 400, color: '#ffb8ff' },
      { x: 600, y: 400, color: '#ffb852' }
    ],
    score: 0,
    keys: {}
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'up') stateRef.current.direction = pressed ? 0 : stateRef.current.direction;
      if (action === 'right') stateRef.current.direction = pressed ? 1 : stateRef.current.direction;
      if (action === 'down') stateRef.current.direction = pressed ? 2 : stateRef.current.direction;
      if (action === 'left') stateRef.current.direction = pressed ? 3 : stateRef.current.direction;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Generate dots
    for (let x = 50; x < 750; x += 40) {
      for (let y = 50; y < 550; y += 40) {
        state.dots.push({ x, y, eaten: false });
      }
    }

    const gameLoop = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 600);

      // Update Pacman
      const speed = 4;
      if (state.keys.ArrowUp || state.direction === 0) { state.pacY -= speed; state.direction = 0; }
      if (state.keys.ArrowRight || state.direction === 1) { state.pacX += speed; state.direction = 1; }
      if (state.keys.ArrowDown || state.direction === 2) { state.pacY += speed; state.direction = 2; }
      if (state.keys.ArrowLeft || state.direction === 3) { state.pacX -= speed; state.direction = 3; }

      // Wrap around
      if (state.pacX < 0) state.pacX = 800;
      if (state.pacX > 800) state.pacX = 0;
      if (state.pacY < 0) state.pacY = 600;
      if (state.pacY > 600) state.pacY = 0;

      // Update ghosts
      state.ghosts.forEach(ghost => {
        if (Math.random() < 0.02) {
          ghost.dx = (Math.random() - 0.5) * 2;
          ghost.dy = (Math.random() - 0.5) * 2;
        }
        ghost.x += ghost.dx || 0;
        ghost.y += ghost.dy || 0;
        ghost.x = Math.max(20, Math.min(780, ghost.x));
        ghost.y = Math.max(20, Math.min(580, ghost.y));
      });

      // Draw dots
      state.dots.forEach(dot => {
        if (!dot.eaten) {
          const dist = Math.hypot(dot.x - state.pacX, dot.y - state.pacY);
          if (dist < 20) {
            dot.eaten = true;
            state.score += 10;
            onScoreChange(state.score);
            if (state.score % 100 === 0) onCoachTrigger('Waka waka!');
          } else {
            ctx.fillStyle = '#ffb852';
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw Pacman
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      const mouthAngle = Math.abs(Math.sin(Date.now() / 100)) * 0.3;
      ctx.arc(state.pacX, state.pacY, 15, mouthAngle, Math.PI * 2 - mouthAngle);
      ctx.lineTo(state.pacX, state.pacY);
      ctx.fill();

      // Draw ghosts
      state.ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(ghost.x - 4, ghost.y - 4, 3, 6);
        ctx.fillRect(ghost.x + 1, ghost.y - 4, 3, 6);
      });

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 30);

      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => { state.keys[e.key] = true; };
    const handleKeyUp = (e) => { state.keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ display: 'block', width: '100%', maxWidth: '100vw', height: 'auto', background: '#000' }} />;
});

export default PacmanGame;