(() => {
  'use strict';
  const instances=new Map();
  const palette={coat:'#62362f',rust:'#bd7849',nose:'#422522',cream:'#fff6dd'};
  function dog(ctx,x,y,size=48){
    ctx.save();ctx.translate(x,y);ctx.scale(size/60,size/60);
    ctx.fillStyle=palette.coat;ctx.beginPath();ctx.moveTo(-24,-8);ctx.lineTo(-26,-35);ctx.lineTo(-8,-19);ctx.lineTo(8,-19);ctx.lineTo(26,-35);ctx.lineTo(24,-8);ctx.lineTo(18,18);ctx.lineTo(0,29);ctx.lineTo(-18,18);ctx.closePath();ctx.fill();
    ctx.fillStyle=palette.rust;ctx.beginPath();ctx.moveTo(-23,-29);ctx.lineTo(-20,-10);ctx.lineTo(-12,-18);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(23,-29);ctx.lineTo(20,-10);ctx.lineTo(12,-18);ctx.closePath();ctx.fill();
    ctx.fillRect(-17,-9,10,4);ctx.fillRect(7,-9,10,4);ctx.beginPath();ctx.ellipse(0,13,13,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f7d183';ctx.fillRect(-14,-3,5,4);ctx.fillRect(9,-3,5,4);ctx.fillStyle=palette.nose;ctx.beginPath();ctx.ellipse(0,10,7,4,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=palette.nose;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,13);ctx.lineTo(0,20);ctx.stroke();ctx.restore();
  }
  function bone(ctx,x,y,size=24){
    ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);ctx.rotate(-.5);ctx.fillStyle='#fff3ce';ctx.strokeStyle='#967340';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.roundRect(-9,-4,18,8,3);ctx.fill();ctx.stroke();
    for(const [bx,by]of[[-9,-4],[-9,4],[9,-4],[9,4]]){ctx.beginPath();ctx.arc(bx,by,4.5,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.fillRect(-8,-3,16,6);ctx.restore();
  }
  function toy(ctx,x,y,size=24){
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#3d8f9c';ctx.beginPath();ctx.arc(0,0,size/2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eedea3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-size*.42,0,size*.43,-1.5,1.5);ctx.stroke();ctx.beginPath();ctx.arc(size*.42,0,size*.43,1.6,4.7);ctx.stroke();ctx.restore();
  }
  function register(def){
    if(instances.has(def.id)||document.getElementById(def.id+'-game'))throw Error('Duplicate game '+def.id);
    const tab=document.createElement('button');tab.type='button';tab.dataset.game=def.id;tab.setAttribute('aria-pressed','false');tab.textContent=def.title;
    document.querySelector('.game-picker').append(tab);
    const root=document.createElement('article');root.id=def.id+'-game';root.hidden=true;root.className='arcade-game';
    root.innerHTML='<div class="runner-heading"><div><p class="game-eyebrow"></p><h2></h2></div><div class="scoreboard"><span>Score <strong class="arcade-score">0</strong></span><span>Best <strong class="arcade-best">0</strong></span></div></div><div class="arcade-field"><canvas width="800" height="480" tabindex="0"></canvas></div><p class="arcade-status" role="status"></p><div class="runner-controls"><button type="button" class="arcade-start">Start game</button><button type="button" class="arcade-pause" disabled>Pause</button></div><div class="arcade-controls"></div><p class="runner-help arcade-help"></p>';
    root.querySelector('h2').textContent=def.title;root.querySelector('.game-eyebrow').textContent=def.eyebrow||'The red & rust arcade';root.querySelector('.arcade-help').textContent=def.help;
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');canvas.setAttribute('aria-label',def.title+'. '+def.help);
    const field=root.querySelector('.arcade-controls'),scoreLabel=root.querySelector('.arcade-score'),bestLabel=root.querySelector('.arcade-best'),statusLabel=root.querySelector('.arcade-status'),start=root.querySelector('.arcade-start'),pauseButton=root.querySelector('.arcade-pause');
    let best=0;try{best=Number(localStorage.getItem('doberman-'+def.id+'-best'))||0;}catch{}bestLabel.textContent=best;
    const instance={id:def.id,def,root,canvas,ctx,mode:'ready',points:0,best,game:null,api:null,buttons:[]};
    const keys={},held=new Set();
    function remember(){if(instance.points>instance.best){instance.best=instance.points;bestLabel.textContent=instance.best;try{localStorage.setItem('doberman-'+def.id+'-best',String(instance.best));}catch{}}}
    function clearInput(){Object.keys(keys).forEach(key=>{instance.game?.key?.(key,false);delete keys[key];});held.clear();}
    function sync(){
      pauseButton.disabled=!['running','paused'].includes(instance.mode);pauseButton.textContent=instance.mode==='paused'?'Resume':'Pause';start.textContent=instance.mode==='ready'?'Start game':'Play again';
      instance.buttons.forEach(button=>button.disabled=instance.mode!=='running');
    }
    function render(){
      instance.game.draw();
      if(instance.mode!=='running'){
        ctx.fillStyle='#fff8e9ee';ctx.fillRect(60,167,680,143);ctx.fillStyle='#422a25';ctx.textAlign='center';ctx.font='bold 30px Georgia';
        const title=instance.mode==='ready'?def.title:instance.mode==='paused'?'Taking a breather':instance.mode==='won'?'Good dog!':'Round complete';
        ctx.fillText(title,400,222,640);ctx.font='18px Arial';ctx.fillText(instance.mode==='ready'?'Press Start game to play':instance.mode==='paused'?'Press Resume to keep playing':'Press Play again for another round',400,265,640);
      }
    }
    const api={canvas,ctx,W:800,H:480,keys,held,dog,bone,toy,
      score(value){instance.points=Number.isFinite(value)?Math.max(0,Math.round(value)):0;scoreLabel.textContent=instance.points;remember();},
      status(value){statusLabel.textContent=value;},
      end(message,won=false){if(instance.mode!=='running')return;instance.mode=won?'won':'over';clearInput();remember();statusLabel.textContent=message;sync();}
    };
    instance.api=api;
    instance.pause=()=>{if(instance.mode==='running'){instance.mode='paused';clearInput();statusLabel.textContent='Paused. Press Resume to continue.';}else if(instance.mode==='paused'){instance.mode='running';statusLabel.textContent=def.help;canvas.focus({preventScroll:true});}sync();render();};
    instance.start=()=>{clearInput();instance.mode='running';api.score(0);instance.game.reset();statusLabel.textContent=def.help;sync();render();canvas.focus({preventScroll:true});};
    instance.render=render;instance.clearInput=clearInput;
    instance.game=def.setup(api);instance.game.reset();statusLabel.textContent=def.help;
    for(const config of def.buttons||[]){
      const button=document.createElement('button');button.type='button';button.textContent=config.label;button.dataset.arcadeAction=config.id;button.disabled=true;field.append(button);instance.buttons.push(button);
      if(config.hold){
        button.addEventListener('pointerdown',event=>{if(instance.mode!=='running')return;event.preventDefault();button.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});held.add(config.id);});
        for(const type of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>held.delete(config.id));
        button.addEventListener('keydown',event=>{if(['Space','Enter'].includes(event.code)){event.preventDefault();if(instance.mode==='running')held.add(config.id);}});
        button.addEventListener('keyup',event=>{if(['Space','Enter'].includes(event.code))held.delete(config.id);});
        button.addEventListener('blur',()=>held.delete(config.id));
      }else button.addEventListener('click',()=>{if(instance.mode==='running'){instance.game.action?.(config.id);render();}});
    }
    start.addEventListener('click',instance.start);pauseButton.addEventListener('click',instance.pause);
    function pointer(event,kind){
      if(instance.mode!=='running')return;const box=canvas.getBoundingClientRect();
      const x=(event.clientX-box.left)*800/box.width,y=(event.clientY-box.top)*480/box.height;
      if(kind==='down'){event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);}
      instance.game.pointer?.(kind,x,y);render();
    }
    canvas.addEventListener('pointerdown',e=>pointer(e,'down'));canvas.addEventListener('pointermove',e=>pointer(e,'move'));canvas.addEventListener('pointerup',e=>pointer(e,'up'));canvas.addEventListener('pointercancel',e=>pointer(e,'up'));
    document.getElementById('games').append(root);instances.set(def.id,instance);sync();render();
  }
  window.DobermanArcade={register,instances};
  function active(){return [...instances.values()].find(instance=>!instance.root.hidden&&!document.getElementById('games').hidden);}
  document.addEventListener('keydown',event=>{
    const instance=active();if(!instance||event.target.closest('button,a,summary,input,textarea'))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter','KeyA','KeyD','KeyW','KeyS','KeyF','Digit1','Digit2','Digit3','Digit4'].includes(event.code))event.preventDefault();
    if(event.code==='KeyP'&&!event.repeat){event.preventDefault();instance.pause();return;}
    if(instance.mode!=='running')return;
    instance.api.keys[event.code]=true;instance.game.key?.(event.code,true);instance.render();
  });
  document.addEventListener('keyup',event=>{for(const instance of instances.values()){delete instance.api.keys[event.code];if(instance.mode==='running')instance.game.key?.(event.code,false);}});
  function pauseAway(){for(const instance of instances.values())if(instance.mode==='running'&&(document.hidden||instance.root.hidden||location.hash!=='#games'))instance.pause();}
  document.addEventListener('visibilitychange',pauseAway);window.addEventListener('gamechange',pauseAway);window.addEventListener('hashchange',pauseAway);
  window.addEventListener('blur',()=>{for(const instance of instances.values())if(instance.mode==='running')instance.pause();});
  let previous=0;
  function frame(time){
    const dt=previous?Math.min((time-previous)/1000,.032):0;previous=time;
    for(const instance of instances.values())if(instance.mode==='running'&&!instance.root.hidden&&!document.getElementById('games').hidden){instance.game.update?.(dt);instance.render();}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('DOMContentLoaded',()=>{
    const picker=document.querySelector('.game-picker');
    picker.addEventListener('click',event=>{
      const tab=event.target.closest('[data-game]');if(!tab)return;const selected=tab.dataset.game;
      document.querySelectorAll('#games > article').forEach(game=>game.hidden=game.id!==selected+'-game');
      document.querySelectorAll('[data-game]').forEach(button=>button.setAttribute('aria-pressed',String(button===tab)));
      document.getElementById('arcade-selected').textContent=tab.textContent;window.dispatchEvent(new Event('gamechange'));
    });
    const tabs=[...picker.querySelectorAll('[data-game]')];document.getElementById('arcade-count').textContent=tabs.length;
    const search=document.getElementById('arcade-search');search.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();let count=0;tabs.forEach(tab=>{tab.hidden=!tab.textContent.toLowerCase().includes(query);if(!tab.hidden)count++;});document.getElementById('arcade-empty').hidden=count!==0;});
  });
})();
