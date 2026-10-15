(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const canvas = el('tetris-board'), ctx = canvas.getContext('2d');
  const preview = el('tetris-next'), nextCtx = preview.getContext('2d');
  const shapes = [
    [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]],
    [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]]
  ];
  const colors = ['#debb64','#b97849','#d6948f','#95ad80','#cc8648','#9aacc2','#c59cb3'];
  let board, piece, next, bag=[], mode='ready', score=0, lines=0, level=1, best=0, clock=0, previous=0;
  try { best=Number(localStorage.getItem('doberman-tetris-best'))||0; } catch {}
  el('tetris-best').textContent=best;
  function freshBoard() { return Array.from({length:20},()=>Array(10).fill(0)); }
  board=freshBoard();
  function take() {
    if(!bag.length) {
      bag=[0,1,2,3,4,5,6];
      for(let i=6;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; }
    }
    const id=bag.pop(); return {matrix:shapes[id].map(row=>row.slice()),color:id+1,x:0,y:0};
  }
  function fits(matrix,x,y) {
    return matrix.every((row,dy)=>row.every((cell,dx)=>!cell || (x+dx>=0 && x+dx<10 && y+dy<20 && (y+dy<0 || !board[y+dy][x+dx]))));
  }
  function sync() {
    el('tetris-score').textContent=score; el('tetris-lines').textContent=lines; el('tetris-level').textContent=level;
    el('tetris-pause').disabled=!['running','paused'].includes(mode);
    el('tetris-pause').textContent=mode==='paused'?'Resume':'Pause';
    el('tetris-start').textContent=mode==='ready'?'Start Tetris':'Restart Tetris';
    document.querySelectorAll('[data-tetris]').forEach(button=>button.disabled=mode!=='running');
  }
  function remember() {
    if(score>best) { best=score; el('tetris-best').textContent=best; try {localStorage.setItem('doberman-tetris-best',String(best));}catch{} }
  }
  function spawn() {
    piece=next; next=take(); piece.x=Math.floor((10-piece.matrix[0].length)/2); piece.y=0; clock=0;
    if(!fits(piece.matrix,piece.x,piece.y)) {
      mode='over'; remember(); el('tetris-status').textContent=`Game over! Score: ${score}. Start again for another round.`; sync();
    }
  }
  function begin() {
    board=freshBoard(); bag=[]; score=0; lines=0; level=1; clock=0; previous=0; mode='running'; next=take(); spawn();
    el('tetris-status').textContent='Build full rows. Keep the stack below the top!'; sync(); draw(); canvas.focus({preventScroll:true});
  }
  function lock() {
    for(let dy=0;dy<piece.matrix.length;dy++) for(let dx=0;dx<piece.matrix[dy].length;dx++) {
      if(piece.matrix[dy][dx]) board[piece.y+dy][piece.x+dx]=piece.color;
    }
    const kept=board.filter(row=>row.some(cell=>!cell)); const cleared=20-kept.length;
    if(cleared) {
      board=Array.from({length:cleared},()=>Array(10).fill(0)).concat(kept);
      score += [0,100,300,500,800][cleared]*level; lines+=cleared; level=1+Math.floor(lines/10);
      el('tetris-status').textContent=`Good dog! ${cleared} ${cleared===1?'row':'rows'} cleared.`;
    }
    remember(); spawn(); sync();
  }
  function down(soft=false) {
    if(fits(piece.matrix,piece.x,piece.y+1)) { piece.y++; if(soft)score++; } else lock();
  }
  function rotate() {
    const rotated=piece.matrix[0].map((_,i)=>piece.matrix.map(row=>row[i]).reverse());
    for(const offset of [0,-1,1,-2,2,-3,3]) {
      if(fits(rotated,piece.x+offset,piece.y)) { piece.matrix=rotated; piece.x+=offset; return; }
    }
  }
  function action(name) {
    if(mode!=='running')return;
    if(name==='left' && fits(piece.matrix,piece.x-1,piece.y))piece.x--;
    if(name==='right' && fits(piece.matrix,piece.x+1,piece.y))piece.x++;
    if(name==='rotate')rotate();
    if(name==='down') {down(true);clock=0;}
    if(name==='drop') {
      while(fits(piece.matrix,piece.x,piece.y+1)){piece.y++;score+=2;}
      lock();
    }
    remember(); sync(); draw();
  }
  function pause() {
    if(mode==='running') {mode='paused';el('tetris-status').textContent='Paused. Press Resume to keep stacking.';}
    else if(mode==='paused') {mode='running';previous=0;el('tetris-status').textContent='Keep stacking!';}
    sync();draw();
  }
  function block(context,x,y,color,size=30,ghost=false) {
    context.fillStyle=ghost?'#ffffff18':colors[color-1]; context.fillRect(x*size+1,y*size+1,size-2,size-2);
    context.strokeStyle=ghost?'#e5d2a2':'#ffffff55';context.lineWidth=1;context.strokeRect(x*size+2,y*size+2,size-4,size-4);
    if(!ghost) {
      // A tiny paw print on each block gives the stack its Doberman theme.
      context.fillStyle='#211b1860';context.beginPath();context.ellipse(x*size+size*.5,y*size+size*.63,size*.15,size*.12,0,0,Math.PI*2);context.fill();
      for(const [px,py] of [[.31,.4],[.47,.31],[.64,.36]]) {context.beginPath();context.arc(x*size+size*px,y*size+size*py,size*.06,0,Math.PI*2);context.fill();}
    }
  }
  function drawPiece(context,p,size=30,ghost=false) {
    p.matrix.forEach((row,y)=>row.forEach((cell,x)=>{if(cell)block(context,p.x+x,p.y+y,p.color,size,ghost);}));
  }
  function draw() {
    ctx.fillStyle='#211b18';ctx.fillRect(0,0,300,600);
    ctx.strokeStyle='#ffffff0b';ctx.lineWidth=1;
    for(let x=0;x<=300;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke();}
    for(let y=0;y<=600;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(300,y);ctx.stroke();}
    board.forEach((row,y)=>row.forEach((cell,x)=>{if(cell)block(ctx,x,y,cell);}));
    if(piece) {
      const ghost={...piece};while(fits(ghost.matrix,ghost.x,ghost.y+1))ghost.y++;
      drawPiece(ctx,ghost,30,true);drawPiece(ctx,piece);
    }
    nextCtx.fillStyle='#211b18';nextCtx.fillRect(0,0,120,120);
    if(next) {drawPiece(nextCtx,{...next,x:(5-next.matrix[0].length)/2,y:(5-next.matrix.length)/2},24);preview.setAttribute('aria-label','Next piece: '+['I','O','T','S','Z','J','L'][next.color-1]);}
    if(mode!=='running') {
      ctx.fillStyle='#211b18dd';ctx.fillRect(0,215,300,140);ctx.textAlign='center';ctx.fillStyle='#e5cd90';ctx.font='bold 25px Georgia';
      ctx.fillText(mode==='ready'?'Doberman Tetris':mode==='paused'?'Paused':'Game over',150,265);ctx.font='15px Arial';
      ctx.fillText(mode==='paused'?'Press Resume':mode==='over'?'Start a new game':'Press Start Tetris',150,300);
    }
  }
  function frame(time) {
    const dt=previous?Math.min(time-previous,100):0;previous=time;
    if(mode==='running') {clock+=dt;if(clock>=Math.max(100,850-(level-1)*65)){clock=0;down();sync();draw();}}
    requestAnimationFrame(frame);
  }
  el('tetris-start').addEventListener('click',begin);el('tetris-pause').addEventListener('click',pause);
  document.querySelectorAll('[data-tetris]').forEach(button=>button.addEventListener('click',()=>action(button.dataset.tetris)));
  document.addEventListener('keydown',event=>{
    if(el('games').hidden || el('tetris-game').hidden || event.target.closest('button,a,summary,input,textarea'))return;
    const key={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',Space:'drop'}[event.code];
    if(key){event.preventDefault();if(!event.repeat||['left','right','down'].includes(key))action(key);}
    if(event.code==='KeyP'&&!event.repeat){event.preventDefault();pause();}
  });
  function away(){if(mode==='running'&&(document.hidden||location.hash!=='#games'||el('tetris-game').hidden))pause();}
  document.addEventListener('visibilitychange',away);window.addEventListener('hashchange',away);window.addEventListener('gamechange',away);
  sync();draw();requestAnimationFrame(frame);
})();
