(() => {
  const updateScale = () => document.documentElement.style.setProperty('--page-scale', document.documentElement.clientWidth > 700 ? Math.min(document.documentElement.clientWidth / 1907, 1) : 1);
  updateScale();
  window.addEventListener('resize', updateScale);
  const contact = document.getElementById('contact-dialog');
  const video = document.getElementById('video-dialog');
  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => contact.showModal()));
  document.querySelector('[data-video]').addEventListener('click', () => video.showModal());
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const r = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
    });
  });
  const gallery = document.querySelector('.gift-gallery');
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  const dots = [...gallery.querySelectorAll('[data-dot]')];
  let current = 0;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === current)));
    gallery.querySelector('.pagination').dataset.used = 'true';
    gallery.querySelector('[data-counter]').textContent = `Фото ${current + 1} из ${slides.length}`;
  }
  gallery.querySelector('[data-prev]').addEventListener('click', () => show(current - 1));
  gallery.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); show(current + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  let start;
  gallery.addEventListener('touchstart', event => { const t=event.changedTouches[0];start={x:t.clientX,y:t.clientY}; }, {passive:true});
  gallery.addEventListener('touchend', event => {
    if (!start) return;
    const t=event.changedTouches[0], dx=t.clientX-start.x, dy=t.clientY-start.y;
    if (Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.5) show(current+(dx>0?-1:1));
    start=null;
  }, {passive:true});
})();
