import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const BreakoutGame = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const gameState = useRef(null);
  const paddleRef = useRef(null);
  const mobileControlActive = useRef({ left: false, right: false });

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (action === 'left') mobileControlActive.current.left = pressed;
      else if (action === 'right') mobileControlActive.current.right = pressed;
    }
  }));

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const WIDTH = 600;
    const HEIGHT = 400;
    
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let paddle = { x: WIDTH / 2 - 50, y: HEIGHT - 30, w: 100, h: 10 };
    paddleRef.current = paddle;
    let ball = { x: WIDTH / 2, y: HEIGHT / 2, dx: 3, dy: -3, r: 8 };
    let bricks = [];
    let localScore = 0;
    let combo = 0;

    // Create bricks
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        bricks.push({
          x: col * 60 + 5,
          y: row * 20 + 30,
          w: 50,
          h: 15,
          alive: true,
          color: `hsl(${row * 60}, 70%, 60%)`
        });
      }
    }

    function draw() {
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Paddle
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

      // Ball
      ctx.fillStyle = "#ff00ff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      // Bricks
      bricks.forEach(brick => {
        if (brick.alive) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
        }
      });
    }

    function update() {
      // Handle mobile controls
      if (mobileControlActive.current.left) {
        paddle.x -= 8;
        paddle.x = Math.max(0, paddle.x);
      }
      if (mobileControlActive.current.right) {
        paddle.x += 8;
        paddle.x = Math.min(WIDTH - paddle.w, paddle.x);
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall collision
      if (ball.x + ball.r > WIDTH || ball.x - ball.r < 0) ball.dx *= -1;
      if (ball.y - ball.r < 0) ball.dy *= -1;

      // Paddle collision
      if (ball.y + ball.r > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
        ball.dy *= -1;
        ball.dx += (ball.x - (paddle.x + paddle.w / 2)) * 0.1;
      }

      // Bottom
      if (ball.y + ball.r > HEIGHT) {
        setGameOver(true);
        onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
        return;
      }

      // Brick collision
      bricks.forEach(brick => {
        if (brick.alive && 
            ball.x > brick.x && ball.x < brick.x + brick.w &&
            ball.y > brick.y && ball.y < brick.y + brick.h) {
          brick.alive = false;
          ball.dy *= -1;
          localScore += 10;
          combo++;
          setScore(localScore);
          onScoreChange(localScore);
          onBondChange(Math.min(100, (localScore / 500) * 100));
          
          if (combo >= 3) {
            onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
            combo = 0;
          }
        }
      });

      // Win condition
      if (bricks.every(b => !b.alive)) {
        onCoachTrigger("PERFECT!! You cleared all bricks!!");
        setTimeout(() => initGame(), 2000);
      }
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

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      paddle.x = e.clientX - rect.left - paddle.w / 2;
      paddle.x = Math.max(0, Math.min(WIDTH - paddle.w, paddle.x));
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    requestAnimationFrame(gameLoop);

    const tipInterval = setInterval(() => {
      if (!gameOver) {
        onCoachTrigger(coach.tips[Math.floor(Math.random() * coach.tips.length)]);
      }
    }, 25000);

    gameState.current = { cleanup: () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      clearInterval(tipInterval);
    }};

  }, [coach, onScoreChange, onCoachTrigger, onBondChange, gameOver]);

  useEffect(() => {
    initGame();
    return () => gameState.current?.cleanup();
  }, [initGame]);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ border: "2px solid #ff00ff", borderRadius: 8 }} />
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
        Move Mouse to Control Paddle | Break All Bricks!
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

export default BreakoutGame;