(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL(script?.dataset.roomsBase || '.', script?.src || location.href);
  const rooms = window.KatunRoomsData || [];
  document.querySelectorAll('[data-kt-catalog]').forEach(section => {
    if (section.dataset.catalogReady) return;
    section.dataset.catalogReady = 'true';
    const dialog = section.querySelector('dialog');
    let opener;
    let priorOverflow = '';
    let changePhoto = () => {};
    dialog.querySelector('.kt-rooms__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      document.body.style.overflow = priorOverflow;
      opener?.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.querySelector('.kt-rooms__photo-prev').addEventListener('click', () => changePhoto(-1));
    dialog.querySelector('.kt-rooms__photo-next').addEventListener('click', () => changePhoto(1));
    dialog.querySelector('.kt-rooms__gallery').addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      changePhoto(event.key === 'ArrowRight' ? 1 : -1);
    });
    section.querySelectorAll('[data-open-room]').forEach(button => button.addEventListener('click', () => {
      const room = rooms.find(item => item.id === button.dataset.openRoom);
      if (!room || dialog.open) return;
      opener = button;
      dialog.querySelector('#kt-rooms-modal-title').textContent = room.title;
      dialog.querySelector('.kt-rooms__modal-subtitle').textContent = room.subtitle;
      dialog.querySelector('.kt-rooms__description').replaceChildren(...room.description.map(text => {
        const p = document.createElement('p'); p.textContent = text; return p;
      }));
      const specs=[];
      if(room.area!=null)specs.push({label:'Площадь',value:room.area+' м²'});
      if(room.main!=null)specs.push({label:'Основных мест',value:String(room.main)});
      if(room.extra!=null)specs.push({label:'Доп. мест',value:String(room.extra)});
      specs.push(...room.specs);
      dialog.querySelector('.kt-rooms__specs').hidden = specs.length===0;
      dialog.classList.toggle('kt-rooms__dialog--gallery',room.description.length===0);
      dialog.querySelector('.kt-rooms__parameters').replaceChildren(...specs.map(spec => {
        const group=document.createElement('div');
        if(spec.value.length>22)group.className='kt-rooms__parameter-text';
        const dt=document.createElement('dt');const dd=document.createElement('dd');
        dt.textContent=spec.label;dd.textContent=spec.value;group.append(dt,dd);return group;
      }));
      const image=dialog.querySelector('.kt-rooms__large');
      const thumbs=dialog.querySelector('.kt-rooms__thumbs');thumbs.replaceChildren();
      let active=0;
      const showPhoto=index=>{
        active=(index+room.images.length)%room.images.length;
        image.src=new URL(room.images[active],base).href;
        image.alt=`${room.title} — фотография ${active+1}`;
        dialog.querySelector('.kt-rooms__photo-count').textContent=`${active+1} / ${room.images.length}`;
        thumbs.querySelectorAll('button').forEach((thumb,i)=>thumb.setAttribute('aria-pressed',String(i===active)));
      };
      changePhoto=direction=>showPhoto(active+direction);
      room.images.forEach((src,i)=>{
        const thumb=document.createElement('button');thumb.type='button';thumb.setAttribute('aria-label',`Фотография ${i+1}`);
        const photo=document.createElement('img');photo.src=new URL(src,base).href;photo.alt='';thumb.append(photo);
        thumb.addEventListener('click',()=>showPhoto(i));thumbs.append(thumb);
      });
      showPhoto(0);
      priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
      dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.kt-rooms__close').focus({preventScroll:true});
    }));
    // By default this is an ordinary link to Katun's online booking page.
    // The host may cancel this event and open its own booking interface later.
    section.querySelectorAll('[data-book-room]').forEach(link=>link.addEventListener('click',event=>{
      const room=rooms.find(r=>r.id===link.dataset.bookRoom);
      if(!room)return;
      const navigate=link.dispatchEvent(new CustomEvent('katun:book-room',{
        bubbles:true,cancelable:true,detail:{id:room.id,title:room.title}
      }));
      if(!navigate)event.preventDefault();
    }));
  });
})();
