(() => {
  'use strict';
  const arcade = window.DobermanArcade;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const held = (a, id, code) => a.held.has(id) || !!a.keys[code];
  const hit = (x, y, r, box) => x + r > box.x && x - r < box.x + box.w && y + r > box.y && y - r < box.y + box.h;
  function text(c, label, x, y, size = 18, color = '#ffffff', align = 'left') {
    c.fillStyle = color; c.font = `700 ${size}px system-ui, sans-serif`; c.textAlign = align; c.fillText(label, x, y); c.textAlign = 'left';
  }
  function pill(c, label, x, y, w = 170) {
    c.fillStyle = '#18272fe8'; c.fillRect(x, y, w, 32); text(c, label, x + 12, y + 22, 16);
  }
  function lawn(c) {
    c.fillStyle = '#c3eaf2'; c.fillRect(0, 0, 800, 480);
    c.fillStyle = '#ffffffb8';
    [[90, 75], [345, 56], [650, 98]].forEach(([x, y]) => {
      c.beginPath(); c.ellipse(x, y, 70, 20, 0, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = '#8dc272'; c.fillRect(0, 345, 800, 135);
    c.fillStyle = '#76a35e';
    for (let x = 0; x < 800; x += 48) { c.fillRect(x, 352, 3, 12); c.fillRect(x + 13, 367, 3, 9); }
  }

  arcade.register({
    id: 'fetch-catch', title: 'Louis Fetch Catch', eyebrow: 'Catch the good stuff',
    help: 'Move Louis with Left/Right, the buttons, or your finger. Catch 25 bones and toys. Avoid socks! Three drops or sock catches end the round.',
    buttons: [{ id: 'left', label: 'Left', hold: true }, { id: 'right', label: 'Right', hold: true }],
    setup(a) {
      const c = a.ctx;
      let x, items, spawn, score, lives, catches, elapsed, done;
      function reset() {
        x = 400; items = []; spawn = 0.65; score = 0; lives = 3; catches = 0; elapsed = 0; done = false;
        a.score(0); a.status('Catch bones and toys. Let the socks fall past Louis.');
      }
      function hurt(message) {
        lives--; a.status(`${message} ${lives} ${lives === 1 ? 'chance' : 'chances'} left.`);
        if (lives <= 0) { done = true; a.end(`Fetch finished! Louis caught ${catches} goodies.`); }
      }
      function update(dt) {
        if (done) return;
        elapsed += dt;
        x = clamp(x + ((held(a, 'right', 'ArrowRight') ? 1 : 0) - (held(a, 'left', 'ArrowLeft') ? 1 : 0)) * 430 * dt, 40, 760);
        spawn -= dt;
        if (spawn <= 0) {
          const kind = Math.random() < 0.23 ? 'sock' : (Math.random() < 0.55 ? 'bone' : 'toy');
          items.push({ x: 40 + Math.random() * 720, y: -24, kind, speed: 135 + Math.min(165, catches * 6) + Math.random() * 35, spin: Math.random() * 6 });
          spawn = Math.max(0.36, 0.95 - catches * 0.019);
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i]; item.y += item.speed * dt; item.spin += dt * 1.5;
          if (item.y >= 376 && item.y < 435 && Math.abs(item.x - x) < 49) {
            items.splice(i, 1);
            if (item.kind === 'sock') hurt('That was a sock!');
            else {
              catches++; score += item.kind === 'bone' ? 10 : 15; a.score(score);
              if (catches >= 25) { done = true; a.end('Perfect fetch! Louis caught 25 goodies!', true); }
              else a.status(`${catches} of 25 goodies caught. Keep fetching!`);
            }
          } else if (item.y > 495) {
            items.splice(i, 1); if (item.kind !== 'sock') hurt('A goodie got away.');
          }
          if (done) break;
        }
      }
      function draw() {
        lawn(c);
        c.strokeStyle = '#e6ce97'; c.lineWidth = 8;
        for (let fx = 0; fx < 830; fx += 48) { c.beginPath(); c.moveTo(fx, 347); c.lineTo(fx, 292); c.stroke(); }
        c.fillStyle = '#b78b54'; c.fillRect(0, 309, 800, 7); c.fillRect(0, 333, 800, 7);
        items.forEach(item => {
          c.save(); c.translate(item.x, item.y); c.rotate(Math.sin(item.spin) * 0.25);
          if (item.kind === 'bone') a.bone(c, 0, 0, 32);
          else if (item.kind === 'toy') a.toy(c, 0, 0, 32);
          else {
            c.fillStyle = '#716c9f'; c.fillRect(-10, -18, 19, 26); c.fillRect(-10, 5, 31, 13);
            c.fillStyle = '#f4e4ff'; c.fillRect(-10, -17, 19, 5);
            text(c, 'X', 0, 6, 14, '#ffffff', 'center');
          }
          c.restore();
        });
        c.fillStyle = '#47673c44'; c.beginPath(); c.ellipse(x, 446, 49, 10, 0, 0, Math.PI * 2); c.fill();
        a.dog(c, x, 399, 76);
        c.fillStyle = '#b67b46'; c.fillRect(x - 44, 424, 88, 27);
        c.strokeStyle = '#f4cf89'; c.lineWidth = 3; c.strokeRect(x - 44, 424, 88, 27);
        text(c, 'FETCH', x, 444, 15, '#ffffff', 'center');
        pill(c, `GOODIES ${catches} / 25`, 18, 16, 184); pill(c, `CHANCES ${lives}`, 623, 16, 159);
      }
      return { reset, update, draw, pointer(kind, px) { if (kind === 'down' || kind === 'move') x = clamp(px, 40, 760); }, inspect() { return { x, score, lives, catches, items: items.map(i => ({ ...i })), elapsed, done }; } };
    }
  });

  arcade.register({
    id: 'flappy-louis', title: 'Flappy Louis', eyebrow: 'A Doberman takes flight',
    help: 'Tap, press Space or Up, or use Flap to keep Louis flying. Pass 15 garden gates. Touching a gate, the ground, or the top ends the flight.',
    buttons: [{ id: 'flap', label: 'Flap' }],
    setup(a) {
      const c = a.ctx, dogX = 180, radius = 23;
      let y, vy, gates, timer, score, elapsed, done, pressed;
      function reset() {
        y = 225; vy = -100; gates = []; timer = 1.05; score = 0; elapsed = 0; done = false; pressed = new Set();
        a.score(0); a.status('Flap through 15 garden gates. Tap to fly!');
      }
      function flap() { if (!done) vy = -305; }
      function lose() { done = true; a.end(`Louis flew through ${score} ${score === 1 ? 'gate' : 'gates'}. Try another flight!`); }
      function update(dt) {
        if (done) return;
        elapsed += dt; vy += 825 * dt; y += vy * dt; timer -= dt;
        const speed = 178 + Math.min(80, score * 5);
        if (timer <= 0) {
          const gap = Math.max(143, 184 - score * 2.6), middle = 148 + Math.random() * 160;
          gates.push({ x: 835, w: 66, top: middle - gap / 2, bottom: middle + gap / 2, passed: false }); timer = 1.65;
        }
        for (const gate of gates) {
          gate.x -= speed * dt;
          if (dogX + radius > gate.x && dogX - radius < gate.x + gate.w && (y - radius < gate.top || y + radius > gate.bottom)) { lose(); return; }
          if (!gate.passed && gate.x + gate.w < dogX - radius) {
            gate.passed = true; score++; a.score(score); a.status(`${score} of 15 gates cleared!`);
            if (score >= 15) { done = true; a.end('A sky-high success! Louis cleared all 15 gates.', true); return; }
          }
        }
        gates = gates.filter(g => g.x > -90);
        if (y - radius <= 0 || y + radius >= 447) lose();
      }
      function draw() {
        lawn(c);
        c.fillStyle = '#99c9ad';
        for (let i = 0; i < 7; i++) { const bx = ((i * 170 - elapsed * 20) % 1000 + 1000) % 1000 - 100; c.beginPath(); c.arc(bx, 452, 105, Math.PI, 0); c.fill(); }
        gates.forEach(g => {
          c.fillStyle = '#8c4c35'; c.fillRect(g.x + 6, 0, g.w - 12, g.top); c.fillRect(g.x + 6, g.bottom, g.w - 12, 447 - g.bottom);
          c.fillStyle = '#c48a57'; c.fillRect(g.x, g.top - 20, g.w, 20); c.fillRect(g.x, g.bottom, g.w, 20);
          c.fillStyle = '#e7b47a'; c.fillRect(g.x + 10, 0, 8, Math.max(0, g.top - 20)); c.fillRect(g.x + 10, g.bottom + 20, 8, Math.max(0, 427 - g.bottom));
          a.bone(c, g.x + g.w / 2, g.bottom + 43, 22);
        });
        c.fillStyle = '#5d8e4f'; c.fillRect(0, 447, 800, 33); c.fillStyle = '#e8d3a4'; c.fillRect(0, 447, 800, 7);
        c.save(); c.translate(dogX, y); c.rotate(clamp(vy / 750, -0.38, 0.65));
        c.fillStyle = '#fff4dd';
        c.beginPath(); c.ellipse(-31, 9, 21, 10, -0.6 + Math.sin(elapsed * 22) * 0.25, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(31, 9, 21, 10, 0.6 - Math.sin(elapsed * 22) * 0.25, 0, Math.PI * 2); c.fill();
        a.dog(c, 0, 0, 55); c.restore();
        pill(c, `GATES ${score} / 15`, 18, 16, 165);
      }
      return { reset, update, draw, key(code, down) { if (!down) { pressed.delete(code); return; } if (!pressed.has(code) && (code === 'Space' || code === 'ArrowUp' || code === 'KeyW')) flap(); pressed.add(code); }, pointer(kind) { if (kind === 'down') flap(); }, action(id) { if (id === 'flap') flap(); }, inspect() { return { y, vy, score, gates: gates.map(g => ({ ...g })), elapsed, done }; } };
    }
  });

  arcade.register({
    id: 'crosswalk', title: 'Doberman Crosswalk', eyebrow: 'Bring the bones home',
    help: 'Use arrows, WASD, or the direction buttons to cross the roads. Reach the doghouse at the top with 5 bones. Watch for cars! You have 3 lives and 35 seconds per trip.',
    buttons: [{ id: 'left', label: 'Left', hold: true }, { id: 'up', label: 'Up', hold: true }, { id: 'down', label: 'Down', hold: true }, { id: 'right', label: 'Right', hold: true }],
    setup(a) {
      const c = a.ctx, laneRows = [1, 2, 3, 5, 6];
      const colors = ['#dc6b58', '#6db8c3', '#e2b65b', '#9e82c1', '#69b6a2'];
      let col, row, cars, lives, trips, score, time, wait, shield, done;
      const px = () => col * 80 + 40, py = () => row * 60 + 30;
      function position() { col = 4; row = 7; shield = 0.6; wait = 0.17; }
      function reset() {
        lives = 3; trips = 0; score = 0; time = 35; done = false;
        cars = [];
        laneRows.forEach((r, li) => {
          const direction = li % 2 ? -1 : 1;
          for (let i = 0; i < 3; i++) cars.push({ x: i * 335 + (li % 2) * 100, y: r * 60 + 10, w: li % 2 ? 105 : 85, h: 40, speed: direction * (64 + li * 11), color: colors[li] });
        });
        position(); a.score(0); a.status('Carry 5 bones to the doghouse. The middle grass is safe.');
      }
      function hurt(message) {
        lives--;
        if (lives <= 0) { done = true; a.end(`${message} Louis brought home ${trips} of 5 bones.`); }
        else { position(); time = 35; a.status(`${message} ${lives} ${lives === 1 ? 'life' : 'lives'} left.`); }
      }
      function move(dx, dy) {
        if (done || wait > 0) return;
        col = clamp(col + dx, 0, 9); row = clamp(row + dy, 0, 7); wait = 0.15;
        if (row === 0 && (col === 4 || col === 5)) {
          trips++; score += 100; a.score(score);
          if (trips >= 5) { done = true; a.end('All 5 bones delivered! Louis is home safe.', true); }
          else { position(); time = 35; a.status(`${trips} of 5 bones home. The traffic is getting faster!`); }
        } else if (row === 0) a.status('The doghouse is in the middle. Move along the top grass.');
      }
      function direction(id) { if (id === 'left') move(-1, 0); else if (id === 'right') move(1, 0); else if (id === 'up') move(0, -1); else if (id === 'down') move(0, 1); }
      function update(dt) {
        if (done) return;
        wait -= dt; shield = Math.max(0, shield - dt); time -= dt;
        for (const car of cars) {
          car.x += car.speed * (1 + trips * 0.19) * dt;
          if (car.speed > 0 && car.x > 820) car.x = -car.w - 80;
          if (car.speed < 0 && car.x + car.w < -20) car.x = 900;
        }
        if (wait <= 0) {
          if (held(a, 'up', 'ArrowUp') || a.keys.KeyW) direction('up');
          else if (held(a, 'down', 'ArrowDown') || a.keys.KeyS) direction('down');
          else if (held(a, 'left', 'ArrowLeft') || a.keys.KeyA) direction('left');
          else if (held(a, 'right', 'ArrowRight') || a.keys.KeyD) direction('right');
        }
        if (done) return;
        if (shield <= 0 && cars.some(car => hit(px(), py(), 18, car))) hurt('A car bumped Louis!');
        else if (time <= 0) hurt('Time for that trip ran out.');
      }
      function draw() {
        c.fillStyle = '#83b565'; c.fillRect(0, 0, 800, 480);
        laneRows.forEach(r => {
          c.fillStyle = '#3b4650'; c.fillRect(0, r * 60, 800, 60);
          c.fillStyle = '#d5d7c5'; for (let x = 0; x < 800; x += 70) c.fillRect(x, r * 60 + 57, 36, 3);
        });
        c.fillStyle = '#d8c49a'; c.fillRect(347, 44, 106, 16);
        c.fillStyle = '#9b513a'; c.fillRect(349, 8, 102, 43);
        c.fillStyle = '#663525'; c.beginPath(); c.moveTo(333, 13); c.lineTo(400, -15); c.lineTo(467, 13); c.fill();
        c.fillStyle = '#312523'; c.fillRect(382, 25, 36, 26); a.bone(c, 400, 14, 25);
        text(c, 'SAFE GRASS', 22, 272, 16, '#264c2d'); a.bone(c, 735, 270, 31);
        cars.forEach(car => {
          c.fillStyle = '#1b252c'; c.fillRect(car.x + 12, car.y - 4, 19, 48); c.fillRect(car.x + car.w - 31, car.y - 4, 19, 48);
          c.fillStyle = car.color; c.fillRect(car.x, car.y, car.w, car.h);
          c.fillStyle = '#bbdfed'; c.fillRect(car.x + car.w * 0.28, car.y + 5, car.w * 0.4, 30);
          c.fillStyle = '#ffefaa'; c.fillRect(car.speed > 0 ? car.x + car.w - 5 : car.x + 1, car.y + 5, 4, 8); c.fillRect(car.speed > 0 ? car.x + car.w - 5 : car.x + 1, car.y + 27, 4, 8);
        });
        if (shield <= 0 || Math.floor(shield * 12) % 2 === 0) { a.dog(c, px(), py(), 44); a.bone(c, px() + 22, py() + 14, 21); }
        pill(c, `BONES ${trips} / 5`, 16, 448, 154); pill(c, `${lives} LIVES`, 180, 448, 113); pill(c, `${Math.max(0, Math.ceil(time))} SEC`, 665, 448, 120);
      }
      return { reset, update, draw, action: direction, key(code, down) { if (!down) return; const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' }; if (map[code]) direction(map[code]); }, pointer(kind, x, y) { if (kind !== 'down') return; const dx = x - px(), dy = y - py(); direction(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')); }, inspect() { return { col, row, x: px(), y: py(), lives, trips, score, time, shield, cars: cars.map(v => ({ ...v })), done }; } };
    }
  });

  arcade.register({
    id: 'bone-breaker', title: 'Bone Breaker', eyebrow: 'Bounce, bark, break',
    help: 'Move the paddle with Left/Right or your finger. Tap, press Space, or use Launch to serve. Break every bone tile. Three lost balls end the game.',
    buttons: [{ id: 'left', label: 'Left', hold: true }, { id: 'launch', label: 'Launch' }, { id: 'right', label: 'Right', hold: true }],
    setup(a) {
      const c = a.ctx, paddleY = 431, paddleW = 118, radius = 9;
      let paddleX, ball, bricks, lives, score, launched, done;
      function serve() { ball = { x: paddleX, y: paddleY - 18, vx: 192, vy: -275 }; launched = false; }
      function reset() {
        paddleX = 400; bricks = []; lives = 3; score = 0; done = false;
        for (let row = 0; row < 5; row++) for (let col = 0; col < 9; col++) bricks.push({ x: 35 + col * 82, y: 66 + row * 35, w: 74, h: 26, hp: row < 2 ? 2 : 1, color: ['#bc6c4d', '#dc9a68', '#b5a0d1', '#76bfc4', '#d6c173'][row] });
        serve(); a.score(0); a.status('Launch the ball and clear all 45 bone tiles.');
      }
      function launch() { if (!done) { launched = true; a.status('Keep the ball bouncing! High tiles take two hits.'); } }
      function update(dt) {
        if (done) return;
        paddleX = clamp(paddleX + ((held(a, 'right', 'ArrowRight') ? 1 : 0) - (held(a, 'left', 'ArrowLeft') ? 1 : 0)) * 490 * dt, paddleW / 2 + 10, 790 - paddleW / 2);
        if (!launched) { ball.x = paddleX; ball.y = paddleY - 18; return; }
        const oldX = ball.x, oldY = ball.y; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 12 + radius) { ball.x = 12 + radius; ball.vx = Math.abs(ball.vx); }
        if (ball.x > 788 - radius) { ball.x = 788 - radius; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < 39 + radius) { ball.y = 39 + radius; ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && ball.y + radius >= paddleY && oldY - radius < paddleY + 14 && Math.abs(ball.x - paddleX) < paddleW / 2 + radius) {
          const offset = clamp((ball.x - paddleX) / (paddleW / 2), -1, 1), speed = Math.min(550, Math.hypot(ball.vx, ball.vy) + 9);
          const bounceX = Math.sin(offset * 1.08) * speed;
          ball.vx = Math.abs(bounceX) < 75 ? (ball.vx < 0 ? -75 : 75) : bounceX;
          ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx); ball.y = paddleY - radius - 1;
        }
        for (let i = 0; i < bricks.length; i++) {
          const brick = bricks[i];
          if (!hit(ball.x, ball.y, radius, brick)) continue;
          brick.hp--; score += brick.hp ? 5 : 15; a.score(score);
          if (oldY + radius <= brick.y || oldY - radius >= brick.y + brick.h) { ball.vy *= -1; ball.y = oldY; }
          else { ball.vx *= -1; ball.x = oldX; }
          if (brick.hp === 0) bricks.splice(i, 1);
          if (!bricks.length) { done = true; a.end('Every bone tile cleared! Louis is a bouncing champion.', true); return; }
          break;
        }
        if (ball.y > 500) {
          lives--;
          if (!lives) { done = true; a.end(`${45 - bricks.length} tiles cleared. Louis has ${bricks.length} left for next time!`); }
          else { serve(); a.status(`${lives} balls left. Tap or press Launch to serve again.`); }
        }
      }
      function draw() {
        c.fillStyle = '#203d4b'; c.fillRect(0, 0, 800, 480);
        c.strokeStyle = '#ffffff08'; c.lineWidth = 1;
        for (let x = 20; x < 800; x += 40) { c.beginPath(); c.moveTo(x, 38); c.lineTo(x, 480); c.stroke(); }
        for (let y = 40; y < 480; y += 40) { c.beginPath(); c.moveTo(12, y); c.lineTo(788, y); c.stroke(); }
        c.fillStyle = '#537785'; c.fillRect(3, 36, 9, 444); c.fillRect(788, 36, 9, 444); c.fillRect(3, 31, 794, 8);
        bricks.forEach(b => {
          c.fillStyle = '#102832'; c.fillRect(b.x + 2, b.y + 3, b.w, b.h);
          c.fillStyle = b.color; c.fillRect(b.x, b.y, b.w, b.h);
          c.strokeStyle = b.hp === 2 ? '#fff0c8' : '#ffffff55'; c.lineWidth = b.hp === 2 ? 3 : 1; c.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
          a.bone(c, b.x + b.w / 2, b.y + b.h / 2, 24);
        });
        c.fillStyle = '#ddab71'; c.fillRect(paddleX - paddleW / 2, paddleY, paddleW, 14);
        c.fillStyle = '#ffddb1'; c.fillRect(paddleX - paddleW / 2, paddleY, paddleW, 4);
        a.dog(c, paddleX, 461, 31);
        c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(ball.x, ball.y, radius, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#bc643f'; c.beginPath(); c.arc(ball.x - 2, ball.y - 2, 3, 0, Math.PI * 2); c.fill();
        pill(c, `${bricks.length} TILES`, 18, 0, 150); pill(c, `${lives} BALLS`, 658, 0, 124);
        if (!launched && !done) text(c, 'TAP OR PRESS SPACE TO LAUNCH', 400, 350, 20, '#ffe6b9', 'center');
      }
      return { reset, update, draw, action(id) { if (id === 'launch') launch(); }, key(code, down) { if (down && (code === 'Space' || code === 'ArrowUp')) launch(); }, pointer(kind, x) { if (kind === 'down' || kind === 'move') paddleX = clamp(x, paddleW / 2 + 10, 790 - paddleW / 2); if (kind === 'down') launch(); }, inspect() { return { paddleX, ball: { ...ball }, lives, score, launched, bricks: bricks.map(b => ({ ...b })), done }; } };
    }
  });

  arcade.register({
    id: 'space-bark', title: 'Space Bark', eyebrow: 'Defend the doghouse galaxy',
    help: 'Move with Left/Right or your finger. Hold Space or Bark to fire at the toy fleet. Clear 3 waves, dodge toy shots, and keep the fleet away from Louis. Three lives.',
    buttons: [{ id: 'left', label: 'Left', hold: true }, { id: 'fire', label: 'Bark', hold: true }, { id: 'right', label: 'Right', hold: true }],
    setup(a) {
      const c = a.ctx;
      let x, bullets, enemyShots, enemies, offsetX, offsetY, direction, fireIn, attackIn, lives, wave, score, shield, elapsed, done;
      function fleet() {
        enemies = [];
        for (let r = 0; r < 4; r++) for (let col = 0; col < 8; col++) enemies.push({ x: 112 + col * 80, y: 82 + r * 49, col, row: r });
        offsetX = 0; offsetY = 0; direction = 1; attackIn = 1.2; bullets = []; enemyShots = []; shield = 1.3;
      }
      function reset() {
        x = 400; lives = 3; wave = 1; score = 0; elapsed = 0; fireIn = 0; done = false; fleet();
        a.score(0); a.status('Clear three toy fleets. Hold Bark or Space to fire!');
      }
      function fire() {
        if (done || fireIn > 0) return;
        bullets.push({ x, y: 394 }); fireIn = 0.2;
      }
      function update(dt) {
        if (done) return;
        elapsed += dt; fireIn = Math.max(0, fireIn - dt); attackIn -= dt; shield = Math.max(0, shield - dt);
        x = clamp(x + ((held(a, 'right', 'ArrowRight') ? 1 : 0) - (held(a, 'left', 'ArrowLeft') ? 1 : 0)) * 390 * dt, 31, 769);
        if (held(a, 'fire', 'Space')) fire();
        const speed = 29 + wave * 11 + (32 - enemies.length) * 1.2;
        offsetX += direction * speed * dt;
        const left = Math.min(...enemies.map(e => e.x + offsetX)), right = Math.max(...enemies.map(e => e.x + offsetX));
        if ((direction > 0 && right > 771) || (direction < 0 && left < 29)) { direction *= -1; offsetY += 17; }
        if (attackIn <= 0 && enemies.length) {
          const col = Math.floor(Math.random() * 8), column = enemies.filter(e => e.col === col);
          const enemy = column.length ? column.reduce((a, b) => a.y > b.y ? a : b) : enemies[Math.floor(Math.random() * enemies.length)];
          enemyShots.push({ x: enemy.x + offsetX, y: enemy.y + offsetY + 16 }); attackIn = Math.max(0.32, 1.16 - wave * 0.15 - (32 - enemies.length) * 0.013);
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
          const shot = bullets[i]; shot.y -= 570 * dt;
          const ei = enemies.findIndex(e => Math.abs(e.x + offsetX - shot.x) < 22 && Math.abs(e.y + offsetY - shot.y) < 21);
          if (ei >= 0) {
            enemies.splice(ei, 1); bullets.splice(i, 1); score += 20; a.score(score);
          } else if (shot.y < -20) bullets.splice(i, 1);
        }
        if (!enemies.length) {
          score += 100; a.score(score);
          if (wave >= 3) { done = true; a.end('Galaxy saved! Louis cleared all three toy fleets.', true); }
          else { wave++; fleet(); a.status(`Wave ${wave} of 3! The toys are getting faster.`); }
          return;
        }
        for (let i = enemyShots.length - 1; i >= 0; i--) {
          const shot = enemyShots[i]; shot.y += (170 + wave * 28) * dt;
          if (shield <= 0 && Math.abs(shot.x - x) < 27 && Math.abs(shot.y - 422) < 27) {
            enemyShots.splice(i, 1); lives--; shield = 1.4;
            if (!lives) { done = true; a.end(`Louis reached wave ${wave}. The toy fleet wins this round.`); return; }
            a.status(`${lives} lives left. Watch those toy shots!`);
          } else if (shot.y > 500) enemyShots.splice(i, 1);
        }
        if (enemies.some(e => e.y + offsetY > 383)) { done = true; a.end('The toy fleet reached the doghouse! Try another mission.'); }
      }
      function draw() {
        const gradient = c.createLinearGradient(0, 0, 0, 480); gradient.addColorStop(0, '#10182f'); gradient.addColorStop(1, '#344d69'); c.fillStyle = gradient; c.fillRect(0, 0, 800, 480);
        for (let i = 0; i < 62; i++) { c.fillStyle = i % 3 ? '#b9d5d9' : '#ffdf9d'; c.fillRect((i * 137 + 33) % 800, ((i * 89 + elapsed * (8 + i % 5)) % 470), i % 3 ? 2 : 3, i % 3 ? 2 : 3); }
        c.strokeStyle = '#658a9a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 461); c.lineTo(800, 461); c.stroke();
        enemies.forEach(e => {
          const ex = e.x + offsetX, ey = e.y + offsetY;
          c.fillStyle = ['#ad78ba', '#6dbac3', '#dca46b', '#99bf76'][e.row]; c.beginPath(); c.ellipse(ex, ey + 5, 27, 9, 0, 0, Math.PI * 2); c.fill();
          a.toy(c, ex, ey - 4, 29); c.fillStyle = '#fff5ce'; c.fillRect(ex - 19, ey + 6, 5, 3); c.fillRect(ex + 14, ey + 6, 5, 3);
        });
        bullets.forEach(b => { c.fillStyle = '#ffedb0'; c.fillRect(b.x - 3, b.y - 10, 6, 18); c.fillStyle = '#e1a877'; c.fillRect(b.x - 1, b.y + 8, 2, 8); });
        enemyShots.forEach(b => { a.toy(c, b.x, b.y, 16); });
        c.fillStyle = '#90503b'; c.beginPath(); c.moveTo(x - 36, 447); c.lineTo(x - 24, 413); c.lineTo(x + 24, 413); c.lineTo(x + 36, 447); c.closePath(); c.fill();
        c.fillStyle = '#ffbf76'; c.beginPath(); c.moveTo(x - 11, 450); c.lineTo(x + 11, 450); c.lineTo(x, 462 + Math.sin(elapsed * 35) * 5); c.fill();
        if (shield <= 0 || Math.floor(shield * 12) % 2 === 0) a.dog(c, x, 420, 55);
        pill(c, `WAVE ${wave} / 3`, 18, 10, 150); pill(c, `${lives} LIVES`, 659, 10, 123);
      }
      return { reset, update, draw, action(id) { if (id === 'fire') fire(); }, key(code, down) { if (down && code === 'Space') fire(); }, pointer(kind, px) { if (kind === 'down' || kind === 'move') x = clamp(px, 31, 769); if (kind === 'down') fire(); }, inspect() { return { x, lives, wave, score, shield, enemies: enemies.map(e => ({ ...e, screenX: e.x + offsetX, screenY: e.y + offsetY })), bullets: bullets.map(b => ({ ...b })), enemyShots: enemyShots.map(b => ({ ...b })), done }; } };
    }
  });
})();
