import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const RhythmGame = forwardRef(({ onScoreChange, onCoachTrigger, onBondChange, coach }, ref) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const gameState = useRef(null);
  const hitNoteFunc = useRef(null);

  useImperativeHandle(ref, () => ({
    handleControl: (action, pressed) => {
      if (pressed && hitNoteFunc.current) {
        if (action === 'lane0') hitNoteFunc.current(0);
        else if (action === 'lane1') hitNoteFunc.current(1);
        else if (action === 'lane2') hitNoteFunc.current(2);
        else if (action === 'lane3') hitNoteFunc.current(3);
      }
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

    const LANES = 4;
    const KEYS = ["KeyD", "KeyF", "KeyJ", "KeyK"];
    const COLORS = ["#ff0088", "#00ff88", "#ff00ff", "#00ffff"];
    const TARGET_Y = HEIGHT - 80;
    
    let notes = [];
    let localScore = 0;
    let localCombo = 0;
    let bpm = 120;
    let beatInterval = (60 / bpm) * 1000;
    let lastBeat = 0;
    let health = 100;

    function spawnNote() {
      const lane = Math.floor(Math.random() * LANES);
      notes.push({
        lane,
        y: 0,
        speed: 3,
        hit: false
      });
    }

    function draw() {
      // Background
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Lanes
      for (let i = 0; i < LANES; i++) {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(i * (WIDTH / LANES), 0, WIDTH / LANES, HEIGHT);
      }

      // Target line
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, TARGET_Y);
      ctx.lineTo(WIDTH, TARGET_Y);
      ctx.stroke();

      // Target boxes
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = COLORS[i] + "33";
        ctx.fillRect(i * (WIDTH / LANES) + 10, TARGET_Y - 30, (WIDTH / LANES) - 20, 60);
      }

      // Notes
      notes.forEach(note => {
        if (!note.hit) {
          ctx.fillStyle = COLORS[note.lane];
          ctx.fillRect(
            note.lane * (WIDTH / LANES) + 20,
            note.y - 20,
            (WIDTH / LANES) - 40,
            40
          );
        }
      });

      // HUD
      ctx.fillStyle = "#fff";
      ctx.font = "20px monospace";
      ctx.fillText(`COMBO: ${localCombo}`, 10, 30);
      ctx.fillText(`SCORE: ${localScore}`, 10, 60);
      
      // Health bar
      ctx.fillStyle = health > 30 ? "#00ff88" : "#ff0088";
      ctx.fillRect(WIDTH - 160, 20, health * 1.5, 20);
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(WIDTH - 160, 20, 150, 20);
      ctx.fillText("HP", WIDTH - 190, 35);
    }

    function update() {
      // Move notes
      notes.forEach(note => {
        note.y += note.speed;
      });

      // Remove missed notes
      notes = notes.filter(note => {
        if (note.y > HEIGHT && !note.hit) {
          health -= 10;
          localCombo = 0;
          setCombo(0);
          
          if (health <= 0) {
            setGameOver(true);
            onCoachTrigger(coach.failPhrases[Math.floor(Math.random() * coach.failPhrases.length)]);
          }
          return false;
        }
        return note.y < HEIGHT + 50;
      });
    }

    function hitNote(lane) {
      const hitWindow = 50;
      const note = notes.find(n => 
        n.lane === lane && 
        !n.hit && 
        Math.abs(n.y - TARGET_Y) < hitWindow
      );

      if (note) {
        note.hit = true;
        localCombo++;
        setCombo(localCombo);
        
        const points = 100 + (localCombo * 10);
        localScore += points;
        setScore(localScore);
        onScoreChange(localScore);
        onBondChange(Math.min(100, (localScore / 1000) * 100));

        if (localCombo % 10 === 0) {
          onCoachTrigger(coach.successPhrases[Math.floor(Math.random() * coach.successPhrases.length)]);
        }

        setTimeout(() => {
          notes = notes.filter(n => n !== note);
        }, 100);
      }
    }

    let lastTime = Date.now();
    function gameLoop() {
      if (gameOver) return;
      
      const now = Date.now();
      
      // Spawn notes on beat
      if (now - lastBeat > beatInterval) {
        spawnNote();
        lastBeat = now;
      }

      update();
      draw();
      requestAnimationFrame(gameLoop);
    }

    function handleKeyPress(e) {
      const laneIndex = KEYS.indexOf(e.code);
      if (laneIndex !== -1) {
        hitNote(laneIndex);
      }
    }

    // Expose hitNote for mobile
    hitNoteFunc.current = hitNote;

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
      <canvas ref={canvasRef} style={{ border: "2px solid #ffd700", borderRadius: 8 }} />
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
        D F J K Keys to Hit Notes | Match the Beat | Don't Miss!
      </div>
      <div style={{ marginTop: 8, fontSize: 12 }}>
        Combo: <span style={{ color: "#00ff88", fontWeight: "bold" }}>{combo}x</span>
      </div>
      {gameOver && (
        <div style={{ marginTop: 12 }}>
          <div className="tsv-title" style={{ fontSize: 14, color: "#ff4b4b", marginBottom: 8 }}>GAME OVER</div>
          <button className="tsv-btn" onClick={() => { setGameOver(false); setScore(0); setCombo(0); initGame(); }}>
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
});

export default RhythmGame;
