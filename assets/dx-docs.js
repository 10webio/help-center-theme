/* 10Web Help Center — docs layout scripts (loaded with defer from document_head.hbs) */

/* =====================================================================
   10Web Help Center — Docs layout (v2) behaviour
   - Left sidebar: categories → sections / sub-categories → article titles
   - Right rail: "On this page" built from the article's h2/h3, with scroll-spy
   - ⌘K / Ctrl+K search modal (instant results from the Help Center API)
   - Theme toggle, mobile drawer, "Ask AI", anonymous feedback buttons
   Uses the existing globals from script.js when present:
   mainSections, hiddenArticles, redirection_list.
   ===================================================================== */
(function () {
  'use strict';

  var DX = window.DX = window.DX || {};
  var MOCK = window.DX_MOCK || null;
  var localeMatch = location.pathname.match(/\/hc\/([a-z]{2}(?:-[a-z0-9]+)?)/i);
  DX.locale = (window.HelpCenter && HelpCenter.user && HelpCenter.user.locale) || (localeMatch ? localeMatch[1] : 'en-us');
  DX.api = '/api/v2/help_center/' + DX.locale + '/';
  var CACHE_MS = 15 * 60 * 1000;

  /* ---------- small helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var ICON = {
    chevron: '<svg class="dx-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.92 8C10.92 8.14 10.87 8.28 10.76 8.39L6.01 13.14C5.8 13.35 5.45 13.35 5.24 13.14C5.02 12.92 5.02 12.58 5.24 12.36L9.6 8L5.24 3.64C5.02 3.42 5.02 3.08 5.24 2.86C5.45 2.65 5.8 2.65 6.01 2.86L10.76 7.61C10.87 7.72 10.92 7.86 10.92 8L10.92 8Z"/></svg>',
    down: '<svg class="dx-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10.93C7.86 10.93 7.72 10.87 7.61 10.76L2.86 6.01C2.65 5.8 2.65 5.45 2.86 5.24C3.08 5.02 3.42 5.02 3.64 5.24L8 9.6L12.36 5.24C12.58 5.02 12.92 5.02 13.14 5.24C13.35 5.45 13.35 5.8 13.14 6.01L8.39 10.76C8.28 10.87 8.14 10.93 8 10.93H8Z"/></svg>'
  };
  function cacheGet(key) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.t > CACHE_MS) return null;
      return obj.v;
    } catch (e) { return null; }
  }
  function cacheSet(key, v) {
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { /* storage full or blocked */ }
  }
  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function getAll(path, key) {
    var out = [];
    function page(url) {
      return getJSON(url).then(function (j) {
        out = out.concat(j[key] || []);
        return j.next_page ? page(j.next_page) : out;
      });
    }
    return page(DX.api + path + (path.indexOf('?') > -1 ? '&' : '?') + 'per_page=100');
  }
  function parseJSONList(text) {
    if (!text || typeof text !== 'string') return null;
    var t = text.trim();
    if (t.charAt(0) !== '[') return null;
    try { var v = JSON.parse(t); return Array.isArray(v) ? v : null; } catch (e) { return null; }
  }
  function byPosition(a, b) { return (a.position || 0) - (b.position || 0); }

  /* ---------- data source (live API or mock for the preview) ---------- */
  var data = {
    structure: function () {
      if (MOCK) return Promise.resolve({ categories: MOCK.categories, sections: MOCK.sections });
      var key = 'dx:cs:' + DX.locale;
      var hit = cacheGet(key);
      if (hit) return Promise.resolve(hit);
      return Promise.all([getAll('categories.json', 'categories'), getAll('sections.json', 'sections')])
        .then(function (r) {
          var v = {
            categories: r[0].map(function (c) { return { id: c.id, name: c.name, position: c.position, html_url: c.html_url, description: c.description }; }),
            sections: r[1].map(function (s) { return { id: s.id, name: s.name, position: s.position, category_id: s.category_id, parent_section_id: s.parent_section_id || null, html_url: s.html_url, description: s.description }; })
          };
          cacheSet(key, v);
          return v;
        });
    },
    articles: function (sectionId) {
      if (MOCK) return Promise.resolve((MOCK.articles[sectionId] || []).slice());
      var key = 'dx:a:' + DX.locale + ':' + sectionId;
      var hit = cacheGet(key);
      if (hit) return Promise.resolve(hit);
      return getAll('sections/' + sectionId + '/articles.json?sort_by=position&sort_order=asc', 'articles')
        .then(function (list) {
          var v = list.filter(function (a) { return !a.draft; })
            .map(function (a) { return { id: a.id, title: a.title, html_url: a.html_url, position: a.position }; });
          cacheSet(key, v);
          return v;
        });
    },
    search: function (q) {
      if (MOCK) return Promise.resolve(MOCK.search(q));
      return getJSON('/api/v2/help_center/articles/search.json?locale=' + encodeURIComponent(DX.locale) + '&per_page=8&query=' + encodeURIComponent(q))
        .then(function (j) {
          return (j.results || []).map(function (r) {
            var tmp = document.createElement('div'); tmp.innerHTML = r.snippet || '';
            return { title: r.title || r.name, url: r.html_url, path: (tmp.textContent || '').trim() };
          });
        });
    }
  };

  /* ---------- article visibility rules carried over from script.js ---------- */
  function isHidden(a) {
    var hidden = (typeof hiddenArticles !== 'undefined') ? hiddenArticles : [];
    if (hidden.indexOf(Number(a.id)) > -1 || hidden.indexOf(String(a.id)) > -1) return true;
    if (typeof redirection_list !== 'undefined' && redirection_list) {
      for (var k in redirection_list) {
        var list = redirection_list[k] || [];
        if (list.indexOf && (list.indexOf(a.html_url) > -1)) return true;
      }
    }
    return false;
  }

  /* ---------- page context ---------- */
  var ctx = (function () {
    var root = $('[data-dx-page]');
    var c = {
      page: root ? root.getAttribute('data-dx-page') : '',
      articleId: root ? root.getAttribute('data-article-id') : null,
      sectionId: root ? root.getAttribute('data-section-id') : null,
      categoryId: root ? root.getAttribute('data-category-id') : null
    };
    if (!c.articleId) { var m = location.pathname.match(/\/articles\/(\d+)/); if (m) c.articleId = m[1]; }
    if (!c.sectionId) { var s = location.pathname.match(/\/sections\/(\d+)/); if (s) c.sectionId = s[1]; }
    if (!c.categoryId) { var g = location.pathname.match(/\/categories\/(\d+)/); if (g) c.categoryId = g[1]; }
    return c;
  })();

  /* =================================================================
     Sidebar tree
     ================================================================= */
  var tree = { nodesBySection: {}, built: false };

  function rootCategoryIds(categories) {
    var ids = [];
    if (MOCK && MOCK.rootCategories) ids = MOCK.rootCategories.slice();
    else if (typeof mainSections !== 'undefined') ids = Object.keys(mainSections);
    if (!ids.length) ids = categories.slice().sort(byPosition).map(function (c) { return String(c.id); });
    return ids.map(String);
  }
  function customSectionIds() {
    var set = {};
    var src = (MOCK && MOCK.mainSections) || (typeof mainSections !== 'undefined' ? mainSections : {});
    Object.keys(src).forEach(function (cid) {
      (src[cid].custom || []).forEach(function (c) { set[String(c.id)] = true; });
    });
    return set;
  }

  function renderTree(container, struct) {
    var catById = {}, secsByCat = {}, secsByParent = {};
    struct.categories.forEach(function (c) { catById[String(c.id)] = c; });
    struct.sections.forEach(function (s) {
      if (s.parent_section_id) (secsByParent[String(s.parent_section_id)] = secsByParent[String(s.parent_section_id)] || []).push(s);
      else (secsByCat[String(s.category_id)] = secsByCat[String(s.category_id)] || []).push(s);
    });
    var custom = customSectionIds();
    if (!ctx.categoryId && ctx.sectionId) {
      var cur = struct.sections.filter(function (x) { return String(x.id) === String(ctx.sectionId); })[0];
      while (cur && cur.parent_section_id) { var pid = String(cur.parent_section_id); cur = struct.sections.filter(function (x) { return String(x.id) === pid; })[0]; }
      if (cur) ctx.categoryId = String(cur.category_id);
    }
    var roots = rootCategoryIds(struct.categories).filter(function (id) { return catById[id]; });

    // Make sure the category of the page you are on is always reachable.
    if (ctx.categoryId && roots.indexOf(String(ctx.categoryId)) === -1 && catById[ctx.categoryId] && !isReachable(ctx.categoryId)) roots.unshift(String(ctx.categoryId));
    function isReachable(catId) {
      var seen = {};
      function walk(cid) {
        if (seen[cid]) return false; seen[cid] = true;
        if (cid === String(catId)) return true;
        return (secsByCat[cid] || []).some(function (s) {
          if (!custom[String(s.id)]) return false;
          return (parseJSONList(s.description) || []).some(function (x) { return walk(String(x.id)); });
        });
      }
      return roots.some(function (r) { return walk(r); });
    }

    function sameName(a, b) { return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase(); }

    function sectionNode(s, trail) {
      var sid = String(s.id);
      var li = el('li', { 'class': 'dx-node', 'aria-expanded': 'false', 'data-section': sid });
      var btn = el('button', { 'class': 'dx-row', type: 'button', html: '<span class="dx-label"></span>' + ICON.chevron });
      btn.querySelector('.dx-label').textContent = s.name;
      var ul = el('ul', { role: 'group' });
      li.appendChild(btn); li.appendChild(ul);
      li._section = s; li._trail = trail;

      if (custom[sid]) {
        // Custom section: its description lists sub-categories ({id, name}).
        var subs = parseJSONList(s.description) || [];
        // One sub-category with the same name: show its sections directly (no duplicate level).
        if (subs.length === 1 && catById[String(subs[0].id)] && trail.indexOf(String(subs[0].id)) === -1 &&
            (catById[String(subs[0].id)].name || '').trim().toLowerCase() === (s.name || '').trim().toLowerCase()) {
          var onlyId = String(subs[0].id);
          var onlySecs = secsByCat[onlyId] || [];
          // ...and if that category holds a single section with the same name too, show that section's contents.
          if (onlySecs.length === 1 && sameName(onlySecs[0].name, s.name) && !custom[String(onlySecs[0].id)]) {
            return sectionNode(onlySecs[0], trail.concat(onlyId));
          }
          li.setAttribute('data-category', onlyId);
          onlySecs.slice().sort(byPosition).forEach(function (cs) { ul.appendChild(sectionNode(cs, trail.concat(onlyId))); });
          li._loaded = true;
          return li;
        }
        subs.forEach(function (sub) {
          var cid = String(sub.id);
          if (trail.indexOf(cid) > -1) return; // guard against loops
          var catSecs = secsByCat[cid] || [];
          // Sub-category with a single section of the same name: skip the duplicate section step.
          if (catSecs.length === 1 && catById[cid] && sameName(catSecs[0].name, catById[cid].name)) {
            var merged = sectionNode(catSecs[0], trail.concat(cid));
            if (!merged.hasAttribute('data-category')) merged.setAttribute('data-category', cid);
            ul.appendChild(merged);
            return;
          }
          var subLi = el('li', { 'class': 'dx-node', 'aria-expanded': 'false', 'data-category': cid });
          var subBtn = el('button', { 'class': 'dx-row', type: 'button', html: '<span class="dx-label"></span>' + ICON.chevron });
          subBtn.querySelector('.dx-label').textContent = (catById[cid] && catById[cid].name) || sub.name;
          var subUl = el('ul', { role: 'group' });
          (secsByCat[cid] || []).slice().sort(byPosition).forEach(function (cs) { subUl.appendChild(sectionNode(cs, trail.concat(cid))); });
          if (!subUl.children.length && sub.html_url) subUl.appendChild(articleLeaf({ title: 'Overview', html_url: sub.html_url }));
          subLi.appendChild(subBtn); subLi.appendChild(subUl);
          ul.appendChild(subLi);
        });
        li._loaded = true;
      } else {
        (tree.nodesBySection[sid] = tree.nodesBySection[sid] || []).push(li);
        (secsByParent[sid] || []).slice().sort(byPosition).forEach(function (child) { ul.appendChild(sectionNode(child, trail)); });
      }
      return li;
    }

    var frag = document.createDocumentFragment();
    roots.forEach(function (cid) {
      var cat = catById[cid];
      var g = el('li', { 'class': 'dx-group', 'data-open': 'true', 'data-category': cid });
      var title = el('button', { 'class': 'dx-group-title', type: 'button', 'aria-expanded': 'true', html: '<span></span>' + ICON.down });
      title.querySelector('span').textContent = (MOCK && MOCK.mainSections && MOCK.mainSections[cid] && MOCK.mainSections[cid].name) ||
        (typeof mainSections !== 'undefined' && mainSections[cid] && mainSections[cid].name) || cat.name;
      var ul = el('ul', { role: 'group' });
      (secsByCat[cid] || []).slice().sort(byPosition).forEach(function (s) { ul.appendChild(sectionNode(s, [cid])); });
      if (!ul.children.length) ul.appendChild(el('li', { 'class': 'dx-tree-empty', text: 'No sections yet' }));
      g.appendChild(title); g.appendChild(ul);
      frag.appendChild(g);
    });
    var rootUl = el('ul', { 'class': 'dx-tree', role: 'tree', 'aria-label': 'Help Center navigation' });
    rootUl.appendChild(frag);
    container.innerHTML = '';
    container.appendChild(rootUl);
    tree.built = true;
  }

  function articleLeaf(a) {
    var li = el('li', { 'class': 'dx-node', 'data-article': a.id ? String(a.id) : '' });
    var link = el('a', { 'class': 'dx-row', href: a.html_url || a.url || '#' });
    link.appendChild(el('span', { 'class': 'dx-label', text: a.title || a.name }));
    if (ctx.articleId && String(a.id) === String(ctx.articleId)) link.setAttribute('aria-current', 'page');
    li.appendChild(link);
    return li;
  }

  function loadSection(li) {
    if (li._loaded || li._loading) return li._loading || Promise.resolve();
    var s = li._section;
    var ul = li.querySelector(':scope > ul');
    var loading = el('li', { 'class': 'dx-tree-empty', text: 'Loading…' });
    ul.insertBefore(loading, ul.firstChild);
    li._loading = data.articles(s.id).then(function (list) {
      var extras = parseJSONList(s.description) || [];
      extras.forEach(function (x) { list.push({ id: x.id, title: x.name || x.title, html_url: x.html_url }); });
      var seen = {};
      list.filter(function (a) {
        if (isHidden(a)) return false;
        if (seen[a.id]) return false; seen[a.id] = true; return true;
      }).forEach(function (a) { ul.insertBefore(articleLeaf(a), loading); });
      loading.remove();
      if (!ul.children.length) ul.appendChild(el('li', { 'class': 'dx-tree-empty', text: 'No articles yet' }));
      li._loaded = true;
    }).catch(function () {
      loading.textContent = 'Couldn’t load articles. Open the section page instead.';
      li._loading = null;
    });
    return li._loading;
  }

  function setExpanded(li, open) {
    li.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && li._section && !li._loaded) loadSection(li);
  }

  function bindTree(container) {
    container.addEventListener('click', function (e) {
      var gt = e.target.closest('.dx-group-title');
      if (gt) {
        var g = gt.parentNode, open = g.getAttribute('data-open') !== 'false';
        g.setAttribute('data-open', open ? 'false' : 'true');
        gt.setAttribute('aria-expanded', open ? 'false' : 'true');
        return;
      }
      var row = e.target.closest('button.dx-row');
      if (row) {
        var li = row.parentNode;
        setExpanded(li, li.getAttribute('aria-expanded') !== 'true');
      }
    });
  }

  function revealCurrent(container) {
    var targetSection = ctx.sectionId ? String(ctx.sectionId) : null;
    var nodes = targetSection ? (tree.nodesBySection[targetSection] || []) : [];
    if (!nodes.length && ctx.categoryId) {
      var group = container.querySelector('.dx-group[data-category="' + ctx.categoryId + '"], .dx-node[data-category="' + ctx.categoryId + '"]');
      if (group) openAncestors(group, true);
      return;
    }
    var li = nodes[0];
    if (!li) return;
    openAncestors(li, false);
    li.classList.add('dx-in-path');
    setExpanded(li, true);
    (li._loading || Promise.resolve()).then(function () {
      var cur = container.querySelector('a.dx-row[aria-current="page"]');
      var focusEl = cur || li.querySelector(':scope > .dx-row');
      if (focusEl) {
        var cRect = container.getBoundingClientRect(), r = focusEl.getBoundingClientRect();
        container.scrollTop += (r.top - cRect.top) - container.clientHeight / 3;
      }
    });
  }
  function openAncestors(node, includeSelf) {
    var n = includeSelf ? node : node.parentNode;
    while (n && !n.classList.contains('dx-tree')) {
      if (n.classList && n.classList.contains('dx-node')) { n.setAttribute('aria-expanded', 'true'); n.classList.add('dx-in-path'); }
      if (n.classList && n.classList.contains('dx-group')) { n.setAttribute('data-open', 'true'); }
      n = n.parentNode;
    }
  }

  function initSidebar() {
    var container = $('#dx-tree');
    if (!container) return;
    bindTree(container);
    data.structure().then(function (struct) {
      renderTree(container, struct);
      if (ctx.page === 'home') return redirectHome(container);
      revealCurrent(container);
    }).catch(function () {
      showHome();
      container.innerHTML = '<p class="dx-tree-empty">Navigation couldn’t load. Refresh the page to try again.</p>';
    });
  }

  /* Home page is not shown: go to the first article of the first sub-category/section
     of the first category, in the same order as the sidebar. */
  function showHome() { document.documentElement.classList.add('dx-home-ready'); }
  function redirectHome(container) {
    var nodes = $all('.dx-node[data-section]', container).filter(function (li) {
      return li._section && !li._loaded; // article-holding sections (custom sections hold sub-categories)
    });
    function tryNext(i) {
      if (i >= nodes.length) { showHome(); revealCurrent(container); return; }
      return data.articles(nodes[i]._section.id).then(function (list) {
        var first = list.filter(function (a) { return !isHidden(a); })[0];
        if (first && first.html_url) location.replace(first.html_url);
        else return tryNext(i + 1);
      }, function () { return tryNext(i + 1); });
    }
    return tryNext(0);
  }

  /* =================================================================
     On this page (right rail) + scroll spy
     ================================================================= */
  function slugify(t) {
    return (t || '').toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'section';
  }
  var rail = { heads: [], links: [], current: -1, lockUntil: 0, bound: false };

  function buildRail(heads) {
    var toc = $('#dx-toc'), list = $('#dx-toc-list');
    if (!toc || !list) return;
    rail.heads = heads; rail.current = -1;
    list.innerHTML = '';
    if (!heads.length) { toc.hidden = true; return; }
    toc.hidden = false;
    var ol = el('ol'), group = -1;
    rail.groups = [];
    heads.forEach(function (h, i) {
      if (h.tagName !== 'H3') group = i;
      rail.groups.push(group);
      var li = el('li', { 'class': h.tagName === 'H3' ? 'dx-toc-h3' : 'dx-toc-h2' });
      if (h.tagName === 'H3') li.setAttribute('data-group', group);
      var a = el('a', { href: '#' + h.id });
      a.textContent = (h.getAttribute('data-toc-label') || h.getAttribute('data-title') || h.textContent).trim().replace(/\s+/g, ' ');
      li.appendChild(a); ol.appendChild(li);
    });
    list.appendChild(ol);
    rail.links = $all('a', ol);
    if (!rail.bound) {
      rail.bound = true;
      list.addEventListener('click', function (e) {
        var a = e.target.closest('a'); if (!a) return;
        e.preventDefault();
        var target = document.getElementById(a.getAttribute('href').slice(1));
        if (!target) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + target.id);
        setRailActive(rail.links.indexOf(a));
        rail.lockUntil = Date.now() + 700;
      });
      var ticking = false;
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); } }, { passive: true });
    }
    spy();
  }
  function setRailActive(i) {
    if (i === rail.current) return;
    rail.current = i;
    rail.links.forEach(function (l, j) { if (j === i) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    // Show h3 entries only under the h2 section that is currently selected.
    var g = (rail.groups && i >= 0) ? rail.groups[i] : -1;
    rail.links.forEach(function (l, j) {
      var li = l.parentNode;
      if (li.classList.contains('dx-toc-h3')) li.classList.toggle('dx-toc-open', g >= 0 && rail.groups[j] === g);
      else li.classList.toggle('dx-toc-parent-active', j === g && j !== i);
    });
    var act = rail.links[i], toc = $('#dx-toc');
    if (act && toc) {
      var r = act.getBoundingClientRect(), tr = toc.getBoundingClientRect();
      if (r.top < tr.top + 40 || r.bottom > tr.bottom - 40) toc.scrollTop += r.top - tr.top - toc.clientHeight / 3;
    }
  }
  function spy() {
    if (!rail.heads.length || Date.now() < rail.lockUntil) return;
    var offset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dx-header-h'), 10) || 64) + 46 + 110;
    var idx = 0;
    for (var i = 0; i < rail.heads.length; i++) { if (rail.heads[i].getBoundingClientRect().top - offset <= 0) idx = i; else break; }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = rail.heads.length - 1;
    setRailActive(idx);
  }

  function initTOC() {
    var body = $('.dx-article .article-body');
    var toc = $('#dx-toc');
    if (!body || !toc) return;
    var heads = $all('h2, h3', body).filter(function (h) {
      if (!h.textContent.trim()) return false;
      if (h.tagName === 'H3' && h.closest('.accordion-section')) return false;
      if (h.closest('.tip-main-container, .note-main-container')) return false;
      return true;
    });
    if (!heads.length) {
      toc.hidden = true;
      var shell = $('.dx-shell'); if (shell) shell.classList.add('dx-no-toc');
      return;
    }
    var used = {};
    heads.forEach(function (h) {
      var label = h.getAttribute('data-title') || h.textContent.trim();
      if (!h.id) {
        var id = slugify(label), n = 2;
        while (used[id] || document.getElementById(id)) id = slugify(label) + '-' + (n++);
        h.id = id;
      }
      used[h.id] = true;
    });
    buildRail(heads);
  }

  /* =================================================================
     Changelog: a section whose articles are updates, grouped by date
     ================================================================= */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dayKey(iso) {
    var d = new Date(iso);
    return { id: MONTHS[d.getMonth()].toLowerCase() + '-' + d.getDate() + '-' + d.getFullYear(), label: MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() };
  }
  data.changelog = function (sectionId, page) {
    if (MOCK && MOCK.changelog) {
      var all = MOCK.changelog, per = 6, start = (page - 1) * per;
      return Promise.resolve({ items: all.slice(start, start + per), next: start + per < all.length });
    }
    // The release date comes from a label like "date-2026-10-28" (falls back to the creation date),
    // so updates can be back-dated. All updates are loaded once, sorted newest first, then shown 20 at a time.
    var PER = 20, DATE_LABEL = /^date[-_:\s]?(\d{4})-(\d{1,2})-(\d{1,2})$/i;
    if (!data._cl || data._cl.id !== sectionId) {
      data._cl = { id: sectionId, all: getAll('sections/' + sectionId + '/articles.json?sort_by=created_at&sort_order=desc', 'articles').then(function (list) {
        return list.filter(function (a) { return !a.draft && !isHidden(a); }).map(function (a) {
          var labels = a.label_names || [], when = a.created_at, tags = [];
          labels.forEach(function (l) {
            var m = String(l).trim().match(DATE_LABEL);
            if (m) when = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) + 'T12:00:00';
            else tags.push(l);
          });
          return { id: a.id, title: a.title, html_url: a.html_url, created_at: when, sort: new Date(when).getTime(), made: new Date(a.created_at).getTime(), labels: tags, body: a.body || '' };
        }).sort(function (x, y) { return (y.sort - x.sort) || (y.made - x.made); });
      }) };
    }
    return data._cl.all.then(function (all) {
      var start = (page - 1) * PER;
      return { items: all.slice(start, start + PER), next: start + PER < all.length };
    });
  };

  function initChangelog() {
    var main = $('#dx-main');
    if (!main) return false;
    var sid = main.getAttribute('data-section-id') || '';
    var cid = (main.getAttribute('data-changelog-id') || '').trim();
    var isChangelog = main.getAttribute('data-dx-page') === 'changelog' || (cid && sid && cid === sid);
    if (!isChangelog) return false;

    var shell = $('.dx-shell');
    shell.classList.remove('dx-no-toc');
    shell.classList.add('dx-changelog-mode');
    main.classList.add('dx-changelog');
    $all('[data-dx-section-default]').forEach(function (n) { n.hidden = true; });
    var wrap = $('#dx-changelog'); if (!wrap) return true;
    wrap.hidden = false;
    var mb = $('.dx-menu-btn'); if (mb) mb.hidden = true;
    $all('.dx-tab').forEach(function (t) {
      if (t.getAttribute('data-dx-tab') === 'changelog') t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });

    var feed = $('#dx-changelog-feed', wrap), more = $('.dx-cl-more', wrap), status = $('.dx-cl-status', wrap);
    var page = 1, days = {}, firstLoad = true;

    function entry(a) {
      var art = el('article', { 'class': 'dx-cl-entry', id: 'update-' + a.id });
      var h = el('h2', { 'class': 'dx-cl-title' });
      var link = el('a', { href: a.html_url || '#' }); link.textContent = a.title;
      h.appendChild(link); art.appendChild(h);
      if (a.labels && a.labels.length) {
        var tags = el('ul', { 'class': 'dx-cl-tags', 'aria-label': 'Tags' });
        a.labels.forEach(function (l) { tags.appendChild(el('li', { text: l })); });
        art.appendChild(tags);
      }
      var body = el('div', { 'class': 'article-body' });
      body.innerHTML = a.body;
      art.appendChild(body);
      return art;
    }
    function load() {
      more.hidden = true;
      status.hidden = false; status.textContent = 'Loading updates…';
      data.changelog(sid, page).then(function (res) {
        res.items.forEach(function (a) {
          var k = dayKey(a.created_at);
          var day = days[k.id];
          if (!day) {
            day = el('section', { 'class': 'dx-cl-day', 'aria-labelledby': k.id });
            var dcol = el('div', { 'class': 'dx-cl-date' });
            var inner = el('div', { 'class': 'dx-cl-date-inner' });
            var pill = el('h2', { 'class': 'dx-cl-pill', id: k.id, 'data-toc-label': k.label });
            pill.textContent = k.label;
            inner.appendChild(pill); dcol.appendChild(inner); day.appendChild(dcol);
            day.appendChild(el('div', { 'class': 'dx-cl-entries' }));
            feed.appendChild(day);
            days[k.id] = day;
          }
          $('.dx-cl-entries', day).appendChild(entry(a));
        });
        status.hidden = true;
        if (!feed.children.length) { status.hidden = false; status.textContent = 'No updates published yet.'; }
        more.hidden = !res.next;
        page++;
        buildRail($all('.dx-cl-pill', feed));
        if (firstLoad && location.hash) {
          firstLoad = false;
          var t = document.getElementById(location.hash.slice(1));
          if (t) t.scrollIntoView({ block: 'start' });
        }
        firstLoad = false;
      }).catch(function () {
        status.hidden = false; status.textContent = 'Updates couldn’t load. Refresh the page to try again.';
        more.hidden = false;
      });
    }
    $('button', more).addEventListener('click', load);
    load();
    return true;
  }

  /* =================================================================
     Search modal
     ================================================================= */
  function initSearch() {
    var modal = $('#dx-search');
    if (!modal) return;
    var input = $('input', modal), list = $('.dx-results', modal);
    var timer = null, results = [], sel = -1, lastQ = '', opener = null;
    var searchPage = modal.getAttribute('data-search-url') || ('/hc/' + DX.locale + '/search');

    function open(mode) {
      opener = document.activeElement;
      modal.setAttribute('data-open', 'true');
      input.placeholder = mode === 'ask' ? 'Ask a question about 10Web…' : 'Search or ask a question…';
      input.value = ''; render([], ''); setTimeout(function () { input.focus(); }, 0);
      document.documentElement.style.overflow = 'hidden';
    }
    function close() {
      modal.setAttribute('data-open', 'false');
      document.documentElement.style.overflow = '';
      if (opener && opener.focus) opener.focus();
    }
    function render(items, q) {
      results = items; sel = q ? 0 : -1;
      list.innerHTML = '';
      if (!q) { list.appendChild(el('li', { 'class': 'dx-r-empty', text: 'Type a keyword or a full question, like “How do I connect my domain?”' })); return; }
      // First row: Zendesk generative search (quick answer on the search results page)
      var ai = el('a', { href: searchPage + '?utf8=%E2%9C%93&query=' + encodeURIComponent(q), role: 'option', 'aria-selected': 'true', 'class': 'dx-r-ai' });
      ai.innerHTML = '<svg class="dx-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M7.47.9a.55.55 0 0 1 1.06 0l.9 3.05a3.3 3.3 0 0 0 2.62 2.62l3.05.9a.55.55 0 0 1 0 1.06l-3.05.9a3.3 3.3 0 0 0-2.62 2.62l-.9 3.05a.55.55 0 0 1-1.06 0l-.9-3.05a3.3 3.3 0 0 0-2.62-2.62L.9 8.53a.55.55 0 0 1 0-1.06l3.05-.9a3.3 3.3 0 0 0 2.62-2.62L7.47.9Z"/></svg>';
      var t = el('span', { 'class': 'dx-r-title' }); t.appendChild(document.createTextNode('Get an AI answer for “' + q + '”'));
      ai.appendChild(t);
      ai.appendChild(el('span', { 'class': 'dx-r-path', text: 'Quick answer generated from our help articles' }));
      var aiLi = el('li'); aiLi.appendChild(ai); list.appendChild(aiLi);
      if (!items.length) { list.appendChild(el('li', { 'class': 'dx-r-empty', text: 'No article titles match “' + q + '”. Try the AI answer above.' })); return; }
      list.appendChild(el('li', { 'class': 'dx-r-label', text: 'Articles' }));
      items.forEach(function (r, i) {
        var a = el('a', { href: r.url, role: 'option', 'aria-selected': 'false' });
        a.appendChild(el('span', { 'class': 'dx-r-title', text: r.title }));
        if (r.path) a.appendChild(el('span', { 'class': 'dx-r-path', text: r.path.length > 140 ? r.path.slice(0, 140) + '…' : r.path }));
        var li = el('li'); li.appendChild(a); list.appendChild(li);
      });
    }
    function move(d) {
      var opts = $all('a', list); if (!opts.length) return;
      sel = (sel + d + opts.length) % opts.length;
      opts.forEach(function (o, i) { o.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
      opts[sel].scrollIntoView({ block: 'nearest' });
    }
    input.addEventListener('input', function () {
      var q = input.value.trim();
      clearTimeout(timer);
      if (q.length < 2) { render([], q); return; }
      timer = setTimeout(function () {
        lastQ = q;
        data.search(q).then(function (items) { if (q === lastQ) render(items, q); }).catch(function () { render([], q); });
      }, 180);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var opts = $all('a', list);
        if (sel > -1 && opts[sel]) { location.href = opts[sel].href; }
        else if (input.value.trim()) { location.href = searchPage + '?utf8=%E2%9C%93&query=' + encodeURIComponent(input.value.trim()); }
      }
    });
    modal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-dx-close')) close(); });
    document.addEventListener('keydown', function (e) {
      var typing = /input|textarea|select/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); modal.getAttribute('data-open') === 'true' ? close() : open(); }
      else if (e.key === '/' && !typing && modal.getAttribute('data-open') !== 'true') { e.preventDefault(); open(); }
      else if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') { close(); }
    });
    $all('[data-dx-open-search]').forEach(function (b) { b.addEventListener('click', function () { open(); }); });
    DX.openSearch = open;
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $all('.dx-kbd-mod').forEach(function (k) { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  }

  /* ---------- Ask AI: opens 10Web support messenger, falls back to search ---------- */
  function initAsk() {
    $all('[data-dx-ask]').forEach(function (b) {
      b.addEventListener('click', function () {
        try {
          if (window.Smooch && typeof Smooch.open === 'function' && document.getElementById('smooch-snippet')) { Smooch.open(); return; }
          if (window.tenwebChatEligible && typeof window.tenwebInitChat === 'function') {
            window.tenwebInitChat();
            var tries = 0, t = setInterval(function () {
              tries++;
              if (window.Smooch && typeof Smooch.open === 'function') { try { Smooch.open(); } catch (e) { } clearInterval(t); }
              else if (tries > 40) { clearInterval(t); if (DX.openSearch) DX.openSearch('ask'); }
            }, 150);
            return;
          }
          if (typeof window.zE === 'function') { zE('messenger', 'open'); return; }
        } catch (e) { /* fall through */ }
        if (DX.openSearch) DX.openSearch('ask');
      });
    });
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    $all('.dx-theme-toggle').forEach(function (b) {
      function sync() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        b.setAttribute('aria-pressed', dark ? 'true' : 'false');
        b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      }
      sync();
      b.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('dx-theme', next); } catch (e) { }
        sync();
      });
    });
    // Legacy pages (requests, community, profile) were designed for light only.
    if (!$('.dx-shell')) {
      document.documentElement.setAttribute('data-theme', 'light');
      $all('.dx-theme-toggle').forEach(function (b) { b.hidden = true; });
    }
  }

  /* ---------- Mobile drawer ---------- */
  function initDrawer() {
    var btn = $('.dx-menu-btn'), scrim = $('.dx-scrim');
    if (!btn || !$('.dx-sidebar')) { if (btn) btn.hidden = true; return; }
    function set(open) {
      document.body.classList.toggle('dx-drawer-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { set(!document.body.classList.contains('dx-drawer-open')); });
    if (scrim) scrim.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------- Feedback for signed-out visitors ---------- */
  function initFeedback() {
    var box = $('.dx-feedback[data-anonymous]');
    if (!box) return;
    var note = $('.dx-feedback-note', box);
    $all('.dx-vote', box).forEach(function (b) {
      b.addEventListener('click', function () {
        $all('.dx-vote', box).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        if (note) note.hidden = false;
      });
    });
  }

  /* ---------- Copy article URL (works with the legacy jQuery handler) ---------- */
  function initCopy() {
    $all('.dx-copy').forEach(function (btn) {
      var label = $('.clipboard', btn);
      btn.addEventListener('click', function (e) {
        if (window.jQuery && label && e.target.closest('.clipboard')) return; // legacy handler copies
        if (window.jQuery && label) { window.jQuery(label).trigger('click'); return; }
        var done = function () { if (label) { label.textContent = 'Copied'; setTimeout(function () { label.textContent = 'Copy article URL'; }, 2000); } };
        if (navigator.clipboard) navigator.clipboard.writeText(location.href.split('#')[0]).then(done, done); else done();
      });
    });
  }

  function init() {
    if (!document.body.classList.contains('dx-body')) document.body.classList.add('dx-body');
    initTheme(); initDrawer(); initSearch(); initAsk(); if (!initChangelog()) { initSidebar(); } initTOC(); initFeedback(); initCopy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();



/* =====================================================================
   Header state: current tab / My Tickets link
   ===================================================================== */
(function () {
  function run() {
    var root = document.documentElement, tickets = root.classList.contains('dx-tickets');
    var page = (document.querySelector('[data-dx-page]') || {}).getAttribute ? document.querySelector('[data-dx-page]').getAttribute('data-dx-page') : '';
    var main = document.getElementById('dx-main');
    var isChangelog = main && main.getAttribute('data-changelog-id') && main.getAttribute('data-changelog-id') === main.getAttribute('data-section-id');
    Array.prototype.forEach.call(document.querySelectorAll('.dx-tab'), function (t) {
      var tab = t.getAttribute('data-dx-tab');
      var on = !tickets && ((tab === 'changelog' && isChangelog) || (tab === 'docs' && !isChangelog && page !== 'search'));
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    if (tickets) Array.prototype.forEach.call(document.querySelectorAll('.dx-my-tickets'), function (a) { a.setAttribute('aria-current', 'page'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();


(function () {
  var btn = document.querySelector('.dx-account-btn'), menu = document.getElementById('dx-account-menu');
  if (!btn || !menu) return;
  function set(open) { menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
})();


/* Replaces the native <select> menus with a styled listbox. The real <select> stays in the
   form (hidden) so values still submit and existing change handlers keep working. */
(function () {
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.4 4.1a.55.55 0 0 1 0 .78l-6.5 6.5a.55.55 0 0 1-.78 0L2.6 7.86a.55.55 0 1 1 .78-.78l3.13 3.13 6.11-6.11a.55.55 0 0 1 .78 0Z"/></svg>';
  var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var uid = 0;
  document.querySelectorAll('.dx-rq-select').forEach(function (label) {
    var sel = label.querySelector('select'); if (!sel) return;
    var wrap = document.createElement('div'); wrap.className = label.className;
    while (label.firstChild) wrap.appendChild(label.firstChild);
    label.parentNode.replaceChild(wrap, label);
    var id = 'dx-sel-' + (++uid);
    var labelText = (document.querySelector('label[for="' + sel.id + '"]') || wrap.querySelector('.dx-visually-hidden') || {}).textContent || '';
    var lblEl = document.querySelector('label[for="' + sel.id + '"]');
    sel.classList.add('dx-sel-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dx-sel-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id);
    if (sel.id) { btn.id = sel.id + '-btn'; if (lblEl) lblEl.setAttribute('for', btn.id); }
    var menu = document.createElement('ul'); menu.className = 'dx-sel-menu'; menu.id = id; menu.setAttribute('role', 'listbox'); menu.tabIndex = -1; menu.hidden = true;
    if (labelText) menu.setAttribute('aria-label', labelText.replace('*', '').trim());
    var opts = Array.prototype.map.call(sel.options, function (o, i) {
      var li = document.createElement('li'); li.className = 'dx-sel-opt' + (o.value === '' ? ' is-placeholder' : '');
      li.id = id + '-o' + i; li.setAttribute('role', 'option');
      li.innerHTML = '<span></span>' + CHECK; li.firstChild.textContent = o.text;
      li.addEventListener('mousedown', function (e) { e.preventDefault(); });
      li.addEventListener('click', function () { choose(i); });
      li.addEventListener('mousemove', function () { setActive(i); });
      menu.appendChild(li); return li;
    });
    sel.insertAdjacentElement('afterend', btn); btn.insertAdjacentElement('afterend', menu);
    var active = -1;
    function sync() {
      var i = sel.selectedIndex, o = sel.options[i];
      btn.textContent = o ? o.text : '';
      btn.classList.toggle('is-placeholder', !!o && o.value === '');
      opts.forEach(function (li, j) { li.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    }
    Object.defineProperty(sel, 'value', { get: function () { return desc.get.call(sel); }, set: function (v) { desc.set.call(sel, v); sync(); } });
    function setActive(i) {
      active = i; opts.forEach(function (li, j) { li.classList.toggle('is-active', j === i); });
      if (opts[i]) { menu.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
    }
    function open() { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); setActive(Math.max(0, sel.selectedIndex)); menu.focus(); }
    function close(refocus) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
    function choose(i) {
      var changed = sel.selectedIndex !== i;
      sel.selectedIndex = i; sync(); close(true);
      if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    btn.addEventListener('click', function () { menu.hidden ? open() : close(true); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
    menu.addEventListener('keydown', function (e) {
      var n = opts.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % n); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + n) % n); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(n - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') { close(false); }
    });
    menu.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== btn) close(false); }, 0); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(false); });
    sync();
  });
})();


/* =====================================================================
   My tickets: status counts (Requests API), status tiles, sort, org tab
   The ticket list itself is rendered by Zendesk (requests_page.hbs).
   ===================================================================== */
(function () {
  function run() {
    var main = document.querySelector('[data-dx-page="requests"]');
    if (!main) return;
    var statusSel = document.getElementById('request-status-select');
    var sortSel = document.getElementById('dx-rq-sort');
    var form = statusSel ? statusSel.form : null;

    // Sort: mirror Zendesk's sort links
    var params = new URLSearchParams(location.search);
    if (sortSel) {
      if (params.get('sort_by') === 'created_at') sortSel.value = 'created_at';
      sortSel.addEventListener('change', function () {
        var link = document.querySelector(sortSel.value === 'created_at' ? '.dx-sort-created' : '.dx-sort-updated');
        if (link) location.href = link.href;
      });
    }
    // Status select: reload the list with the chosen status (same URL script.js builds)
    function go() {
      var q = document.getElementById('quick-search');
      var p = new URLSearchParams();
      if (q && q.value) p.set('query', q.value);
      if (statusSel && statusSel.value) p.set('status', statusSel.value);
      location.search = p.toString();
    }
    if (statusSel) statusSel.addEventListener('change', go);

    // Which status option means what
    function optionFor(kind) {
      if (!statusSel) return null;
      var words = { open: /open|offen|abierto|ouvert/i, pending: /await|reply|warten|pendiente|attente/i, solved: /solved|gelöst|resuelto|résolu/i };
      var opts = Array.prototype.slice.call(statusSel.options);
      return opts.filter(function (o) { return words[kind].test(o.text) || o.value === kind; })[0] ||
             opts[{ open: 1, pending: 2, solved: 3 }[kind]] || null;
    }
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.dx-rq-stat'));
    tiles.forEach(function (b) {
      var o = optionFor(b.getAttribute('data-status'));
      if (o && statusSel.value && o.value === statusSel.value) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        if (!statusSel) return;
        var opt = optionFor(b.getAttribute('data-status'));
        statusSel.value = (b.getAttribute('aria-pressed') === 'true' || !opt) ? '' : opt.value;
        go();
      });
    });

    // Counts from the Requests API (all pages), matching the current list (mine or CC'd)
    var stats = document.querySelector('.dx-rq-stats');
    var ccd = /\/requests\/ccd/.test(location.pathname) || /filter=ccd/.test(location.search);
    var url = ccd ? '/api/v2/requests/ccd.json?per_page=100' : '/api/v2/requests.json?per_page=100';
    var counts = { open: 0, pending: 0, solved: 0 }, pages = 0;
    function bucket(s) { return s === 'pending' ? 'pending' : (s === 'solved' || s === 'closed') ? 'solved' : 'open'; }
    function load(u) {
      return fetch(u, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          (j.requests || []).forEach(function (q) { counts[bucket(q.status)]++; });
          pages++;
          if (j.next_page && pages < 10) return load(j.next_page);
        });
    }
    if (stats) load(url).then(function () {
      Object.keys(counts).forEach(function (k) { var n = stats.querySelector('[data-count="' + k + '"]'); if (n) n.textContent = counts[k]; });
      stats.hidden = false;
    }).catch(function () { stats.hidden = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
