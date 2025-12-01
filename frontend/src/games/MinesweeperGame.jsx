import { useEffect, useRef, forwardRef } from 'react';

const MinesweeperGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    grid: [],
    revealed: [],
    flags: [],
    mines: 20,
    score: 0,
    gameOver: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    const rows = 12;
    const cols = 16;

    // Initialize grid
    for (let r = 0; r < rows; r++) {
      state.grid[r] = [];
      state.revealed[r] = [];
      state.flags[r] = [];
      for (let c = 0; c < cols; c++) {
        state.grid[r][c] = 0;
        state.revealed[r][c] = false;
        state.flags[r][c] = false;
      }
    }

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < state.mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (state.grid[r][c] !== -1) {
        state.grid[r][c] = -1;
        minesPlaced++;
      }
    }

    // Calculate numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (state.grid[r][c] !== -1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && state.grid[nr][nc] === -1) {
                count++;
              }
            }
          }
          state.grid[r][c] = count;
        }
      }
    }

    const reveal = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || state.revealed[r][c] || state.flags[r][c]) return;
      
      state.revealed[r][c] = true;
      if (state.grid[r][c] === -1) {
        state.gameOver = true;
        return;
      }
      
      state.score += 10;
      onScoreChange(state.score);
      
      if (state.grid[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(r + dr, c + dc);
          }
        }
      }
    };

    const gameLoop = () => {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 800, 600);

      const cellSize = 48;
      const offsetX = 10;
      const offsetY = 50;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;
          
          if (state.revealed[r][c]) {
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            if (state.grid[r][c] === -1) {
              ctx.fillStyle = '#ff4444';
              ctx.font = '24px monospace';
              ctx.fillText('💣', x + 12, y + 32);
            } else if (state.grid[r][c] > 0) {
              ctx.fillStyle = '#00ff88';
              ctx.font = '20px monospace';
              ctx.fillText(state.grid[r][c], x + 16, y + 30);
            }
          } else {
            ctx.fillStyle = state.flags[r][c] ? '#ff8800' : '#4a4a5a';
            ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
            
            if (state.flags[r][c]) {
              ctx.fillStyle = '#fff';
              ctx.font = '24px monospace';
              ctx.fillText('🚩', x + 12, y + 32);
            }
          }
        }
      }

      ctx.fillStyle = '#00ff88';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 20, 30);
      
      if (state.gameOver) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '36px monospace';
        ctx.fillText('GAME OVER!', 280, 300);
      }

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      if (state.gameOver) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor((x - 10) / 48);
      const r = Math.floor((y - 50) / 48);
      
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (e.button === 2 || e.ctrlKey) {
          state.flags[r][c] = !state.flags[r][c];
        } else {
          reveal(r, c);
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); handleClick(e); });
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', background: '#0a0a12' }} />;
});

export default MinesweeperGame;