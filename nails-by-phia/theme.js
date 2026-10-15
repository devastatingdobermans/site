(() => {
  const root = document.documentElement;
  let dark = false;
  try { dark = localStorage.getItem('phia-theme') === 'dark'; } catch {}
  root.dataset.theme = dark ? 'dark' : 'light';
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    function render() {
      root.dataset.theme = dark ? 'dark' : 'light';
      button.setAttribute('aria-pressed', String(dark));
      button.textContent = dark ? 'Dark mode: on' : 'Dark mode: off';
    }
    button.addEventListener('click', () => {
      dark = !dark;
      try { localStorage.setItem('phia-theme', dark ? 'dark' : 'light'); } catch {}
      render();
    });
    render();
  });
})();
