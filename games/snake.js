(() => {
  'use strict';
  const el=id=>document.getElementById(id), canvas=el('snake-board'), ctx=canvas.getContext('2d');
  const size=20, cell=30;
  const directions={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  let snake=[], direction=directions.right, queue=[], food=null, score=0, best=0, mode='ready', clock=0, previous=0;
  let touchStart=null;
  try {best=Number(localStorage.getItem('doberman-snake-best'))||0;}catch{}
  el('snake-best').textContent=best;
  function sync() {
    el('snake-score').textContent=score;
    el('snake-pause').disabled=!['running','paused'].includes(mode);
    el('snake-pause').textContent=mode==='paused'?'Resume':'Pause';
    el('snake-start').textContent=mode==='ready'?'Start Snake':'Restart Snake';
    document.querySelectorAll('[data-snake]').forEach(button=>button.disabled=mode!=='running');
  }
  function remember() {
    if(score>best){best=score;el('snake-best').textContent=best;try{localStorage.setItem('doberman-snake-best',String(best));}catch{}}
  }
  function placeFood() {
    const free=[];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!snake.some(p=>p.x===x&&p.y===y))free.push({x,y});
    if(!free.length){food=null;mode='won';el('snake-status').textContent='Top dog! You filled the entire yard!';sync();return;}
    food={...free[Math.floor(Math.random()*free.length)],type:Math.random()<.5?'bone':'toy'};
  }
  function begin() {
    snake=[{x:6,y:10},{x:5,y:10},{x:4,y:10},{x:3,y:10}];direction=directions.right;queue=[];score=0;clock=0;previous=0;mode='running';
    placeFood();el('snake-status').textContent='Fetch those bones and toys!';sync();draw();canvas.focus({preventScroll:true});
  }
  function steer(name) {
    if(mode!=='running'||queue.length>=2)return;
    const next=directions[name],last=queue.length?queue[queue.length-1]:direction;
    if(next && (next.x!==last.x||next.y!==last.y) && !(next.x===-last.x&&next.y===-last.y))queue.push(next);
  }
  function step() {
    if(queue.length)direction=queue.shift();
    const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const eating=food&&head.x===food.x&&head.y===food.y;
    const body=eating?snake:snake.slice(0,-1);
    if(head.x<0||head.x>=size||head.y<0||head.y>=size||body.some(p=>p.x===head.x&&p.y===head.y)) {
      mode='over';remember();el('snake-status').textContent=`Oops, tangled up! Score: ${score}. Press Restart Snake to try again.`;sync();return;
    }
    snake.unshift(head);
    if(eating){score++;remember();placeFood();if(mode==='running')el('snake-status').textContent=`Good dog! ${score} ${score===1?'find':'finds'}. Keep fetching!`;}
    else snake.pop();
    sync();
  }
  function pause() {
    if(mode==='running'){mode='paused';el('snake-status').textContent='Paused. Press Resume when you are ready.';}
    else if(mode==='paused'){mode='running';previous=0;el('snake-status').textContent='Keep fetching!';}
    sync();draw();
  }
  function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function drawFood() {
    if(!food)return;
    const x=food.x*cell+15,y=food.y*cell+15;
    if(food.type==='bone') {
      ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);
      ctx.strokeStyle='#9b7b47';ctx.lineWidth=2;ctx.fillStyle='#fff6d6';
      ctx.beginPath();ctx.moveTo(-6,-4);ctx.bezierCurveTo(-18,-15,-19,3,-10,3);ctx.bezierCurveTo(-17,14,-1,17,-5,5);ctx.lineTo(6,5);ctx.bezierCurveTo(18,16,19,-3,10,-3);ctx.bezierCurveTo(17,-14,1,-17,5,-5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    } else {
      circle(x,y,12,'#4b98a4');ctx.strokeStyle='#f9e8a9';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(x-10,y,10,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.arc(x+10,y,10,Math.PI/2,Math.PI*1.5);ctx.stroke();
    }
  }
  function drawDog() {
    snake.slice(1).reverse().forEach(p=>{
      ctx.fillStyle='#62362f';ctx.fillRect(p.x*cell+2,p.y*cell+2,26,26);
      circle(p.x*cell+15,p.y*cell+15,5,'#bd7849');
    });
    if(!snake.length)return;
    const head=snake[0];ctx.save();ctx.translate(head.x*cell+15,head.y*cell+15);
    ctx.rotate(Math.atan2(direction.y,direction.x));
    ctx.fillStyle='#62362f';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(5,-11);ctx.lineTo(-14,-14);ctx.lineTo(-7,-4);ctx.lineTo(-7,4);ctx.lineTo(-14,14);ctx.lineTo(5,11);ctx.closePath();ctx.fill();
    ctx.fillStyle='#bd7849';ctx.fillRect(4,-5,8,10);circle(12,0,3,'#422522');circle(2,-7,2,'#f4d47b');circle(2,7,2,'#f4d47b');
    ctx.strokeStyle='#b94740';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-7,-10);ctx.lineTo(-7,10);ctx.stroke();ctx.restore();
  }
  function draw() {
    ctx.fillStyle='#eee8d4';ctx.fillRect(0,0,600,600);
    ctx.fillStyle='#e5dec6';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%2===0)ctx.fillRect(x*cell,y*cell,cell,cell);
    drawFood();drawDog();
    if(mode!=='running') {
      ctx.fillStyle='#fffaf0ed';ctx.fillRect(45,235,510,130);ctx.fillStyle='#38291e';ctx.textAlign='center';ctx.font='bold 32px Georgia';
      ctx.fillText(mode==='ready'?'Doberman Snake':mode==='paused'?'Taking a breather':mode==='won'?'Top dog!':'All tangled up!',300,285);
      ctx.font='20px Arial';ctx.fillText(mode==='ready'?'Bones, toys, and one hungry Doberman':mode==='paused'?'Press Resume to keep fetching':'Press Restart Snake for another round',300,325);
    }
  }
  function frame(time) {
    const dt=previous?Math.min(time-previous,100):0;previous=time;
    if(mode==='running'){clock+=dt;if(clock>=Math.max(80,180-Math.floor(score/3)*10)){clock=0;step();draw();}}
    requestAnimationFrame(frame);
  }
  el('snake-start').addEventListener('click',begin);el('snake-pause').addEventListener('click',pause);
  document.querySelectorAll('[data-snake]').forEach(button=>button.addEventListener('click',()=>steer(button.dataset.snake)));
  document.addEventListener('keydown',event=>{
    if(el('games').hidden||el('snake-game').hidden||event.target.closest('button,a,summary,input,textarea'))return;
    const name={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'}[event.code];
    if(name){event.preventDefault();steer(name);}if(event.code==='KeyP'&&!event.repeat){event.preventDefault();pause();}
  });
  canvas.addEventListener('pointerdown',event=>{touchStart={x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointerup',event=>{
    if(!touchStart)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;
    steer(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
  });
  canvas.addEventListener('pointercancel',()=>touchStart=null);
  function away(){if(mode==='running'&&(document.hidden||location.hash!=='#games'||el('snake-game').hidden))pause();}
  document.addEventListener('visibilitychange',away);window.addEventListener('hashchange',away);window.addEventListener('gamechange',away);
  sync();draw();requestAnimationFrame(frame);
})();
