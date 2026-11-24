/* 687 Starflower concept site: optional enhancements. No libraries, no network.
   1. Marks the section being read in the contents rail / strip.
   2. Viewing table: opens figure photos in place (Esc, arrows, swipe). With JS off the links open the file. */
(function () {
  var d = document, nav = d.querySelector('nav');

  /* 1. active section */
  if (nav) {
    var links = {}, cur = null, tick = 0;
    [].forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var secs = [].filter.call(d.querySelectorAll('section[id]'), function (s) { return links[s.id]; });
    var mark = function (id) {
      if (id === cur) return;
      if (cur) { links[cur].classList.remove('on'); links[cur].removeAttribute('aria-current'); }
      cur = id;
      var a = links[id];
      if (!a) return;
      a.classList.add('on'); a.setAttribute('aria-current', 'true');
      var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect(), to = {};
      if (r.left < n.left + 32 || r.right > n.right - 32) to.left = nav.scrollLeft + r.left - n.left - (n.width - r.width) / 2;
      if (r.top < n.top + 16 || r.bottom > n.bottom - 16) to.top = nav.scrollTop + r.top - n.top - (n.height - r.height) / 2;
      if (('left' in to || 'top' in to) && nav.scrollTo) nav.scrollTo(to);
    };
    var pick = function () {
      tick = 0;
      var line = Math.min(innerHeight * 0.35, 260), best = secs[0];
      for (var i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top <= line) best = secs[i];
      if (innerHeight + scrollY >= d.documentElement.scrollHeight - 4) best = secs[secs.length - 1];
      if (best) mark(best.id);
    };
    if (secs.length) {
      addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(pick); }, { passive: true });
      addEventListener('resize', pick);
      pick();
    }
  }

  /* 2. viewing table */
  if (!window.HTMLDialogElement) return;
  var items = [].filter.call(d.querySelectorAll('figure a > img, .mast-img > img'), function (im) {
    return /\.(jpe?g|png|webp|gif)$/i.test(im.parentNode.getAttribute('href') || '');
  });
  if (!items.length) return;

  var svg = function (p) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>'; };
  var dlg = d.createElement('dialog'), at = 0, x0 = null;
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML =
    '<div class="lb-stage"><img alt=""></div>' +
    '<div class="lb-bar"><p class="lb-cap"></p><span class="lb-n"></span>' +
    '<a class="lb-btn lb-open" target="_blank" rel="noopener" aria-label="Open the full-size file in a new tab">' + svg('M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5') + '</a></div>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo">' + svg('M15 5l-7 7 7 7') + '</button>' +
    '<button class="lb-btn lb-next" type="button" aria-label="Next photo">' + svg('M9 5l7 7-7 7') + '</button>' +
    '<button class="lb-btn lb-x" type="button" aria-label="Close">' + svg('M6 6l12 12M18 6L6 18') + '</button>';
  d.body.appendChild(dlg);
  var big = dlg.querySelector('img'), cap = dlg.querySelector('.lb-cap'), num = dlg.querySelector('.lb-n'), open = dlg.querySelector('.lb-open');

  var show = function (i) {
    at = (i + items.length) % items.length;
    var th = items[at], href = th.parentNode.href, fig = th.closest('figure'), fc = fig && fig.querySelector('figcaption');
    big.src = th.currentSrc || th.src;            /* instant, then swap to the full file */
    big.alt = th.alt;
    var full = new Image(), me = at;
    full.onload = function () { if (me === at && dlg.open) big.src = href; };
    full.src = href;
    cap.innerHTML = fc ? fc.innerHTML : '';
    if (!fc) cap.textContent = th.alt;
    num.textContent = (at + 1) + ' / ' + items.length;
    open.href = href;
  };
  var step = function (n) { show(at + n); };

  items.forEach(function (im, i) {
    im.parentNode.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      show(i);
      dlg.showModal();
      dlg.querySelector('.lb-x').focus();
    });
  });
  dlg.querySelector('.lb-prev').onclick = function () { step(-1); };
  dlg.querySelector('.lb-next').onclick = function () { step(1); };
  dlg.querySelector('.lb-x').onclick = function () { dlg.close(); };
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.className === 'lb-stage') dlg.close();
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  dlg.addEventListener('close', function () {
    var a = items[at].parentNode;                 /* land where the reader stopped */
    a.focus({ preventScroll: true });
    a.scrollIntoView({ block: 'nearest' });
  });
})();
