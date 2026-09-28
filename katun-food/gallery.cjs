// Build-time only: the published page contains no JavaScript.
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function renderGallery(key, gallery) {
  if (!/^[a-z][a-z0-9-]*$/.test(key) || !gallery.photos.length) throw new Error('Gallery needs a unique key and at least one photo');
  const count = gallery.photos.length;
  const id = index => `kfn-${key}-photo-${index + 1}`;
  const slides = gallery.photos.map((photo, index) => {
    if (!/^(?:assets\/|\/(?!\/)|https:\/\/)/.test(photo.src)) throw new Error('Unsupported photo URL');
    const prev = (index + count - 1) % count;
    const next = (index + 1) % count;
    return `<input class="kfn-state kfn-photo-state" type="radio" name="kfn-${key}-photo" id="${id(index)}" aria-label="Фото ${index + 1} из ${count}: ${escape(photo.alt)}"${index === 0 ? ' checked' : ''}>
<div class="kfn-photo-slide">
<div class="kfn-photo-stage"><figure class="kfn-photo"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" loading="lazy" decoding="async"></figure></div>
${count > 1 ? `<div class="kfn-photo-controls">
<div class="kfn-photo-dots" aria-hidden="true">${gallery.photos.map((_, n) => `<label class="kfn-photo-dot${n === index ? ' kfn-dot-active' : ''}" for="${id(n)}">${n + 1}</label>`).join('')}</div>
<div class="kfn-photo-pair" aria-hidden="true"><label class="kfn-photo-arrow" for="${id(prev)}" title="Предыдущее фото">←</label><span class="kfn-photo-count">${index + 1} / ${count}</span><label class="kfn-photo-arrow" for="${id(next)}" title="Следующее фото">→</label></div>
</div>` : ''}
</div>`;
  });
  return `<fieldset class="kfn-photos${gallery.large ? ' kfn-photos-large' : ''}"><legend class="kfn-sr-only">${escape(gallery.label)}</legend>\n${slides.join('\n')}\n</fieldset>`;
}
module.exports = {renderGallery};
