// → / ← : 다음 · 이전 (장 안에 단계가 있으면 단계부터)
// o : 원래 PPT 화면 겹쳐 보기, f : 전체 화면
// 주소 #장.단계 를 기억해서, 파일이 바뀌어 새로 고쳐져도 같은 자리로 돌아온다
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.getElementById('stage');
  const ref = document.getElementById('ref');
  const hud = document.getElementById('hud');
  let n = 1, step = 0;
  const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);   // 배포본(GitHub Pages)에서는 겹쳐 보기 · 실시간 반영을 끈다

  const steps = s => Math.max(0, ...[...s.querySelectorAll('[data-step]')].map(e => +e.dataset.step));

  function fit() {
    const k = Math.min(innerWidth / 960, innerHeight / 540);
    // 확대는 transform 대신 zoom: 배치가 화면 픽셀에 맞춰져 가는 눈금 · 선 굵기가 자리마다 달라 보이지 않는다
    const ox = innerWidth / 2 - 480 * k, oy = innerHeight / 2 - 270 * k;
    for (const el of [stage, ref]) { el.style.zoom = k; el.style.transform = 'none'; el.style.left = ox / k + 'px'; el.style.top = oy / k + 'px'; }
    // 가는 눈금(data-snap)은 양 끝을 화면 픽셀에 맞춰 굵기를 똑같이
    const d = devicePixelRatio;
    document.querySelectorAll('[data-snap]').forEach(e => {
      if (!e.dataset.l) { e.dataset.l = parseFloat(e.style.left); e.dataset.w = parseFloat(e.style.width); }
      const L = +e.dataset.l, W = +e.dataset.w, px = Math.max(1, Math.round(W * k * d));
      const x = Math.round((ox + (L + W / 2) * k) * d - px / 2) / d;
      e.style.left = (x - ox) / k + 'px'; e.style.width = px / d / k + 'px';
    });
  }

  function show(anim) {
    slides.forEach((s, i) => s.classList.toggle('on', i === n - 1));
    const s = slides[n - 1];
    s.querySelectorAll('[data-step]').forEach(e => {
      if (!anim) e.style.transition = 'none';
      e.classList.toggle('hide', +e.dataset.step > step);
      if (!anim) { e.offsetWidth; e.style.transition = ''; }
    });
    s.dataset.at = step;           // CSS 에서 .slide[data-at="2"] 처럼 단계별 모양을 줄 수 있다
    if (LOCAL) ref.src = `img/ppt/${String(n).padStart(2, '0')}.png`;   // 원본 PPT 겹쳐 보기는 내 컴퓨터에서만
    hud.textContent = `${n} / ${slides.length}` + (steps(s) ? `  ·  단계 ${step}/${steps(s)}` : '');
    history.replaceState(null, '', `#${n}.${step}`);
    if (window.MOTION) { slides.forEach(x => x !== s && x._flowOn && MOTION.onLeave(x)); MOTION.onShow(s); }
  }

  function go(d) {
    const s = slides[n - 1], prev = n;
    if (d > 0) {
      if (step < steps(s)) step++;
      else if (n < slides.length) { n++; step = 0; }
    } else {
      if (step > 0) step--;
      else if (n > 1) { n--; step = steps(slides[n - 1]); }
    }
    show(true);
    if (n !== prev && window.MOTION) MOTION.play(slides[prev - 1], slides[n - 1]);
  }

  addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) go(1);
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) go(-1);
    else if (e.key === 'Home') { n = 1; step = 0; show(false); }
    else if (e.key === 'End') { n = slides.length; step = 0; show(false); }
    else if (e.key === 'o') ref.classList.toggle('on');
    else if (e.key === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else return;
    e.preventDefault();
  });
  addEventListener('click', e => go(e.clientX > innerWidth / 3 ? 1 : -1));
  addEventListener('resize', fit);

  function fromHash() {
    const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
    if (m) { n = Math.min(Math.max(+m[1], 1), slides.length); step = Math.min(+(m[2] || 0), steps(slides[n - 1])); }
  }
  addEventListener('hashchange', () => { fromHash(); show(false); });
  fromHash(); fit(); show(false);

  // 실시간 반영: 서버가 파일 변경을 알려 주면 새로 고침
  if (LOCAL) {
    const es = new EventSource('/__live');
    es.onmessage = () => location.reload();
  }
})();
