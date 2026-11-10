(() => {
  const contact = document.getElementById('contact-dialog');
  const video = document.getElementById('video-dialog');
  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => contact.showModal()));
  document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => video.showModal()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  const gallery = document.querySelector('.photo-gallery');
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  let current = 0;
  const move = step => {
    slides[current].hidden = true;
    current = (current + step + slides.length) % slides.length;
    slides[current].hidden = false;
    gallery.querySelector('[data-counter]').textContent = `${current + 1} / ${slides.length}`;
  };
  gallery.querySelector('[data-prev]').addEventListener('click', () => move(-1));
  gallery.querySelector('[data-next]').addEventListener('click', () => move(1));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  let touchStart;
  gallery.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]; }, {passive:true});
  gallery.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.clientX;
    const dy = event.changedTouches[0].clientY - touchStart.clientY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx > 0 ? -1 : 1);
    touchStart = null;
  }, {passive:true});
})();
