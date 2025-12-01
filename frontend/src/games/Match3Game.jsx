import { useEffect, useRef, forwardRef } from 'react';

const Match3Game = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    grid: [],
    selected: null,
    score: 0,
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize grid
    for (let row = 0; row < 8; row++) {
      state.grid[row] = [];
      for (let col = 0; col < 8; col++) {
        state.grid[row][col] = Math.floor(Math.random() * 6);
      }
    }

    const checkMatches = () => {
      const matches = [];
      // Check horizontal
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 6; col++) {
          if (state.grid[row][col] === state.grid[row][col + 1] && 
              state.grid[row][col] === state.grid[row][col + 2]) {
            matches.push([row, col], [row, col + 1], [row, col + 2]);
          }
        }
      }
      // Check vertical
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 6; row++) {
          if (state.grid[row][col] === state.grid[row + 1][col] && 
              state.grid[row][col] === state.grid[row + 2][col]) {
            matches.push([row, col], [row + 1, col], [row + 2, col]);
          }
        }
      }
      return matches;
    };

    const gameLoop = () => {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 800, 600);

      const cellSize = 70;
      const offsetX = 50;
      const offsetY = 20;

      // Draw grid
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;
          
          ctx.fillStyle = state.colors[state.grid[row][col]];
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          
          if (state.selected && state.selected[0] === row && state.selected[1] === col) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }
        }
      }

      // Draw score
      ctx.fillStyle = '#00ff88';
      ctx.font = '24px monospace';
      ctx.fillText(`Score: ${state.score}`, 620, 40);

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor((x - 50) / 70);
      const row = Math.floor((y - 20) / 70);
      
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        if (!state.selected) {
          state.selected = [row, col];
        } else {
          const [sRow, sCol] = state.selected;
          if (Math.abs(row - sRow) + Math.abs(col - sCol) === 1) {
            // Swap
            const temp = state.grid[row][col];
            state.grid[row][col] = state.grid[sRow][sCol];
            state.grid[sRow][sCol] = temp;
            
            const matches = checkMatches();
            if (matches.length > 0) {
              state.score += matches.length * 10;
              onScoreChange(state.score);
              if (state.score % 100 === 0) onCoachTrigger('Great combo!');
              matches.forEach(([r, c]) => {
                state.grid[r][c] = Math.floor(Math.random() * 6);
              });
            }
          }
          state.selected = null;
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ display: 'block', width: '100%', maxWidth: '100vw', height: 'auto', background: '#0a0a12' }} />;
});

export default Match3Game;