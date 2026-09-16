for(const carousel of document.querySelectorAll('[data-dinner-carousel],[data-carousel]')){
  const track=carousel.querySelector('.carousel-track');
  const cards=[...track.children];
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let index=0;
  let busy=false;
  let pointerId=null;
  let startX=0;
  let delta=0;
  let previewIndex=null;
  let lastInteraction=Date.now();
  let equalHeight=0;
  const shadowSpace=34;
  const width=()=>carousel.getBoundingClientRect().width;
  const updateHeight=()=>{track.style.height=`${(equalHeight||cards[index].offsetHeight)+shadowSpace}px`};
  const equalizeHeights=()=>{
    const previous=cards.map(card=>({
      display:card.style.display,
      visibility:card.style.visibility,
      height:card.style.height,
      transform:card.style.transform,
      transition:card.style.transition,
    }));
    cards.forEach(card=>{
      card.style.display='block';
      card.style.visibility='hidden';
      card.style.height='auto';
      card.style.transform='none';
      card.style.transition='none';
    });
    equalHeight=Math.ceil(Math.max(...cards.map(card=>card.scrollHeight||card.offsetHeight||0)));
    cards.forEach((card,i)=>{
      card.style.display=previous[i].display;
      card.style.visibility=previous[i].visibility;
      card.style.height=equalHeight?`${equalHeight}px`:previous[i].height;
      card.style.transform=previous[i].transform;
      card.style.transition=previous[i].transition;
    });
    updateHeight();
  };
  const showOnly=()=>{
    cards.forEach((card,i)=>{
      card.style.display='';
      card.style.transform='';
      card.style.transition='';
      card.classList.toggle('is-active',i===index);
      card.setAttribute('aria-hidden',String(i!==index));
      if(i!==index)card.setAttribute('inert','');
      else card.removeAttribute('inert');
    });
    previewIndex=null;
    busy=false;
    updateHeight();
  };
  const prepare=(direction)=>{
    const next=(index+direction+cards.length)%cards.length;
    if(previewIndex!==null&&previewIndex!==next){
      cards[previewIndex].style.display='';
      cards[previewIndex].style.transform='';
    }
    previewIndex=next;
    const incoming=cards[next];
    incoming.style.display='block';
    incoming.style.transition='none';
    cards[index].style.transition='none';
    return incoming;
  };
  const slide=(direction,fromDrag=false)=>{
    if(busy)return;
    const next=(index+direction+cards.length)%cards.length;
    const outgoing=cards[index];
    const incoming=prepare(direction);
    if(!fromDrag){
      outgoing.style.transform='translateX(0px)';
      incoming.style.transform=`translateX(${direction*width()}px)`;
    }
    busy=true;
    lastInteraction=Date.now();
    const finish=()=>{index=next;showOnly()};
    if(reducedMotion.matches){finish();return}
    incoming.getBoundingClientRect();
    outgoing.style.transition='transform .5s ease';
    incoming.style.transition='transform .5s ease';
    requestAnimationFrame(()=>{
      outgoing.style.transform=`translateX(${-direction*width()}px)`;
      incoming.style.transform='translateX(0px)';
    });
    setTimeout(finish,550);
  };
  carousel.querySelector('[data-prev]').addEventListener('click',()=>slide(-1));
  carousel.querySelector('[data-next]').addEventListener('click',()=>slide(1));
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      slide(event.key==='ArrowRight'?1:-1);
    }
  });
  track.addEventListener('pointerdown',event=>{
    if(busy||event.button!==0||event.target.closest('a,button'))return;
    event.preventDefault();
    pointerId=event.pointerId;
    startX=event.clientX;
    delta=0;
    track.classList.add('is-dragging');
    track.setPointerCapture(pointerId);
    lastInteraction=Date.now();
  });
  track.addEventListener('pointermove',event=>{
    if(event.pointerId!==pointerId)return;
    delta=event.clientX-startX;
    if(Math.abs(delta)<5)return;
    const direction=delta<0?1:-1;
    const incoming=prepare(direction);
    cards[index].style.transform=`translateX(${delta}px)`;
    incoming.style.transform=`translateX(${direction*width()+delta}px)`;
  });
  const endDrag=event=>{
    if(event.pointerId!==pointerId)return;
    delta=event.clientX-startX;
    pointerId=null;
    track.classList.remove('is-dragging');
    if(Math.abs(delta)>Math.max(45,width()*.1)){
      if(previewIndex===null)prepare(delta<0?1:-1);
      slide(delta<0?1:-1,true);
    }else if(previewIndex!==null){
      cards[index].style.transform='';
      cards[previewIndex].style.display='';
      cards[previewIndex].style.transform='';
      previewIndex=null;
      updateHeight();
    }
    lastInteraction=Date.now();
  };
  track.addEventListener('pointerup',endDrag);
  track.addEventListener('pointercancel',endDrag);
  track.addEventListener('dragstart',event=>event.preventDefault());
  showOnly();
  equalizeHeights();
  window.addEventListener('resize',equalizeHeights);
  document.fonts?.ready.then(equalizeHeights);
  for(const image of track.querySelectorAll?.('img')||[]){
    if(!image.complete)image.addEventListener('load',equalizeHeights,{once:true});
  }
  carousel.classList.add('is-ready');
  setInterval(()=>{
    if(reducedMotion.matches||document.hidden||busy||pointerId!==null||carousel.matches(':hover')||(document.activeElement!==track&&track.contains(document.activeElement))||Date.now()-lastInteraction<5000)return;
    slide(1);
  },5000);
}

