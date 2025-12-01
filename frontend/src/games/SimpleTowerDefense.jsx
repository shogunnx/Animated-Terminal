import { useEffect, useRef, forwardRef } from 'react';

const SimpleTowerDefense = forwardRef(({ onScoreChange, onCoachTrigger }, ref) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    path: [[0, 300], [200, 300], [200, 150], [600, 150], [600, 450], [800, 450]],
    enemies: [],
    towers: [],
    bullets: [],
    wave: 1,
    money: 200,
    score: 0,
    lives: 10,
    selectedTower: null
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;
    let enemySpawnTimer = 0;

    const spawnEnemy = () => {
      state.enemies.push({
        x: 0,
        y: 300,
        pathIndex: 0,
        health: 50 * state.wave,
        maxHealth: 50 * state.wave,
        speed: 1
      });
    };

    const gameLoop = () => {
      ctx.fillStyle = '#0a4a0a';
      ctx.fillRect(0, 0, 800, 600);

      // Draw path
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 40;
      ctx.beginPath();
      state.path.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.stroke();

      // Spawn enemies
      enemySpawnTimer++;
      if (enemySpawnTimer > 60 && state.enemies.length < state.wave * 5) {
        spawnEnemy();
        enemySpawnTimer = 0;
      }

      // Update enemies
      state.enemies = state.enemies.filter(enemy => {
        if (enemy.pathIndex < state.path.length - 1) {
          const target = state.path[enemy.pathIndex + 1];
          const dx = target[0] - enemy.x;
          const dy = target[1] - enemy.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 5) {
            enemy.pathIndex++;
          } else {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }

          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Health bar
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * (enemy.health / enemy.maxHealth), 3);

          return true;
        } else {
          state.lives--;
          return false;
        }
      });

      // Update towers
      state.towers.forEach(tower => {
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(tower.x - 15, tower.y - 15, 30, 30);

        // Shoot at enemies
        if (tower.cooldown > 0) {
          tower.cooldown--;
        } else {
          const target = state.enemies.find(e => {
            const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
            return dist < 150;
          });

          if (target) {
            state.bullets.push({
              x: tower.x,
              y: tower.y,
              targetX: target.x,
              targetY: target.y,
              target: target,
              damage: 25
            });
            tower.cooldown = 30;
          }
        }
      });

      // Update bullets
      state.bullets = state.bullets.filter(bullet => {
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10 || !bullet.target) {
          if (bullet.target) {
            bullet.target.health -= bullet.damage;
            if (bullet.target.health <= 0) {
              state.money += 20;
              state.score += 10;
              onScoreChange(state.score);
              state.enemies = state.enemies.filter(e => e !== bullet.target);
            }
          }
          return false;
        }

        bullet.x += (dx / dist) * 10;
        bullet.y += (dy / dist) * 10;

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // UI
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 800, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`Wave: ${state.wave}  Money: $${state.money}  Lives: ${state.lives}  Score: ${state.score}`, 10, 25);

      if (state.lives <= 0) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '48px monospace';
        ctx.fillText('GAME OVER', 250, 300);
      }

      requestAnimationFrame(gameLoop);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (y > 40 && state.money >= 100 && state.lives > 0) {
        state.towers.push({ x, y, cooldown: 0 });
        state.money -= 100;
      }
    };

    canvas.addEventListener('click', handleClick);
    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [onScoreChange, onCoachTrigger]);

  return (
    <div>
      <canvas ref={canvasRef} width={1400} height={800} style={{ width: '100%', height: 'auto', background: '#0a4a0a' }} />
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>Click anywhere to place a tower ($100)</div>
    </div>
  );
});

export default SimpleTowerDefense;