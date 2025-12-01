import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const SpaceInvadersGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    playerX: 375,
    bullets: [],
    enemies: [],
    score: 0,
    keys: {},
    enemyDirection: 1
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'left') stateRef.current.keys.ArrowLeft = pressed;
      if (action === 'right') stateRef.current.keys.ArrowRight = pressed;
      if (action === 'fire' && pressed) {
        stateRef.current.bullets.push({ x: stateRef.current.playerX + 12, y: 540 });
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize enemies
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        state.enemies.push({ x: col * 80 + 100, y: row * 60 + 50, alive: true });
      }
    }

    const gameLoop = () => {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 800, 600);

      // Player movement
      if (state.keys.ArrowLeft) state.playerX = Math.max(0, state.playerX - 6);
      if (state.keys.ArrowRight) state.playerX = Math.min(775, state.playerX + 6);
      if (state.keys[' '] && Math.random() < 0.1) {
        state.bullets.push({ x: state.playerX + 12, y: 540 });
      }

      // Update bullets
      state.bullets = state.bullets.filter(b => {
        b.y -= 8;
        return b.y > 0;
      });

      // Update enemies
      let moveDown = false;
      state.enemies.forEach(e => {
        if (e.alive) {
          e.x += state.enemyDirection * 2;
          if (e.x <= 0 || e.x >= 780) moveDown = true;
        }
      });
      if (moveDown) {
        state.enemyDirection *= -1;
        state.enemies.forEach(e => { if (e.alive) e.y += 20; });
      }

      // Collision
      state.bullets.forEach(b => {
        state.enemies.forEach(e => {
          if (e.alive && Math.abs(b.x - e.x) < 25 && Math.abs(b.y - e.y) < 25) {
            e.alive = false;
            b.y = -100;
            state.score += 10;
            onScoreChange(state.score);
            if (state.score % 100 === 0) onCoachTrigger('Nice shooting!');
          }
        });
      });

      // Draw player
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(state.playerX, 550, 25, 20);

      // Draw bullets
      ctx.fillStyle = '#ffff00';
      state.bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));

      // Draw enemies
      ctx.fillStyle = '#ff4444';
      state.enemies.forEach(e => {
        if (e.alive) {
          ctx.fillText('👾', e.x, e.y);
        }
      });

      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => { state.keys[e.key] = true; };
    const handleKeyUp = (e) => { state.keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    ctx.font = '24px monospace';
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', minWidth: '1200px', maxWidth: '1400px', background: '#0a0a12' }} />;
});

export default SpaceInvadersGame;