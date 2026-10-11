(function () {
  if (window.VukMotion) return;
  var me = document.currentScript || document.querySelector('script[src*="motion.js"]');
  var bg = (me && me.getAttribute('data-bg')) || '#22261F';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var t0 = performance.now();
  var started = false;

  var pre = document.createElement('div');
  pre.setAttribute('aria-hidden', 'true');
  pre.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:' + bg + ';';
  var logo = document.createElement('img');
  logo.src = 'assets/logo.png';
  logo.alt = '';
  logo.style.cssText = 'height:96px;width:auto;display:block;';
  pre.appendChild(logo);
  (document.body || document.documentElement).appendChild(pre);
  document.documentElement.style.overflow = 'hidden';
  if (!reduce) logo.animate(
    [{ opacity: 0.45, transform: 'scale(0.97)' }, { opacity: 1, transform: 'scale(1.03)' }],
    { duration: 1300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
  );

  function hold(el, frames, opts) {
    var a = el.animate(frames, Object.assign({ fill: 'both', easing: EASE }, opts));
    a.pause(); a.currentTime = 0;
    a.onfinish = function () { a.cancel(); };
    return a;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function init() {
    if (started) return;
    started = true;
    var hero = document.getElementById('vrh');
    var heroImg = hero && hero.querySelector('img');
    var h1 = hero && hero.querySelector('h1');
    var intro = [];

    if (!reduce && hero) {
      var header = document.querySelector('header');
      if (header) intro.push([hold(header, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 900 }), 150]);
      if (heroImg) intro.push([hold(heroImg, [{ opacity: 0, transform: 'scale(1.12)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 2400 }), 0]);
      if (h1) Array.prototype.forEach.call(h1.parentElement.children, function (el, i) {
        intro.push([hold(el, [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 1200 }), 350 + i * 140]);
      });
      var badge = heroImg && heroImg.parentElement.nextElementSibling;
      if (badge) intro.push([hold(badge, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 1000 }), 1100]);
    }

    var ready = Promise.all([
      document.fonts ? document.fonts.ready : null,
      heroImg && heroImg.decode ? heroImg.decode().catch(function () {}) : null
    ]);
    Promise.race([ready, wait(3000)]).then(function () {
      return wait(Math.max(0, 900 - (performance.now() - t0)));
    }).then(function () {
      var fade = pre.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 1 : 700, easing: 'ease', fill: 'forwards' });
      fade.onfinish = function () { pre.remove(); };
      document.documentElement.style.overflow = '';
      intro.forEach(function (p) { setTimeout(function () { p[0].play(); }, p[1] + 200); });
    });

    if (reduce) return;
    setupParallax(hero, heroImg, h1);
    setupReveal();
  }

  function setupParallax(hero, img, h1) {
    if (!hero || !img) return;
    var wrap = img.parentElement;
    var full = getComputedStyle(wrap).position === 'absolute';
    var text = h1 && h1.parentElement;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY, h = hero.offsetHeight;
      if (y > h) return;
      if (full) wrap.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
      if (text && full) {
        text.style.transform = 'translate3d(0,' + (y * 0.1).toFixed(1) + 'px,0)';
        text.style.opacity = String(Math.max(0, 1 - y / (h * 0.9)).toFixed(3));
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  function setupReveal() {
    var items = [];
    document.querySelectorAll('section:not(#vrh), footer').forEach(function (sec) {
      var box = sec.firstElementChild;
      if (!box) return;
      Array.prototype.forEach.call(box.children, function (c) {
        var grid = getComputedStyle(c).display === 'grid' && c.children.length >= 4;
        if (grid) Array.prototype.forEach.call(c.children, function (g) { items.push(g); });
        else items.push(c);
      });
    });
    var map = new Map();
    items.forEach(function (el) {
      var a = hold(el, [{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'none' }], { duration: 1000 });
      var img = el.children.length === 1 && el.firstElementChild.tagName === 'IMG' ? el.firstElementChild : null;
      var b = img ? hold(img, [{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1600 }) : null;
      map.set(el, [a, b]);
    });
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      vis.sort(function (p, q) {
        var r1 = p.getBoundingClientRect(), r2 = q.getBoundingClientRect();
        return (r1.top - r2.top) || (r1.left - r2.left);
      });
      vis.forEach(function (el, i) {
        io.unobserve(el);
        var pair = map.get(el);
        setTimeout(function () { pair[0].play(); if (pair[1]) pair[1].play(); }, Math.min(i * 90, 540));
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  window.VukMotion = { init: init };
})();
