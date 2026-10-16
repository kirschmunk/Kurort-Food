// Демо не отправляет адреса и не изменяет подписку.
document.querySelector('.demo-subscription input[type="button"]').addEventListener('click', () => {
  const result = document.querySelector('#demo-subscribe-result');
  result.textContent = 'Это макет: данные не отправляются.';
  result.hidden = false;
});
