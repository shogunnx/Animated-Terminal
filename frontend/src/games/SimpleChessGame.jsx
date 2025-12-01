import { useEffect, useRef, forwardRef } from 'react';

const SimpleChessGame = forwardRef(({ onScoreChange }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    board: [],
    selected: null,
    turn: 'white',
    message: 'Simple Chess - Click pieces to move'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize board
    const pieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
    state.board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let i = 0; i < 8; i++) {
      state.board[0][i] = { type: pieces[i], color: 'black' };
      state.board[1][i] = { type: '♟', color: 'black' };
      state.board[6][i] = { type: '♙', color: 'white' };
      state.board[7][i] = { type: pieces[i].replace(/♜|♞|♝|♛|♚/g, m => ({'♜':'♖','♞':'♘','♝':'♗','♛':'♕','♚':'♔'}[m])), color: 'white' };
    }

    const gameLoop = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 600);

      const cellSize = 70;
      const offsetX = 50;
      const offsetY = 20;

      // Draw board
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
          ctx.fillRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize, cellSize);

          if (state.selected && state.selected[0] === row && state.selected[1] === col) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize, cellSize);
          }

          const piece = state.board[row][col];
          if (piece) {
            ctx.font = '48px monospace';
            ctx.fillStyle = piece.color === 'white' ? '#fff' : '#000';
            ctx.fillText(piece.type, offsetX + col * cellSize + 10, offsetY + row * cellSize + 52);
          }
        }
      }

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(state.message, 50, 590);
      ctx.fillText(`Turn: ${state.turn}`, 600, 590);

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
          const piece = state.board[row][col];
          if (piece && piece.color === state.turn) {
            state.selected = [row, col];
          }
        } else {
          const [sRow, sCol] = state.selected;
          state.board[row][col] = state.board[sRow][sCol];
          state.board[sRow][sCol] = null;
          state.selected = null;
          state.turn = state.turn === 'white' ? 'black' : 'white';
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', minWidth: '1200px', maxWidth: '1400px' }} />;
});

export default SimpleChessGame;