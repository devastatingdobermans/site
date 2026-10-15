(() => {
  'use strict';
  const el=id=>document.getElementById(id), canvas=el('adventure-board'), ctx=canvas.getContext('2d');
  const ground=400, worldWidth=3200, controls={left:false,right:false};
  const levels=[
    {name:'Backyard breakout',sky:'#a4d7df',gaps:[[680,790],[1510,1630],[2340,2470]],platforms:[[300,310,144],[950,304,144],[1260,250,120],[1810,308,144],[2080,252,120],[2660,306,144]],enemies:[[1090,1020,1300],[1910,1780,2200],[2740,2600,2920]]},
    {name:'The toy trail',sky:'#b9cce0',gaps:[[520,650],[1190,1330],[2000,2140],[2620,2760]],platforms:[[250,306,120],[780,306,144],[1000,246,112],[1490,304,144],[1730,242,120],[2270,304,144],[2470,244,112],[2870,306,144]],enemies:[[860,720,1110],[1580,1420,1840],[2370,2220,2530],[2910,2830,3050]]},
    {name:'Home before sunset',sky:'#edbb9e',gaps:[[610,750],[1370,1520],[2190,2340],[2690,2830]],platforms:[[280,306,128],[860,306,128],[1100,246,128],[1640,304,128],[1900,244,128],[2430,306,128],[2890,304,112]],enemies:[[980,810,1240],[1770,1600,2080],[2500,2400,2610],[2960,2880,3090]]}
  ];
  let mode='ready', level=0, score=0, baseScore=0, best=0, player, solids=[], bones=[], enemies=[], camera=0, previous=0, clock=0, jumpBuffer=0, coyote=0;
  try{best=Number(localStorage.getItem('doberman-adventure-best'))||0;}catch{}
  el('adventure-best').textContent=best;
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function sync(){
    el('adventure-score').textContent=score;el('adventure-level').textContent=`${level+1} / 3`;
    el('adventure-pause').disabled=!['running','paused'].includes(mode);el('adventure-pause').textContent=mode==='paused'?'Resume':'Pause';
    el('adventure-start').textContent=mode==='ready'?'Start adventure':mode==='clear'?'Next level':mode==='over'?'Retry level':mode==='won'?'Play again':'Restart level';
    document.querySelectorAll('[data-adventure]').forEach(button=>button.disabled=mode!=='running');
  }
  function remember(){if(score>best){best=score;el('adventure-best').textContent=best;try{localStorage.setItem('doberman-adventure-best',String(best));}catch{}}}
  function release(){controls.left=false;controls.right=false;jumpBuffer=0;}
  function load(){
    const config=levels[level];solids=[];let left=0;
    for(const [start,end]of config.gaps){solids.push({x:left,y:ground,w:start-left,h:80});left=end;}
    solids.push({x:left,y:ground,w:worldWidth-left,h:80});
    config.platforms.forEach(([x,y,w])=>solids.push({x,y,w,h:20}));
    bones=[];
    config.platforms.forEach(([x,y,w])=>{for(let i=0;i<3;i++)bones.push({x:x+20+i*(w-40)/2,y:y-34,w:20,h:16,taken:false});});
    config.gaps.forEach(([x,end])=>bones.push({x:(x+end)/2-10,y:ground-100,w:20,h:16,taken:false}));
    enemies=config.enemies.map(([x,min,max])=>({x,y:ground-28,w:30,h:28,min,max,vx:level%2?-65:65,alive:true}));
    player={x:70,y:ground-40,w:36,h:40,vx:0,vy:0,facing:1,onGround:true};camera=0;clock=0;coyote=.1;release();previous=0;
  }
  function begin(){
    if(mode==='clear'){level++;baseScore=score;}
    else if(mode==='won'||mode==='ready'){level=0;baseScore=0;}
    score=baseScore;load();mode='running';el('adventure-status').textContent=`Level ${level+1}: ${levels[level].name}. Get Louis to the doghouse!`;sync();draw();canvas.focus({preventScroll:true});
  }
  function fail(){mode='over';release();el('adventure-status').textContent='Oops! Louis needs another try. Retry this level and keep your completed-level points.';remember();sync();}
  function finish(){
    score+=100;remember();release();mode=level===2?'won':'clear';
    el('adventure-status').textContent=mode==='won'?`Louis is home! All three levels complete. Final score: ${score}.`:`Good dog! Level ${level+1} complete. Press Next level to keep going.`;sync();
  }
  function pause(){
    if(mode==='running'){mode='paused';release();el('adventure-status').textContent='Paused. Press Resume to continue.';}
    else if(mode==='paused'){mode='running';previous=0;el('adventure-status').textContent=`Level ${level+1}: ${levels[level].name}. Keep going!`;}
    sync();draw();
  }
  function update(dt){
    clock+=dt;jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=player.onGround?.1:Math.max(0,coyote-dt);
    player.vx=(Number(controls.right)-Number(controls.left))*250;
    if(player.vx)player.facing=Math.sign(player.vx);
    if(jumpBuffer>0&&coyote>0){player.vy=-620;player.onGround=false;coyote=0;jumpBuffer=0;}
    player.vy=Math.min(900,player.vy+1750*dt);
    player.x+=player.vx*dt;player.x=Math.max(0,Math.min(worldWidth-player.w,player.x));
    for(const solid of solids)if(overlap(player,solid)){player.x=player.vx>0?solid.x-player.w:solid.x+solid.w;}
    const oldBottom=player.y+player.h;
    player.y+=player.vy*dt;player.onGround=false;
    for(const solid of solids)if(overlap(player,solid)){
      if(player.vy>=0){player.y=solid.y-player.h;player.onGround=true;}
      else player.y=solid.y+solid.h;
      player.vy=0;
    }
    if(player.y>550){fail();return;}
    for(const bone of bones)if(!bone.taken&&overlap(player,bone)){bone.taken=true;score+=10;remember();sync();}
    for(const enemy of enemies){
      if(!enemy.alive)continue;enemy.x+=enemy.vx*dt;
      if(enemy.x<enemy.min){enemy.x=enemy.min;enemy.vx=Math.abs(enemy.vx);}
      if(enemy.x+enemy.w>enemy.max){enemy.x=enemy.max-enemy.w;enemy.vx=-Math.abs(enemy.vx);}
      if(overlap(player,enemy)){
        if(player.vy>0&&oldBottom<=enemy.y+12){enemy.alive=false;player.vy=-410;score+=25;remember();sync();}
        else{fail();return;}
      }
    }
    camera=Math.max(0,Math.min(worldWidth-960,player.x-290));
    if(player.x>worldWidth-160)finish();
  }
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
  function dog(){
    ctx.save();ctx.translate(Math.round(player.x-camera+18),Math.round(player.y));ctx.scale(player.facing,1);
    const stride=player.onGround&&player.vx?Math.sin(clock*20)*4:0;
    rect(-15,14,29,17,'#62362f');rect(5,4,16,18,'#62362f');rect(7,-4,4,12,'#62362f');rect(17,-4,4,12,'#62362f');
    rect(14,15,14,8,'#bd7849');rect(25,15,4,5,'#422522');rect(16,8,4,4,'#f1cb75');rect(4,22,9,9,'#bd7849');
    rect(-20,9,7,8,'#62362f');rect(-24,5,5,8,'#62362f');
    rect(-12+stride,28,6,12,'#62362f');rect(6-stride,28,6,12,'#62362f');rect(-12+stride,36,9,4,'#bd7849');rect(6-stride,36,9,4,'#bd7849');
    rect(4,18,4,7,'#ac4440');ctx.restore();
  }
  function draw(){
    ctx.fillStyle=levels[level].sky;ctx.fillRect(0,0,960,480);
    rect(790-camera*.08,40,48,48,'#ffe19b');
    for(let i=0;i<8;i++){const x=i*260-camera*.25;rect(x,100+(i%2)*32,96,16,'#fff4e3');rect(x+16,84+(i%2)*32,56,16,'#fff4e3');}
    for(let i=0;i<12;i++){const x=i*340-camera*.4;rect(x,310,180,90,'#7fa58a');rect(x+28,278,124,32,'#7fa58a');rect(x+58,254,64,24,'#7fa58a');}
    for(const solid of solids){
      const x=solid.x-camera;if(x+solid.w<0||x>960)continue;
      rect(x,solid.y,solid.w,solid.h,'#9b6946');rect(x,solid.y,solid.w,8,'#5c873f');
      for(let bx=Math.max(solid.x,Math.floor(camera/32)*32);bx<Math.min(solid.x+solid.w,camera+980);bx+=32){rect(bx-camera,solid.y+12,24,4,'#b88352');if(solid.h>20)rect(bx-camera+8,solid.y+40,16,5,'#754b34');}
    }
    for(const bone of bones)if(!bone.taken){const x=bone.x-camera,y=bone.y+Math.sin(clock*3)*3;rect(x+4,y+5,12,6,'#fff5cf');rect(x,y,6,6,'#fff5cf');rect(x,y+10,6,6,'#fff5cf');rect(x+14,y,6,6,'#fff5cf');rect(x+14,y+10,6,6,'#fff5cf');}
    for(const enemy of enemies)if(enemy.alive){const x=enemy.x-camera;rect(x,enemy.y+6,30,18,'#657eaa');rect(x+4,enemy.y,22,8,'#849cc3');rect(x+4,enemy.y+12,5,5,'#fff4d5');rect(x+21,enemy.y+12,5,5,'#fff4d5');rect(x+3,enemy.y+24,8,4,'#3a3030');rect(x+21,enemy.y+24,8,4,'#3a3030');rect(x+13,enemy.y-6,4,9,'#e1b75e');rect(x+9,enemy.y-10,12,4,'#e1b75e');}
    const home=worldWidth-140-camera;
    rect(home-20,ground-72,110,72,'#b9714c');rect(home-32,ground-84,134,12,'#784635');rect(home-16,ground-100,102,16,'#784635');rect(home,ground-112,70,12,'#784635');rect(home+20,ground-46,36,46,'#422a25');
    ctx.fillStyle='#fff1ce';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('LOUIS',home+36,ground-54);
    dog();
    if(mode!=='running'){
      rect(140,148,680,150,'#fff7e9ed');ctx.fillStyle='#422a25';ctx.textAlign='center';ctx.font='bold 30px monospace';
      ctx.fillText(mode==='ready'?'DOBERMAN 8-BIT ADVENTURE':mode==='paused'?'PAUSED':mode==='clear'?'GOOD DOG! LEVEL COMPLETE':mode==='won'?'LOUIS MADE IT HOME!':'LET\'S TRY THAT AGAIN',480,207);
      ctx.font='18px monospace';ctx.fillText(mode==='ready'?'Collect bones. Bounce on toys. Find home.':mode==='paused'?'Press Resume to keep exploring':mode==='clear'?'Press Next level':mode==='won'?'Three levels. One very good boy.':'Press Retry level for another go',480,255);
    }
  }
  function frame(time){
    const dt=previous?Math.min((time-previous)/1000,.04):0;previous=time;
    if(mode==='running'){const steps=Math.max(1,Math.ceil(dt/.008));for(let i=0;i<steps&&mode==='running';i++)update(dt/steps);draw();}
    requestAnimationFrame(frame);
  }
  el('adventure-start').addEventListener('click',begin);el('adventure-pause').addEventListener('click',pause);
  const keyAction={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
  document.addEventListener('keydown',event=>{
    if(el('games').hidden||el('adventure-game').hidden||event.target.closest('button,a,summary,input,textarea'))return;
    const action=keyAction[event.code];if(action){event.preventDefault();if(mode==='running'){if(action==='jump'){if(!event.repeat)jumpBuffer=.13;}else controls[action]=true;}}
    if(event.code==='KeyP'&&!event.repeat){event.preventDefault();pause();}
  });
  document.addEventListener('keyup',event=>{const action=keyAction[event.code];if(action==='left'||action==='right')controls[action]=false;});
  document.querySelectorAll('[data-adventure]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{if(mode!=='running')return;event.preventDefault();button.setPointerCapture(event.pointerId);const action=button.dataset.adventure;if(action==='jump')jumpBuffer=.13;else controls[action]=true;canvas.focus({preventScroll:true});});
    const stop=()=>{const action=button.dataset.adventure;if(action!=='jump')controls[action]=false;};
    button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
    button.addEventListener('click',event=>{if(event.detail===0&&mode==='running'){const action=button.dataset.adventure;if(action==='jump')jumpBuffer=.13;else{controls[action]=true;setTimeout(()=>controls[action]=false,120);}}});
  });
  function away(){if(mode==='running'&&(document.hidden||location.hash!=='#games'||el('adventure-game').hidden))pause();}
  document.addEventListener('visibilitychange',away);window.addEventListener('hashchange',away);window.addEventListener('gamechange',away);window.addEventListener('blur',()=>{if(mode==='running')pause();});
  load();sync();draw();requestAnimationFrame(frame);
})();
