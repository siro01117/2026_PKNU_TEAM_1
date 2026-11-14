// 장별 모션 설정. index.html 은 PPT 에서 다시 만들어지므로 모션은 여기에만 둔다.
// 규칙: 등장 · 전환 모션은 모두 0.5초 이내 (계속 도는 효과만 예외)
(() => {
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const T = 500;                      // 이어지는 전환 길이(ms)
  const S = n => document.querySelector(`.slide[data-n="${n}"]`);
  const byName = (n, name) => S(n).querySelector(`:scope > [data-name="${name}"]`);
  // 비교용 서명(설정을 붙이기 전 모양). 여러 장에 똑같이 있는 틀 · 꺾쇠는 단계 · 등장에서 뺀다
  const sig = e => e.outerHTML.replace(/ data-name="[^"]*"/g, '');
  const SIG = new Map(), CNT = new Map();
  for (const s of document.querySelectorAll('.slide')) for (const e of s.children) { const g = sig(e); SIG.set(e, g); CNT.set(g, (CNT.get(g) || 0) + 1); }
  const chrome = e => CNT.get(SIG.get(e)) > 1;

  // 요소 범위(슬라이드 좌표, style 값 기준)
  function box(e) {
    if (e.classList.contains('grp')) {
      let a = [1e9, 1e9, -1e9, -1e9];
      for (const c of e.querySelectorAll('.shp, .pic, .txt')) { const b = box(c); a = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]; }
      return a;
    }
    const s = e.style, l = parseFloat(s.left), t = parseFloat(s.top);
    return [l, t, l + parseFloat(s.width), t + parseFloat(s.height)];
  }
  // 화면 영역 안에 가운데가 들어오는 요소들
  function pick(n, [x1, y1, x2, y2], skip = []) {
    return [...S(n).children].filter(e => {
      if (e.dataset.morph || chrome(e) || skip.includes(e.dataset.name)) return false;
      const b = box(e), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
    });
  }
  // 단계: 영역 목록 → 차례로 data-step 1, 2, ... (같은 단계 안에서는 왼쪽부터 조금씩 늦게, 0.2초 안)
  function steps(n, list) {
    list.forEach((r, i) => {
      const els = Array.isArray(r[0]) ? r.flatMap(x => pick(n, x)) : pick(n, r, r.skip);
      els.sort((a, b) => box(a)[0] - box(b)[0]);
      els.forEach((e, j) => { e.dataset.step = i + 1; e.style.transitionDelay = Math.min(j * 30, 200) + 'ms'; });
    });
  }
  const skip = (r, names) => Object.assign(r, { skip: names });
  // 장에 들어올 때 차례: 영역 목록 순서대로 조금씩 늦게
  function enter(n, list) { list.forEach((r, i) => pick(n, r).forEach(e => { if (!e.dataset.enter) e.dataset.enter = i; })); }
  // 막대: 바닥(y) · 왼쪽(x)에서 자라기
  // 막대 · 띠: 바닥(y) · 왼쪽(x)부터 차오르기
  const CLIP = { y: 'inset(100% 0 0 0)', x: 'inset(0 100% 0 0)' };
  function grow(n, names, axis = 'y') { names.forEach(x => { const e = byName(n, x); if (e) e.dataset.grow = axis; }); }
  // 여러 요소를 한 묶음으로 감싼다(이어지는 전환에서 함께 움직이도록)
  function wrap(n, names, key) {
    const els = names.map(x => byName(n, x)).filter(Boolean);
    if (!els.length) return;
    const g = document.createElement('div');
    g.className = 'grp'; g.dataset.morph = key; g.style.transformOrigin = '0 0';
    els[0].before(g); els.forEach(e => g.append(e));
    SIG.set(g, `grp ${n} ${key}`);                    // 다른 장과 같은 것으로 잘못 보지 않게 제 이름표
    if (els[0].dataset.enter) g.dataset.enter = els[0].dataset.enter;   // 장에 들어올 때 차례는 안의 요소를 따른다
    return g;
  }

  // 모든 장에 같은 자리로 있는 FIG 줄 · 쪽 번호: 장이 바뀌어도 그대로 두고 달라진 숫자만 굴려 바꾼다
  for (const sl of document.querySelectorAll('.slide')) for (const e of sl.querySelectorAll(':scope > .txt')) {
    const t = e.textContent.trim();
    if (/^\d\d ?\/ ?29$/.test(t)) e.dataset.role = 'page'; else if (/^FIG\./.test(t)) e.dataset.role = 'fig';
  }

  /* ================= 장별 설정 ================= */
  // 01 표지: 제목 → 아래 그림
  enter(1, [[0, 0, 960, 230], [0, 230, 960, 480]]);
  // 02 목차: 위에서 아래로
  enter(2, [[0, 120, 960, 170], [0, 170, 960, 210], [0, 210, 960, 250], [0, 250, 960, 290], [0, 290, 960, 330], [0, 330, 960, 370], [0, 370, 960, 480]]);
  // 03 · 09 간지: 제목 → 진행 표시
  enter(3, [[0, 0, 960, 230], [0, 230, 960, 480]]);
  enter(9, [[0, 0, 960, 330], [0, 330, 960, 480]]);
  // 04 → 05: 부지 그림이 산업단지 아이콘으로 줄어든다
  wrap(4, ['road fill', 'block 1', 'block 2', 'block 3', 'block 4', 'block 5', 'block 6', 'site boundary',
           'warehouse 2', 'office 4', 'warehouse 6', 'factory 1', 'factory 3', 'factory 5'], 'cluster');
  wrap(5, ['industrial complex'], 'cluster');
  // 05: 산업단지로 바뀌는 동안 세 기관과 선이 바로 이어진다
  enter(5, [[0, 120, 960, 480]]);
  // 06 수출 흐름: 왼쪽에서 오른쪽
  enter(6, [[0, 120, 240, 480], [240, 120, 450, 480], [450, 120, 660, 480], [660, 120, 960, 480]]);
  // 07 계약 구조
  steps(7, [[0, 150, 960, 240]]);   // 처음부터 세 주체 + 대금 덩어리가 돌고, → 직접 계약 없음만
  // 대금 덩어리('우웅'): 물 호스 속 물 덩어리처럼 선이 불룩하게 부풀어 지나간다(선과 같은 색, 양 끝은 선으로 가늘어짐)
  //   waves: 차례로 도는 묶음 목록. 한 묶음 안의 길들은 동시에 간다. 길 = 꺾이는 점 목록 [x, y]
  const BLOB = {
    7: { cycle: 2600, waves: [[[[350, 270.5], [405, 270.5]]], [[[560, 270.5], [615, 270.5]]]] },                 // 체계 → 상위, 상위 → 하위
    22: { cycle: 2800, waves: [[[[429.9, 296], [429.9, 199.9], [515, 199.9]]],                                      // 체계기업 → 예치 계좌
                               [[[625, 244], [625, 296]], [[735, 199.9], [820.1, 199.9], [820.1, 296]]]] },          // 예치 계좌 → 상위 · 하위 함께
  };
  for (const n in BLOB) {
    const w = document.createElement('div'); w.className = 'blobwrap';
    w.innerHTML = BLOB[n].waves.flat().map(() => '<div class="blob"><svg viewBox="0 0 28 10"><path d="M0 5 C7 5 8 .5 14 .5 C20 .5 21 5 28 5 C21 5 20 9.5 14 9.5 C8 9.5 7 5 0 5 Z" fill="#2450F0"/></svg></div><div class="ripple"></div>').join('');
    S(n).append(w); SIG.set(w, 'blob ' + n);
  }
  // 06 → 07: 체계기업 · 협력기업 상자가 그대로 이어지고, 협력기업에서 하위 협력기업이 갈라져 나온다
  const P = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'Picture ' + (a + i));
  wrap(6, [...P(20, 24), 'TextBox 39'], 'prime');
  wrap(6, [...P(25, 29), 'TextBox 40'], 'sup');
  wrap(7, [...P(10, 14), 'TextBox 32'], 'prime');
  wrap(7, [...P(15, 19), 'TextBox 33'], 'sup');
  const sub7 = wrap(7, [...P(20, 24), 'TextBox 34'], 'sub7');
  if (sub7) sub7.dataset.morphFrom = 'sup';
  grow(7, ['Picture 25', 'Picture 26'], 'x');   // 상자가 자리 잡은 뒤 선이 왼쪽부터 그어진다
  ['Picture 25', 'Picture 26'].forEach(x => byName(7, x).dataset.after = 1);
  // 14 → 15: 가운데 '통합지원센터'가 15장 위쪽 센터 자리로 이어 옮겨 간다
  wrap(14, [...P(18, 21), 'TextBox 48'], 'center');
  wrap(15, [...P(25, 28), 'TextBox 29'], 'center');
  // 15 ~ 18 왼쪽 단계 목록: 다시 나타나지 않고 색만 바뀐다(옛 글자가 제자리에서 흐려지며 새 색이 드러남), 활성 막대는 미끄러져 옮겨 간다
  for (let n = 15; n <= 18; n++) {
    for (const e of [...S(n).children]) {
      if (e.classList.contains('txt') && e.style.left === '95px') e.dataset.hold = 'st' + parseFloat(e.style.top);
    }
    const bar = [...S(n).children].find(e => (e.getAttribute('src') || '').endsWith('image121.svg'));
    if (bar) wrap(n, [bar.dataset.name], 'stepbar');
  }
  // 17 → 18 왼쪽 상자(A의 시험 항목 → 추가 시험): 다시 나타나지 않고 상자 폭이 줄고, 오른쪽 꺾쇠 · 이어지는 선이 따라 옮겨 가며 글자는 페이드 없이 바로 바뀐다
  for (const n of [17, 18]) for (const x of ['Picture 25', 'Picture 27', 'Picture 29', 'Picture 31', 'TextBox 30']) byName(n, x).dataset.slide = x;
  // 13 → 14: 협력기업 → 선 → 센터 → 선 → 체계기업 · 시험기관 차례로 이어진다 (0.55초 안)
  {
    const seq = (names, t, dur, g) => names.forEach(x => { const e = x === 'center' ? S(14).querySelector(':scope > [data-morph="center"]') : byName(14, x);
      if (!e) return; e.dataset.t = t; e.dataset.dur = dur; if (g) e.dataset.grow = g; });
    seq([...P(12, 16), 'TextBox 47'], 0, 180);
    seq(['Picture 17'], 90, 110, 'x');
    seq(['center'], 170, 180);
    seq(['Picture 22', 'Picture 35'], 260, 100, 'x');
    seq(['Picture 23', 'Picture 24'], 330, 90, 'x');
    seq([...P(36, 40), 'TextBox 51'], 340, 180);
    seq([...P(25, 34), 'TextBox 49', 'TextBox 50'], 380, 170);
  }
  // 08 조정 주체: 거래 당사자 · 이유 · 가운데 바는 처음부터. 한 번 누르면 공공 기관이 나타나고
  //    동시에 거래 당사자 위로 빨간 줄이 왼쪽부터 그어지며 거래 당사자 쪽이 흐려진다(비활성)
  steps(8, [[490, 200, 960, 400]]);
  { const x = byName(8, 'Picture 10'); x.dataset.step = 1; x.dataset.grow = 'x'; }
  ['TextBox 18', 'TextBox 19'].forEach(x => byName(8, x).dataset.dim = 1);
  // 10 기존 지원 기관 셋 → 하나로 모임. 처음엔 세 기관이 화면 가운데, 넘기면 위로 올라가며 갈래 선이 이어지고 아래 센터가 나온다
  ['TextBox 21', 'TextBox 22', 'TextBox 23', '로고 1', '로고 2', '로고 3'].forEach(x => byName(10, x).classList.add('inst'));   // 로고: 국방벤처센터 = 국방기술진흥연구소, 나머지 둘 = 방위사업청(운영 기관)
  steps(10, [[0, 200, 960, 470]]);
  // 11 · 19 장 번호 간지: 위에서 아래로
  for (const n of [11, 19]) enter(n, [[0, 100, 960, 220], [0, 220, 960, 300], [0, 300, 960, 480]]);
  // 12 진입의 어려움: 사진 → 막대가 자라며
  grow(12, ['Picture 14', 'Picture 15']);
  enter(12, [[-50, 100, 470, 480], [470, 100, 700, 480], [700, 100, 960, 480]]);
  // 13 기존 조직의 한계: 단계와 기관 → 결론 한 줄
  // 13장: 클릭 단계 없음. 기관 줄 · 결론 문장 모두 처음부터
  // 14 통합 인증 흐름: 협력기업 → 센터 → 체계기업 · 시험기관
  // 15~18 같은 판: 같은 것은 그대로, 바뀌는 쪽만 바뀐다(전환이 알아서)
  // 20 운영의 어려움: 영업이익 막대 → 순이익 막대
  grow(20, ['Picture 13', 'Picture 14', 'Picture 17', 'Picture 18']);
  steps(20, [[500, 120, 960, 480]]);
  // 21 집중하는 구간: 구간 선 → 협력기업 지급
  //    클릭 없이 한 번에, 막대도 차오르지 않고 다른 것과 함께 살짝 올라오며 (대사가 짧아서)
  // 22 기존 제도: 법 셋과 예치 계좌 → 직접 계약 없는 하위까지 지급
  //    클릭 단계 없음(직접 계약 표시 · 아래 문구 뺌). 대금 덩어리만 돈다
  // 23 선결과제: 세 제도 → 6.5%
  //    클릭 없이 처음부터: 왼쪽 두 조건 · 오른쪽 고리(6.5%만 파랑, 속은 비움). 고리는 0에서 6.5%까지 돌아 차오른다(runRing)
  // 24 대금 지급 기록: 등록 → 기록 표 → 체계기업별 집계
  //    클릭 없이 한 번에(흐르는 선 없음)
  // 25 제도 활용: 평소 → 대금 지연 시
  //    클릭 없이 처음부터 다. 평소 상자도 대금 지연 상자처럼 회색 테두리
  // 26 상생수준평가 연결: 왼쪽에서 오른쪽
  //    흐르는 선 없음. 센터 기록 · 인센티브 위에 아이콘
  enter(26, [[0, 120, 320, 480], [320, 120, 640, 480], [640, 120, 960, 480]]);
  // 27 첫 제안: 사진 → 왜 창원인가 · 세 이유
  //    클릭 없이 한 번에
  // 28 결론: 문장 → 노란 띠
  grow(28, ['Picture 14'], 'x');
  enter(28, [[0, 240, 960, 280], [0, 280, 960, 360]]);
  // 29 감사합니다
  enter(29, [[0, 100, 960, 360], [0, 360, 960, 480]]);

  /* ================= 흐르는 선(항상 도는 효과) · 숫자 올라가기 ================= */
  // 방향: 'r' 오른쪽 · 'l' 왼쪽 · 'd' 아래 · 'u' 위 · [x, y] 그 점에서 나가는 쪽 · 'mid' 가운데에서 양쪽으로
  const FLOW = {
    5: [['Picture 17', [480, 318]], ['Picture 19', [480, 318]], ['Picture 20', [480, 318]]],
    6: [['Picture 30', 'r'], ['Picture 31', 'r'], ['Picture 32', 'r']],
    17: [['Picture 31', 'r'], ['Picture 32', 'mid'], ['Picture 33', 'r'], ['Picture 34', 'r']],
    18: [['Picture 31', 'r'], ['Picture 32', 'mid'], ['Picture 33', 'r'], ['Picture 34', 'r']],
    21: [['Picture 13', 'r'], ['Picture 14', 'r']],
  };
  const DASH = [6, 3], SPEED = 18, GAP = '#C5D2FF';   // 점선: 선 6px · 흐린 파랑 틈 3px, 초당 이동(px)
  const svgText = {};
  async function inline(img) {
    const src = img.getAttribute('src');
    svgText[src] ??= fetch(src).then(r => r.ok ? r.text() : '').catch(() => '');
    const txt = await svgText[src]; if (!txt || !img.isConnected) return null;
    const svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
    if (svg.nodeName !== 'svg') return null;
    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', `0 0 ${parseFloat(svg.getAttribute('width'))} ${parseFloat(svg.getAttribute('height'))}`);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'none');
    for (const a of img.attributes) if (a.name !== 'src' && a.name !== 'alt') svg.setAttribute(a.name, a.value);
    const node = document.importNode(svg, true);
    node.style.overflow = 'visible';
    SIG.set(node, SIG.get(img)); img.replaceWith(node);
    return node;
  }
  async function setupFlow(slide) {
    // 흐르는 선(FLOW)과 그어지는 선(DRAW) 모두 그림을 svg 로 펼쳐 둔다
    const list = [...(FLOW[slide.dataset.n] || []), ...(DRAW[slide.dataset.n]?.lines.map(l => [l[0], null]) || [])]; if (!list.length) return;
    slide._flowSetup ??= (async () => {
      for (const [name, dir] of list) {
        const el = slide.querySelector(`:scope > [data-name="${name}"]`); if (!el) continue;
        const img = el.tagName === 'IMG' ? el : el.querySelector('img');   // 잘라 쓴 그림은 안쪽 img
        const s = img ? await inline(img) : el;
        if (s && dir != null) s.dataset.flow = JSON.stringify(dir);
      }
    })();
    return slide._flowSetup;
  }
  function runFlow(slide) {
    slide.querySelectorAll('.pulse').forEach(p => p.remove());
    const o = slide.getBoundingClientRect(), k = o.width / 960;
    for (const svg of slide.querySelectorAll('[data-flow]')) {
      const dir = JSON.parse(svg.dataset.flow);
      for (const g of svg.querySelectorAll('path, line, polyline')) {
        if (g.classList.contains('pulse')) continue;
        const d = g.getAttribute('d') || '', cs = getComputedStyle(g);
        if (/z/i.test(d) || cs.stroke === 'none' || (cs.strokeDasharray && cs.strokeDasharray !== 'none')) continue;
        const len = g.getTotalLength(), m = g.getScreenCTM(); if (!m || !len) continue;
        const sc = Math.hypot(m.a, m.b) / k;
        if (len * sc < 20) continue;                         // 화살촉 같은 짧은 선은 뺀다
        // 끝점 위치: CSS 회전 · 뒤집기까지 반영되도록 작은 점을 찍어 화면 위치를 잰다
        const P = t => { const q = g.getPointAtLength(t), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', q.x); c.setAttribute('cy', q.y); c.setAttribute('r', 0.01); g.after(c);
          const r = c.getBoundingClientRect(); c.remove(); return [(r.left + r.width / 2 - o.left) / k, (r.top + r.height / 2 - o.top) / k]; };
        const [a, b] = [P(0), P(len)];
        let fwd = true;
        if (dir === 'r') fwd = a[0] <= b[0]; else if (dir === 'l') fwd = a[0] >= b[0];
        else if (dir === 'd') fwd = a[1] <= b[1]; else if (dir === 'u') fwd = a[1] >= b[1];
        else if (dir === 'asis') fwd = true;
        else if (Array.isArray(dir)) fwd = Math.hypot(a[0] - dir[0], a[1] - dir[1]) <= Math.hypot(b[0] - dir[0], b[1] - dir[1]);
        // 흐르는 점선: 선 위에 흰 틈을 일정 간격으로 내고 그 틈이 흐르는 방향으로 천천히 움직인다
        const sw = parseFloat(cs.strokeWidth) || 1;
        const cut = DASH[1] / sc, period = (DASH[0] + DASH[1]) / sc;
        const make = (forward, clip) => {
          const p = g.cloneNode(); p.classList.add('pulse');
          p.removeAttribute('marker-end'); p.removeAttribute('marker-start');
          p.setAttribute('fill', 'none'); p.setAttribute('stroke', GAP); p.setAttribute('stroke-width', sw);
          p.setAttribute('stroke-linecap', 'butt'); p.setAttribute('stroke-dasharray', `${cut} ${period - cut}`);
          if (clip) p.setAttribute('clip-path', `url(#${clip})`);
          g.after(p);
          p.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: forward ? -period : period }],
            { duration: period * sc / SPEED * 1000, iterations: Infinity, easing: 'linear' });
        };
        if (dir === 'mid') {                                   // 가운데에서 양쪽으로: 반씩 잘라 서로 반대로
          const bb = g.getBBox(), wide = bb.width >= bb.height, id = 'c' + Math.random().toString(36).slice(2);
          const NS = 'http://www.w3.org/2000/svg', defs = document.createElementNS(NS, 'defs');
          const pad = 10 / sc;
          for (const [suf, half] of [['a', 0], ['b', 1]]) {
            const cp = document.createElementNS(NS, 'clipPath'), r = document.createElementNS(NS, 'rect');
            cp.id = id + suf; cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
            const x = bb.x - pad, y = bb.y - pad, w = bb.width + 2 * pad, h = bb.height + 2 * pad;
            if (wide) { r.setAttribute('x', half ? bb.x + bb.width / 2 : x); r.setAttribute('y', y); r.setAttribute('width', w / 2); r.setAttribute('height', h); }
            else { r.setAttribute('x', x); r.setAttribute('y', half ? bb.y + bb.height / 2 : y); r.setAttribute('width', w); r.setAttribute('height', h / 2); }
            cp.append(r); defs.append(cp);
          }
          defs.classList.add('pulse'); g.after(defs);
          const startFirst = wide ? a[0] <= b[0] : a[1] <= b[1];   // 왼쪽(위쪽) 반이 시작점 쪽인가
          make(!startFirst, id + 'a'); make(startFirst, id + 'b');  // 두 반 모두 바깥쪽으로
        } else make(fwd);
      }
    }
  }
  // 숫자 올라가기: 22% · +26.8% 같은 글을 0부터 (0.4초)
  const NUM = /^([+\-\s]*)(\d+(?:\.\d+)?)(%)$/;
  for (const n of [12, 20, 23]) for (const t of S(n).querySelectorAll('.txt span')) if (NUM.test(t.textContent.trim())) t.dataset.count = t.textContent.trim();
  // 고리 그래프: 장에 들어오면 0에서 제 비율까지 돈다
  function runRing(slide) {
    for (const c of slide.querySelectorAll('circle.arc')) {
      const C = +c.dataset.c, end = c.getAttribute('stroke-dashoffset');
      c.getAnimations().forEach(a => a.cancel());
      c.animate([{ strokeDashoffset: C }, { strokeDashoffset: end }], { duration: 400, delay: 150, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    }
  }
  function runCount(slide) {
    for (const t of slide.querySelectorAll('[data-count]')) {
      const host = t.closest('.slide > *');
      if (host.classList.contains('hide')) { t._done = false; continue; }
      if (t._done) continue; t._done = true;
      const [, pre, num, suf] = t.dataset.count.match(NUM), dec = (num.split('.')[1] || '').length, end = +num, t0 = performance.now();
      const tick = now => {
        const x = Math.min(1, Math.max(0, (now - t0 - 100) / 400)), e = 1 - Math.pow(1 - x, 3);
        t.textContent = pre + (end * e).toFixed(dec) + suf; if (x < 1) requestAnimationFrame(tick);
      };
      t.textContent = pre + (0).toFixed(dec) + suf; requestAnimationFrame(tick);
    }
  }
  // 선 위를 지나가는 덩어리: [시작 x, 끝 x] 구간을 차례로, 한 바퀴 CYCLE ms
  function runBlob(slide) {
    const cfg = BLOB[slide.dataset.n]; if (!cfg) return;
    const blobs = [...slide.querySelectorAll('.blob')], rips = [...slide.querySelectorAll('.ripple')];
    [...blobs, ...rips].forEach(e => e.getAnimations().forEach(a => a.cancel()));
    const per = 0.32, opt = { duration: cfg.cycle, iterations: Infinity, delay: 500 };   // 한 묶음이 한 바퀴에서 차지하는 몫, 장 전환이 끝난 뒤 시작
    const ease = u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);                     // 밀려 나가 빨라졌다가 도착 앞에서 감속
    let k = 0;
    cfg.waves.forEach((group, gi) => group.forEach(pts => {
      const b = blobs[k], r = rips[k]; k++;
      const seg = pts.slice(1).map((p, i) => { const q = pts[i], dx = p[0] - q[0], dy = p[1] - q[1]; return { q, dx, dy, len: Math.hypot(dx, dy), ang: Math.atan2(dy, dx) * 180 / Math.PI }; });
      const total = seg.reduce((a, x) => a + x.len, 0);
      const at = d => { for (const x of seg) { if (d <= x.len) return [x.q[0] + x.dx * d / x.len, x.q[1] + x.dy * d / x.len, x.ang]; d -= x.len; } const x = seg[seg.length - 1]; return [x.q[0] + x.dx, x.q[1] + x.dy, x.ang]; };
      const t0 = gi * per, tc = t0 + per * 0.1, t1 = t0 + per * 0.55, C = 3;   // '우'(모으기) 동안 3px 만 움직임
      const kf = (d, off, o) => { const [x, y, a] = at(d); return { offset: off, translate: `${x}px ${y}px`, rotate: `${a}deg`, opacity: o }; };
      const go = [kf(0, 0, 0), kf(0, t0, 0), kf(0, t0 + 0.001, 1), kf(C, tc, 1)];
      for (let i = 1; i <= 16; i++) go.push(kf(C + (total - C) * ease(i / 16), tc + (t1 - tc) * i / 16, 1));   // 꺾이는 곳도 부드럽게 돌아 나간다
      go.push(kf(total, t1 + 0.001, 0), kf(total, 1, 0));
      if (t0 === 0) go.splice(1, 1);
      b.animate(go, opt);
      b.animate([{ offset: 0, scale: '.5 .15' }, { offset: t0, scale: '.4 .25', easing: 'cubic-bezier(.2,.9,.3,1)' },
                 { offset: tc, scale: '1.3 1.15', easing: 'cubic-bezier(.4,0,.8,.6)' }, { offset: t1, scale: '.5 .3' }, { offset: 1, scale: '.5 .15' }], opt);
      // 가장 크게 부푼 자리에서 뿌연 파동이 한 번 퍼지고 옅어진다
      if (r) { const [x, y, a] = at(C), T = `${x}px ${y}px`;
        r.animate([{ offset: 0, translate: T, rotate: `${a}deg`, opacity: 0 }, { offset: tc - 0.001, translate: T, rotate: `${a}deg`, scale: '.8 .8', opacity: 0 },
                   { offset: tc, translate: T, rotate: `${a}deg`, scale: '.8 .8', opacity: .7, easing: 'cubic-bezier(.2,.8,.3,1)' },
                   { offset: tc + per * 0.45, translate: T, rotate: `${a}deg`, scale: '2.6 2.2', opacity: 0 }, { offset: 1, translate: T, rotate: `${a}deg`, opacity: 0 }], opt); }
    }));
  }
  // 흰 빛 시머: 같은 장의 시머 글자들을 화면 좌표 하나로 묶어, 빛이 낱말 사이에서 끊기지 않고 줄 전체를 이어서 지나간다
  const SHIM = { gap: 150, speed: 70 };                 // 빛 사이 간격(px), 초당 이동(px) → 줄 위에 빛이 한두 개 동시에
  function runShimmer(slide) {
    const list = slide.querySelectorAll('.shimmer.light'); if (!list.length) return;
    const o = slide.getBoundingClientRect(), k = o.width / 960, P = SHIM.gap;
    for (const t of list) {
      t.getAnimations().forEach(a => a.cancel());
      const L = (t.getBoundingClientRect().left - o.left) / k;
      t.style.backgroundSize = `${P}px 100%`;
      t.animate([{ backgroundPosition: `${-L}px 0` }, { backgroundPosition: `${-L + P}px 0` }],
        { duration: P / SHIM.speed * 1000, iterations: Infinity, easing: 'linear' });
    }
  }
  // 단계가 올 때 선을 그어 보이기: [이름, 시작(ms), 길이(ms)]. 선은 그림 안 경로의 처음(위쪽 끝)부터 그어진다
  //   10: 세 기관에서 갈래가 동시에 내려와 가운데에서 만나고 → 줄기가 통합지원센터로 내려간다 → 상자
  const DRAW = { 10: { step: 1, lines: [['Picture 12', 140, 180], ['Picture 14', 140, 180], ['Picture 13', 140, 180], ['Picture 15', 300, 100]],
                       after: 320, dur: 180 } };   // 10: 세 기관이 먼저 위로 올라가고(0.18초) 그 뒤 선
  function runDraw(slide) {
    const cfg = DRAW[slide.dataset.n], at = +(slide.dataset.at || 0), was = slide._at; slide._at = at;
    if (!cfg || at !== cfg.step || was !== cfg.step - 1) return;
    const names = cfg.lines.map(l => l[0]);
    for (const [name, delay, dur] of cfg.lines) {
      const el = slide.querySelector(`:scope > [data-name="${name}"]`); if (!el) continue;
      for (const g of el.querySelectorAll('path, line')) {
        if (g.classList.contains('pulse')) {          // 흐르는 무늬는 다 그어진 뒤에 보인다
          g.animate([{ opacity: 0 }, { opacity: 0, offset: 0.99 }, { opacity: 1 }], { duration: delay + dur + 60 });
          continue;
        }
        const len = g.getTotalLength(); if (!len) continue;
        g.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: dur, delay, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'backwards' });
      }
    }
    // 선 말고 같은 단계에 나타나는 것(상자 · 글)은 선이 닿을 무렵 나타난다
    for (const e of slide.querySelectorAll(`:scope > [data-step="${cfg.step}"]`)) {
      if (names.includes(e.dataset.name)) continue;
      e.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: cfg.dur || 230, delay: cfg.after, easing: EASE, fill: 'backwards' });
    }
  }
  async function onShow(slide) {
    runCount(slide); runBlob(slide); runShimmer(slide); runRing(slide);
    await setupFlow(slide);
    runDraw(slide);
    if (slide.classList.contains('on') && !slide._flowOn) { slide._flowOn = true; runFlow(slide); }
  }
  function onLeave(slide) {
    slide._flowOn = false;
    slide.querySelectorAll('.pulse').forEach(p => p.remove());
    slide.querySelectorAll('[data-count]').forEach(t => { t._done = false; t.textContent = t.dataset.count; });
  }

  /* ================= 전환 ================= */
  // 두 장에 똑같이 있는 요소(틀 · 꺾쇠 · 같은 제목)는 그대로 두고, 바뀌는 것만 빠르게 바꾼다
  const rect = (e, k, o) => { const r = e.getBoundingClientRect(); return { x: (r.left - o.left) / k, y: (r.top - o.top) / k, w: r.width / k, h: r.height / k }; };
  function fit(a, b) {
    const s = Math.min(b.w / a.w, b.h / a.h);
    return `translate(${b.x + b.w / 2 - s * (a.x + a.w / 2)}px, ${b.y + b.h / 2 - s * (a.y + a.h / 2)}px) scale(${s})`;
  }
  function bbox(g, k, o) {
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    for (const e of g.querySelectorAll('.shp, .pic, .txt')) {
      const r = rect(e, k, o); if (!r.w && !r.h) continue;
      x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h);
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  const textNodes = e => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), r = []; while (w.nextNode()) r.push(w.currentNode); return r; };
  // 글자가 같은 자리에서 숫자만 다르면 그 숫자만 위(다음 장) · 아래(앞 장)로 굴린다. 다른 글이 바뀌면 그 줄만 빠르게 바꾼다
  function swapText(a, b, up) {
    const ta = textNodes(a), tb = textNodes(b);
    const ok = ta.length === tb.length && ta.every((x, i) => x.data.length === tb[i].data.length &&
      [...x.data].every((c, j) => c === tb[i].data[j] || (/\d/.test(c) && /\d/.test(tb[i].data[j]))));
    if (!ok) return [b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE })];
    const html = b.innerHTML;
    tb.forEach((x, i) => {
      const o = ta[i].data, d = x.data; if (o === d) return;
      const f = document.createDocumentFragment();
      [...d].forEach((c, j) => {
        if (c === o[j]) { f.append(c); return; }
        const r = document.createElement('span'); r.className = 'roll';
        r.innerHTML = `<span class="o">${o[j]}</span><span class="n">${c}</span>`; f.append(r);
      });
      x.replaceWith(f);
    });
    const k = up ? 1 : -1, out = [];
    for (const r of b.querySelectorAll('.roll')) {
      out.push(r.children[0].animate([{ translate: '0 0' }, { translate: `0 ${-100 * k}%` }], { duration: 300, easing: EASE, fill: 'forwards' }));
      out.push(r.children[1].animate([{ translate: `0 ${100 * k}%` }, { translate: '0 0' }], { duration: 300, easing: EASE }));
    }
    b._restore = () => { b.innerHTML = html; delete b._restore; };
    Promise.all(out.map(x => x.finished)).catch(() => {}).finally(() => b._restore?.());
    return out;
  }

  function play(A, B) {
    document.querySelectorAll('[data-role]').forEach(e => e._restore?.());
    document.querySelectorAll('.slide.ghost').forEach(g => g.classList.remove('ghost'));
    document.getAnimations().forEach(a => { if (!(a instanceof CSSTransition) && a.effect?.getTiming().iterations !== Infinity) a.finish(); });
    const sameB = new Set([...B.children].map(e => SIG.get(e))), sameA = new Set([...A.children].map(e => SIG.get(e)));
    A.classList.add('ghost');
    const o = B.getBoundingClientRect(), k = o.width / 960;
    const anim = [], morphed = new Set();
    for (const b of B.querySelectorAll(':scope > [data-role]')) {
      const a = A.querySelector(`:scope > [data-role="${b.dataset.role}"]`); if (!a) continue;
      a.style.visibility = 'hidden'; morphed.add(a); morphed.add(b);
      if (a.textContent !== b.textContent) anim.push(...swapText(a, b, +B.dataset.n > +A.dataset.n));
    }
    for (const b of B.querySelectorAll(':scope > [data-hold]')) {   // 같은 자리 글자: 새 것은 바로 보이고 옛 것만 위에서 흐려진다 → 색만 바뀌는 느낌
      const a = A.querySelector(`:scope > [data-hold="${b.dataset.hold}"]`); if (!a) continue;
      anim.push(a.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease', fill: 'forwards' }));
      morphed.add(a); morphed.add(b);
    }
    // 같은 것이 크기 · 자리만 바뀌는 것(data-slide): 새 자리 · 크기로 옮겨 가고, 글자는 페이드 없이 바로 바뀐다
    const geo = e => ({ left: e.style.left, top: e.style.top, width: e.style.width, height: e.style.height });
    for (const b of B.querySelectorAll(':scope > [data-slide]')) {
      const a = A.querySelector(`:scope > [data-slide="${b.dataset.slide}"]`); if (!a) continue;
      anim.push(b.animate([geo(a), geo(b)], { duration: T, easing: EASE }));   // 글자가 달라도 흐려지며 겹치지 않고 바로 바뀐다
      a.style.visibility = 'hidden';
      morphed.add(a); morphed.add(b);
    }
    // 모양 · 자리 · 글자가 같고 색만 다른 것: 다시 올라오며 나타나지 않고 제자리에서 색만 바뀐다
    const shapeKey = e => { const t = e.style; return [e.tagName, e.className, t.left, t.top, t.width, t.height, t.transform, e.textContent.trim()].join('|'); };
    const pool = new Map();
    for (const a of A.children) if (!morphed.has(a) && !a.dataset.morph && !sameB.has(SIG.get(a))) pool.set(shapeKey(a), a);
    for (const b of B.children) {
      if (morphed.has(b) || b.dataset.morph || b.classList.contains('hide') || sameA.has(SIG.get(b))) continue;
      const a = pool.get(shapeKey(b)); if (!a) continue;
      pool.delete(shapeKey(b));
      anim.push(a.animate([{}, { opacity: 0 }], { duration: 250, easing: 'ease', fill: 'forwards' }));
      morphed.add(a); morphed.add(b);
    }
    for (const a of A.querySelectorAll(':scope > [data-morph]')) {
      const b = B.querySelector(`:scope > [data-morph="${a.dataset.morph}"]`); if (!b) continue;
      const ra = bbox(a, k, o), rb = bbox(b, k, o);
      const same = Math.abs(rb.w / ra.w - 1) < 0.1 && Math.abs(rb.h / ra.h - 1) < 0.1;   // 크기가 같으면 겹쳐 흐려지지 않게 새 것은 처음부터 보이고, 옛 것만 빨리 빠진다
      anim.push(a.animate(same ? [{ transform: 'none', opacity: 1 }, { opacity: 0, offset: 0.4 }, { transform: fit(ra, rb), opacity: 0 }]
                               : [{ transform: 'none', opacity: 1 }, { transform: fit(ra, rb), opacity: 0 }], { duration: T, easing: EASE }));
      anim.push(b.animate([{ transform: fit(rb, ra), opacity: same ? 1 : 0 }, { transform: 'none', opacity: 1 }], { duration: T, easing: EASE }));
      morphed.add(a); morphed.add(b);
    }
    // 앞 장의 한 묶음에서 갈라져 나오는 것(data-morph-from): 그 자리에서 시작해 제자리로
    for (const b of B.querySelectorAll(':scope > [data-morph-from]')) {
      const a = A.querySelector(`:scope > [data-morph="${b.dataset.morphFrom}"]`); if (!a) continue;
      const ra = bbox(a, k, o), rb = bbox(b, k, o);
      anim.push(b.animate([{ transform: fit(rb, ra), opacity: 0 }, { opacity: 1, offset: 0.35 }, { transform: 'none', opacity: 1 }], { duration: T, easing: EASE }));
      morphed.add(b);
    }
    for (const e of A.children) {
      if (morphed.has(e)) continue;
      if (sameB.has(SIG.get(e))) { e.style.visibility = 'hidden'; continue; }
      anim.push(e.animate([{ opacity: 0 }], { duration: morphed.size ? 60 : 150, fill: 'forwards' }));   // 지금 투명도에서 시작(흐려진 것이 다시 진해졌다 사라지지 않게)   // 이어 움직일 땐 남은 선이 겹치지 않게 바로 뺀다
    }
    // 들어오는 장: 차례(data-enter)대로 살짝 올라오며. 마지막이 0.5초 안에 끝나게 간격을 줄인다
    const ins = [...B.children].filter(e => !morphed.has(e) && !e.classList.contains('hide') && !sameA.has(SIG.get(e)));
    const last = Math.max(0, ...ins.map(e => +(e.dataset.enter || 0)));
    const gap = last ? Math.min(60, 100 / last) : 0;
    for (const e of ins) {
      const d = 100 + gap * +(e.dataset.enter || 0), g = e.dataset.grow;
      const from = g ? { clipPath: CLIP[g] } : { opacity: 0, translate: '0 8px' };
      const to = g ? { clipPath: 'inset(0 0 0 0)' } : { opacity: 1, translate: '0 0' };
      if (e.dataset.t) { anim.push(e.animate([from, to], { duration: +e.dataset.dur, delay: +e.dataset.t, easing: g ? 'linear' : EASE, fill: 'backwards' })); continue; }   // 장에서 정한 차례 · 길이
      anim.push(e.animate([from, to], g && e.dataset.after ? { duration: 180, delay: 320, easing: EASE, fill: 'backwards' }   // 상자가 자리 잡은 뒤 선 긋기
                                    : g ? { duration: 400, delay: Math.min(d, 100), easing: EASE, fill: 'backwards' }
                                         : { duration: 250, delay: d, easing: EASE, fill: 'backwards' }));
    }
    Promise.all(anim.map(x => x.finished)).catch(() => {}).finally(() => {
      A.classList.remove('ghost');
      A.getAnimations({ subtree: true }).forEach(x => x.cancel());
      for (const e of A.children) e.style.visibility = '';
    });
  }

  // 선 그림을 svg 로 펼치는 일은 처음부터 모든 장에 해 둔다. 장에 처음 들어갈 때 펼치면
  // 들어오는 움직임이 걸린 옛 그림이 바뀌어 버려, 선이 움직임 없이 미리 떠 있었다
  document.querySelectorAll('.slide').forEach(sl => setupFlow(sl));
  window.MOTION = { play, onShow, onLeave };
})();
