import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TSV_GAMES, GIRL_COACHES } from "../content/tsvContent.js";
import TetrisGame from "../games/TetrisGame.jsx";
import SnakeGame from "../games/SnakeGame.jsx";
import BreakoutGame from "../games/BreakoutGame.jsx";
import RunnerGame from "../games/RunnerGame.jsx";
import MicroGames from "../games/MicroGames.jsx";
import RhythmGame from "../games/RhythmGame.jsx";
import MobileControls from "../components/MobileControls.jsx";

export default function GamePlayer() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const coachId = searchParams.get("coach") || "harmony";
  const mode = searchParams.get("mode") || "coach";
  
  const game = TSV_GAMES.find(g => g.id === gameId);
  const coach = GIRL_COACHES[coachId];
  
  const [score, setScore] = useState(0);
  const [coachMessage, setCoachMessage] = useState("");
  const [bondMeter, setBondMeter] = useState(0);
  const gameControlRef = useRef(null);

  const gameComponents = {
    // Original 6 games
    tetris: TetrisGame,
    snake: SnakeGame,
    breakout: BreakoutGame,
    runner: RunnerGame,
    microgames: MicroGames,
    rhythm: RhythmGame,
    // New 20 games
    pong: lazy(() => import('../games/PongGame.jsx')),
    space_invaders: lazy(() => import('../games/SpaceInvadersGame.jsx')),
    flappy: lazy(() => import('../games/FlappyGame.jsx')),
    match3: lazy(() => import('../games/Match3Game.jsx')),
    solitaire: lazy(() => import('../games/SolitaireGame.jsx')),
    minesweeper: lazy(() => import('../games/MinesweeperGame.jsx')),
    pacman: lazy(() => import('../games/PacmanGame.jsx')),
    platformer: lazy(() => import('../games/PlatformerGame.jsx')),
    bubble_shooter: lazy(() => import('../games/BubbleShooterGame.jsx')),
    tower_defense: lazy(() => import('../games/SimpleTowerDefense.jsx')),
    word_search: lazy(() => import('../games/SimpleWordSearch.jsx')),
    memory: lazy(() => import('../games/MemoryGame.jsx')),
    racing: lazy(() => import('../games/SimpleRacingGame.jsx')),
    bowling: lazy(() => import('../games/SimpleBowlingGame.jsx')),
    asteroids: lazy(() => import('../games/AsteroidsGame.jsx')),
    chess: lazy(() => import('../games/SimpleChessGame.jsx')),
    pool: lazy(() => import('../games/Simple8BallGame.jsx')),
    pinball: lazy(() => import('../games/SimplePinballGame.jsx')),
    sudoku: lazy(() => import('../games/SimpleSudokuGame.jsx')),
    blackjack: lazy(() => import('../games/SimpleBlackjackGame.jsx')),
  };

  const GameComponent = gameComponents[gameId];

  const handleMobileControl = (action, pressed) => {
    if (gameControlRef.current && gameControlRef.current.handleControl) {
      gameControlRef.current.handleControl(action, pressed);
    }
  };

  if (!game || !GameComponent) {
    return (
      <div className="tsv-glass" style={{ padding: 16 }}>
        <div className="tsv-title">GAME NOT FOUND</div>
        <button className="tsv-btn" style={{ marginTop: 12 }} onClick={() => navigate("/gameroom")}>
          ← Back to Games
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>
      {/* Game Canvas */}
      <div className="tsv-glass tsv-glow" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="tsv-title" style={{ fontSize: 14 }}>
            {game.icon} {game.name}
          </div>
          <button className="tsv-btn" onClick={() => navigate("/gameroom")}>
            ← EXIT
          </button>
        </div>

        <GameComponent 
          ref={gameControlRef}
          onScoreChange={setScore}
          onCoachTrigger={setCoachMessage}
          onBondChange={setBondMeter}
          coach={coach}
          mode={mode}
        />
        
        {/* Mobile Controls */}
        <MobileControls gameId={gameId} onControl={handleMobileControl} />
      </div>

      {/* Girl Coach Panel */}
      <div className="tsv-glass tsv-glow" style={{ padding: 16, position: "sticky", top: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 8 }}>
          {coach.name}
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 12 }}>
          {coach.role}
        </div>

        {/* Score Display */}
        <div className="tsv-glass" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>SCORE</div>
          <div className="tsv-title" style={{ fontSize: 24, color: "#00ff88" }}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* Bond Meter (Date Mode) */}
        {mode === "date" && (
          <div className="tsv-glass" style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6 }}>BOND METER ♥</div>
            <div style={{ 
              width: "100%", 
              height: 20, 
              background: "rgba(0,0,0,0.3)", 
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              <div style={{
                width: `${bondMeter}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ff0080, #ff66c4)",
                transition: "width 0.3s ease",
                boxShadow: "0 0 10px #ff66c4"
              }} />
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: "center" }}>
              {bondMeter < 30 ? "Getting to know you..." : 
               bondMeter < 70 ? "She's warming up! ♥" : 
               "She's impressed!! ♥♥"}
            </div>
          </div>
        )}

        {/* Coach Message */}
        <div className="tsv-glass tsv-pulse" style={{ 
          padding: 12, 
          minHeight: 80,
          background: "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(136,0,255,0.1))"
        }}>
          <div style={{ fontSize: 11, lineHeight: 1.4, fontStyle: "italic" }}>
            "{coachMessage || "Ready when you are..."}"
          </div>
        </div>

        {/* Mode Info */}
        <div style={{ marginTop: 12, fontSize: 9, opacity: 0.6 }}>
          <div>Mode: <b>{mode === "coach" ? "Coach" : mode === "rival" ? "Rival" : "Date"}</b></div>
          <div>Tips appear every 20-30 seconds</div>
        </div>
      </div>
    </div>
  );
}
