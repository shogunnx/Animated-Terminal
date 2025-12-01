import { useEffect, useRef, forwardRef } from 'react';

const SimpleWordSearch = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    grid: [],
    words: ['VICTORY', 'POWER', 'ANGEL', 'GIRL', 'MIND'],
    found: [],
    selected: [],
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize grid with random letters
    for (let r = 0; r < 10; r++) {
      state.grid[r] = [];
      for (let c = 0; c < 10; c++) {
        state.grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }

    // Place words horizontally
    state.words.forEach((word, i) => {
      const row = i * 2;
      const col = Math.floor(Math.random() * (10 - word.length));
      for (let j = 0; j < word.length; j++) {
        state.grid[row][col + j] = word[j];
      }
    });

    const gameLoop = () => {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 800, 600);

      const cellSize = 50;
      const offsetX = 50;
      const offsetY = 80;

      // Draw grid
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const x = offsetX + c * cellSize;
          const y = offsetY + r * cellSize;

          ctx.fillStyle = state.selected.some(s => s[0] === r && s[1] === c) ? '#4444aa' : '#2a2a3a';
          ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

          ctx.fillStyle = '#fff';
          ctx.font = '20px monospace';
          ctx.fillText(state.grid[r][c], x + 15, y + 32);
        }
      }

      // Draw word list
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('Find these words:', 600, 100);
      state.words.forEach((word, i) => {
        ctx.fillStyle = state.found.includes(word) ? '#00ff88' : '#fff';
        ctx.fillText(word, 600, 130 + i * 30);
        if (state.found.includes(word)) {
          ctx.strokeStyle = '#00ff88';
          ctx.beginPath();
          ctx.moveTo(600, 125 + i * 30);
          ctx.lineTo(680, 125 + i * 30);
          ctx.stroke();
        }
      });

      ctx.fillStyle = '#00ff88';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 50, 50);

      if (state.found.length === state.words.length) {
        ctx.fillStyle = '#00ff88';
        ctx.font = '36px monospace';
        ctx.fillText('ALL FOUND!', 250, 300);
      }

      requestAnimationFrame(gameLoop);
    };

    let selecting = false;
    let startCell = null;

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor((x - 50) / 50);
      const r = Math.floor((y - 80) / 50);

      if (c >= 0 && c < 10 && r >= 0 && r < 10) {
        selecting = true;
        startCell = [r, c];
        state.selected = [[r, c]];
      }
    };

    const handleMouseMove = (e) => {
      if (!selecting || !startCell) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const c = Math.floor((x - 50) / 50);
      const r = Math.floor((y - 80) / 50);

      if (c >= 0 && c < 10 && r >= 0 && r < 10 && r === startCell[0]) {
        state.selected = [];
        const minC = Math.min(startCell[1], c);
        const maxC = Math.max(startCell[1], c);
        for (let i = minC; i <= maxC; i++) {
          state.selected.push([r, i]);
        }
      }
    };

    const handleMouseUp = () => {
      if (state.selected.length > 0) {
        const word = state.selected.map(([r, c]) => state.grid[r][c]).join('');
        if (state.words.includes(word) && !state.found.includes(word)) {
          state.found.push(word);
          state.score += 100;
          onScoreChange(state.score);
          onCoachTrigger(`Found ${word}!`);
        }
      }
      selecting = false;
      startCell = null;
      state.selected = [];
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    gameLoop();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: 'auto', background: '#0a0a12' }} />;
});

export default SimpleWordSearch;