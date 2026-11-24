/* 687 Starflower concept site: optional enhancements. No libraries, no network.
   1. Marks the section being read in the contents rail / strip.
   Photos are plain links that open the full-size file in a new tab. */
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

  /* Photos open the full-size file in a new tab (plain links, no in-page viewer). */
})();
