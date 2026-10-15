(() => {
  'use strict';
  const canvas = document.getElementById('runner');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('run-score');
  const bestEl = document.getElementById('run-best');
  const status = document.getElementById('run-status');
  const start = document.getElementById('run-start');
  const jumpButton = document.getElementById('run-jump');
  const pauseButton = document.getElementById('run-pause');
  const ground = 286, dogX = 110;
  let mode = 'ready', y = 0, velocity = 0, elapsed = 0, distance = 0;
  let obstacles = [], spawnIn = 1.6, previous = 0, best = 0;
  try { best = Number(localStorage.getItem('doberman-dash-best')) || 0; } catch {}
  bestEl.textContent = best;
  function controls() {
    jumpButton.disabled = mode !== 'running';
    pauseButton.disabled = !['running','paused'].includes(mode);
    pauseButton.textContent = mode === 'paused' ? 'Resume' : 'Pause';
    start.textContent = mode === 'ready' ? 'Start game' : 'Restart';
  }
  function begin() {
    mode = 'running'; y = 0; velocity = 0; elapsed = 0; distance = 0;
    obstacles = []; spawnIn = 1.6; previous = 0; scoreEl.textContent = '0';
    status.textContent = 'Go, Louie! Jump over the obstacles.';
    controls(); canvas.focus({preventScroll:true});
  }
  function jump() {
    if (mode === 'ready' || mode === 'over') begin();
    if (mode === 'running' && y === 0) velocity = 690;
  }
  function pause() {
    if (mode === 'running') {
      mode = 'paused'; status.textContent = 'Paused. Press Resume when you’re ready.';
    } else if (mode === 'paused') {
      mode = 'running'; previous = 0; status.textContent = 'Keep going, Louie!';
    }
    controls(); draw();
  }
  function end() {
    mode = 'over';
    const score = Math.floor(elapsed * 10);
    if (score > best) {
      best = score; bestEl.textContent = best;
      try { localStorage.setItem('doberman-dash-best', String(best)); } catch {}
    }
    status.textContent = `Oops! Louie hit an obstacle. Score: ${score}. Press Restart or jump to try again.`;
    controls();
  }
  function update(dt) {
    elapsed += dt;
    const speed = Math.min(560, 300 + elapsed * 5);
    distance += speed * dt;
    y += velocity * dt; velocity -= 1800 * dt;
    if (y <= 0) { y = 0; velocity = 0; }
    spawnIn -= dt;
    if (spawnIn <= 0) {
      const fence = Math.random() > .45;
      obstacles.push({x:940, w:fence ? 45 : 30, h:fence ? 51 : 37, fence});
      spawnIn = 1.35 + Math.random() * .65;
    }
    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
      // The collision box follows the torso, leaving the ears and tail forgiving.
      if (dogX + 17 < obstacle.x + obstacle.w - 4 && dogX + 80 > obstacle.x + 4 &&
          ground - y - 53 < ground - 3 && ground - y - 5 > ground - obstacle.h + 5) {
        end(); break;
      }
    }
    obstacles = obstacles.filter(o => o.x + o.w > -20);
    scoreEl.textContent = Math.floor(elapsed * 10);
  }
  function polygon(points, color) {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x,z], i) => i ? ctx.lineTo(x,z) : ctx.moveTo(x,z));
    ctx.closePath(); ctx.fill();
  }
  function drawDog() {
    ctx.save(); ctx.translate(dogX, ground - y);
    const stride = mode === 'running' && y === 0 ? Math.sin(elapsed * 24) * 9 : 0;
    ctx.strokeStyle = '#251d1b'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (const [x, swing] of [[22,stride],[38,-stride],[64,-stride],[76,stride]]) {
      ctx.beginPath(); ctx.moveTo(x,-33); ctx.lineTo(x + swing,-9); ctx.lineTo(x + swing + 8,-5); ctx.stroke();
      ctx.fillStyle = '#aa6235'; ctx.fillRect(x + swing + 1,-9,12,6);
    }
    polygon([[7,-45],[20,-55],[67,-53],[77,-67],[88,-66],[95,-49],[82,-35],[25,-30],[12,-34]],'#251d1b');
    polygon([[72,-66],[73,-93],[83,-76],[91,-94],[96,-65]],'#251d1b');
    polygon([[80,-59],[105,-57],[108,-48],[88,-43]],'#aa6235');
    polygon([[70,-48],[80,-50],[81,-36],[70,-31]],'#aa6235');
    polygon([[12,-46],[1,-58],[-5,-57],[3,-38],[18,-34]],'#251d1b');
    ctx.fillStyle = '#251d1b'; ctx.fillRect(101,-57,8,6);
    ctx.fillStyle = '#f3d27a'; ctx.fillRect(86,-67,4,4);
    ctx.strokeStyle = '#b2443f'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(74,-54); ctx.lineTo(83,-47); ctx.stroke();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0,0,900,360);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0,0,900,360);
    ctx.fillStyle = '#e8c678'; ctx.beginPath(); ctx.arc(770,65,25,0,Math.PI*2); ctx.fill();
    for (let i=0;i<4;i++) {
      const x = ((i * 290 - distance * .12) % 1160 + 1160) % 1160 - 100;
      ctx.fillStyle = '#eee3d2'; ctx.beginPath(); ctx.ellipse(x,103 + (i%2)*30,45,9,0,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#ebe0cc'; ctx.fillRect(0,ground,900,74);
    ctx.strokeStyle = '#9b8869'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,ground); ctx.lineTo(900,ground); ctx.stroke();
    ctx.fillStyle = '#b7a68b';
    for (let i=0;i<30;i++) ctx.fillRect(((i*41-distance)%1230+1230)%1230,ground+13+(i%3)*11,8,2);
    for (const o of obstacles) {
      if (o.fence) {
        ctx.fillStyle = '#98603d';
        ctx.fillRect(o.x,ground-o.h,9,o.h); ctx.fillRect(o.x+o.w-9,ground-o.h,9,o.h);
        ctx.fillRect(o.x,ground-o.h+10,o.w,8); ctx.fillRect(o.x,ground-19,o.w,8);
      } else {
        polygon([[o.x,ground-o.h+8],[o.x+o.w,ground-o.h+8],[o.x+o.w-4,ground],[o.x+4,ground]],'#ad573c');
        ctx.fillStyle = '#d07f56'; ctx.fillRect(o.x-3,ground-o.h+5,o.w+6,8);
        ctx.strokeStyle = '#75804b'; ctx.lineWidth=4; ctx.beginPath();
        ctx.moveTo(o.x+o.w/2,ground-o.h+5); ctx.lineTo(o.x+o.w/2,ground-o.h-8); ctx.stroke();
      }
    }
    drawDog();
    if (mode !== 'running') {
      ctx.fillStyle = '#fffaf0e8'; ctx.fillRect(260,125,470,90);
      ctx.textAlign='center'; ctx.fillStyle='#38291e'; ctx.font='bold 28px Georgia';
      ctx.fillText(mode === 'ready' ? 'Doberman Dash' : mode === 'paused' ? 'Taking a breather' : 'Let’s try that again!',495,162);
      ctx.font='17px Arial'; ctx.fillText(mode === 'paused' ? 'Press Resume to keep running' : 'Tap to jump · Space / ?',495,192);
    }
  }
  function frame(time) {
    const dt = previous ? Math.min((time-previous)/1000,.035) : 0;
    previous = time;
    if (mode === 'running') { update(dt); draw(); }
    requestAnimationFrame(frame);
  }
  start.addEventListener('click', begin);
  jumpButton.addEventListener('click', jump);
  pauseButton.addEventListener('click', pause);
  canvas.addEventListener('pointerdown', event => { event.preventDefault(); canvas.focus({preventScroll:true}); jump(); });
  document.addEventListener('keydown', event => {
    if (document.getElementById('games').hidden || event.repeat ||
        event.target.closest('button,a,summary,input,textarea')) return;
    if (['Space','ArrowUp'].includes(event.code)) { event.preventDefault(); jump(); }
    if (event.code === 'KeyP') { event.preventDefault(); pause(); }
  });
  function pauseWhenAway() {
    if (mode === 'running' && (document.hidden || location.hash !== '#games')) pause();
  }
  document.addEventListener('visibilitychange', pauseWhenAway);
  window.addEventListener('hashchange', pauseWhenAway);
  controls(); draw(); requestAnimationFrame(frame);
})();
