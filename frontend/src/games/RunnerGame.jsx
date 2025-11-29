import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const RunnerGame = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameState = useRef(null);
  const playerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'jump' && pressed && playerRef.current && !playerRef.current.jumping) {
        playerRef.current.jumping = true;
        playerRef.current.vy = -15;
      }
    }
  }));

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const WIDTH = 600;
    const HEIGHT = 300;
    
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let player = { x: 50, y: HEIGHT - 60, w: 30, h: 50, vy: 0, jumping: false };
    playerRef.current = player;
    let obstacles = [];
    let localScore = 0;
    let gameSpeed = 5;
    let frameCount = 0;

    function draw() {
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#1a1a3e");
      gradient.addColorStop(1, "#0a0a12");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Ground
      ctx.fillStyle = "#2a2a42";
      ctx.fillRect(0, HEIGHT - 10, WIDTH, 10);

      // Player
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, player.w, player.h);

      // Obstacles
      obstacles.forEach(obs => {
        ctx.fillStyle = "#ff0088";
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Score
      ctx.fillStyle = "#fff";
      ctx.font = "20px monospace";
      ctx.fillText(`DISTANCE: ${Math.floor(localScore)}`, 10, 30);
    }

    function update() {
      frameCount++;
      localScore += 0.1;
      setScore(Math.floor(localScore));
      onScoreChange(Math.floor(localScore));
      onBondChange(Math.min(100, (localScore / 100) * 100));

      // Increase difficulty
      if (frameCount % 300 === 0) {
        gameSpeed += 0.5;
        onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
      }

      // Gravity
      if (player.jumping) {
        player.vy += 0.8;
        player.y += player.vy;
        
        if (player.y >= HEIGHT - 60) {
          player.y = HEIGHT - 60;
          player.vy = 0;
          player.jumping = false;
        }
      }

      // Spawn obstacles
      if (frameCount % 80 === 0) {
        obstacles.push({
          x: WIDTH,
          y: HEIGHT - 10 - 40,
          w: 20 + Math.random() * 20,
          h: 40
        });
      }

      // Move obstacles
      obstacles.forEach(obs => obs.x -= gameSpeed);
      obstacles = obstacles.filter(obs => obs.x + obs.w > 0);

      // Collision
      obstacles.forEach(obs => {
        if (player.x < obs.x + obs.w &&
            player.x + player.w > obs.x &&
            player.y < obs.y + obs.h &&
            player.y + player.h > obs.y) {
          setGameOver(true);
          onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
        }
      });
    }

    let lastTime = 0;
    function gameLoop(time) {
      if (gameOver) return;
      
      if (time - lastTime > 16) {
        update();
        draw();
        lastTime = time;
      }
      requestAnimationFrame(gameLoop);
    }

    function handleKeyPress(e) {
      if (e.code === "Space" && !player.jumping) {
        player.jumping = true;
        player.vy = -15;
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    requestAnimationFrame(gameLoop);

    const tipInterval = setInterval(() => {
      if (!gameOver) {
        onCoachTrigger(coach.tips[Math.floor(Math.random() * coach.tips.length)]);
      }
    }, 25000);

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
        SPACE to Jump | Avoid Obstacles | Run Forever!
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

export default RunnerGame;