// The sections of the current page are open: its link and every parent are marked current.
;(function () {
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
})()

// The side menu stays where it was: the theme scrolled it on every page (scrollIntoView of the current link) and
// moved it with the page while reading (its "sticky" navigation). Its position is kept per tab, and the current page
// is brought into view only when it is out of sight.
;(function () {
  const KEY = 'wiki-side-menu-scroll'
  const nav = window.SphinxRtdTheme && window.SphinxRtdTheme.Navigation
  if (nav) {
    // the menu doesn't follow the scroll of the page
    nav.onScroll = function () { this.winScroll = false }
    // the current page is marked and its sections opened, without scrolling the menu
    const reset = nav.reset
    nav.reset = function () {
      const scrollIntoView = Element.prototype.scrollIntoView
      Element.prototype.scrollIntoView = function () {}
      try { return reset.apply(this, arguments) } finally { Element.prototype.scrollIntoView = scrollIntoView }
    }
  }
  const sidebar = () => document.querySelector('.wy-side-scroll')
  const save = () => {
    const el = sidebar()
    if (!el) return
    try { sessionStorage.setItem(KEY, String(el.scrollTop)) } catch (e) { /* no storage: nothing kept */ }
  }
  const restore = () => {
    const el = sidebar()
    if (!el) return
    let saved = null
    try { saved = sessionStorage.getItem(KEY) } catch (e) { /* no storage */ }
    if (saved !== null) el.scrollTop = +saved
    // the current page, in view only if it is out of sight
    // the link of the page itself: the deepest one marked current
    const marked = el.querySelectorAll('.wy-menu-vertical a.current, .wy-menu-vertical li.current > a:not([href^="#"])')
    const current = marked.length ? marked[marked.length - 1] : null
    if (current) {
      const box = el.getBoundingClientRect()
      const link = current.getBoundingClientRect()
      if (link.top < box.top || link.bottom > box.bottom) el.scrollTop += link.top - box.top - box.height / 3
    }
  }
  document.addEventListener('click', (event) => { if (event.target.closest && event.target.closest('.wy-menu-vertical a')) save() })
  window.addEventListener('pagehide', save)
  // after the theme has marked the current page (jQuery ready)
  if (document.readyState === 'complete') restore()
  else window.addEventListener('load', restore)
})()

// A 3xpr script written inside a template string (orm.executeScript(`…`)) is coloured as code, not as one string.
;(function () {
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
