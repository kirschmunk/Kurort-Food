(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL(script?.dataset.roomsBase || '.', script?.src || location.href);
  const rooms = window.BelokurikhaRoomsData || [];
  document.querySelectorAll('[data-br-catalog]').forEach(section => {
    if (section.dataset.catalogReady) return;
    section.dataset.catalogReady = 'true';
    const dialog = section.querySelector('dialog');
    let opener;
    let priorOverflow = '';
    let changePhoto = () => {};
    const close = () => dialog.close();
    dialog.querySelector('.br-rooms__close').addEventListener('click', close);
    dialog.addEventListener('close', () => {
      document.body.style.overflow = priorOverflow;
      opener?.focus({preventScroll:true});
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    dialog.querySelector('.br-rooms__photo-prev').addEventListener('click', () => changePhoto(-1));
    dialog.querySelector('.br-rooms__photo-next').addEventListener('click', () => changePhoto(1));
    dialog.querySelector('.br-rooms__gallery').addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      changePhoto(event.key === 'ArrowRight' ? 1 : -1);
    });
    const paragraphs = (selector, values) => {
      dialog.querySelector(selector).replaceChildren(...values.map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }));
    };
    section.querySelectorAll('[data-open-room]').forEach(button => button.addEventListener('click', () => {
      const room = rooms.find(item => item.id === button.dataset.openRoom);
      if (!room || dialog.open) return;
      opener = button;
      const name = section.querySelector(`[data-room="${room.id}"] .br-catalog__name`);
      dialog.querySelector('#br-rooms-modal-title').replaceChildren(...Array.from(name.childNodes, node => node.cloneNode(true)));
      dialog.querySelector('.br-rooms__modal-subtitle').textContent = room.subtitle;
      paragraphs('.br-rooms__description', room.description);
      paragraphs('.br-rooms__notes', room.notes);
      const specs = [{label:'Площадь:', value:room.area + ' м²'}, {label:'Основных мест:', value:String(room.main)}];
      if (room.extra !== null) specs.push({label:'Доп. мест:', value:String(room.extra)});
      specs.push(...room.specs.filter(spec => spec.label === 'Вместимость:'), ...room.specs.filter(spec => spec.label !== 'Вместимость:'));
      dialog.querySelector('.br-rooms__parameters').replaceChildren(...specs.map(spec => {
        const group = document.createElement('div');
        if (spec.label.length > 32) group.classList.add('br-rooms__parameter-wide');
        if (spec.value.length > 22) group.classList.add('br-rooms__parameter-text');
        const label = document.createElement('dt');
        const value = document.createElement('dd');
        label.textContent = spec.label;
        value.textContent = spec.value;
        group.append(label, value);
        return group;
      }));
      const image = dialog.querySelector('.br-rooms__large');
      const thumbs = dialog.querySelector('.br-rooms__thumbs');
      thumbs.replaceChildren();
      let activePhoto = 0;
      const showPhoto = index => {
        activePhoto = (index + room.images.length) % room.images.length;
        image.src = new URL(room.images[activePhoto], base).href;
        image.alt = `${room.title} — фотография ${activePhoto + 1}`;
        dialog.querySelector('.br-rooms__photo-count').textContent = `${activePhoto + 1} / ${room.images.length}`;
        thumbs.querySelectorAll('button').forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === activePhoto)));
      };
      changePhoto = direction => showPhoto(activePhoto + direction);
      room.images.forEach((src, i) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.setAttribute('aria-label', `Фотография ${i + 1}`);
        const photo = document.createElement('img');
        photo.src = new URL(src, base).href;
        photo.alt = '';
        thumb.append(photo);
        thumb.addEventListener('click', () => showPhoto(i));
        thumbs.append(thumb);
      });
      showPhoto(0);
      priorOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.scrollTop = 0;
      dialog.querySelector('.br-rooms__close').focus({preventScroll:true});
    }));
    // The host website owns booking. No popup, requests or form submission here.
    section.querySelectorAll('[data-book-room]').forEach(button => button.addEventListener('click', () => {
      const room = rooms.find(item => item.id === button.dataset.bookRoom);
      if (!room) return;
      button.dispatchEvent(new CustomEvent('belokurikha:book-room', {
        bubbles:true,
        detail:{id:room.id, title:room.title}
      }));
    }));
  });
})();
