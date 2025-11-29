import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const SnakeGame = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameState = useRef(null);
  const directionRef = useRef({ dx: 1, dy: 0 });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (pressed && controlFunctions.current) {
        const { dx, dy } = directionRef.current;
        if (action === 'up' && dy === 0) { directionRef.current = { dx: 0, dy: -1 }; }
        else if (action === 'down' && dy === 0) { directionRef.current = { dx: 0, dy: 1 }; }
        else if (action === 'left' && dx === 0) { directionRef.current = { dx: -1, dy: 0 }; }
        else if (action === 'right' && dx === 0) { directionRef.current = { dx: 1, dy: 0 }; }
      }
    }
  }));
  
  const controlFunctions = useRef(null);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const GRID = 20;
    const SIZE = 400;
    const CELL = SIZE / GRID;
    
    canvas.width = SIZE;
    canvas.height = SIZE;

    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    directionRef.current = { dx: 1, dy: 0 };
    let localScore = 0;

    function randomFood() {
      food = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID)
      };
    }

    function draw() {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(SIZE, i * CELL);
        ctx.stroke();
      }

      // Snake
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? "#00ff88" : "#00aa66";
        ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 2, CELL - 2);
      });

      // Food
      ctx.fillStyle = "#ff0088";
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL/2, food.y * CELL + CELL/2, CELL/2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function update() {
      const { dx, dy } = directionRef.current;
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};

      // Wall collision
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        setGameOver(true);
        onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
        return;
      }

      // Self collision
      if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
        return;
      }

      snake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        localScore += 10;
        setScore(localScore);
        onScoreChange(localScore);
        onBondChange(Math.min(100, (snake.length / 50) * 100));
        randomFood();
        
        if (snake.length % 5 === 0) {
          onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
        }
      } else {
        snake.pop();
      }
    }

    let lastTime = 0;
    function gameLoop(time) {
      if (gameOver) return;
      
      if (time - lastTime > 100) {
        update();
        draw();
        lastTime = time;
      }
      requestAnimationFrame(gameLoop);
    }

    function handleKeyPress(e) {
      const { dx, dy } = directionRef.current;
      if (e.key === "ArrowUp" && dy === 0) { directionRef.current = { dx: 0, dy: -1 }; }
      if (e.key === "ArrowDown" && dy === 0) { directionRef.current = { dx: 0, dy: 1 }; }
      if (e.key === "ArrowLeft" && dx === 0) { directionRef.current = { dx: -1, dy: 0 }; }
      if (e.key === "ArrowRight" && dx === 0) { directionRef.current = { dx: 1, dy: 0 }; }
    }

    window.addEventListener("keydown", handleKeyPress);
    requestAnimationFrame(gameLoop);

    const tipInterval = setInterval(() => {
      if (!gameOver) {
        onCoachTrigger(coach.tips[Math.floor(Math.random() * coach.tips.length)]);
      }
    }, 20000);

    // Expose for mobile
    controlFunctions.current = { setDirection: (newDir) => { directionRef.current = newDir; } };

    gameState.current = { cleanup: () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearInterval(tipInterval);
    }};

  }, [coach, onScoreChange, onCoachTrigger, onBondChange, gameOver]);

  useEffect(() => {
    initGame();
    return () => gameState.current?.cleanup();
  }, [initGame]);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ border: "2px solid #00ff88", borderRadius: 8 }} />
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
        Arrow Keys to Move | Eat Food | Don't Hit Walls or Yourself!
      </div>
      {gameOver && (
        <div style={{ marginTop: 12 }}>
          <div className="tsv-title" style={{ fontSize: 14, color: "#ff4b4b", marginBottom: 8 }}>GAME OVER</div>
          <button className="tsv-btn" onClick={() => { setGameOver(false); setScore(0); initGame(); }}>
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
});

export default SnakeGame;