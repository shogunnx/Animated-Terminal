import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const AsteroidsGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    ship: { x: 400, y: 300, angle: 0, vx: 0, vy: 0 },
    asteroids: [],
    bullets: [],
    score: 0,
    keys: {}
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'left') stateRef.current.keys.ArrowLeft = pressed;
      if (action === 'right') stateRef.current.keys.ArrowRight = pressed;
      if (action === 'up') stateRef.current.keys.ArrowUp = pressed;
      if (action === 'fire' && pressed) {
        const state = stateRef.current;
        state.bullets.push({
          x: state.ship.x,
          y: state.ship.y,
          vx: Math.cos(state.ship.angle) * 8,
          vy: Math.sin(state.ship.angle) * 8,
          life: 60
        });
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize asteroids
    for (let i = 0; i < 5; i++) {
      state.asteroids.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 40
      });
    }

    const gameLoop = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 600);

      // Ship controls
      if (state.keys.ArrowLeft) state.ship.angle -= 0.1;
      if (state.keys.ArrowRight) state.ship.angle += 0.1;
      if (state.keys.ArrowUp) {
        state.ship.vx += Math.cos(state.ship.angle) * 0.2;
        state.ship.vy += Math.sin(state.ship.angle) * 0.2;
      }
      if (state.keys[' '] && Math.random() < 0.1) {
        state.bullets.push({
          x: state.ship.x,
          y: state.ship.y,
          vx: Math.cos(state.ship.angle) * 8,
          vy: Math.sin(state.ship.angle) * 8,
          life: 60
        });
      }

      // Update ship
      state.ship.vx *= 0.99;
      state.ship.vy *= 0.99;
      state.ship.x += state.ship.vx;
      state.ship.y += state.ship.vy;
      if (state.ship.x < 0) state.ship.x = 800;
      if (state.ship.x > 800) state.ship.x = 0;
      if (state.ship.y < 0) state.ship.y = 600;
      if (state.ship.y > 600) state.ship.y = 0;

      // Draw ship
      ctx.save();
      ctx.translate(state.ship.x, state.ship.y);
      ctx.rotate(state.ship.angle);
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Update bullets
      state.bullets = state.bullets.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        ctx.fillStyle = '#ff0';
        ctx.fillRect(b.x, b.y, 3, 3);
        return b.life > 0;
      });

      // Update asteroids
      state.asteroids.forEach(ast => {
        ast.x += ast.vx;
        ast.y += ast.vy;
        if (ast.x < 0) ast.x = 800;
        if (ast.x > 800) ast.x = 0;
        if (ast.y < 0) ast.y = 600;
        if (ast.y > 600) ast.y = 0;

        ctx.strokeStyle = '#888';
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
        ctx.stroke();

        // Check bullet collisions
        state.bullets.forEach(b => {
          const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
          if (dist < ast.size) {
            b.life = 0;
            ast.size -= 10;
            state.score += 10;
            onScoreChange(state.score);
            if (state.score % 100 === 0) onCoachTrigger('Nice shooting!');
          }
        });
      });

      state.asteroids = state.asteroids.filter(a => a.size > 10);

      if (state.asteroids.length < 3) {
        state.asteroids.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 40
        });
      }

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

export default AsteroidsGame;