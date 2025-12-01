import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const PongGame = forwardRef(({ onScoreChange, onCoachTrigger, mode }, ref) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const gameLoopRef = useRef(null);
  const stateRef = useRef({
    paddleY: 350,
    ballX: 700,
    ballY: 400,
    ballVX: 5,
    ballVY: 3,
    aiPaddleY: 350,
    score: 0,
    aiScore: 0,
    keys: {}
  });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'up') stateRef.current.keys.ArrowUp = pressed;
      if (action === 'down') stateRef.current.keys.ArrowDown = pressed;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const gameLoop = () => {
      // Clear
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 1400, 800);

      // Update paddle
      if (state.keys.ArrowUp || state.keys.w) state.paddleY = Math.max(0, state.paddleY - 8);
      if (state.keys.ArrowDown || state.keys.s) state.paddleY = Math.min(500, state.paddleY + 8);

      // Update ball
      state.ballX += state.ballVX;
      state.ballY += state.ballVY;

      // Ball collision with top/bottom
      if (state.ballY <= 0 || state.ballY >= 590) state.ballVY *= -1;

      // Ball collision with player paddle
      if (state.ballX <= 30 && state.ballY >= state.paddleY && state.ballY <= state.paddleY + 100) {
        state.ballVX = Math.abs(state.ballVX);
        state.ballVY += (Math.random() - 0.5) * 2;
      }

      // Ball collision with AI paddle
      if (state.ballX >= 760 && state.ballY >= state.aiPaddleY && state.ballY <= state.aiPaddleY + 100) {
        state.ballVX = -Math.abs(state.ballVX);
        state.ballVY += (Math.random() - 0.5) * 2;
      }

      // AI movement
      const aiTarget = state.ballY - 50;
      if (state.aiPaddleY < aiTarget) state.aiPaddleY = Math.min(500, state.aiPaddleY + 4);
      if (state.aiPaddleY > aiTarget) state.aiPaddleY = Math.max(0, state.aiPaddleY - 4);

      // Score
      if (state.ballX <= 0) {
        state.aiScore++;
        state.ballX = 400;
        state.ballY = 300;
        state.ballVX = -5;
      }
      if (state.ballX >= 800) {
        state.score++;
        onScoreChange(state.score * 10);
        state.ballX = 400;
        state.ballY = 300;
        state.ballVX = 5;
        if (state.score % 3 === 0) onCoachTrigger('Great rally!');
      }

      // Draw center line
      ctx.strokeStyle = '#76FFE140';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(400, 0);
      ctx.lineTo(400, 600);
      ctx.stroke();

      // Draw paddles
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(20, state.paddleY, 10, 100);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(770, state.aiPaddleY, 10, 100);

      // Draw ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw scores
      ctx.font = '32px monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(state.score, 350, 50);
      ctx.fillStyle = '#ff4444';
      ctx.fillText(state.aiScore, 430, 50);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => { state.keys[e.key] = true; };
    const handleKeyUp = (e) => { state.keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', background: '#0a0a12' }} />;
});

export default PongGame;