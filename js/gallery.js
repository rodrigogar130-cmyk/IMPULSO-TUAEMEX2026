const catalogUrl = 'data/galeria.json';
const categoryLabels = {
  all: 'Todos los momentos',
  inauguracion: 'Inauguraci\u00f3n',
  cultura: 'Cultura e Innovaci\u00f3n Creativa',
  deporte: 'Deporte',
  tecnologia: 'Tecnolog\u00eda',
  diseno: 'Dise\u00f1o',
  investigacion: 'Investigaci\u00f3n Aplicada',
  gobernanza: 'Gobernanza',
  bienestar: 'Bienestar Integral',
  bootcamp: 'Bootcamp y Demo Day'
};
const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });

function publishedItems(items) {
  return items.filter(item => item?.published && item?.id && item?.image).sort((a, b) => (a.order || 0) - (b.order || 0));
}

function formatMeta(item) {
  const parts = [categoryLabels[item.category] || item.category];
  if (item.date) {
    const value = new Date(`${item.date}T12:00:00`);
    if (!Number.isNaN(value.valueOf())) parts.push(dateFormatter.format(value));
  }
  return parts.filter(Boolean).join(' \u00b7 ');
}

function safeImage(image, alt) {
  const img = document.createElement('img');
  img.src = image;
  img.alt = alt || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

function safeMedia(item) {
  if (item.type !== 'video') return safeImage(item.thumbnail || item.image, item.alt);
  const video = document.createElement('video');
  video.src = item.thumbnail || item.image;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', item.alt || item.title || 'Video');
  return video;
}

async function loadCatalog() {
  const response = await fetch(catalogUrl, { cache: 'no-cache' });
  if (!response.ok) throw new Error('No se pudo cargar el cat\u00e1logo.');
  return publishedItems(await response.json());
}

function initGallery(items) {
  const grid = document.querySelector('[data-gallery-grid]');
  if (!grid) return;

  const status = document.querySelector('[data-gallery-status]');
  const empty = document.querySelector('[data-gallery-empty]');
  const filters = [...document.querySelectorAll('[data-gallery-filter]')];
  const dialog = document.querySelector('[data-gallery-dialog]');
  const dialogImage = dialog?.querySelector('[data-gallery-dialog-image]');
  const dialogVideo = dialog?.querySelector('[data-gallery-dialog-video]');
  const dialogTitle = dialog?.querySelector('[data-gallery-dialog-title]');
  const dialogMeta = dialog?.querySelector('[data-gallery-dialog-meta]');
  const prev = dialog?.querySelector('[data-gallery-prev]');
  const next = dialog?.querySelector('[data-gallery-next]');
  let active = 'all';
  let visible = [];
  let selected = 0;
  let pointerStart = null;

  const setDialog = () => {
    const item = visible[selected];
    if (!item) return;
    const isVideo = item.type === 'video';

    if (dialogImage) {
      dialogImage.hidden = isVideo;
      if (!isVideo) {
        dialogImage.src = item.image;
        dialogImage.alt = item.alt || item.title || '';
      }
    }
    if (dialogVideo) {
      dialogVideo.pause();
      dialogVideo.hidden = !isVideo;
      if (isVideo) {
        dialogVideo.src = item.image;
        dialogVideo.load();
      } else {
        dialogVideo.removeAttribute('src');
      }
    }
    dialogTitle.textContent = item.title || 'Momento Impulso';
    dialogMeta.textContent = [item.description, formatMeta(item)].filter(Boolean).join(' \u00b7 ');
    prev.disabled = next.disabled = visible.length < 2;
  };

  const open = index => {
    selected = index;
    setDialog();
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const draw = () => {
    visible = items.filter(item => active === 'all' || item.category === active);
    grid.replaceChildren();
    empty.hidden = visible.length !== 0;
    status.textContent = visible.length ? `${visible.length} ${visible.length === 1 ? 'momento disponible' : 'momentos disponibles'}.` : '';

    visible.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-card';
      button.setAttribute('aria-label', `Abrir ${item.title || (item.type === 'video' ? 'video' : 'fotograf\u00eda')}`);
      const figure = document.createElement('figure');
      figure.append(safeMedia(item));
      const caption = document.createElement('figcaption');
      const title = document.createElement('span');
      title.className = 'gallery-card-title';
      title.textContent = item.title || 'Momento Impulso';
      const meta = document.createElement('span');
      meta.className = 'gallery-card-meta';
      meta.textContent = [item.type === 'video' ? 'Video' : null, formatMeta(item)].filter(Boolean).join(' \u00b7 ');
      caption.append(title, meta);
      figure.append(caption);
      button.append(figure);
      button.addEventListener('click', () => open(index));
      grid.append(button);
    });
  };

  const move = direction => {
    if (!visible.length) return;
    selected = (selected + direction + visible.length) % visible.length;
    setDialog();
  };

  filters.forEach(filter => filter.addEventListener('click', () => {
    active = filter.dataset.galleryFilter;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
    draw();
  }));

  dialog?.querySelector('[data-gallery-close]')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('close', () => dialogVideo?.pause());
  prev?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  dialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog?.addEventListener('pointerdown', event => { pointerStart = event.clientX; });
  dialog?.addEventListener('pointerup', event => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1);
  });
  draw();
}

function initHomePreview(items) {
  const target = document.querySelector('[data-gallery-preview]');
  if (!target) return;
  const selected = items.filter(item => item.featured).concat(items.filter(item => !item.featured)).slice(0, 8);
  if (!selected.length) {
    target.innerHTML = '<p class="home-gallery-empty">Las fotograf\u00edas estar\u00e1n disponibles pr\u00f3ximamente.</p>';
    return;
  }
  target.replaceChildren();
  selected.forEach(item => {
    const figure = document.createElement('figure');
    figure.className = 'home-gallery-item';
    figure.append(safeMedia(item));
    const label = document.createElement('span');
    label.textContent = item.title || 'Momento Impulso';
    figure.append(label);
    target.append(figure);
  });
}

loadCatalog()
  .then(items => { initGallery(items); initHomePreview(items); })
  .catch(() => {
    document.querySelectorAll('[data-gallery-status]').forEach(node => { node.textContent = 'No fue posible cargar la galer\u00eda por el momento.'; });
    document.querySelectorAll('[data-gallery-empty]').forEach(node => { node.hidden = false; });
  });
