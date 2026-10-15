// Showreel 15 s, 1080x1920 @ 60 fps — tudo desenhado por código (Skia via @napi-rs/canvas).
// Uso:
//   node render.js --bands bands.json --raw [--from 0 --to 900]      -> RGBA cru no stdout
//   node render.js --bands bands.json --png out_dir 0,120,240 [--guides]
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------------ config
const W = 1080, H = 1920, FPS = 60, NF = 900;
const BPM = 128, BEAT = 60 / BPM, BAR = 4 * BEAT, S16 = BEAT / 4;
const SAFE = { l: 100, r: 960, t: 250, b: 1520 };
const CX = 530, CY = 885;          // centro da área segura (não da tela)
const C = {
  ink: '#0D0D12', paper: '#F3EFE6', red: '#FF3B2E', blue: '#2D4BFF', lime: '#C6FF3A',
};
const NSUB = 8;                     // subframes de motion blur
const SHUTTER = 0.5 / FPS;          // obturador 180°

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BANDS = JSON.parse(fs.readFileSync(arg('--bands', 'bands.json'))).bands;

const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium',
  600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
for (const [w, n] of Object.entries(WEIGHTS))
  GlobalFonts.registerFromPath(`/usr/share/fonts/opentype/inter/InterDisplay-${n}.otf`, `ID${w}`);
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'MONO');
const CAP = 0.727;                  // altura de maiúscula da Inter / em

// ------------------------------------------------------------------ util
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, t0, d) => clamp((t - t0) / d);
const eOutExpo = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const eInExpo = x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const eInOutExpo = x => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
const eOutCubic = x => 1 - Math.pow(1 - x, 3);
const eInCubic = x => x * x * x;
const eInQuad = x => x * x;
const eInOutCubic = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOutBack = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const eOutElastic = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
const alpha = (h, a) => `rgba(${hex(h).join(',')},${a})`;

function bg(ctx, col) { ctx.fillStyle = col; ctx.fillRect(-400, -400, W + 800, H + 800); }

