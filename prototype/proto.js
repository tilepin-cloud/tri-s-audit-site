// Панель прототипа: выбор заголовочного шрифта и принудительные веб-шрифты. Не идёт в продакшн.
(function () {
  const root = document.documentElement;
  const saved = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  root.dataset.head = saved('proto-head', 'fira');
  root.dataset.webfonts = saved('proto-webfonts', '1');
  const bar = document.createElement('div');
  bar.className = 'proto-bar';
  bar.innerHTML = `
    <span class="proto-nav">
      <a href="home.html">Главная</a><a href="service.html">Услуга</a><a href="post.html">Статья</a>
    </span>
    <button data-head="fira" aria-pressed="false" title="Заголовки: Fira Sans Condensed">A Fira</button>
    <button data-head="inter" aria-pressed="false" title="Заголовки: Inter Tight">B Inter</button>
    <button data-web aria-pressed="false" title="Показывать веб-шрифты даже там, где есть Calibri/Bahnschrift">web</button>`;
  document.body.append(bar);
  const sync = () => {
    bar.querySelectorAll('[data-head]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.head === root.dataset.head)));
    bar.querySelector('[data-web]').setAttribute('aria-pressed', String(root.dataset.webfonts === '1'));
    const here = location.pathname.split('/').pop();
    bar.querySelectorAll('.proto-nav a').forEach(a => a.getAttribute('href') === here ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  };
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.head) { root.dataset.head = b.dataset.head; store('proto-head', b.dataset.head); }
    if ('web' in b.dataset) { root.dataset.webfonts = root.dataset.webfonts === '1' ? '0' : '1'; store('proto-webfonts', root.dataset.webfonts); }
    sync();
  });
  sync();
})();
