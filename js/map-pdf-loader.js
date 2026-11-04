(() => {
  const map = document.querySelector('[data-map-pdf]');
  if (!map || !map.dataset.src) return;

  const load = () => {
    if (map.data) return;
    map.data = map.dataset.src;
    observer?.disconnect();
  };

  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: '600px 0px', threshold: 0 });
    observer.observe(map);
  } else {
    load();
  }
})();
