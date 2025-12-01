import { useEffect, useRef, useState, forwardRef } from 'react';

const SimpleBlackjackGame = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('betting');
  const stateRef = useRef({
    playerHand: [],
    dealerHand: [],
    deck: [],
    bet: 10,
    money: 1000,
    score: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    const createDeck = () => {
      const suits = ['♥', '♦', '♣', '♠'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      state.deck = [];
      suits.forEach(suit => {
        values.forEach((value, i) => {
          state.deck.push({ value, suit, numValue: i === 0 ? 11 : (i >= 10 ? 10 : i + 1) });
        });
      });
      state.deck.sort(() => Math.random() - 0.5);
    };

    const calcTotal = (hand) => {
      let total = hand.reduce((sum, card) => sum + card.numValue, 0);
      let aces = hand.filter(c => c.value === 'A').length;
      while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
      }
      return total;
    };

    const drawCard = (x, y, card, faceUp = true) => {
      ctx.fillStyle = faceUp ? '#fff' : '#2a4a7a';
      ctx.fillRect(x, y, 80, 110);
      ctx.strokeStyle = '#76FFE1';
      ctx.strokeRect(x, y, 80, 110);
      
      if (faceUp && card) {
        ctx.fillStyle = (card.suit === '♥' || card.suit === '♦') ? '#ff4444' : '#000';
        ctx.font = '18px monospace';
        ctx.fillText(card.value, x + 10, y + 30);
        ctx.font = '28px monospace';
        ctx.fillText(card.suit, x + 25, y + 70);
      }
    };

    const gameLoop = () => {
      ctx.fillStyle = '#0a6020';
      ctx.fillRect(0, 0, 800, 600);

      // Draw dealer hand
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('Dealer:', 50, 80);
      state.dealerHand.forEach((card, i) => {
        drawCard(50 + i * 100, 100, card, gameState !== 'playing' || i === 0);
      });
      if (gameState !== 'playing') {
        ctx.fillText(`Total: ${calcTotal(state.dealerHand)}`, 50, 230);
      }

      // Draw player hand
      ctx.fillText('Player:', 50, 280);
      state.playerHand.forEach((card, i) => {
        drawCard(50 + i * 100, 300, card, true);
      });
      ctx.fillText(`Total: ${calcTotal(state.playerHand)}`, 50, 430);

      // Draw UI
      ctx.fillText(`Money: $${state.money}`, 50, 50);
      ctx.fillText(`Bet: $${state.bet}`, 250, 50);

      // Draw buttons
      if (gameState === 'betting') {
        ctx.fillStyle = '#4a4aaa';
        ctx.fillRect(300, 500, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.fillText('DEAL', 370, 535);
      } else if (gameState === 'playing') {
        ctx.fillStyle = '#4a4aaa';
        ctx.fillRect(200, 500, 150, 50);
        ctx.fillStyle = '#fff';
        ctx.fillText('HIT', 250, 535);
        
        ctx.fillStyle = '#4a4aaa';
        ctx.fillRect(450, 500, 150, 50);
        ctx.fillStyle = '#fff';
        ctx.fillText('STAND', 485, 535);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = '32px monospace';
        ctx.fillText(gameState, 300, 500);
        
        ctx.fillStyle = '#4a4aaa';
        ctx.fillRect(300, 520, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText('NEW GAME', 325, 555);
      }

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (gameState === 'betting' && x >= 300 && x <= 500 && y >= 500 && y <= 550) {
        createDeck();
        state.playerHand = [state.deck.pop(), state.deck.pop()];
        state.dealerHand = [state.deck.pop(), state.deck.pop()];
        setGameState('playing');
      } else if (gameState === 'playing') {
        if (x >= 200 && x <= 350 && y >= 500 && y <= 550) {
          // HIT
          state.playerHand.push(state.deck.pop());
          if (calcTotal(state.playerHand) > 21) {
            state.money -= state.bet;
            setGameState('BUST!');
          }
        } else if (x >= 450 && x <= 600 && y >= 500 && y <= 550) {
          // STAND
          while (calcTotal(state.dealerHand) < 17) {
            state.dealerHand.push(state.deck.pop());
          }
          const pTotal = calcTotal(state.playerHand);
          const dTotal = calcTotal(state.dealerHand);
          if (dTotal > 21 || pTotal > dTotal) {
            state.money += state.bet;
            state.score += state.bet;
            onScoreChange(state.score);
            onCoachTrigger('You win!');
            setGameState('YOU WIN!');
          } else if (pTotal < dTotal) {
            state.money -= state.bet;
            setGameState('DEALER WINS');
          } else {
            setGameState('PUSH');
          }
        }
      } else if (x >= 300 && x <= 500 && y >= 520 && y <= 570) {
        setGameState('betting');
        state.playerHand = [];
        state.dealerHand = [];
      }
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState, onScoreChange, onCoachTrigger]);

  return <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', minWidth: '1200px', maxWidth: '1400px' }} />;
});

export default SimpleBlackjackGame;