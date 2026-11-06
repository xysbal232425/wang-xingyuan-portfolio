(() => {
  const chapters = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('.mast nav a')];
  const mast = document.querySelector('.mast');
  function highlightChapter() {
    const marker = mast.offsetHeight + (innerHeight - mast.offsetHeight) * .35;
    const current = chapters.findLast(section => section.getBoundingClientRect().top <= marker) || chapters[0];
    for (const link of links) {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--mast-height', mast.offsetHeight + 'px');
    highlightChapter();
  }).observe(mast);
  window.addEventListener('scroll', highlightChapter, {passive:true});
  highlightChapter();
  const follow = matchMedia('(any-pointer:fine) and (prefers-reduced-motion:no-preference)');
  const ink = document.createElement('canvas');
  ink.className = 'pointer-ink';
  ink.setAttribute('aria-hidden','true');
  const ctx = ink.getContext('2d');
  if (!ctx) return;
  document.body.append(ink);
  const nodes = [];
  const lifetime = 340;
  let pointerX = 0, pointerY = 0, lastMove = 0, lastFrame = 0, frame = 0;

  function resize() {
    const ratio = Math.min(2, devicePixelRatio);
    ink.width = Math.round(innerWidth * ratio);
    ink.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
  }
  resize();
  window.addEventListener('resize', resize);

  function clearTrail() {
    cancelAnimationFrame(frame);
    frame = 0;
    nodes.length = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function draw(now) {
    const opacity = Math.max(0, Math.min(1, (lifetime - (now - lastMove)) / 270));
    if (!opacity || !follow.matches) { clearTrail(); return; }
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const weight = 1 - Math.exp(-Math.max(1, now - lastFrame) / 29);
    lastFrame = now;
    nodes[0].x = pointerX;
    nodes[0].y = pointerY;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1], node = nodes[i];
      const dx = node.x - prev.x, dy = node.y - prev.y;
      const distance = Math.hypot(dx, dy);
      // Cap the gap so even a fast sweep leaves a short, connected ribbon.
      const lag = distance ? Math.min(1 - weight, 11 / distance) : 0;
      node.x = prev.x + dx * lag;
      node.y = prev.y + dy * lag;
      const taper = 1 - i / nodes.length;
      ctx.lineWidth = 0.7 + 3.8 * taper;
      ctx.strokeStyle = 'rgba(78,151,255,' + (opacity * taper * .9) + ')';
      ctx.shadowColor = 'rgba(34,96,255,' + (opacity * .55) + ')';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    }
    frame = requestAnimationFrame(draw);
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !follow.matches || document.querySelector('dialog[open]')) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMove = performance.now();
    if (!frame) {
      for (let i = 0; i < 12; i++) nodes.push({x:pointerX, y:pointerY});
      lastFrame = lastMove;
      frame = requestAnimationFrame(draw);
    }
  });
  document.documentElement.addEventListener('pointerleave', clearTrail);
  window.addEventListener('blur', clearTrail);
})();