for(const carousel of document.querySelectorAll('[data-legacy-carousel]')){
  const track=carousel.querySelector('.carousel-track');
  const cards=[...track.children];
  const slides=cards.map(card=>{
    const slide=document.createElement('div');
    slide.className='carousel-slide';
    slide.append(card);
    return slide;
  });
  track.replaceChildren(...slides);
  if(slides.length>1){
    const before=slides.at(-1).cloneNode(true);
    const after=slides[0].cloneNode(true);
    for(const clone of [before,after]){
      clone.setAttribute('aria-hidden','true');
      clone.setAttribute('inert','');
      clone.dataset.carouselClone='';
    }
    track.prepend(before);
    track.append(after);
  }
  track.querySelectorAll('img').forEach(image=>{image.draggable=false});
  let position=slides.length>1?1:0;
  let startX=0;
  let pointerX=0;
  let pointerId=null;
  let isDragging=false;
  let blockClick=false;
  let isAnimating=false;
  let lastInteraction=Date.now();
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const width=()=>carousel.getBoundingClientRect().width;
  const activeIndex=()=>position===0?slides.length-1:position===slides.length+1?0:position-1;
  const paint=(animate=true)=>{
    track.style.transition=animate&&!reducedMotion.matches?'transform .5s ease':'none';
    track.style.transform=`translate3d(${-position*width()}px,0,0)`;
    slides.forEach((slide,i)=>{
      slide.setAttribute('aria-hidden',String(i!==activeIndex()));
      if(i!==activeIndex())slide.setAttribute('inert','');
      else slide.removeAttribute('inert');
    });
  };
  const settle=()=>{
    if(position===0)position=slides.length;
    else if(position===slides.length+1)position=1;
    isAnimating=false;
    paint(false);
  };
  const go=(direction)=>{
    if(isAnimating||slides.length<2)return;
    position+=direction;
    lastInteraction=Date.now();
    isAnimating=!reducedMotion.matches;
    paint(true);
    if(reducedMotion.matches)settle();
  };
  track.addEventListener('transitionend',event=>{
    if(event.target===track&&event.propertyName==='transform'&&isAnimating)settle();
  });
  carousel.querySelector('[data-prev]').addEventListener('click',()=>go(-1));
  carousel.querySelector('[data-next]').addEventListener('click',()=>go(1));
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      go(event.key==='ArrowRight'?1:-1);
    }
  });
  track.addEventListener('pointerdown',event=>{
    if(isAnimating||event.button!==0||event.target.closest('a,button'))return;
    pointerId=event.pointerId;
    startX=pointerX=event.clientX;
    isDragging=false;
    track.setPointerCapture(pointerId);
    lastInteraction=Date.now();
  });
  track.addEventListener('pointermove',event=>{
    if(event.pointerId!==pointerId)return;
    pointerX=event.clientX;
    const delta=pointerX-startX;
    if(Math.abs(delta)>5)isDragging=true;
    if(!isDragging)return;
    track.classList.add('is-dragging');
    track.style.transition='none';
    track.style.transform=`translate3d(${-position*width()+delta}px,0,0)`;
  });
  const finishDrag=(event)=>{
    if(event.pointerId!==pointerId)return;
    pointerX=event.clientX;
    const delta=pointerX-startX;
    pointerId=null;
    track.classList.remove('is-dragging');
    if(isDragging){
      blockClick=true;
      setTimeout(()=>{blockClick=false},0);
      if(Math.abs(delta)>Math.max(45,width()*.1))go(delta<0?1:-1);
      else paint(true);
    }
    isDragging=false;
    lastInteraction=Date.now();
  };
  track.addEventListener('pointerup',finishDrag);
  track.addEventListener('pointercancel',finishDrag);
  track.addEventListener('dragstart',event=>event.preventDefault());
  track.addEventListener('click',event=>{
    if(blockClick){event.preventDefault();event.stopPropagation()}
  },true);
  window.addEventListener('resize',()=>{isAnimating=false;settle()});
  paint(false);
  carousel.classList.add('is-ready');
  if(slides.length>1){
    setInterval(()=>{
      if(reducedMotion.matches||document.hidden||pointerId!==null||carousel.matches(':hover')||(document.activeElement!==track&&track.contains(document.activeElement))||Date.now()-lastInteraction<5000)return;
      go(1);
    },5000);
  }
}
/*
 * Все внешние адреса страницы собраны здесь.
 * После публикации PDF достаточно заменить menu и poster на прямые ссылки.
 */
const newYearLinks={
  menu:'https://belokurikha.ru/vechernie-restorany-i-banketnoe-menyu-v-sanatoriyah-seti-kurort-belokuriha-otkryli-zakazy-na-izyskannye-blyuda/',
  poster:'https://belokurikha.ru/category/afisha/',
  booking:'https://sales.belokurikha.ru/online/online-rules/index.php',
};

for(const actions of document.querySelectorAll('.card-actions')){
  const labels=[...actions.querySelectorAll('span')];
  const targets=[newYearLinks.menu,newYearLinks.poster];
  labels.forEach((label,index)=>{
    const link=document.createElement('a');
    link.href=targets[index]||newYearLinks.poster;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent=label.textContent;
    label.replaceWith(link);
  });
}

for(const button of document.querySelectorAll('[data-booking]')){
  const link=document.createElement('a');
  link.href=button.dataset.bookingHref||newYearLinks.booking;
  link.className=button.className;
  link.textContent=button.textContent;
  button.replaceWith(link);
}

const highlights=document.querySelector?.('.highlights');
if(highlights&&'IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const cards=[...highlights.querySelectorAll('.highlight')];
  highlights.classList.add('has-motion');
  cards.forEach((card,index)=>card.style.transitionDelay=`${index*70}ms`);
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  },{threshold:.18});
  cards.forEach(card=>observer.observe(card));
}