// ------------------------------------------------------------------ texto
const measCache = new Map();
function adv(ctx, w, size, s) {
  if (!s) return 0;
  const k = `${w}|${size.toFixed(2)}|${s}`;
  let v = measCache.get(k);
  if (v === undefined) { ctx.font = `${size}px ID${w}`; v = ctx.measureText(s).width; measCache.set(k, v); }
  return v;
}
function fitSize(ctx, text, w, maxW, track = -0.02) {
  const m = adv(ctx, w, 100, text) + track * 100 * (text.length - 1);
  return 100 * maxW / m;
}
// desenha palavra centrada em (cx, cy) (cy = centro das maiúsculas); fn(i, n) devolve transformações por letra
function word(ctx, text, o) {
  const w = o.w || 900, track = o.track ?? -0.02;
  const size = o.size || fitSize(ctx, text, w, o.fit, track);
  const xs = []; let x = 0;
  for (let i = 0; i < text.length; i++) {
    const pre = adv(ctx, w, size, text.slice(0, i));
    const cw = adv(ctx, w, size, text[i]);
    xs.push({ x: pre + track * size * i, cw });
  }
  const total = xs[xs.length - 1].x + xs[xs.length - 1].cw;
  ctx.save();
  ctx.translate(o.cx, o.cy);
  if (o.scale !== undefined) ctx.scale(o.scale * (o.sx || 1), o.scale * (o.sy || 1));
  if (o.rot) ctx.rotate(o.rot);
  ctx.font = `${size}px ID${w}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') continue;
    const L = o.letter ? o.letter(i, text.length) : {};
    if (L.hide) continue;
    const lx = xs[i].x + xs[i].cw / 2 - total / 2;
    ctx.save();
    ctx.translate(lx + (L.dx || 0), (L.dy || 0));
    if (L.rot) ctx.rotate(L.rot);
    if (L.sx || L.sy || L.s) ctx.scale((L.s || 1) * (L.sx || 1), (L.s || 1) * (L.sy || 1));
    ctx.globalAlpha = L.a ?? 1;
    const col = L.color || o.color;
    if (o.stroke) { ctx.strokeStyle = col; ctx.lineWidth = o.stroke; ctx.strokeText(text[i], 0, CAP * size / 2); }
    else { ctx.fillStyle = col; ctx.fillText(text[i], 0, CAP * size / 2); }
    ctx.restore();
  }
  ctx.restore();
  return { size, total };
}
function mono(ctx, text, x, y, col, size = 36, align = 'left', a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.font = `${size}px MONO`; ctx.fillStyle = col;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y); ctx.restore();
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// rótulo de seção: palavra grande que sobe de uma máscara
function label(ctx, text, lt, col, cy = 1335, fit = 720) {
  const size = fitSize(ctx, text, 900, fit);
  const capH = CAP * size;
  ctx.save();
  ctx.beginPath(); ctx.rect(-200, cy - capH / 2 - 30, W + 400, capH + 60); ctx.clip();
  word(ctx, text, { w: 900, size, cx: CX, cy, color: col, letter: (i) => {
    const p = eOutExpo(prog(lt, 0.03 + i * 0.03, 0.35));
    return { dy: (1 - p) * capH * 1.5 };
  } });
  ctx.restore();
}

// ------------------------------------------------------------------ cena 0: HOOK
function shockwave(ctx, x, y, t, col, maxR = 1200) {
  const p = clamp(t / 0.7); if (p >= 1) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 70 * Math.pow(1 - p, 2) + 0.5;
  ctx.beginPath(); ctx.arc(x, y, 560 + maxR * eOutExpo(p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function debris(ctx, t, col, seed, n = 16, cx = CX, cy = CY) {
  const r = rng(seed);
  ctx.save(); ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, sp = 500 + r() * 800, sz = 24 + r() * 30, kind = Math.floor(r() * 3), rs = (r() - 0.5) * 12;
    const p = eOutExpo(clamp(t / 0.7));
    const al = 1 - clamp((t - 0.15) / 0.4);
    if (al <= 0) continue;
    ctx.save(); ctx.globalAlpha = al;
    ctx.translate(cx + Math.cos(a) * (430 + sp * p), cy + Math.sin(a) * (430 + sp * p));
    ctx.rotate(rs * t);
    ctx.beginPath();
    if (kind === 0) ctx.rect(-sz / 2, -sz / 2, sz, sz);
    else if (kind === 1) { ctx.moveTo(0, -sz * 0.6); ctx.lineTo(sz * 0.55, sz * 0.4); ctx.lineTo(-sz * 0.55, sz * 0.4); ctx.closePath(); }
    else ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function hookTag(ctx, col) { mono(ctx, 'CLAUDE — MOTION REEL 26', CX, 330, col, 38, 'center'); }

function scene0(ctx, t) {
  const k = Math.min(3, Math.floor(t / BEAT)), bt = t - k * BEAT;
  if (k === 0) {
    bg(ctx, C.red);
    shockwave(ctx, CX, CY, bt, C.ink);
    debris(ctx, bt, C.ink, 11);
    hookTag(ctx, C.ink);
    const s = lerp(1.1, 1, eOutExpo(clamp(bt / 0.2)));
    word(ctx, 'I MAKE', { fit: 720, cx: CX, cy: CY, color: C.ink, scale: s,
      letter: i => ({ dy: -70 * (1 - eOutExpo(clamp((bt + 0.04 - i * 0.015) / 0.22))) }) });
  } else if (k === 1) {
    bg(ctx, C.ink);
    hookTag(ctx, C.paper);
    const r = word(ctx, 'THINGS', { fit: 820, cx: CX, cy: CY, color: C.paper,
      letter: i => {
        const p = clamp((bt + 0.07 - i * 0.022) / 0.2);
        return { dy: -320 * (1 - eOutBack(p, 2.2)), sy: 1 + 0.35 * (1 - p), sx: 1 - 0.15 * (1 - p), hide: p <= 0 };
      } });
    const bw = 820 * eOutExpo(prog(bt, 0.04, 0.3));
    ctx.fillStyle = C.lime; ctx.fillRect(CX - 410, CY + CAP * r.size / 2 + 40, bw, 28);
  } else {
    bg(ctx, C.lime);
    // k==2: MOVE. dançando ; k==3: letras explodem + íris
    const t2 = t - 2 * BEAT;
    const scat = k === 3 ? bt : 0;
    const sp = eOutCubic(clamp(scat / 0.42));
    const R = rng(5);
    const dirs = [...Array(5)].map(() => [R() * 2 - 1, R() * 2 - 1, (R() - 0.5) * 6]);
    const drawMove = (col) => {
      hookTag(ctx, col);
      word(ctx, 'MOVE.', { fit: 800, cx: CX, cy: CY, color: col, scale: lerp(1.12, 1, eOutExpo(clamp(t2 / 0.22))),
        letter: (i, n) => {
          const ph = t2 / (BEAT / 2) - i * 0.35;
          const off = i - (n - 1) / 2;
          return {
            dy: -55 * Math.abs(Math.sin(Math.PI * ph)) * (1 - sp) + (dirs[i][1] * 700 - 200) * sp,
            dx: (off * 380 + dirs[i][0] * 300) * sp,
            rot: 0.12 * Math.sin(Math.PI * 2 * t2 / BEAT - i) * (1 - sp) + dirs[i][2] * sp,
            s: 1 - 0.55 * sp,
          };
        } });
    };
    drawMove(C.ink);
    if (k === 3) {
      const r = 1350 * eInOutCubic(clamp(bt / (BEAT * 0.92)));
      ctx.save(); ctx.beginPath(); ctx.arc(CX, 760, r, 0, Math.PI * 2); ctx.clip();
      bg(ctx, C.ink);
      drawMove(C.paper);
      const cr = 260 * eOutBack(prog(bt, 0.18, 0.26), 2.5);
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(CX, 760, Math.max(0, cr), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ cena 1: SHAPE
function polyRadial(verts, th) {
  // distância do centro até o polígono no ângulo th (ray casting)
  const dx = Math.cos(th), dy = Math.sin(th);
  let best = Infinity;
  for (let i = 0; i < verts.length; i++) {
    const [ax, ay] = verts[i], [bx, by] = verts[(i + 1) % verts.length];
    const ex = bx - ax, ey = by - ay;
    const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const tt = (ax * ey - ay * ex) / den, u = (ax * dy - ay * dx) / den;
    if (tt > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, tt);
  }
  return isFinite(best) ? best : 1;
}
const ngon = (n, r, rot = -Math.PI / 2) => [...Array(n)].map((_, i) => [Math.cos(rot + i * 2 * Math.PI / n) * r, Math.sin(rot + i * 2 * Math.PI / n) * r]);
const STAR = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.5 : 1.18; return [Math.cos(a) * r, Math.sin(a) * r]; });
const SHAPES = [
  { col: C.red, f: () => 1 },
  { col: C.blue, f: th => polyRadial(ngon(4, 1.18, -Math.PI / 4), th) },
  { col: C.lime, f: th => polyRadial(ngon(3, 1.3), th) },
  { col: C.paper, f: th => polyRadial(STAR, th) },
];
const NPT = 240;
const SHAPE_PTS = SHAPES.map(s => [...Array(NPT)].map((_, i) => s.f(-Math.PI / 2 + i * 2 * Math.PI / NPT)));
function shapeState(lt) {
  let idx = 0, p = 1;
  for (let k = 1; k < 4; k++) if (lt >= k * BEAT - 0.02) { idx = k; p = clamp((lt - (k * BEAT - 0.02)) / 0.3); }
  const prev = Math.max(0, idx - 1);
  const e = idx === 0 ? 1 : eOutBack(p, 2.4);
  const radii = SHAPE_PTS[idx].map((r, i) => lerp(SHAPE_PTS[prev][i], r, e));
  const col = idx === 0 ? SHAPES[0].col : mix(SHAPES[prev].col, SHAPES[idx].col, clamp(p * 1.6));
  const spin = lt * 0.5 + [0, 1, 2, 3].reduce((a, k) => a + (k ? (Math.PI / 2) * eInOutCubic(clamp((lt - k * BEAT + 0.02) / 0.3)) : 0), 0);
  return { radii, col, spin };
}
function drawShape(ctx, st, x, y, R, sx = 1, sy = 1, fill = true, stroke = 0, strokeCol) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.rotate(st.spin);
  ctx.beginPath();
  st.radii.forEach((r, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / NPT; const px = Math.cos(a) * r * R, py = Math.sin(a) * r * R; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
  ctx.closePath();
  if (fill) { ctx.fillStyle = st.col; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = strokeCol; ctx.lineWidth = stroke / Math.max(sx, sy); ctx.stroke(); }
  ctx.restore();
}
function scene1(ctx, lt) {
  bg(ctx, C.ink);
  const bt = lt % BEAT, bi = Math.floor(lt / BEAT);
  const exitP = clamp((lt - (BAR - 0.34)) / 0.34);
  label(ctx, 'SHAPE', lt, C.paper);
  mono(ctx, 'MORPH × 4  /  ON THE BEAT', CX, 1452, C.paper, 34, 'center', 0.55 * (1 - exitP));
  // órbitas
  const orbs = [C.red, C.blue, C.lime];
  orbs.forEach((col, i) => {
    const jumps = [...Array(4)].reduce((a, _, k) => a + eOutExpo(clamp((lt - k * BEAT) / 0.3)), 0);
    const a = -Math.PI / 2 + i * 2 * Math.PI / 3 + jumps * (Math.PI / 3) * (i % 2 ? -1 : 1) + lt * 0.4;
    const rr = 390;
    ctx.fillStyle = col; ctx.globalAlpha = 1 - exitP;
    ctx.beginPath(); ctx.arc(CX + Math.cos(a) * rr, 760 + Math.sin(a) * rr, 26, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
  // ecos (onion trail)
  if (exitP <= 0) for (let j = 4; j >= 1; j--) {
    const st = shapeState(Math.max(0, lt - j * 0.045));
    ctx.globalAlpha = 0.5 - j * 0.1;
    drawShape(ctx, st, CX, 760, 260 * (1 + j * 0.07), 1, 1, false, 5, C.paper);
    ctx.globalAlpha = 1;
  }
  const st = shapeState(lt);
  const kick = Math.exp(-bt / 0.08) * (bi === 0 && lt < 0.05 ? 0 : 1);
  const big = 1 + 12 * eInExpo(exitP);
  st.spin += eInCubic(exitP) * 2.5;
  if (exitP > 0) st.col = mix(st.col, C.paper, exitP);
  drawShape(ctx, st, CX, 760, 260 * big, 1 + 0.14 * kick, 1 - 0.1 * kick);
}

// ------------------------------------------------------------------ cena 2: TYPE (fonte "variável" em ondas)
const WSTEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
function scene2(ctx, lt) {
  bg(ctx, C.paper);
  const rows = 7, size = 150, gap = 150;
  const pushes = [...Array(4)].reduce((a, _, k) => a + eOutExpo(clamp((lt - k * BEAT) / 0.35)), 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(SAFE.l, SAFE.t, SAFE.r - SAFE.l, SAFE.b - SAFE.t); ctx.clip();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (let r = 0; r < rows; r++) {
    const cy = CY + (r - 3) * gap;
    const dir = r % 2 ? 1 : -1;
    const enter = eOutExpo(prog(lt, r * 0.025, 0.4));
    let x = -900 + dir * (lt * 160 + pushes * 170) + (1 - enter) * dir * -1200 + r * 137;
    x = ((x % 1200) + 1200) % 1200 - 1200 + SAFE.l - 200;
    const col = r === 3 ? C.red : C.ink;
    const outline = r === 1 || r === 5;
    let i = 0;
    while (x < SAFE.r + 50) {
      const ch = 'TYPE '[i % 5];
      const wave = 0.5 + 0.5 * Math.sin(lt * 7 - i * 0.55 + r * 0.9 + pushes * 1.3);
      const w = WSTEPS[Math.round(wave * 8)];
      const a = adv(ctx, w, size, ch);
      if (ch !== ' ' && x + a > SAFE.l - 50) {
        ctx.font = `${size}px ID${w}`;
        if (outline) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeText(ch, x, cy + CAP * size / 2); }
        else { ctx.fillStyle = col; ctx.fillText(ch, x, cy + CAP * size / 2); }
      }
      x += a + (ch === ' ' ? 10 : -2);
      i++;
    }
  }
  ctx.restore();
  // degradê nas bordas da janela
  for (const [x0, x1] of [[SAFE.l, SAFE.l + 150], [SAFE.r, SAFE.r - 150]]) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, alpha(C.paper, 1)); g.addColorStop(1, alpha(C.paper, 0));
    ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), SAFE.t, 150, SAFE.b - SAFE.t);
  }
  // saída: barras azuis sobem
  const cols = 8, cw = W / cols;
  ctx.fillStyle = C.blue;
  for (let c = 0; c < cols; c++) {
    const p = eInOutCubic(clamp((lt - (BAR - 0.36) - c * 0.018) / 0.22));
    if (p > 0) ctx.fillRect(c * cw - 1, H * (1 - p), cw + 2, H * p + 2);
  }
}

// ------------------------------------------------------------------ cena 3: RHYTHM (visualizador real da trilha)
function bandsAt(t) {
  const f = ((t * FPS) % NF + NF) % NF, i0 = Math.floor(f), fr = f - i0, A = BANDS[i0], B2 = BANDS[(i0 + 1) % NF];
  return A.map((v, i) => lerp(v, B2[i], fr));
}
// variante do label com letras saltando
function hopLabel(ctx, text, lt, col) {
  const size = fitSize(ctx, text, 900, 720), capH = CAP * size;
  const k16 = Math.floor(lt / S16), u = (lt % S16) / S16;
  ctx.save(); ctx.beginPath(); ctx.rect(-200, 1335 - capH / 2 - 120, W + 400, capH + 150); ctx.clip();
  word(ctx, text, { w: 900, size, cx: CX, cy: 1335, color: col, letter: i => {
    const p = eOutExpo(prog(lt, 0.03 + i * 0.03, 0.35));
    const hop = (k16 % text.length === i) ? -70 * Math.sin(Math.PI * u) : 0;
    return { dy: (1 - p) * capH * 1.5 + hop * p };
  } });
  ctx.restore();
}

// ------------------------------------------------------------------ cena 4: DEPTH (partículas 3D)
const NP = 420;
const P3 = (() => {
  const sphere = [], cube = [], torus = [], helix = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < NP; i++) { const y = 1 - (i / (NP - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i; sphere.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
  const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let i = 0; i < NP; i++) { const e = E[i % 12], u = Math.floor(i / 12) / 34; cube.push(V[e[0]].map((a, j) => lerp(a, V[e[1]][j], u) * 0.72)); }
  for (let i = 0; i < NP; i++) { const a = (i % 30) / 30 * Math.PI * 2, b = Math.floor(i / 30) / 14 * Math.PI * 2; torus.push([(0.85 + 0.35 * Math.cos(b)) * Math.cos(a), 0.35 * Math.sin(b), (0.85 + 0.35 * Math.cos(b)) * Math.sin(a)]); }
  for (let i = 0; i < NP; i++) { const s = i % 2, u = Math.floor(i / 2) / 209, a = u * Math.PI * 5 + s * Math.PI; helix.push([Math.cos(a) * 0.55, (u - 0.5) * 2.2, Math.sin(a) * 0.55]); }
  const R = rng(9);
  const scatter = [...Array(NP)].map(() => [(R() - 0.5) * 8, (R() - 0.5) * 8, (R() - 0.5) * 6]);
  return { sets: [sphere, cube, torus, helix], scatter };
})();
function scene4(ctx, lt) {
  bg(ctx, C.ink);
  const bt = lt % BEAT;
  const kick = Math.exp(-bt / 0.1);
  const exitP = clamp((lt - (BAR - 0.24)) / 0.24);
  // fundo: grade em perspectiva sutil
  ctx.strokeStyle = alpha(C.blue, 0.5); ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const z = ((i / 9 + lt * 0.6) % 1);
    const y = 1180 + 300 * z * z;
    ctx.globalAlpha = z; ctx.beginPath(); ctx.moveTo(-50, y); ctx.lineTo(W + 50, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const ry = lt * 1.5 + [1, 2, 3].reduce((a, k) => a + 1.2 * eOutExpo(clamp((lt - k * BEAT) / 0.4)), 0);
  const rx = 0.45 + 0.25 * Math.sin(lt * 2.2);
  const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
  const pts = [];
  for (let i = 0; i < NP; i++) {
    let p = P3.scatter[i];
    const ent = eOutExpo(clamp((lt - (i / NP) * 0.12) / 0.4));
    let q = P3.sets[0][i];
    for (let k = 1; k < 4; k++) {
      const m = eInOutCubic(clamp((lt - k * BEAT + 0.06 - (i / NP) * 0.1) / 0.3));
      if (m > 0) q = q.map((v, j) => lerp(v, P3.sets[k][i][j], m));
    }
    p = p.map((v, j) => lerp(v, q[j], ent));
    const sc = (1 + 0.14 * kick) * (1 + 9 * eInExpo(exitP));
    let [x, y, z] = p.map(v => v * sc);
    [x, z] = [x * cyr - z * syr, x * syr + z * cyr];
    [y, z] = [y * cxr - z * sxr, y * sxr + z * cxr];
    const f = 4 / (4 + z);
    if (4 + z < 0.3) continue;
    pts.push([CX + x * 290 * f, 760 + y * 290 * f, z, f]);
  }
  pts.sort((a, b) => b[2] - a[2]);
  for (const [x, y, z, f] of pts) {
    const d = clamp((1 - z) / 2);
    ctx.fillStyle = mix(C.blue, C.lime, d);
    ctx.globalAlpha = (0.35 + 0.65 * d) * (1 - exitP * 0.7);
    ctx.beginPath(); ctx.arc(x, y, Math.max(1, 9 * f), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // DEPTH com extrusão girando
  const size = fitSize(ctx, 'DEPTH', 900, 700);
  const ang = lt * 2.2;
  for (let j = 14; j >= 1; j--) {
    const pr = eOutExpo(prog(lt, 0.05, 0.4));
    word(ctx, 'DEPTH', { size, cx: CX + Math.cos(ang) * j * 2.2 * pr, cy: 1335 + Math.sin(ang) * j * 2.2 * pr + 1.8 * j * pr, color: mix(C.blue, C.ink, j / 18) });
  }
  label(ctx, 'DEPTH', lt, C.paper, 1335, 700);
  if (exitP > 0.75) { ctx.fillStyle = alpha(C.paper, (exitP - 0.75) * 3.2); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ cena 5: TRANSITIONS
const PANELS = [
  { w: 'CUT', bg: C.red, fg: C.ink },
  { w: 'WIPE', bg: C.blue, fg: C.paper },
  { w: 'MASK', bg: C.lime, fg: C.ink },
  { w: 'SLICE', bg: C.ink, fg: C.paper },
];
function panel(ctx, k, pt) {
  const P = PANELS[k];
  bg(ctx, P.bg);
  mono(ctx, `TRANSITION 0${k + 1}/04`, CX, CY - 230, P.fg, 38, 'center', 0.8);
  word(ctx, P.w, { fit: 800, cx: CX, cy: CY, color: P.fg, scale: 1 + 0.06 * eOutCubic(clamp(pt / BEAT)) });
}
function scene5(ctx, lt, t) {
  let cur = Math.min(3, Math.floor((lt + 0.12) / BEAT));
  const pts = k => lt - k * BEAT;
  panel(ctx, Math.max(0, cur - 1), pts(Math.max(0, cur - 1)));
  if (cur === 0) panel(ctx, 0, pts(0));
  const p = clamp((lt - (cur * BEAT - 0.12)) / 0.24);
  const e = eInOutCubic(p);
  ctx.save();
  if (cur === 1) {       // WIPE diagonal com borda lime
    const xEdge = lerp(-500, W + 500, e);
    ctx.beginPath(); ctx.moveTo(-500, -100); ctx.lineTo(xEdge + 350, -100); ctx.lineTo(xEdge - 350, H + 100); ctx.lineTo(-500, H + 100); ctx.closePath();
    ctx.save(); ctx.clip(); panel(ctx, 1, pts(1)); ctx.restore();
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.moveTo(xEdge + 350, -100); ctx.lineTo(xEdge + 410, -100); ctx.lineTo(xEdge - 290, H + 100); ctx.lineTo(xEdge - 350, H + 100); ctx.closePath();
    if (p < 1) ctx.fill();
  } else if (cur === 2) { // MASK: íris
    const r = 1450 * e;
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.save(); ctx.clip(); panel(ctx, 2, pts(2)); ctx.restore();
    if (p < 1) { ctx.strokeStyle = C.ink; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke(); }
  } else if (cur === 3) { // SLICE: fatias alternadas
    const n = 10, sh = H / n;
    for (let s = 0; s < n; s++) {
      const q = eOutExpo(clamp((lt - (3 * BEAT - 0.12) - s * 0.012) / 0.26));
      const dx = (1 - q) * W * (s % 2 ? 1 : -1);
      ctx.save(); ctx.beginPath(); ctx.rect(-10, s * sh - 1, W + 20, sh + 2); ctx.clip(); ctx.translate(dx, 0); panel(ctx, 3, pts(3)); ctx.restore();
    }
  } else if (cur === 0) {
    // CUT: flash de inversão por 2 frames
    if (lt < 2 / FPS) { ctx.fillStyle = alpha(C.paper, 0.85 * (1 - lt * FPS / 2)); ctx.fillRect(0, 0, W, H); }
  }
  ctx.restore();
  // saída: PUSH para cima revelando a cena 6
  const xp = eInOutCubic(clamp((lt - (BAR - 0.3)) / 0.3));
  if (xp > 0) return { push: xp };
  return null;
}

// ------------------------------------------------------------------ cena 6: TIMING (bola com squash & stretch + graph editor)
const GROUND = 1075, HMAX = 340, BR = 70;
function ballH(lt) {
  if (lt < -BEAT / 2) return HMAX;
  if (lt > 3 * BEAT) { const d = lt - 3 * BEAT; return HMAX * 4 * (d / BEAT) * (1 - d / BEAT) + Math.max(0, d - BEAT / 2) * 9000 * Math.max(0, d - BEAT / 2); }
  const u = ((lt % BEAT) + BEAT) % BEAT / BEAT;
  return HMAX * 4 * u * (1 - u);
}
function scene6(ctx, lt) {
  bg(ctx, C.paper);
  // título
  const tsz = fitSize(ctx, 'TIMING', 900, 640);
  word(ctx, 'TIMING', { size: tsz, cx: CX, cy: 432, color: C.ink });
  mono(ctx, 'SQUASH & STRETCH  ·  ONION SKIN', CX, 552, C.ink, 32, 'center', 0.6);
  // sombra
  const h = ballH(lt);
  const sw = 150 * (1 - 0.55 * clamp(h / HMAX));
  ctx.fillStyle = alpha(C.ink, 0.18 * (1 - 0.6 * clamp(h / HMAX)));
  ctx.beginPath(); ctx.ellipse(CX, GROUND + 10, Math.max(1, sw), Math.max(1, sw * 0.16), 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(CX - 330, GROUND + 6, 660, 8);
  // onion skin
  for (let j = 6; j >= 1; j--) {
    const hj = ballH(lt - j * 0.03);
    ctx.strokeStyle = alpha(C.ink, 0.32 - j * 0.04); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(CX, GROUND - BR - hj, BR, 0, Math.PI * 2); ctx.stroke();
  }
  // squash & stretch
  const vel = (ballH(lt + 0.004) - ballH(lt - 0.004)) / 0.008;
  const d = Math.min(...[0, 1, 2, 3].map(k => Math.abs(lt - k * BEAT)));
  const sq = Math.exp(-d / 0.028);
  const st = clamp(Math.abs(vel) / 4000) * 0.32 * (1 - sq);
  const sx = (1 + 0.42 * sq) * (1 - st * 0.5), sy = (1 - 0.38 * sq) * (1 + st);
  ctx.fillStyle = C.red;
  ctx.beginPath(); ctx.ellipse(CX, GROUND - BR * sy - h, BR * sx, BR * sy, 0, 0, Math.PI * 2); ctx.fill();
  // graph editor
  const gx = 120, gy = 1170, gw = 820, gh = 280;
  ctx.fillStyle = C.ink; rrect(ctx, gx, gy, gw, gh, 28); ctx.fill();
  ctx.strokeStyle = alpha(C.paper, 0.12); ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(gx + i * gw / 8, gy + 20); ctx.lineTo(gx + i * gw / 8, gy + gh - 20); ctx.stroke(); }
  mono(ctx, 'GRAPH EDITOR · POS.Y', gx + 34, gy + 56, C.paper, 30, 'left', 0.6);
  const T0 = -0.15, T1 = BAR, mapX = tt => gx + 40 + (tt - T0) / (T1 - T0) * (gw - 80), mapY = hh => gy + gh - 40 - clamp(hh / HMAX, 0, 1.4) * (gh - 120);
  ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
  ctx.strokeStyle = C.lime; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) { const tt = lerp(T0, T1, i / 240); const X = mapX(tt), Y = mapY(ballH(tt)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
  ctx.stroke();
  // keyframes (losangos)
  ctx.fillStyle = C.paper;
  for (let k = 0; k < 4; k++) for (const tt of [k * BEAT, k * BEAT + BEAT / 2]) {
    if (tt > T1) continue;
    ctx.save(); ctx.translate(mapX(tt), mapY(ballH(tt))); ctx.rotate(Math.PI / 4); ctx.fillRect(-11, -11, 22, 22); ctx.restore();
  }
  const ph = mapX(clamp(lt, T0, T1));
  ctx.fillStyle = C.red; ctx.fillRect(ph - 3, gy + 20, 6, gh - 40);
  ctx.beginPath(); ctx.arc(ph, mapY(ballH(lt)), 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // saída: painel ink cai do topo (gravidade -> impacto no downbeat)
  const dp = clamp((lt - 3.5 * BEAT) / (0.5 * BEAT));
  if (dp > 0) { const y = -H + H * eInQuad(dp); ctx.fillStyle = C.ink; ctx.fillRect(-50, y - 50, W + 100, H + 50); }
}

// ------------------------------------------------------------------ cena 7: OUTRO + build + íris de loop
function scene7(ctx, lt) {
  bg(ctx, C.ink);
  const build = clamp((lt - 2 * BEAT) / (2 * BEAT));
  const zoom = 1 + 0.22 * eInCubic(build);
  const shake = 10 * eInCubic(build);
  const R = rng(Math.floor(lt * 60) + 3);
  ctx.save();
  ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-CX, -CY);
  ctx.translate((R() - 0.5) * shake, (R() - 0.5) * shake);
  // anéis tracejados acelerando
  const spd = lt * 0.6 + 3.2 * Math.pow(build, 2.5);
  [300, 380, 460].forEach((r, i) => {
    const a = clamp(build * 2.5) * 0.9;
    if (a <= 0) return;
    ctx.save(); ctx.translate(CX, CY - 60); ctx.rotate(spd * (i % 2 ? -1 : 1) * (1 + i * 0.4));
    ctx.strokeStyle = alpha([C.blue, C.lime, C.red][i], a); ctx.lineWidth = 10 - i * 2; ctx.setLineDash([40 + i * 20, 30]);
    ctx.beginPath(); ctx.arc(0, 0, r * (0.8 + 0.2 * eOutExpo(build)), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });
  ctx.setLineDash([]);
  // CLAUDE
  word(ctx, 'CLAUDE', { fit: 820, cx: CX, cy: CY - 150, color: C.paper, letter: i => {
    const p = clamp((lt - 0.015 - i * 0.025) / 0.2);
    const e = eOutExpo(p);
    return { s: lerp(2.6, 1, e), dy: (1 - e) * -120, a: clamp(p * 4), hide: p <= 0 };
  } });
  // MOTION DESIGNER (máscara)
  const mp = eOutExpo(prog(lt, BEAT - 0.02, 0.3));
  if (mp > 0) {
    const sz = fitSize(ctx, 'MOTION DESIGNER', 800, 820);
    ctx.save(); ctx.beginPath(); ctx.rect(CX - 420, CY + 20, 840 * mp, 130); ctx.clip();
    word(ctx, 'MOTION DESIGNER', { w: 800, size: sz, cx: CX, cy: CY + 80, color: C.lime });
    ctx.restore();
    if (mp < 1) { ctx.fillStyle = C.lime; ctx.fillRect(CX - 420 + 840 * mp - 8, CY + 20, 16, 120); }
  }
  // pill 100% CODE
  const pp = prog(lt, 2 * BEAT - 0.02, 0.35);
  if (pp > 0) {
    const s = eOutBack(pp, 3);
    ctx.save(); ctx.translate(CX, CY + 270); ctx.scale(s, s);
    ctx.fillStyle = C.red; rrect(ctx, -250, -62, 500, 124, 62); ctx.fill();
    word(ctx, '100% CODE', { w: 900, size: 72, cx: 0, cy: 0, color: C.paper });
    ctx.restore();
  }
  ctx.restore();
  // íris vermelha -> volta ao frame 0 (fundo vermelho do HOOK)
  const ip = clamp((lt - 3 * BEAT) / (0.84 * BEAT));
  if (ip > 0) {
    const r = 1450 * eInExpo(ip);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(CX, CY, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
  }
}

// ------------------------------------------------------------------ HUD
const NAMES = ['HOOK', 'SHAPE', 'TYPE', 'RHYTHM', 'DEPTH', 'TRANSITIONS', 'TIMING', 'CLAUDE'];
function hudColor(t) {
  const bar = Math.floor(t / BAR), lt = t - bar * BAR;
  if (bar === 5) { const k = Math.min(3, Math.floor((lt + 0.0) / BEAT)); return PANELS[k].fg; }
  return [C.ink, C.paper, C.ink, C.paper, C.paper, C.ink, C.ink, C.paper][bar];
}
function hud(ctx, t) {
  const bar = Math.floor(t / BAR), lt = t - bar * BAR;
  if (bar === 0) return;
  let a = 1;
  if (bar === 1) a = eOutExpo(clamp(lt / 0.3));
  if (bar === 7) a = 1 - clamp((lt - 3 * BEAT) / 0.15);
  if (a <= 0) return;
  const col = hudColor(t);
  mono(ctx, 'CLAUDE / REEL 26', SAFE.l, 312, col, 34, 'left', a);
  mono(ctx, `0${bar}/07 ${NAMES[bar]}`, SAFE.r, 312, col, 34, 'right', a);
  // timecode + metrônomo
  const sec = Math.floor(t), fr = Math.floor((t - sec) * FPS);
  mono(ctx, `00:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, SAFE.l, 1508, col, 34, 'left', a);
  const bi = Math.floor(t / BEAT) % 4;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 4; i++) {
    const x = SAFE.r - 4 * 44 + i * 44 + 6, y = 1480;
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 3;
    if (i === bi) ctx.fillRect(x, y, 30, 30); else ctx.strokeRect(x + 1.5, y + 1.5, 27, 27);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ frame completo
function renderScene(ctx, t) {
  const bar = Math.floor(t / BAR), lt = t - bar * BAR;
  switch (bar) {
    case 0: scene0(ctx, t); break;
    case 1: scene1(ctx, lt); break;
    case 2: scene2(ctx, lt); break;
    case 3: scene3(ctx, lt, t); break;
    case 4: scene4(ctx, lt); break;
    case 5: {
      const r = scene5(ctx, lt, t);
      if (r) { // push: cena 5 sobe, cena 6 entra por baixo
        const y = -H * r.push;
        const off = getOff();
        const o = off.getContext('2d');
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.save(); scene6(o, lt - BAR); o.restore();
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const snap = getOff2(); const s2 = snap.getContext('2d');
        s2.setTransform(1, 0, 0, 1, 0, 0); s2.drawImage(ctx.canvas, 0, 0);
        ctx.drawImage(snap, 0, y); ctx.drawImage(off, 0, y + H);
        ctx.restore();
      }
      break;
    }
    case 6: scene6(ctx, lt); break;
    default: scene7(ctx, lt); break;
  }
}
function scene3(ctx, lt, t) {
  bg(ctx, C.blue);
  const bt = lt % BEAT;
  const enter = eOutExpo(prog(lt, 0, 0.35));
  const kick = Math.exp(-bt / 0.12);
  for (let k = 0; k < 4; k++) {
    const d = lt - k * BEAT; if (d < 0 || d > 0.9) continue;
    const p = d / 0.9;
    ctx.strokeStyle = alpha(C.paper, 0.35 * (1 - p)); ctx.lineWidth = 10 * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(CX, 760, 200 + 700 * eOutCubic(p), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = C.lime; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(CX, 760, (330 + 45 * kick) * enter, 0, Math.PI * 2); ctx.stroke();
  const b = bandsAt(t);
  const n = 16, bw = 36, gp = 14, tot = n * bw + (n - 1) * gp, x0 = CX - tot / 2;
  for (let i = 0; i < n; i++) {
    const v = b[i];
    const h = (30 + 300 * v) * enter;
    ctx.fillStyle = v > 0.78 ? C.lime : C.paper;
    rrect(ctx, x0 + i * (bw + gp), 760 - h, bw, 2 * h, bw / 2); ctx.fill();
  }
  hopLabel(ctx, 'RHYTHM', lt, C.paper);
  const k16 = Math.floor(lt / S16);
  mono(ctx, `128 BPM  ·  4/4  ·  ${String((k16 % 16) + 1).padStart(2, '0')}/16`, CX, 1452, C.paper, 34, 'center', 0.7);
  const ep = eInCubic(clamp((lt - (BAR - 0.36)) / 0.36));
  if (ep > 0) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(CX, 760, 1400 * ep, 0, Math.PI * 2); ctx.fill(); }
}
let _off = null, _off2 = null;
const getOff = () => (_off ||= createCanvas(W, H));
const getOff2 = () => (_off2 ||= createCanvas(W, H));

// pós: pulso no kick, tremor e RGB split nos cortes
const KICKLESS = new Set([30, 31]);
const CUTS = [0, 1, 2, 4, 8, 12, 16, 20, 24, 28]; // tempos (beats) com corte forte
function post(t) {
  const b = Math.floor(t / BEAT), bt = t - b * BEAT;
  const pulse = KICKLESS.has(b) ? 0 : 0.013 * Math.exp(-bt / 0.07);
  let split = 0, shake = 0;
  if (CUTS.includes(b)) { split = (b === 0 ? 8 : 18) * Math.max(0, 1 - bt / 0.1); shake = (b === 0 || b === 28 ? 26 : 12) * Math.exp(-bt / 0.06); }
  return { pulse, split, shake, seed: b };
}
const frameCv = createCanvas(W, H);
// Separação de canais feita no buffer (mais simples e exata)
function splitBuffer(px, dx) {
  const out = new Uint8ClampedArray(px.length);
  for (let y = 0; y < H; y++) {
    const row = y * W * 4;
    for (let x = 0; x < W; x++) {
      const i = row + x * 4;
      const xr = Math.min(W - 1, Math.max(0, x + dx)), xb = Math.min(W - 1, Math.max(0, x - dx));
      out[i] = px[row + xr * 4]; out[i + 1] = px[i + 1]; out[i + 2] = px[row + xb * 4 + 2]; out[i + 3] = 255;
    }
  }
  return out;
}
function frameAt(t) {
  const ctx = frameCv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const P = post(t);
  const R = rng(P.seed * 7 + 1);
  const ang = R() * Math.PI * 2;
  ctx.save();
  ctx.translate(CX, CY); ctx.scale(1 + P.pulse, 1 + P.pulse); ctx.translate(-CX, -CY);
  ctx.translate(Math.cos(ang) * P.shake, Math.sin(ang) * P.shake);
  renderScene(ctx, t);
  ctx.restore();
  hud(ctx, t);
  let px = ctx.getImageData(0, 0, W, H).data;
  if (P.split >= 1) px = splitBuffer(px, Math.round(P.split));
  return px;
}

const ACC = new Uint16Array(W * H * 4);
// motion blur: média de subframes, sem cruzar cortes de tempo
function frame(f) {
  const t = f / FPS;
  const b0 = Math.floor(t / BEAT + 1e-9) * BEAT, b1 = b0 + BEAT;
  const acc = ACC; acc.fill(0);
  for (let s = 0; s < NSUB; s++) {
    let ts = t + (s / (NSUB - 1) - 0.5) * SHUTTER;
    ts = Math.min(Math.max(ts, b0), b1 - 1e-5);
    ts = Math.min(Math.max(ts, 0), 15 - 1e-5);
    const px = frameAt(ts);
    for (let i = 0; i < px.length; i++) acc[i] += px[i];
  }
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < out.length; i++) out[i] = (acc[i] + (NSUB >> 1)) / NSUB;
  return out;
}

// ------------------------------------------------------------------ main
if (args.includes('--png')) {
  const dir = arg('--png'); const list = args[args.indexOf('--png') + 2].split(',').map(Number);
  fs.mkdirSync(dir, { recursive: true });
  const guides = args.includes('--guides');
  for (const f of list) {
    const buf = frame(f);
    const cv = createCanvas(W, H); const c = cv.getContext('2d');
    const id = c.createImageData(W, H); id.data.set(buf); c.putImageData(id, 0, 0);
    if (guides) {
      c.fillStyle = 'rgba(255,0,255,0.28)';
      c.fillRect(0, 0, W, SAFE.t); c.fillRect(0, SAFE.b, W, H - SAFE.b); c.fillRect(SAFE.r, SAFE.t, W - SAFE.r, SAFE.b - SAFE.t);
    }
    fs.writeFileSync(path.join(dir, `f${String(f).padStart(3, '0')}.png`), cv.toBuffer('image/png'));
  }
} else {
  const from = +arg('--from', 0), to = +arg('--to', NF);
  (async () => {
    for (let f = from; f < to; f++) {
      const ok = process.stdout.write(frame(f));
      if (!ok) await new Promise(r => process.stdout.once('drain', r));
      if (f % 60 === 0) process.stderr.write(`frame ${f}\n`);
    }
  })();
}
