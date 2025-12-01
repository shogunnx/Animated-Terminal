import { useEffect, useRef, forwardRef } from 'react';

const SimpleSudokuGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    grid: [],
    solution: [],
    selected: null,
    errors: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Generate simple sudoku (simplified)
    const base = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ];

    state.solution = base.map(row => [...row]);
    state.grid = base.map((row, r) => 
      row.map((num, c) => (r + c) % 3 === 0 ? 0 : num)
    );

    const gameLoop = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 600);

      const cellSize = 60;
      const offsetX = 80;
      const offsetY = 60;

      // Draw grid
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;

          ctx.fillStyle = state.selected && state.selected[0] === r && state.selected[1] === c 
            ? '#4a4a7a' : '#2a2a4a';
          ctx.fillRect(x, y, cellSize, cellSize);

          ctx.strokeStyle = (r % 3 === 0 || c % 3 === 0) ? '#fff' : '#666';
          ctx.lineWidth = (r % 3 === 0 || c % 3 === 0) ? 3 : 1;
          ctx.strokeRect(x, y, cellSize, cellSize);

          if (state.grid[r][c] !== 0) {
            ctx.fillStyle = state.grid[r][c] === state.solution[r][c] ? '#00ff88' : '#ff4444';
            ctx.font = '32px monospace';
            ctx.fillText(state.grid[r][c], x + 18, y + 42);
          }
        }
      }

      // Number buttons
      for (let i = 1; i <= 9; i++) {
        const x = 630;
        const y = 60 + (i - 1) * 55;
        ctx.fillStyle = '#4a4a7a';
        ctx.fillRect(x, y, 50, 50);
        ctx.strokeStyle = '#76FFE1';
        ctx.strokeRect(x, y, 50, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.fillText(i, x + 16, y + 34);
      }

      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.fillText('Click cell, then number', 630, 550);
      ctx.fillText(`Errors: ${state.errors}`, 80, 40);

      // Check if complete
      let complete = true;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (state.grid[r][c] !== state.solution[r][c]) {
            complete = false;
          }
        }
      }

      if (complete) {
        ctx.fillStyle = '#00ff88';
        ctx.font = '48px monospace';
        ctx.fillText('SOLVED!', 250, 300);
        onCoachTrigger('Excellent logic!');
      }

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Grid click
      const c = Math.floor((x - 80) / 60);
      const r = Math.floor((y - 60) / 60);
      if (c >= 0 && c < 9 && r >= 0 && r < 9) {
        state.selected = [r, c];
      }

      // Number button click
      if (x >= 630 && x <= 680) {
        const num = Math.floor((y - 60) / 55) + 1;
        if (num >= 1 && num <= 9 && state.selected) {
          const [r, c] = state.selected;
          state.grid[r][c] = num;
          if (num !== state.solution[r][c]) {
            state.errors++;
          } else {
            onScoreChange(state.errors === 0 ? 100 : 50);
          }
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: 'auto' }} />;
});

export default SimpleSudokuGame;