import { listActivities } from './activities.js?v=20261002-2';
import { listPublicSpeakers } from './speakers.js?v=20261013-hostinger-3';

function updateStat(name, value) {
  if (!Number.isFinite(value) || value < 0) return;
  document.querySelectorAll(`[data-public-stat="${name}"]`).forEach(element => {
    const formatted = String(value);
    element.textContent = formatted;
    element.dataset.target = formatted;
  });
}

function countPublicSpeakers(groups, openActivityIds) {
  const ids = new Set();
  for (const group of groups) {
    for (const speaker of group?.speakers || []) {
      if ((speaker.participations || []).some(item => openActivityIds.has(item?.activity_id))) ids.add(speaker.id);
    }
  }
  return ids.size;
}

async function loadPublicStats() {
  try {
    const activities = await listActivities();
    const openActivities = activities.filter(activity => activity?.status === 'open');
    updateStat('activities', openActivities.length);
    try {
      const speakers = await listPublicSpeakers();
      updateStat('speakers', countPublicSpeakers(speakers, new Set(openActivities.map(activity => activity.id))));
    } catch {
      // Las estadísticas nunca bloquean la portada si el catálogo no responde.
    }
  } catch {
    // activities.js ya intenta usar su copia pública local como respaldo.
  }
}

function schedulePublicStats() {
  const targets = [...document.querySelectorAll('[data-public-stat]')];
  if (!targets.length) return;
  let started = false;
  let observer;
  const start = () => {
    if (started) return;
    started = true;
    observer?.disconnect();
    void loadPublicStats();
  };

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) start();
    }, { rootMargin: '400px 0px', threshold: 0 });
    targets.forEach(target => observer.observe(target));
    return;
  }

  // Compatibilidad: la carga se difiere hasta que el navegador termine lo crítico.
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
  else setTimeout(start, 1200);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedulePublicStats, { once: true });
else schedulePublicStats();
