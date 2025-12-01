import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const SimpleRacingGame = forwardRef(({ onScoreChange }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    playerX: 350,
    cars: [],
    score: 0,
    speed: 5,
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
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, 800, 600);

      // Road
      ctx.fillStyle = '#666';
      ctx.fillRect(200, 0, 400, 600);

      // Lane lines
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([20, 20]);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(300 + i * 100, 0);
        ctx.lineTo(300 + i * 100, 600);
        ctx.stroke();
      }

      // Player movement
      if (state.keys.ArrowLeft) state.playerX = Math.max(220, state.playerX - 5);
      if (state.keys.ArrowRight) state.playerX = Math.min(560, state.playerX + 5);

      // Spawn cars
      if (Math.random() < 0.02) {
        state.cars.push({ x: 220 + Math.floor(Math.random() * 3) * 120, y: -80 });
      }

      // Update cars
      state.cars = state.cars.filter(car => {
        car.y += state.speed;
        if (car.y > 600) {
          state.score += 10;
          onScoreChange(state.score);
          state.speed += 0.01;
          return false;
        }
        return true;
      });

      // Draw cars
      state.cars.forEach(car => {
        ctx.fillStyle = '#f00';
        ctx.fillRect(car.x, car.y, 60, 80);
      });

      // Draw player
      ctx.fillStyle = '#0ff';
      ctx.fillRect(state.playerX, 500, 60, 80);

      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 40);

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
  }, [onScoreChange]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ display: 'block', width: '100%', maxWidth: '100vw', height: 'auto' }} />;
});

export default SimpleRacingGame;