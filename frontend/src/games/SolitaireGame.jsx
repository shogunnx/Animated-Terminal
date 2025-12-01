import { useEffect, useRef, forwardRef } from 'react';

const SolitaireGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    deck: [],
    tableau: [[], [], [], [], [], [], []],
    foundation: [[], [], [], []],
    waste: [],
    drawPile: [],
    selected: null,
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Initialize deck
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    suits.forEach((suit, si) => {
      values.forEach((value, vi) => {
        state.deck.push({ suit, value, suitIndex: si, valueIndex: vi, faceUp: false });
      });
    });
    
    // Shuffle
    state.deck.sort(() => Math.random() - 0.5);
    
    // Deal to tableau
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        const card = state.deck.pop();
        if (i === j) card.faceUp = true;
        state.tableau[j].push(card);
      }
    }
    state.drawPile = [...state.deck];

    const drawCard = (x, y, card, faceUp = true) => {
      ctx.fillStyle = faceUp ? '#fff' : '#2a4a7a';
      ctx.fillRect(x, y, 60, 80);
      ctx.strokeStyle = '#76FFE1';
      ctx.strokeRect(x, y, 60, 80);
      
      if (faceUp && card) {
        ctx.fillStyle = (card.suit === '♥' || card.suit === '♦') ? '#ff4444' : '#000';
        ctx.font = '14px monospace';
        ctx.fillText(card.value, x + 8, y + 20);
        ctx.font = '20px monospace';
        ctx.fillText(card.suit, x + 20, y + 50);
      }
    };

    const gameLoop = () => {
      ctx.fillStyle = '#0a6020';
      ctx.fillRect(0, 0, 800, 600);

      // Draw tableau
      state.tableau.forEach((pile, i) => {
        pile.forEach((card, j) => {
          drawCard(30 + i * 90, 120 + j * 25, card, card.faceUp);
        });
      });

      // Draw foundations
      state.foundation.forEach((pile, i) => {
        const card = pile[pile.length - 1];
        drawCard(400 + i * 80, 20, card, true);
      });

      // Draw pile and waste
      if (state.drawPile.length > 0) {
        drawCard(30, 20, null, false);
      }
      if (state.waste.length > 0) {
        drawCard(120, 20, state.waste[state.waste.length - 1], true);
      }

      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${state.score}`, 30, 580);

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Draw pile click
      if (x >= 30 && x <= 90 && y >= 20 && y <= 100) {
        if (state.drawPile.length > 0) {
          const card = state.drawPile.pop();
          card.faceUp = true;
          state.waste.push(card);
        } else {
          state.waste.reverse().forEach(c => { c.faceUp = false; state.drawPile.push(c); });
          state.waste = [];
        }
      }

      // Tableau click - simplified
      state.tableau.forEach((pile, i) => {
        if (x >= 30 + i * 90 && x <= 90 + i * 90 && y >= 120 && pile.length > 0) {
          const topCard = pile[pile.length - 1];
          if (!topCard.faceUp && pile.length > 0) {
            topCard.faceUp = true;
            state.score += 5;
            onScoreChange(state.score);
          }
        }
      });
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', height: 'auto' }} />;
});

export default SolitaireGame;