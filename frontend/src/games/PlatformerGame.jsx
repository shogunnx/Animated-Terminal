import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const PlatformerGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    playerX: 50,
    playerY: 400,
    velX: 0,
    velY: 0,
    onGround: false,
    platforms: [
      { x: 0, y: 500, w: 800, h: 100 },
      { x: 200, y: 400, w: 150, h: 20 },
      { x: 450, y: 300, w: 150, h: 20 },
      { x: 100, y: 200, w: 150, h: 20 },
      { x: 600, y: 200, w: 150, h: 20 }
    ],
    coins: [
      { x: 250, y: 350, collected: false },
      { x: 500, y: 250, collected: false },
      { x: 150, y: 150, collected: false },
      { x: 650, y: 150, collected: false }
    ],
    score: 0,
    keys: {}
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'left') stateRef.current.keys.ArrowLeft = pressed;
      if (action === 'right') stateRef.current.keys.ArrowRight = pressed;
      if (action === 'up' && pressed && stateRef.current.onGround) {
        stateRef.current.velY = -12;
        stateRef.current.onGround = false;
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const gameLoop = () => {
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, 800, 600);

      // Physics
      if (state.keys.ArrowLeft) state.velX = -5;
      else if (state.keys.ArrowRight) state.velX = 5;
      else state.velX *= 0.8;

      if (state.keys.ArrowUp && state.onGround) {
        state.velY = -12;
        state.onGround = false;
      }

      state.velY += 0.5; // Gravity
      state.playerX += state.velX;
      state.playerY += state.velY;

      // Collision with platforms
      state.onGround = false;
      state.platforms.forEach(plat => {
        if (state.playerX + 30 > plat.x && state.playerX < plat.x + plat.w) {
          if (state.playerY + 30 >= plat.y && state.playerY + 30 <= plat.y + 15 && state.velY >= 0) {
            state.playerY = plat.y - 30;
            state.velY = 0;
            state.onGround = true;
          }
        }
      });

      // Collect coins
      state.coins.forEach(coin => {
        if (!coin.collected && Math.abs(state.playerX - coin.x) < 30 && Math.abs(state.playerY - coin.y) < 30) {
          coin.collected = true;
          state.score += 100;
          onScoreChange(state.score);
          onCoachTrigger('Got a coin!');
        }
      });

      // Draw platforms
      ctx.fillStyle = '#8B4513';
      state.platforms.forEach(plat => {
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      });

      // Draw coins
      ctx.fillStyle = '#FFD700';
      state.coins.forEach(coin => {
        if (!coin.collected) {
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw player
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(state.playerX, state.playerY, 30, 30);

      ctx.fillStyle = '#000';
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

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', minWidth: '1200px', maxWidth: '1400px' }} />;
});

export default PlatformerGame;