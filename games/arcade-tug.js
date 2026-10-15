(() => {
  'use strict';
  window.DobermanArcade.register({
    id:'tug-time',title:'Tug-of-War',eyebrow:'Hold on, Louis!',
    help:'Press Space, tap the yard, or press Tug when the moving marker enters the green zone. Win six pulls before three misses or 40 seconds. P pauses.',
    buttons:[{id:'tug',label:'Tug!'}],
    setup(api){
      const {ctx,W,H}=api;let marker,target,direction,pulls,misses,time,cooldown,flash;
      function reset(){marker=0;target=.5;direction=1;pulls=0;misses=0;time=40;cooldown=0;flash=0;api.score(0);}
      function tug(){
        if(cooldown>0)return;cooldown=.3;
        if(Math.abs(marker-target)<=.105){
          pulls++;flash=.35;api.score(pulls*25);api.status('Good grip! '+pulls+' of 6 pulls won.');
          if(pulls===6){api.score(150+Math.ceil(time)*2);api.end('Louis wins the rope toy! Six perfect pulls. Nice fetching!',true);return;}
        }else{misses++;flash=-.35;api.status('Too early or too late! '+(3-misses)+' misses left.');if(misses===3){api.end('The toy got away! Try timing your pull inside the green zone.');return;}}
        marker=0;direction=1;target=.28+Math.random()*.44;
      }
      return {reset,
        update(dt){time-=dt;cooldown=Math.max(0,cooldown-dt);flash=flash>0?Math.max(0,flash-dt):Math.min(0,flash+dt);marker+=direction*dt*(.62+pulls*.06);if(marker>1){marker=2-marker;direction=-1;}if(marker<0){marker=-marker;direction=1;}if(time<=0)api.end('Time is up! Louis won '+pulls+' of 6 pulls.');},
        action(id){if(id==='tug')tug();},key(code,down){if(down&&['Space','Enter'].includes(code))tug();},pointer(kind){if(kind==='down')tug();},
        draw(){
          ctx.fillStyle='#c9e3db';ctx.fillRect(0,0,W,H);ctx.fillStyle='#91ac6d';ctx.fillRect(0,260,W,220);
          ctx.fillStyle='#fff5d9';ctx.font='bold 20px Arial';ctx.textAlign='left';ctx.fillText('PULLS '+pulls+'/6',30,38);ctx.textAlign='right';ctx.fillText('MISSES '+misses+'/3   '+Math.max(0,Math.ceil(time))+'s',770,38);
          const offset=pulls*16;api.dog(ctx,170-offset*.4,170,110);
          ctx.strokeStyle='#b98a50';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(200-offset*.4,210);ctx.lineTo(585-offset,210);ctx.stroke();
          ctx.strokeStyle='#f0d39a';ctx.lineWidth=3;for(let x=220-offset*.4;x<580-offset;x+=18){ctx.beginPath();ctx.moveTo(x,204);ctx.lineTo(x+9,216);ctx.stroke();}
          api.toy(ctx,610-offset,210,78);ctx.fillStyle='#422a25';ctx.textAlign='center';ctx.font='bold 23px Georgia';ctx.fillText('Time your tug!',400,300);
          ctx.fillStyle='#fff5de';ctx.fillRect(100,334,600,52);ctx.fillStyle='#81a865';ctx.fillRect(100+(target-.105)*600,334,.21*600,52);
          ctx.strokeStyle='#60352d';ctx.lineWidth=3;ctx.strokeRect(100,334,600,52);
          ctx.fillStyle=flash<0?'#b1463c':'#60352d';ctx.fillRect(100+marker*600-5,323,10,74);
          ctx.font='17px Arial';ctx.fillText(flash>0?'Good dog!':flash<0?'Try the green zone':'Pull when the marker is in green',400,435);
        },inspect(){return{marker,target,pulls,misses,time,cooldown};}
      };
    }
  });
})();
