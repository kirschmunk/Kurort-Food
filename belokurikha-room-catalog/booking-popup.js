/* Standalone callback form. No jQuery, external widgets or browser storage. */
(() => {
  'use strict';
  function normalizePhone(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (String(value || '').trim().startsWith('+')) return '+' + digits;
    if (digits.length === 10) digits = '7' + digits;
    else if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
    return '+' + digits;
  }
  function validate({name, phone, consent}) {
    if (String(name || '').trim().length < 2) return {field:'name', message:'Пожалуйста, укажите ваше имя.'};
    const text = String(phone || '').trim();
    const digits = text.replace(/\D/g, '');
    if (!/^[+\d\s()\-]+$/.test(text) || digits.length < 10 || digits.length > 15) return {field:'phone', message:'Укажите телефон с кодом страны, например +7 913 123-45-67.'};
    if (consent !== true) return {field:'consent', message:'Для отправки заявки нужно согласие с политикой обработки персональных данных.'};
    return null;
  }
  function responseState(status, text) {
    if (status < 200 || status >= 300) return 'unknown';
    try {
      const data = JSON.parse(text);
      if ((data?.success === true && data?.done === false) || (data?.success === false && data?.done === true)) return 'unknown';
      if (data?.success === true || data?.done === true) return 'accepted';
      if (data?.success === false || data?.done === false) return 'rejected';
    } catch (_) { /* An empty/HTML legacy response is not a receipt. */ }
    return 'unknown';
  }
  function requestTarget(mode, address) {
    const page = new URL(address);
    if (mode !== 'live' || page.protocol !== 'https:' || !['www.belokurikha-san.ru', 'belokurikha-san.ru'].includes(page.hostname)) return null;
    return new URL('/includes/theme-form.php', page.origin).href;
  }
  async function send(endpoint, values, transport = fetch) {
    if (!endpoint) return 'demo';
    if (validate(values)) return 'rejected';
    const body = new URLSearchParams({
      name:values.name.trim(), phone:normalizePhone(values.phone),
      url:values.url || '', agent:values.agent || '', consent:'1',
      room_id:values.roomId || '', room_title:values.roomTitle || ''
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await transport(endpoint, {
        method:'POST', credentials:'same-origin', redirect:'error',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body, signal:controller.signal
      });
      return responseState(response.status, await response.text());
    } catch (_) { return 'unknown'; }
    finally { clearTimeout(timer); }
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {normalizePhone, validate, responseState, requestTarget, send};
    return;
  }
  const script = document.currentScript;
  const endpoint = requestTarget(script?.dataset.bookingMode || 'demo', location.href);
  const css = new URL('booking-popup.css', script.src);
  css.search = new URL(script.src).search;
  function init() {
    if (document.getElementById('br-booking-popup')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet'; style.href = css.href;
    document.head.append(style);
    const dialog = document.createElement('dialog');
    dialog.id = 'br-booking-popup'; dialog.className = 'br-booking';
    dialog.setAttribute('aria-labelledby', 'br-booking-title');
    dialog.setAttribute('aria-describedby', 'br-booking-intro');
    dialog.innerHTML = `
      <button class="br-booking__close" type="button" aria-label="Закрыть заявку"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <p class="br-booking__eyebrow">Санаторий «Белокуриха»</p>
      <h2 id="br-booking-title">Оставьте заявку</h2>
      <p class="br-booking__intro" id="br-booking-intro">Мы перезвоним вам, чтобы уточнить детали и подтвердить заявку.</p>
      <div class="br-booking__room"><span>Выбранный номер</span><strong data-booking-room></strong></div>
      <form class="br-booking__form" novalidate>
        <div class="br-booking__fields">
          <label class="br-booking__field" for="br-booking-name">Ваше имя <span>*</span><input id="br-booking-name" name="name" autocomplete="name" maxlength="100" placeholder="Как к вам обращаться" required></label>
          <label class="br-booking__field" for="br-booking-phone">Телефон <span>*</span><input id="br-booking-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="+7 (___) ___-__-__" required></label>
        </div>
        <label class="br-booking__consent" for="br-booking-consent"><input id="br-booking-consent" name="consent" type="checkbox" required><span>Подтверждаю своё согласие с <a href="https://www.belokurikha-san.ru/about/privacy-policy/" target="_blank" rel="noopener noreferrer">политикой обработки персональных данных</a>.</span></label>
        <p class="br-booking__status" role="status" aria-live="polite" hidden></p>
        <button class="br-booking__submit" type="submit"><span>Отправить заявку</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
      </form>
      <p class="br-booking__demo" ${endpoint ? 'hidden' : ''}>Демонстрация: данные из этой формы не отправляются.</p>
      <p class="br-booking__contact">Или позвоните нам: <a href="tel:88007075183">8 800 707 51 83</a></p>`;
    document.body.append(dialog);
    const form = dialog.querySelector('form');
    const closeButton = dialog.querySelector('.br-booking__close');
    const submit = dialog.querySelector('[type="submit"]');
    const status = dialog.querySelector('.br-booking__status');
    let opener, roomId = '', roomTitle = '', previousOverflow = '', pending = false, completed = false, uncertain = false;
    const feedback = (message, kind = 'error') => {
      status.textContent = message; status.dataset.kind = kind; status.hidden = !message;
    };
    const busy = value => {
      pending = value;
      form.setAttribute('aria-busy', String(value));
      closeButton.disabled = value;
      for (const input of form.querySelectorAll('input')) input.disabled = value;
      submit.disabled = value || completed || uncertain;
      submit.querySelector('span').textContent = value ? 'Отправляем…' : 'Отправить заявку';
    };
    const close = () => { if (!pending) dialog.close(); };
    closeButton.addEventListener('click', close);
    dialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      form.reset(); // Do not retain guest details between openings.
      opener?.focus({preventScroll:true});
    });
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-br-catalog] [data-book-room]');
      if (!button) return;
      // Capture also handles the old <button><a> integration on nomera-temp.
      // It prevents both the legacy popup and the catalog hook firing twice.
      event.preventDefault(); event.stopPropagation();
      if (dialog.open || pending) return;
      opener = button; roomId = button.dataset.bookRoom || '';
      roomTitle = button.dataset.roomTitle || button.closest('[data-room]')?.querySelector('h3')?.textContent.trim() || 'Номер санатория';
      dialog.querySelector('[data-booking-room]').textContent = roomTitle;
      form.reset(); completed = false;
      form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
      feedback(uncertain ? 'Результат предыдущей отправки не подтверждён. Пожалуйста, позвоните нам, прежде чем отправлять заявку повторно.' : '');
      busy(false);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal(); dialog.scrollTop = 0;
      form.elements.name.focus({preventScroll:true});
    }, true);
    form.addEventListener('input', event => event.target.removeAttribute('aria-invalid'));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || completed || uncertain) return;
      const values = {name:form.elements.name.value, phone:form.elements.phone.value, consent:form.elements.consent.checked, roomId, roomTitle, url:location.href, agent:navigator.userAgent};
      const error = validate(values);
      if (error) {
        feedback(error.message); form.elements[error.field].setAttribute('aria-invalid', 'true');
        form.elements[error.field].focus(); return;
      }
      feedback(''); busy(true);
      const result = await send(endpoint, values);
      completed = result === 'accepted' || result === 'demo';
      uncertain = result === 'unknown';
      busy(false);
      if (result === 'demo') feedback('Форма работает. Это демонстрация — заявка не отправлена.', 'info');
      else if (result === 'accepted') {
        form.reset();
        feedback('Спасибо! Сайт принял вашу заявку. Мы свяжемся с вами, чтобы уточнить детали.', 'success');
      } else if (result === 'rejected') feedback('Сайт не принял заявку. Проверьте данные или позвоните нам.');
      else feedback('Не удалось подтвердить результат отправки. Заявка могла поступить на сайт. Пожалуйста, позвоните нам, прежде чем отправлять её повторно.');
      status.scrollIntoView({block:'nearest'});
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
