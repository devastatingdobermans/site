(() => {
  'use strict';

  const colors = {
    ink: '#351b14', rust: '#b86b3e', red: '#713b2c', cream: '#fff3da',
    gold: '#f2bf62', grass: '#84a868', darkGrass: '#5b7c49', sky: '#c4e2e6'
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const integer = max => Math.floor(Math.random() * max);

  function box(ctx, x, y, w, h, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function label(ctx, value, x, y, size = 22, color = colors.ink, align = 'center') {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y);
  }
  function backdrop(api, name, detail) {
    const {ctx, W, H} = api;
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#e7f2eb');
    gradient.addColorStop(1, '#b6cfa1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#91ae76';
    ctx.beginPath(); ctx.ellipse(140, H + 22, 440, 145, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f9d65';
    ctx.beginPath(); ctx.ellipse(680, H + 40, 440, 145, 0, 0, Math.PI * 2); ctx.fill();
    box(ctx, 20, 16, W - 40, 63, 18, 'rgba(255,247,227,.94)');
    label(ctx, name, 40, 41, 24, colors.ink, 'left');
    if (detail) label(ctx, detail, W - 40, 43, 20, colors.red, 'right');
  }
  function paw(ctx, x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, size * .12, size * .3, size * .25, 0, 0, Math.PI * 2); ctx.fill();
    [[-.29, -.19], [-.11, -.36], [.12, -.36], [.3, -.18]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.ellipse(px * size, py * size, size * .115, size * .145, px, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
  function latch() {
    const down = new Set();
    return {
      press(code, isDown) {
        if (!isDown) { down.delete(code); return false; }
        if (down.has(code)) return false;
        down.add(code); return true;
      },
      clear() { down.clear(); }
    };
  }

  window.DobermanArcade.register({
    id: 'toy-pounce', title: 'Louis Toy Pounce', eyebrow: 'Quick paws',
    help: 'Tap popping toys or press 1-6. Leave the blue bath sponges alone! Score 180 points in 30 seconds; three sponges end the round.',
    buttons: Array.from({length: 6}, (_, i) => ({id: `pounce-${i}`, label: `Hole ${i + 1}`})),
    setup(api) {
      const {ctx} = api, keys = latch();
      const positions = Array.from({length: 6}, (_, i) => ({x: 200 + (i % 3) * 200, y: 206 + Math.floor(i / 3) * 157}));
      let holes, time, points, strikes, spawnClock, finished, feedback;
      function reset() {
        holes = positions.map(() => ({kind: null, life: 0, flash: 0, message: ''}));
        time = 30; points = 0; strikes = 0; spawnClock = .25; finished = false; feedback = 'Toys: +10   Sponges: -15';
        keys.clear(); api.score(0); api.status('Help Louis collect toys. Leave bath time for later!');
      }
      function finish(message, won) {
        if (finished) return;
        finished = true; api.end(message, won);
      }
      function hit(index) {
        if (finished || !holes[index] || !holes[index].kind) return;
        const hole = holes[index];
        if (hole.kind === 'toy') {
          points += 10; hole.message = '+10'; feedback = 'Good pounce, Louis!';
        } else {
          points = Math.max(0, points - 15); strikes++; hole.message = 'BATH!';
          feedback = `Sponge ${strikes} of 3. Aim for the toys!`;
        }
        hole.kind = null; hole.life = 0; hole.flash = .5;
        api.score(points); api.status(feedback);
        if (strikes >= 3) finish(`Bath time! ${points} points. Try again and avoid the blue sponges.`, false);
      }
      function update(dt) {
        if (finished) return;
        time = Math.max(0, time - dt);
        holes.forEach(hole => {
          hole.flash = Math.max(0, hole.flash - dt);
          if (hole.kind) { hole.life -= dt; if (hole.life <= 0) hole.kind = null; }
        });
        if (time <= 0) {
          finish(points >= 180 ? `Toy champion! Louis scored ${points} points.` : `${points} points! Get 180 to win the toy challenge.`, points >= 180);
          return;
        }
        spawnClock -= dt;
        if (spawnClock <= 0) {
          const free = holes.map((hole, i) => hole.kind || hole.flash > 0 ? -1 : i).filter(i => i >= 0);
          if (free.length) {
            const hole = holes[free[integer(free.length)]];
            hole.kind = Math.random() < .23 ? 'sponge' : 'toy'; hole.life = time < 12 ? 1.05 : 1.3;
          }
          spawnClock = time < 12 ? .43 : .59;
        }
      }
      function draw() {
        ctx.save();
        backdrop(api, 'TOY POUNCE', `${Math.ceil(time)}s  |  ${points}/180  |  Sponges ${strikes}/3`);
        api.dog(ctx, 58, 285, 65);
        label(ctx, 'LOUIS', 58, 331, 13, colors.red);
        positions.forEach((point, index) => {
          const hole = holes[index];
          ctx.fillStyle = '#547047'; ctx.beginPath(); ctx.ellipse(point.x, point.y + 34, 80, 27, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#4b3024'; ctx.beginPath(); ctx.ellipse(point.x, point.y + 27, 68, 23, 0, 0, Math.PI * 2); ctx.fill();
          if (hole.kind === 'toy') {
            ctx.fillStyle = '#f9d494'; ctx.beginPath(); ctx.arc(point.x, point.y - 8, 48, 0, Math.PI * 2); ctx.fill();
            api.toy(ctx, point.x, point.y - 10, 65);
          } else if (hole.kind === 'sponge') {
            box(ctx, point.x - 40, point.y - 47, 80, 60, 15, '#79c7d8', '#24546b');
            [[-23,-31], [1,-37], [22,-23], [-12,-8], [23,0]].forEach(([x,y]) => {
              ctx.fillStyle = '#3b93b2'; ctx.beginPath(); ctx.arc(point.x + x, point.y + y, 5, 0, Math.PI * 2); ctx.fill();
            });
            label(ctx, 'BATH', point.x, point.y + 1, 16, '#163a4a');
          }
          box(ctx, point.x - 19, point.y + 45, 38, 30, 9, colors.cream);
          label(ctx, index + 1, point.x, point.y + 60, 20);
          if (hole.flash > 0) label(ctx, hole.message, point.x, point.y - 58, 25, hole.message === '+10' ? '#2b5d31' : '#8b2b25');
        });
        box(ctx, 122, 435, 556, 32, 12, 'rgba(255,247,227,.9)');
        label(ctx, feedback, 400, 451, 17);
        ctx.restore();
      }
      return {
        reset, update, draw,
        key(code, isDown) { if (keys.press(code, isDown)) { const match = /^(?:Digit|Numpad)([1-6])$/.exec(code); if (match) hit(Number(match[1]) - 1); } },
        action(id) { if (id.startsWith('pounce-')) hit(Number(id.slice(7))); },
        pointer(kind, x, y) {
          if (kind !== 'down') return;
          const index = positions.findIndex(p => Math.abs(p.x - x) < 85 && y > p.y - 70 && y < p.y + 77);
          if (index >= 0) hit(index);
        },
        inspect() { return {time, points, strikes, finished, holes: holes.map(h => ({...h})), positions}; }
      };
    }
  });

  window.DobermanArcade.register({
    id: 'bark-beats', title: 'Louis Bark Beats', eyebrow: 'Memory mix',
    help: 'Watch the numbered paw pads light up, then repeat the pattern by tapping or pressing 1-4. Complete an eight-pad pattern to win. No sound needed.',
    buttons: [1, 2, 3, 4].map(n => ({id: `beat-${n - 1}`, label: `Paw ${n}`})),
    setup(api) {
      const {ctx} = api, keys = latch();
      const pads = [
        {x: 166, y: 111, color: '#a94a34', light: '#f39068'},
        {x: 423, y: 111, color: '#527d58', light: '#b2dc80'},
        {x: 166, y: 278, color: '#426f8b', light: '#8ccee8'},
        {x: 423, y: 278, color: '#94712e', light: '#f5d06f'}
      ];
      let sequence, phase, clock, input, round, points, activePad, flashTime, finished;
      function watch() { phase = 'watch'; clock = 0; activePad = -1; input = 0; api.status(`Watch Louis: round ${round} of 8.`); }
      function reset() {
        sequence = [integer(4)]; round = 1; points = 0; flashTime = 0; finished = false; keys.clear(); api.score(0); watch();
      }
      function press(index) {
        if (finished || phase !== 'input') return;
        activePad = index; flashTime = .22;
        if (index !== sequence[input]) {
          finished = true; phase = 'wrong'; api.end(`Oops! That was paw ${sequence[input] + 1}. Louis completed ${round - 1} rounds.`, false); return;
        }
        input++;
        if (input === sequence.length) {
          points += round * 25; api.score(points);
          if (round === 8) {
            phase = 'won'; finished = true; api.end('Perfect paws! You remembered all eight beats.', true);
          } else { phase = 'success'; clock = 0; api.status('Good memory! The next pattern adds one paw.'); }
        } else api.status(`Your turn: ${input} of ${sequence.length} paws matched.`);
      }
      function update(dt) {
        if (finished) return;
        if (flashTime > 0) { flashTime = Math.max(0, flashTime - dt); if (flashTime === 0) activePad = -1; }
        clock += dt;
        if (phase === 'watch') {
          const elapsed = clock - .8;
          const step = Math.floor(elapsed / .73);
          activePad = elapsed >= 0 && step < sequence.length && elapsed % .73 < .49 ? sequence[step] : -1;
          if (clock >= .8 + sequence.length * .73 + .2) {
            phase = 'input'; clock = 0; activePad = -1;
            api.status(`Your turn! Repeat ${sequence.length} ${sequence.length === 1 ? 'paw' : 'paws'}.`);
          }
        } else if (phase === 'success' && clock >= .9) { sequence.push(integer(4)); round++; watch(); }
      }
      function draw() {
        ctx.save(); backdrop(api, 'BARK BEATS', `Round ${round}/8  |  ${points} points`);
        pads.forEach((pad, index) => {
          const lit = activePad === index;
          ctx.save();
          if (lit) { ctx.shadowColor = '#fff6ac'; ctx.shadowBlur = 24; }
          box(ctx, pad.x, pad.y, 211, 145, 24, lit ? pad.light : pad.color, '#fff3da');
          ctx.restore();
          paw(ctx, pad.x + 104, pad.y + 63, 77, lit ? '#fff7dd' : '#f5e3bf');
          label(ctx, index + 1, pad.x + 104, pad.y + 119, 22, lit ? colors.ink : '#fff7dd');
        });
        api.dog(ctx, 735, 349, 60);
        const message = phase === 'watch' ? 'WATCH THE PAWS' : phase === 'input' ? `YOUR TURN: ${input}/${sequence.length}` : phase === 'success' ? 'GOOD DOG!' : phase === 'won' ? 'PERFECT PAWS!' : 'TRY AGAIN';
        box(ctx, 180, 442, 440, 29, 12, colors.cream); label(ctx, message, 400, 457, 17);
        ctx.restore();
      }
      return {
        reset, update, draw,
        key(code, isDown) { if (keys.press(code, isDown)) { const match = /^(?:Digit|Numpad)([1-4])$/.exec(code); if (match) press(Number(match[1]) - 1); } },
        action(id) { if (id.startsWith('beat-')) press(Number(id.slice(5))); },
        pointer(kind, x, y) { if (kind === 'down') { const index = pads.findIndex(p => x >= p.x && x <= p.x + 211 && y >= p.y && y <= p.y + 145); if (index >= 0) press(index); } },
        inspect() { return {sequence: [...sequence], phase, clock, input, round, points, activePad, finished}; }
      };
    }
  });

  window.DobermanArcade.register({
    id: 'quick-fetch', title: 'Louis Quick Fetch', eyebrow: 'Reaction race',
    help: 'Wait for the green GO sign, then tap anywhere, press Space, or press Fetch. Complete five trials. Pressing early or waiting over two seconds ends the round.',
    buttons: [{id: 'fetch', label: 'Fetch! (Space)'}],
    setup(api) {
      const {ctx} = api, keys = latch();
      let phase, clock, delay, trials, lastMs, points, finished;
      function wait() { phase = 'wait'; clock = 0; delay = random(1.6, 4.1); api.status(`Trial ${trials.length + 1} of 5: wait for GO!`); }
      function reset() { trials = []; lastMs = null; points = 0; finished = false; keys.clear(); api.score(0); wait(); }
      function fetch() {
        if (finished || phase === 'result') return;
        if (phase === 'wait') { phase = 'early'; finished = true; api.end('Too soon! Louis must stay until the green GO sign. Try again.', false); return; }
        if (phase === 'go') {
          lastMs = Math.round(clock * 1000); trials.push(lastMs);
          points += Math.max(10, 1000 - lastMs); api.score(points);
          phase = 'result'; clock = 0;
          if (trials.length === 5) {
            const average = Math.round(trials.reduce((sum, ms) => sum + ms, 0) / 5);
            finished = true; phase = 'won'; api.end(`Fast fetch! Five trials complete. Average reaction: ${average} ms.`, true);
          } else api.status(`${lastMs} ms! Get ready for trial ${trials.length + 1}.`);
        }
      }
      function update(dt) {
        if (finished) return;
        clock += dt;
        if (phase === 'wait' && clock >= delay) { phase = 'go'; clock = 0; api.status('GO! Fetch now!'); }
        else if (phase === 'go' && clock >= 2) { phase = 'late'; finished = true; api.end('The toy got away! Fetch within two seconds of GO. Try again.', false); }
        else if (phase === 'result' && clock >= 1.1) wait();
      }
      function draw() {
        const currentTrial = trials.length + (['wait', 'go', 'early', 'late'].includes(phase) ? 1 : 0);
        ctx.save(); backdrop(api, 'QUICK FETCH', `Trial ${Math.min(5, currentTrial)}/5`);
        ctx.fillStyle = '#86a968'; ctx.fillRect(0, 346, 800, 134);
        ctx.strokeStyle = '#e6dec3'; ctx.lineWidth = 4;
        for (let x = 20; x < 800; x += 65) { ctx.beginPath(); ctx.moveTo(x, 360); ctx.lineTo(x + 28, 360); ctx.stroke(); }
        const go = phase === 'go';
        ctx.fillStyle = go ? '#246842' : phase === 'early' || phase === 'late' ? '#8b342c' : '#73422f';
        ctx.beginPath(); ctx.arc(400, 227, 119, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff4d6'; ctx.lineWidth = 7; ctx.stroke();
        const text = go ? 'GO!' : phase === 'wait' ? 'STAY' : phase === 'early' ? 'EARLY!' : phase === 'late' ? 'TOO LATE' : `${lastMs} ms`;
        label(ctx, text, 400, 221, go ? 62 : 35, '#fff7df');
        label(ctx, go ? 'FETCH NOW' : phase === 'wait' ? 'Wait for green...' : phase === 'won' ? 'FIVE FETCHES!' : phase === 'result' ? 'Nice fetch!' : 'Restart to try again', 400, 279, 17, '#fff7df');
        api.dog(ctx, go ? 225 : 151, 326, 102); api.toy(ctx, 644, 318, 67);
        for (let i = 0; i < 5; i++) {
          box(ctx, 125 + i * 113, 400, 101, 49, 13, i < trials.length ? colors.cream : '#b4c892');
          label(ctx, i < trials.length ? `${trials[i]} ms` : `Fetch ${i + 1}`, 175 + i * 113, 425, 17);
        }
        ctx.restore();
      }
      return {
        reset, update, draw,
        key(code, isDown) { if (keys.press(code, isDown) && (code === 'Space' || code === 'Enter')) fetch(); },
        action(id) { if (id === 'fetch') fetch(); },
        pointer(kind) { if (kind === 'down') fetch(); },
        inspect() { return {phase, clock, delay, trials: [...trials], lastMs, points, finished}; }
      };
    }
  });

  window.DobermanArcade.register({
    id: 'bone-toss', title: 'Louis Bone Toss', eyebrow: 'Backyard trick shots',
    help: 'Use Left/Right to change angle and Down/Up for power, then Space to toss. Phone players can use the buttons below. Land at least three of five bones in the basket.',
    buttons: [
      {id: 'angle-down', label: 'Angle -'}, {id: 'angle-up', label: 'Angle +'},
      {id: 'power-down', label: 'Power -'}, {id: 'power-up', label: 'Power +'},
      {id: 'toss', label: 'Toss bone (Space)'}
    ],
    setup(api) {
      const {ctx} = api, keys = latch(), origin = {x: 119, y: 357}, gravity = 560;
      let angle, power, basket, projectile, shots, catches, points, phase, clock, feedback, finished;
      function reset() {
        angle = 50; power = 560; basket = {x: 566, y: 335, w: 105, h: 59}; projectile = null;
        shots = 0; catches = 0; points = 0; phase = 'aim'; clock = 0; feedback = 'Aim the dotted arc into the basket.'; finished = false;
        keys.clear(); api.score(0); api.status('Five bones. Catch three to win! Adjust the angle and power.');
      }
      function launch() {
        if (phase !== 'aim' || finished) return;
        const radians = angle * Math.PI / 180;
        projectile = {x: origin.x, y: origin.y, vx: Math.cos(radians) * power, vy: -Math.sin(radians) * power, rotation: 0};
        shots++; phase = 'flight'; clock = 0; feedback = 'Fetch that basket!'; api.status(`Bone ${shots} of 5 is flying!`);
      }
      function resolve(caught) {
        projectile = null; phase = 'result'; clock = 0;
        if (caught) { catches++; points += 100; api.score(points); feedback = 'IN THE BASKET! +100'; }
        else feedback = 'Missed! Adjust the angle or power.';
        api.status(`${caught ? 'Good toss!' : 'Almost!'} ${catches} of ${shots} bones caught.`);
      }
      function action(id) {
        if (finished || phase !== 'aim') return;
        if (id === 'angle-down') angle = clamp(angle - 5, 20, 75);
        else if (id === 'angle-up') angle = clamp(angle + 5, 20, 75);
        else if (id === 'power-down') power = clamp(power - 20, 320, 680);
        else if (id === 'power-up') power = clamp(power + 20, 320, 680);
        else if (id === 'toss') launch();
      }
      function update(dt) {
        if (finished) return;
        clock += dt;
        if (phase === 'flight' && projectile) {
          const previous = {x: projectile.x, y: projectile.y};
          projectile.x += projectile.vx * dt;
          projectile.y += projectile.vy * dt + gravity * dt * dt / 2;
          projectile.vy += gravity * dt; projectile.rotation += dt * 5;
          if (projectile.vy > 0 && previous.y <= basket.y && projectile.y >= basket.y) {
            const fraction = (basket.y - previous.y) / (projectile.y - previous.y);
            const crossingX = previous.x + (projectile.x - previous.x) * fraction;
            if (crossingX > basket.x + 9 && crossingX < basket.x + basket.w - 9) { resolve(true); return; }
          }
          if (projectile.y > 394 || projectile.x > 830 || clock > 5) resolve(false);
        } else if (phase === 'result' && clock >= 1.1) {
          if (shots >= 5) {
            phase = 'done'; finished = true;
            api.end(catches >= 3 ? `Basket champion! Louis caught ${catches} of 5 bones.` : `${catches} of 5 bones caught. Get at least three to win!`, catches >= 3);
          } else {
            basket.x = random(488, 672); phase = 'aim'; clock = 0; feedback = 'New basket spot! Follow the dotted arc.';
            api.status(`Bone ${shots + 1} of 5. The basket moved!`);
          }
        }
      }
      function draw() {
        ctx.save(); backdrop(api, 'BONE TOSS', `Bones ${shots}/5  |  Catches ${catches}/3`);
        ctx.fillStyle = '#a0b679'; ctx.fillRect(0, 395, 800, 85);
        ctx.strokeStyle = '#fff6dd'; ctx.lineWidth = 4;
        for (let x = 20; x < 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 306); ctx.lineTo(x, 388); ctx.stroke(); }
        ctx.strokeStyle = '#f3e5c2'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 329); ctx.lineTo(800, 329); ctx.moveTo(0, 371); ctx.lineTo(800, 371); ctx.stroke();
        if (phase === 'aim') {
          const radians = angle * Math.PI / 180;
          ctx.strokeStyle = 'rgba(85,54,35,.65)'; ctx.lineWidth = 3; ctx.setLineDash([4, 8]); ctx.beginPath();
          for (let t = 0; t <= 2.65; t += .04) {
            const x = origin.x + Math.cos(radians) * power * t;
            const y = origin.y - Math.sin(radians) * power * t + gravity * t * t / 2;
            if (y > 395 && t > 0) break;
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke(); ctx.setLineDash([]);
          api.bone(ctx, origin.x, origin.y, 29);
        }
        api.dog(ctx, 90, 375, 79);
        box(ctx, basket.x, basket.y, basket.w, basket.h, 8, '#aa663d', '#633c26');
        ctx.save(); ctx.beginPath(); ctx.rect(basket.x + 3, basket.y + 3, basket.w - 6, basket.h - 6); ctx.clip();
        ctx.strokeStyle = '#e8b66c'; ctx.lineWidth = 3;
        for (let x = basket.x - 60; x < basket.x + basket.w + 60; x += 18) { ctx.beginPath(); ctx.moveTo(x, basket.y); ctx.lineTo(x + 60, basket.y + basket.h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, basket.y); ctx.lineTo(x - 60, basket.y + basket.h); ctx.stroke(); }
        ctx.restore();
        box(ctx, basket.x - 5, basket.y - 5, basket.w + 10, 11, 5, '#f4ca83', '#633c26');
        if (projectile) { ctx.save(); ctx.translate(projectile.x, projectile.y); ctx.rotate(projectile.rotation); api.bone(ctx, 0, 0, 29); ctx.restore(); }
        box(ctx, 35, 94, 233, 80, 14, colors.cream);
        label(ctx, `Angle ${angle} degrees`, 151, 118, 20); label(ctx, `Power ${Math.round((power - 320) / 360 * 100)}%`, 151, 149, 20);
        box(ctx, 100, 424, 600, 36, 14, colors.cream); label(ctx, feedback, 400, 442, 19);
        ctx.restore();
      }
      return {
        reset, update, draw, action,
        key(code, isDown) {
          if (!keys.press(code, isDown)) return;
          const actions = {ArrowLeft: 'angle-down', ArrowRight: 'angle-up', ArrowDown: 'power-down', ArrowUp: 'power-up', Space: 'toss', Enter: 'toss'};
          if (actions[code]) action(actions[code]);
        },
        inspect() { return {angle, power, basket: {...basket}, projectile: projectile ? {...projectile} : null, shots, catches, points, phase, clock, finished}; }
      };
    }
  });

  window.DobermanArcade.register({
    id: 'treasure-dig', title: 'Louis Treasure Dig', eyebrow: 'Garden brain teaser',
    help: 'Dig every safe square without finding a bath sponge. Numbers count nearby sponges. Your first dig is safe. Toggle Flag mode to mark danger; arrows and Space also work. Clear the garden in 120 seconds.',
    buttons: [{id: 'flag-mode', label: 'Toggle flag / dig (F)'}, {id: 'dig-selected', label: 'Dig selected (Space)'}],
    setup(api) {
      const {ctx} = api, keys = latch();
      const cols = 8, rows = 6, cell = 52, left = 300, top = 106, mineCount = 8;
      const numberColors = ['', '#255f9c', '#2d6c35', '#a43b2b', '#704a91', '#84522b', '#2b7375', '#38362b', '#202020'];
      let board, planted, flagMode, revealed, flags, time, points, selected, finished, hitMine;
      const indexAt = (x, y) => y * cols + x;
      function neighbors(index) {
        const x = index % cols, y = Math.floor(index / cols), result = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && x + dx >= 0 && x + dx < cols && y + dy >= 0 && y + dy < rows) result.push(indexAt(x + dx, y + dy));
        }
        return result;
      }
      function reset() {
        board = Array.from({length: cols * rows}, () => ({mine: false, count: 0, open: false, flag: false}));
        planted = false; flagMode = false; revealed = 0; flags = 0; time = 120; points = 0; selected = 0; finished = false; hitMine = -1;
        keys.clear(); api.score(0); api.status('Dig a safe path for Louis. Your first dig and its neighbors are safe!');
      }
      function plant(first) {
        const safe = new Set([first, ...neighbors(first)]);
        const available = board.map((_, i) => i).filter(i => !safe.has(i));
        for (let n = 0; n < mineCount; n++) {
          const choice = integer(available.length); board[available[choice]].mine = true; available.splice(choice, 1);
        }
        board.forEach((tile, i) => { if (!tile.mine) tile.count = neighbors(i).filter(n => board[n].mine).length; });
        planted = true;
      }
      function toggleFlag(index) {
        const tile = board[index];
        if (tile.open) return;
        if (!tile.flag && flags === mineCount) { api.status('All eight flags are in use. Remove a flag to move it.'); return; }
        tile.flag = !tile.flag; flags += tile.flag ? 1 : -1;
        api.status(`Flag mode ${flagMode ? 'on' : 'off'}. ${flags} of 8 danger flags placed.`);
      }
      function dig(index) {
        if (finished || !board[index]) return;
        selected = index;
        if (flagMode) { toggleFlag(index); return; }
        const tile = board[index];
        if (tile.open || tile.flag) return;
        if (!planted) plant(index);
        if (tile.mine) {
          hitMine = index; finished = true; tile.open = true;
          api.end('A bath sponge! Louis is heading for the tub. Restart and try another path.', false); return;
        }
        const pending = [index], visited = new Set();
        while (pending.length) {
          const next = pending.pop(), square = board[next];
          if (visited.has(next) || square.open || square.flag || square.mine) continue;
          visited.add(next); square.open = true; revealed++;
          if (square.count === 0) neighbors(next).forEach(n => pending.push(n));
        }
        points = revealed * 10; api.score(points);
        if (revealed === cols * rows - mineCount) {
          points += Math.ceil(time); api.score(points); finished = true;
          api.end(`Treasure found! All 40 safe squares dug with ${Math.ceil(time)} seconds left.`, true);
        } else api.status(`${revealed} of 40 safe squares dug. Numbers count nearby bath sponges.`);
      }
      function action(id) {
        if (finished) return;
        if (id === 'flag-mode') { flagMode = !flagMode; api.status(flagMode ? 'FLAG mode: tap covered squares to mark danger.' : 'DIG mode: tap safe squares to uncover them.'); }
        else if (id === 'dig-selected') dig(selected);
      }
      function update(dt) {
        if (finished) return;
        time = Math.max(0, time - dt);
        if (time <= 0) { finished = true; api.end(`Time to come inside! Louis dug ${revealed} of 40 safe squares.`, false); }
      }
      function drawSponge(x, y, selectedMine) {
        box(ctx, x - 16, y - 13, 32, 26, 6, selectedMine ? '#fa9b82' : '#74c0ce', '#345a65');
        ctx.fillStyle = '#3f8494';
        [[-7,-4],[7,-6],[0,6]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2); ctx.fill(); });
      }
      function draw() {
        ctx.save(); backdrop(api, 'TREASURE DIG', `${Math.ceil(time)}s  |  Safe ${revealed}/40`);
        box(ctx, left - 9, top - 9, cols * cell + 18, rows * cell + 18, 16, '#68452c');
        board.forEach((tile, index) => {
          const x = left + index % cols * cell, y = top + Math.floor(index / cols) * cell;
          box(ctx, x + 2, y + 2, cell - 4, cell - 4, 7, tile.open ? tile.mine ? '#eba987' : '#ead4aa' : '#6e924f', tile.open ? '#b89864' : '#b4ca82');
          if (tile.open && !tile.mine) {
            if (tile.count) label(ctx, tile.count, x + cell / 2, y + cell / 2, 27, numberColors[tile.count]);
            else { ctx.globalAlpha = .55; api.bone(ctx, x + cell / 2, y + cell / 2, 20); ctx.globalAlpha = 1; }
          }
          if (tile.mine && (tile.open || finished)) drawSponge(x + cell / 2, y + cell / 2, index === hitMine);
          else if (tile.flag) {
            ctx.strokeStyle = '#fff3d7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 20, y + 13); ctx.lineTo(x + 20, y + 39); ctx.stroke();
            ctx.fillStyle = '#f2bf62'; ctx.beginPath(); ctx.moveTo(x + 21, y + 12); ctx.lineTo(x + 39, y + 18); ctx.lineTo(x + 21, y + 25); ctx.fill();
          }
          if (index === selected) { ctx.strokeStyle = '#fff6d1'; ctx.lineWidth = 4; ctx.strokeRect(x + 4, y + 4, cell - 8, cell - 8); }
        });
        api.dog(ctx, 149, 208, 111);
        box(ctx, 38, 286, 222, 98, 15, colors.cream);
        label(ctx, flagMode ? 'FLAG MODE' : 'DIG MODE', 149, 311, 22, flagMode ? '#885123' : '#315b32');
        label(ctx, `Flags ${flags}/8`, 149, 342, 21);
        label(ctx, 'F switches modes', 149, 369, 15);
        label(ctx, 'Numbers = nearby sponges', 400, 450, 18);
        ctx.restore();
      }
      return {
        reset, update, draw, action,
        key(code, isDown) {
          if (!keys.press(code, isDown) || finished) return;
          let x = selected % cols, y = Math.floor(selected / cols);
          if (code === 'ArrowLeft') x = Math.max(0, x - 1);
          else if (code === 'ArrowRight') x = Math.min(cols - 1, x + 1);
          else if (code === 'ArrowUp') y = Math.max(0, y - 1);
          else if (code === 'ArrowDown') y = Math.min(rows - 1, y + 1);
          else if (code === 'KeyF') { action('flag-mode'); return; }
          else if (code === 'Space' || code === 'Enter') { dig(selected); return; }
          selected = indexAt(x, y);
        },
        pointer(kind, x, y) {
          if (finished || x < left || x >= left + cols * cell || y < top || y >= top + rows * cell) return;
          selected = indexAt(Math.floor((x - left) / cell), Math.floor((y - top) / cell));
          if (kind === 'down') dig(selected);
        },
        inspect() { return {board: board.map(tile => ({...tile})), cols, rows, cell, left, top, planted, flagMode, revealed, flags, time, points, selected, finished, hitMine}; }
      };
    }
  });
})();
