import { useEffect, useRef, forwardRef } from 'react';

const MemoryGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    cards: [],
    flipped: [],
    matched: [],
    score: 0,
    moves: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Create card pairs
    const symbols = ['❤️', '⭐', '🌙', '🔥', '💎', '🎵', '🍀', '⚡'];
    const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    cards.forEach((symbol, i) => {
      state.cards.push({ symbol, id: i });
    });

    const gameLoop = () => {
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, 800, 600);

      const cols = 4;
      const rows = 4;
      const cardW = 150;
      const cardH = 150;
      const offsetX = 100;
      const offsetY = 80;

      state.cards.forEach((card, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = offsetX + col * (cardW + 20);
        const y = offsetY + row * (cardH + 20);

        const isFlipped = state.flipped.includes(i) || state.matched.includes(card.symbol);

        if (isFlipped) {
          ctx.fillStyle = '#4a4aaa';
          ctx.fillRect(x, y, cardW, cardH);
          ctx.font = '64px monospace';
          ctx.fillText(card.symbol, x + 40, y + 100);
        } else {
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(x, y, cardW, cardH);
          ctx.strokeStyle = '#76FFE1';
          ctx.strokeRect(x, y, cardW, cardH);
        }
      });

      // Draw score
      ctx.fillStyle = '#00ff88';
      ctx.font = '24px monospace';
      ctx.fillText(`Moves: ${state.moves}`, 20, 40);
      ctx.fillText(`Matched: ${state.matched.length / 2} / 8`, 600, 40);

      if (state.matched.length === 16) {
        ctx.fillStyle = '#00ff88';
        ctx.font = '48px monospace';
        ctx.fillText('YOU WIN!', 260, 300);
      }

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      if (state.flipped.length >= 2 || state.matched.length === 16) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cols = 4;
      const cardW = 150;
      const cardH = 150;
      const offsetX = 100;
      const offsetY = 80;

      const col = Math.floor((x - offsetX) / (cardW + 20));
      const row = Math.floor((y - offsetY) / (cardH + 20));
      const index = row * cols + col;

      if (index >= 0 && index < 16 && !state.flipped.includes(index) && !state.matched.includes(state.cards[index].symbol)) {
        state.flipped.push(index);

        if (state.flipped.length === 2) {
          state.moves++;
          const [i1, i2] = state.flipped;
          
          if (state.cards[i1].symbol === state.cards[i2].symbol) {
            state.matched.push(state.cards[i1].symbol, state.cards[i2].symbol);
            state.score += 100;
            onScoreChange(state.score);
            onCoachTrigger('Great match!');
            state.flipped = [];
          } else {
            setTimeout(() => {
              state.flipped = [];
            }, 800);
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

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', minWidth: '1200px', maxWidth: '1400px', background: '#0a0a12' }} />;
});

export default MemoryGame;