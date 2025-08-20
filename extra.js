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
  