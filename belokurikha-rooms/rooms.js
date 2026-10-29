(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL(script?.dataset.roomsBase || '.', script?.src || location.href);
  const rooms = window.BelokurikhaRoomsData || [];
  document.querySelectorAll('[data-br-rooms]').forEach(section => {
    if (section.dataset.brReady) return;
    section.dataset.brReady = 'true';
    const track = section.querySelector('.br-rooms__track');
    const cards = Array.from(track.children);
    const prev = section.querySelector('.br-rooms__prev');
    const next = section.querySelector('.br-rooms__next');
    const counter = section.querySelector('.br-rooms__counter');
    const progress = section.querySelector('.br-rooms__progress span');
    const nav = section.querySelector('.br-rooms__navigation');
    const dialog = section.querySelector('dialog');
    let opener;
    let frame;
    const measure = () => {
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].getBoundingClientRect().width;
      const count = Math.min(cards.length, Math.max(1, Math.round((track.clientWidth + parseFloat(getComputedStyle(track).gap)) / step)));
      const first = Math.min(cards.length - count, Math.max(0, Math.round(track.scrollLeft / step)));
      return {step, count, first};
    };
    const update = () => {
      const {count, first} = measure();
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
      counter.textContent = count === 1 ? `${first + 1} из ${cards.length}` : `${first + 1}–${Math.min(first+count,cards.length)} из ${cards.length}`;
      progress.style.width = `${count/cards.length*100}%`;
      progress.style.transform = `translateX(${first/count*100}%)`;
    };
    const move = direction => {
      const {step, count, first} = measure();
      track.scrollTo({left:Math.max(0,Math.min(cards.length-count,first+direction*count))*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    };
    nav.hidden = false;
    section.querySelector('[data-br-controls]').hidden = false;
    prev.addEventListener('click',()=>move(-1));
    next.addEventListener('click',()=>move(1));
    track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);},{passive:true});
    track.addEventListener('keydown',e=>{if(e.target!==track)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
    new ResizeObserver(update).observe(track);
    update();
    function close(){dialog.close();opener?.focus({preventScroll:true});}
    section.querySelector('.br-rooms__close').addEventListener('click',close);
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
    dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
    section.querySelectorAll('[data-open-room]').forEach(button=>button.addEventListener('click',()=>{
      const room=rooms.find(r=>r.id===button.dataset.openRoom);
      if(!room)return;
      opener=button;
      const image=dialog.querySelector('.br-rooms__large');
      const thumbs=dialog.querySelector('.br-rooms__thumbs');
      dialog.querySelector('#br-rooms-modal-title').textContent=room.title;
      dialog.querySelector('.br-rooms__modal-subtitle').textContent=room.subtitle;
      dialog.querySelector('.br-rooms__modal-facts').replaceChildren(section.querySelector(`[data-room="${room.id}"] .br-rooms__facts`).cloneNode(true));
      thumbs.replaceChildren();
      room.images.forEach((src,i)=>{
        const thumb=document.createElement('button');thumb.type='button';thumb.setAttribute('aria-label',`Фотография ${i+1}`);thumb.setAttribute('aria-pressed',String(i===0));
        const photo=document.createElement('img');photo.src=new URL(src,base).href;photo.alt='';thumb.append(photo);
        thumb.addEventListener('click',()=>{image.src=photo.src;image.alt=`${room.title} — фотография ${i+1}`;thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===thumb)));});
        thumbs.append(thumb);
      });
      image.src=new URL(room.images[0],base).href;image.alt=`${room.title} — фотография 1`;
      dialog.showModal();
    }));
  });
})();
