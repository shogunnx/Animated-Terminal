import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const microGames = [
  { name: "CLICK THE CIRCLE!", type: "click" },
  { name: "DODGE THE BOX!", type: "dodge" },
  { name: "CATCH THE STAR!", type: "catch" },
  { name: "MASH SPACE!", type: "mash" },
  { name: "DON'T MOVE!", type: "freeze" },
];

const MicroGames = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentGame, setCurrentGame] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const gameState = useRef(null);
  const mashCountRef = useRef(null);

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'action' && pressed && mashCountRef.current) {
        mashCountRef.current.count++;
      }
    }
  }));

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const WIDTH = 500;
    const HEIGHT = 400;
    
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let localScore = 0;
    let gameType = microGames[Math.floor(Math.random() * microGames.length)];
    let target = { x: WIDTH/2, y: HEIGHT/2, r: 30 };
    let player = { x: WIDTH/2, y: HEIGHT/2 };
    let enemy = { x: Math.random() * WIDTH, y: 0, vy: 3 };
    let mashes = 0;
    let moved = false;
    let timer = 5;

    setCurrentGame(microGames.indexOf(gameType));

    function draw() {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Timer
      ctx.fillStyle = "#fff";
      ctx.font = "40px monospace";
      ctx.fillText(Math.ceil(timer), WIDTH - 60, 50);

      // Game title
      ctx.font = "20px monospace";
      ctx.fillText(gameType.name, 10, 30);

      if (gameType.type === "click") {
        ctx.fillStyle = "#ff00ff";
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (gameType.type === "dodge") {
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(player.x - 15, player.y - 15, 30, 30);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(enemy.x, enemy.y, 40, 40);
      } else if (gameType.type === "catch") {
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(player.x - 15, HEIGHT - 40, 60, 30);
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(target.x, target.y - 10);
        ctx.lineTo(target.x - 10, target.y + 10);
        ctx.lineTo(target.x + 10, target.y + 10);
        ctx.closePath();
        ctx.fill();
      } else if (gameType.type === "mash") {
        ctx.fillStyle = "#00ffff";
        ctx.font = "50px monospace";
        ctx.fillText(mashes, WIDTH/2 - 30, HEIGHT/2);
        ctx.font = "20px monospace";
        ctx.fillText("MASH SPACE!", WIDTH/2 - 80, HEIGHT/2 + 40);
      } else if (gameType.type === "freeze") {
        ctx.fillStyle = "#ff00ff";
        ctx.font = "30px monospace";
        ctx.fillText("DON'T MOVE!", WIDTH/2 - 100, HEIGHT/2);
        if (moved) {
          ctx.fillStyle = "#ff0000";
          ctx.fillText("YOU MOVED!", WIDTH/2 - 90, HEIGHT/2 + 40);
        }
      }
    }

    function update(delta) {
      timer -= delta / 1000;
      setTimeLeft(timer);

      if (timer <= 0) {
        // Check win condition
        let won = false;
        if (gameType.type === "dodge" && !checkCollision(player, enemy, 40)) won = true;
        if (gameType.type === "mash" && mashes >= 10) won = true;
        if (gameType.type === "freeze" && !moved) won = true;

        if (won || gameType.type === "click" || gameType.type === "catch") {
          // Games that handle their own win (click/catch) or passed dodge/mash/freeze
          if (won || gameType.type === "click" || gameType.type === "catch") {
            localScore++;
            setScore(localScore);
            onScoreChange(localScore);
            onBondChange(Math.min(100, (localScore / 20) * 100));
            onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
          }
        } else {
          setGameOver(true);
          onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
          return;
        }

        // Next game
        gameType = microGames[Math.floor(Math.random() * microGames.length)];
        setCurrentGame(microGames.indexOf(gameType));
        target = { x: WIDTH/2 + (Math.random() - 0.5) * 200, y: HEIGHT/2 + (Math.random() - 0.5) * 200, r: 30 };
        enemy = { x: Math.random() * WIDTH, y: 0, vy: 3 + localScore * 0.5 };
        mashes = 0;
        moved = false;
        timer = 5;
      }

      if (gameType.type === "dodge") {
        enemy.y += enemy.vy;
      }

      if (gameType.type === "catch") {
        target.y += 3;
        if (target.y > HEIGHT && !won) {
          setGameOver(true);
          onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
        }
      }
    }

    function checkCollision(p, e, size) {
      return Math.abs(p.x - e.x) < size && Math.abs(p.y - e.y) < size;
    }

    let lastTime = Date.now();
    function gameLoop() {
      if (gameOver) return;
      
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      update(delta);
      draw();
      requestAnimationFrame(gameLoop);
    }

    function handleClick(e) {
      if (gameType.type === "click") {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const dist = Math.sqrt((mx - target.x) ** 2 + (my - target.y) ** 2);
        if (dist < target.r) {
          localScore++;
          setScore(localScore);
          onScoreChange(localScore);
          onBondChange(Math.min(100, (localScore / 20) * 100));
          gameType = microGames[Math.floor(Math.random() * microGames.length)];
          timer = 5;
        }
      }
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      player.x = e.clientX - rect.left;
      player.y = e.clientY - rect.top;
      
      if (gameType.type === "freeze") moved = true;

      if (gameType.type === "catch") {
        if (Math.abs(player.x - target.x) < 30 && target.y > HEIGHT - 60 && target.y < HEIGHT) {
          localScore++;
          setScore(localScore);
          onScoreChange(localScore);
          gameType = microGames[Math.floor(Math.random() * microGames.length)];
          timer = 5;
        }
      }
    }

    function handleKeyPress(e) {
      if (e.code === "Space" && gameType.type === "mash") {
        mashes++;
      }
    }

    // Expose mash counter for mobile
    mashCountRef.current = { get count() { return mashes; }, set count(val) { mashes = val; } };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyPress);
    requestAnimationFrame(gameLoop);

    const tipInterval = setInterval(() => {
      if (!gameOver) {
        onCoachTrigger(coach.tips[Math.floor(Math.random() * coach.tips.length)]);
      }
    }, 30000);

    gameState.current = { cleanup: () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
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
      <div style={{ marginBottom: 12 }}>
        <div className="tsv-title" style={{ fontSize: 16, marginBottom: 6 }}>
          {microGames[currentGame]?.name}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Time: {timeLeft.toFixed(1)}s | Complete before time runs out!
        </div>
      </div>
      <canvas ref={canvasRef} style={{ border: "2px solid #ff00ff", borderRadius: 8 }} />
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
        5 Second Challenges! Click, Dodge, Catch, Mash, Freeze!
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

export default MicroGames;