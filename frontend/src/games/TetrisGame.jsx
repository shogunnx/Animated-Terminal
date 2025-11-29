import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const TetrisGame = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameState = useRef(null);
  const controlFunctions = useRef(null);

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (pressed && controlFunctions.current) {
        const funcs = controlFunctions.current;
        if (action === 'left') funcs.move(-1);
        else if (action === 'right') funcs.move(1);
        else if (action === 'down') funcs.drop();
        else if (action === 'rotate') funcs.rotate();
        else if (action === 'hardDrop') funcs.hardDrop();
      }
    }
  }));

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const COLS = 10;
    const ROWS = 20;
    const BLOCK = 30;
    
    canvas.width = COLS * BLOCK;
    canvas.height = ROWS * BLOCK;

    const SHAPES = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]], // J
      [[0,1,1],[1,1,0]], // S
      [[1,1,0],[0,1,1]], // Z
    ];

    const COLORS = ["#00ffff", "#ffff00", "#ff00ff", "#ff8800", "#0000ff", "#00ff00", "#ff0000"];

    let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    let currentPiece = null;
    let currentX = 0;
    let currentY = 0;
    let currentShape = 0;
    let dropTime = 0;
    let lastTime = 0;
    let localScore = 0;
    let linesCleared = 0;

    function newPiece() {
      currentShape = Math.floor(Math.random() * SHAPES.length);
      currentPiece = SHAPES[currentShape];
      currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
      currentY = 0;
      
      if (collision()) {
        setGameOver(true);
        onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
      }
    }

    function collision() {
      for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
          if (currentPiece[y][x]) {
            const newY = currentY + y;
            const newX = currentX + x;
            if (newY >= ROWS || newX < 0 || newX >= COLS || (newY >= 0 && board[newY][newX])) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function merge() {
      for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
          if (currentPiece[y][x]) {
            board[currentY + y][currentX + x] = currentShape + 1;
          }
        }
      }
    }

    function clearLines() {
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(0));
          cleared++;
          y++;
        }
      }
      if (cleared > 0) {
        localScore += cleared * 100 * cleared;
        linesCleared += cleared;
        setScore(localScore);
        onScoreChange(localScore);
        onBondChange(Math.min(100, (linesCleared / 10) * 100));
        
        if (cleared >= 4) {
          onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
        }
      }
    }

    function rotate() {
      const rotated = currentPiece[0].map((_, i) => 
        currentPiece.map(row => row[i]).reverse()
      );
      const prev = currentPiece;
      currentPiece = rotated;
      if (collision()) currentPiece = prev;
    }

    function move(dir) {
      currentX += dir;
      if (collision()) currentX -= dir;
    }

    function drop() {
      currentY++;
      if (collision()) {
        currentY--;
        merge();
        clearLines();
        newPiece();
      }
    }

    function hardDrop() {
      while (!collision()) currentY++;
      currentY--;
      merge();
      clearLines();
      newPiece();
    }

    function draw() {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw board
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) {
            ctx.fillStyle = COLORS[board[y][x] - 1];
            ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK - 1, BLOCK - 1);
          }
        }
      }

      // Draw current piece
      if (currentPiece) {
        ctx.fillStyle = COLORS[currentShape];
        for (let y = 0; y < currentPiece.length; y++) {
          for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
              ctx.fillRect((currentX + x) * BLOCK, (currentY + y) * BLOCK, BLOCK - 1, BLOCK - 1);
            }
          }
        }
      }

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK, 0);
        ctx.lineTo(i * BLOCK, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK);
        ctx.lineTo(canvas.width, i * BLOCK);
        ctx.stroke();
      }
    }

    function gameLoop(time) {
      if (gameOver) return;
      
      const delta = time - lastTime;
      lastTime = time;
      dropTime += delta;

      if (dropTime > 1000) {
        drop();
        dropTime = 0;
      }

      draw();
      requestAnimationFrame(gameLoop);
    }

    function handleKeyPress(e) {
      if (gameOver) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowDown") drop();
      if (e.key === "ArrowUp") rotate();
      if (e.key === " ") hardDrop();
    }

    window.addEventListener("keydown", handleKeyPress);
    newPiece();
    requestAnimationFrame(gameLoop);

    // Coach tips
    const tipInterval = setInterval(() => {
      if (!gameOver) {
        onCoachTrigger(coach.tips[Math.floor(Math.random() * coach.tips.length)]);
      }
    }, 25000);

    // Expose control functions for mobile
    controlFunctions.current = { move, drop, rotate, hardDrop };

    gameState.current = { cleanup: () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearInterval(tipInterval);
    }};

  }, [coach, onScoreChange, onCoachTrigger, onBondChange]);

  useEffect(() => {
    initGame();
    return () => gameState.current?.cleanup();
  }, [initGame]);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ border: "2px solid #00ffff", borderRadius: 8 }} />
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
        ← → Move | ↑ Rotate | ↓ Drop | SPACE Hard Drop
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

export default TetrisGame;