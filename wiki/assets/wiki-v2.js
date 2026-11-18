(function () {
    // Restaurar scroll del sidebar
    const sidebar = document.querySelector('.wy-side-scroll');
    const keyScroll = 'rtd-sidebar-scroll';
    if (sidebar) {
      const saved = +localStorage.getItem(keyScroll) || 0;
      sidebar.scrollTop = saved;
      window.addEventListener('beforeunload', () => {
        localStorage.setItem(keyScroll, sidebar.scrollTop);
      });
    }
  
    // Forzar expandir padres del enlace activo y mantenerlos “current”
    const links = document.querySelectorAll('.wy-menu-vertical a.reference.internal, .wy-menu-vertical a');
    const here = location.pathname.replace(/\/index\.html?$/, '/');
    let activeLi = null;
  
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      // Normaliza comparando rutas "carpeta/" en vez de "carpeta/index.html"
      const norm = href.replace(/\/index\.html?$/, '/');
      if (norm && (norm === here || (norm !== '#' && here.endsWith(norm)))) {
        const li = a.closest('li');
        if (li) {
          li.classList.add('current');
          activeLi = li;
          // Sube marcando padres como current para que queden expandidos
          let p = li.parentElement;
          while (p) {
            const pli = p.closest('li');
            if (!pli) break;
            pli.classList.add('current');
            p = pli.parentElement;
          }
        }
      }
    });
  })();
  

// A 3xpr script written inside a template string (orm.executeScript(`…`)) is coloured as code, not as one string.
(function () {
  if (!window.hljs) return
  const embedScripts = (el) => {
    el.querySelectorAll('.hljs-string').forEach(span => {
      const text = span.textContent
      if (text.length > 2 && text[0] === '`' && text.endsWith('`') && text.includes('\n')) {
        const code = hljs.highlight(text.slice(1, -1), { language: 'javascript', ignoreIllegals: true }).value
        span.className = 'embedded-script'
        span.innerHTML = '<span class="hljs-string">`</span>' + code + '<span class="hljs-string">`</span>'
      }
    })
  }
  const CONTROL = new Set(['if', 'else', 'for', 'in', 'of', 'while', 'do', 'switch', 'case', 'default', 'break',
    'continue', 'return', 'throw', 'try', 'catch', 'finally', 'await'])
  const markControl = (el) => {
    el.querySelectorAll('.hljs-keyword').forEach(k => { if (CONTROL.has(k.textContent)) k.classList.add('control') })
  }
  hljs.addPlugin({ 'after:highlightElement': ({ el }) => { embedScripts(el); markControl(el) } })
  // in case the blocks were highlighted before this file loaded
  document.querySelectorAll('pre code.hljs').forEach(el => { embedScripts(el); markControl(el) })
})()
