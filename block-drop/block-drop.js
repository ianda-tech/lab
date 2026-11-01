// Block Drop: a classic falling-blocks puzzle for The Lab.
// 10×20 well (+2 hidden rows), 7-bag, SRS rotation with wall kicks, hold, ghost, 3-piece preview, lock delay.
(() => {
  "use strict";
  const COLS = 10, ROWS = 22, HIDDEN = 2;
  const el = (id) => document.getElementById(id);
  const cv = el("board"), ctx = cv.getContext("2d"), CELL = cv.width / COLS;
  const holdCv = el("hold"), hctx = holdCv.getContext("2d");
  const nextCv = el("next"), nctx = nextCv.getContext("2d");
  const ov = el("overlay"), pop = el("pop"), well = el("well");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const KEY_BEST = "lab-blockdrop-best", KEY_START = "lab-blockdrop-start";

  // ---------- pieces ----------
  const SHAPES = {
    I: ["....", "IIII", "....", "...."],
    J: ["J..", "JJJ", "..."],
    L: ["..L", "LLL", "..."],
    O: ["OO", "OO"],
    S: [".SS", "SS.", "..."],
    T: [".T.", "TTT", "..."],
    Z: ["ZZ.", ".ZZ", "..."],
  };
  const COLORS = { I: "#5ad8ff", O: "#ffd84a", T: "#b48cff", S: "#7be07b", Z: "#ff6b6b", J: "#5b8cff", L: "#ffa24a", X: "#4a4f70" };
  const TYPES = Object.keys(SHAPES);
  // ROT[type][r] = list of [x, y] cells inside the piece's box, rotated clockwise r times.
  const ROT = {};
  for (const t of TYPES) {
    let m = SHAPES[t].map((row) => row.split(""));
    ROT[t] = [];
    for (let r = 0; r < 4; r++) {
      const cells = [];
      m.forEach((row, y) => row.forEach((ch, x) => { if (ch !== ".") cells.push([x, y]); }));
      ROT[t].push(cells);
      const n = m.length;
      m = m.map((row, y) => row.map((_, x) => m[n - 1 - x][y]));
    }
  }
  // SRS kick tables, written y-up as in the guideline; converted to y-down when used.
  const K_JLSTZ = {
    "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const K_I = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  // ---------- state ----------
  const S = {
    state: "menu", grid: [], bag: [], queue: [], cur: null, hold: null, canHold: true,
    score: 0, lines: 0, level: 1, startLevel: store.get(KEY_START, 1), combo: -1, b2b: false,
    fallAcc: 0, lockT: 0, resets: 0, lowest: 0, soft: false, lastRotate: false, kickUsed: 0,
    clearing: null, clearT: 0, overT: 0, pieces: 0, stats: { single: 0, double: 0, triple: 0, quad: 0, tspin: 0, maxCombo: 0 },
  };
  let best = store.get(KEY_BEST, 0);
  const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  function refillBag() {
    const b = TYPES.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    S.queue.push(...b);
  }
  function takeNext() { while (S.queue.length < 8) refillBag(); return S.queue.shift(); }
  const cellsOf = (p, r = p.r, x = p.x, y = p.y) => ROT[p.t][r].map(([cx, cy]) => [x + cx, y + cy]);
  function fits(p, r = p.r, x = p.x, y = p.y) {
    for (const [cx, cy] of cellsOf(p, r, x, y)) {
      if (cx < 0 || cx >= COLS || cy >= ROWS) return false;
      if (cy >= 0 && S.grid[cy][cx]) return false;
    }
    return true;
  }
  function spawn(t) {
    const p = { t, r: 0, x: t === "O" ? 4 : 3, y: t === "I" ? -1 : 0 };
    if (!fits(p)) return gameOver();
    S.cur = p; S.fallAcc = 0; S.lockT = 0; S.resets = 0; S.lastRotate = false;
    if (fits(p, p.r, p.x, p.y + 1)) p.y++; // guideline: drop one row straight away so it shows at the top
    S.lowest = p.y;
    draw();
  }
  const fallMs = () => 1000 * Math.pow(Math.max(0.0001, 0.8 - (S.level - 1) * 0.007), S.level - 1);
  const grounded = () => S.cur && !fits(S.cur, S.cur.r, S.cur.x, S.cur.y + 1);

  // ---------- sounds (shared Lab kit) ----------
  const snd = {
    move: () => tone(330, 0.03, "square", 0.025),
    rotate: () => tone(560, 0.045, "triangle", 0.05, 640),
    nokick: () => tone(160, 0.05, "square", 0.03),
    lock: () => tone(170, 0.06, "triangle", 0.09),
    hard: () => { hiss(0.07, 0.18); tone(150, 0.12, "sine", 0.16, 60); },
    hold: () => sfx.snap(),
    clear: (n) => (n >= 4 ? sfx.yay() : n > 1 ? sfx.ding() : sfx.pop()),
    tspin: () => sfx.good(),
    level: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, "triangle", 0.12), i * 80)),
    over: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.24, "triangle", 0.15), i * 170)),
  };

  // ---------- moves ----------
  function afterMove() {
    S.lastRotate = false;
    lockReset();
  }
  function lockReset() {
    if (S.cur.y > S.lowest) { S.lowest = S.cur.y; S.resets = 0; }
    if (grounded() || S.lockT > 0) { if (S.resets < 15) { S.lockT = 0; S.resets++; } }
  }
  function shift(dx) {
    if (S.state !== "play" || !S.cur) return false;
    if (!fits(S.cur, S.cur.r, S.cur.x + dx, S.cur.y)) return false;
    S.cur.x += dx; snd.move(); afterMove(); return true;
  }
  function rotate(dir) {
    if (S.state !== "play" || !S.cur || S.cur.t === "O") { if (S.cur && S.cur.t === "O" && S.state === "play") snd.rotate(); return false; }
    const p = S.cur, from = p.r, to = (p.r + dir + 4) % 4;
    const kicks = (p.t === "I" ? K_I : K_JLSTZ)[from + ">" + to];
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      if (fits(p, to, p.x + kx, p.y - ky)) {
        p.x += kx; p.y -= ky; p.r = to; S.kickUsed = i;
        snd.rotate(); lockReset(); S.lastRotate = true; return true;
      }
    }
    snd.nokick(); return false;
  }
  function softStep() {
    if (S.state !== "play" || !S.cur) return false;
    if (fits(S.cur, S.cur.r, S.cur.x, S.cur.y + 1)) { S.cur.y++; S.score += 1; S.lastRotate = false; if (S.cur.y > S.lowest) { S.lowest = S.cur.y; S.resets = 0; } hud(); return true; }
    return false;
  }
  function hardDrop() {
    if (S.state !== "play" || !S.cur) return;
    let n = 0;
    while (fits(S.cur, S.cur.r, S.cur.x, S.cur.y + 1)) { S.cur.y++; n++; }
    if (n) S.lastRotate = false;
    S.score += 2 * n; S.dropFx = { cells: cellsOf(S.cur), t: 160, n };
    snd.hard(); lock();
  }
  function doHold() {
    if (S.state !== "play" || !S.cur || !S.canHold) return;
    const t = S.cur.t;
    S.canHold = false; snd.hold();
    if (S.hold) { const h = S.hold; S.hold = t; spawn(h); }
    else { S.hold = t; spawn(takeNext()); }
    drawSide();
  }

  // ---------- locking, clears, scoring ----------
  function isTSpin() {
    const p = S.cur;
    if (p.t !== "T" || !S.lastRotate) return false;
    const cx = p.x + 1, cy = p.y + 1;
    const filled = (x, y) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && S.grid[y][x]);
    return [[-1, -1], [1, -1], [-1, 1], [1, 1]].filter(([dx, dy]) => filled(cx + dx, cy + dy)).length >= 3;
  }
  function lock() {
    const p = S.cur, cells = cellsOf(p);
    const tspin = isTSpin();
    for (const [x, y] of cells) if (y >= 0) S.grid[y][x] = p.t;
    S.cur = null; S.pieces++;
    if (cells.every(([, y]) => y < HIDDEN)) return gameOver(); // locked out above the well
    snd.lock();
    const full = [];
    for (let y = 0; y < ROWS; y++) if (S.grid[y].every(Boolean)) full.push(y);
    score(full.length, tspin);
    S.canHold = true;
    if (full.length) { S.clearing = full; S.clearT = 0; S.state = "clearing"; }
    else spawn(takeNext());
    hud(); drawSide();
  }
  function score(n, tspin) {
    const lv = S.level;
    let pts = 0, label = "", sub = [];
    const difficult = n === 4 || (tspin && n > 0);
    if (tspin) { pts = [400, 800, 1200, 1600][n] * lv; label = ["T-Spin", "T-Spin Single", "T-Spin Double", "T-Spin Triple"][n]; S.stats.tspin++; snd.tspin(); }
    else if (n) { pts = [0, 100, 300, 500, 800][n] * lv; label = ["", "Single", "Double", "Triple", "Quad!"][n]; }
    if (n) {
      S.stats[["", "single", "double", "triple", "quad"][n]]++;
      if (difficult && S.b2b) { pts = Math.floor(pts * 1.5); sub.push("Back-to-back ×1.5"); }
      S.b2b = difficult ? true : false;
      S.combo++;
      if (S.combo > 0) { pts += 50 * S.combo * lv; sub.push(`Combo ×${S.combo}`); S.stats.maxCombo = Math.max(S.stats.maxCombo, S.combo); }
      snd.clear(n);
      // all clear: every row empty once these lines go
      const rest = S.grid.filter((row, y) => !row.every(Boolean));
      if (rest.every((row) => row.every((c) => !c))) { pts += [0, 800, 1200, 1800, 2000][n] * lv; sub.push("All clear!"); }
      const before = S.level;
      S.lines += n;
      S.level = S.startLevel + Math.floor(S.lines / 10);
      if (S.level > before) { sub.push(`Level ${S.level}!`); setTimeout(snd.level, 250); }
    } else S.combo = -1;
    S.score += pts;
    if (label) flashPop(label, sub.join(" · "), pts);
    else if (sub.length) flashPop(sub[0], "", 0);
  }
  let popT = null;
  function flashPop(label, sub, pts) {
    pop.innerHTML = `${label}${pts ? ` +${pts}` : ""}${sub ? `<small>${sub}</small>` : ""}`;
    pop.classList.add("show");
    clearTimeout(popT); popT = setTimeout(() => pop.classList.remove("show"), 1100);
  }
  function finishClear() {
    const rows = new Set(S.clearing);
    S.grid = S.grid.filter((_, y) => !rows.has(y));
    while (S.grid.length < ROWS) S.grid.unshift(Array(COLS).fill(0));
    S.clearing = null; S.state = "play";
    spawn(takeNext());
  }

  // ---------- game flow ----------
  function newGame() {
    S.grid = emptyGrid(); S.queue = []; S.hold = null; S.canHold = true;
    S.score = 0; S.lines = 0; S.level = S.startLevel; S.combo = -1; S.b2b = false; S.pieces = 0;
    S.stats = { single: 0, double: 0, triple: 0, quad: 0, tspin: 0, maxCombo: 0 };
    hide(); S.state = "play"; held.clear(); S.soft = false;
    spawn(takeNext()); hud(); drawSide();
    sfx.tap();
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  function gameOver() {
    S.state = "dying"; S.overT = 0; S.cur = null;
    const newBest = S.score > best;
    if (newBest) { best = S.score; store.set(KEY_BEST, best); }
    snd.over(); hud();
    setTimeout(() => {
      S.state = "over";
      show(`<div class="big">🧱</div><h2>Game over</h2>
        ${newBest && S.score > 0 ? `<span class="badge">New best!</span>` : ""}
        <div class="stat-row"><div><b>${S.score}</b><small>score</small></div><div><b>${S.lines}</b><small>lines</small></div><div><b>${S.level}</b><small>level</small></div></div>
        <p>${plural(S.pieces, "piece")} · ${plural(S.stats.quad, "quad")} · ${plural(S.stats.tspin, "T-spin")} · best combo ${Math.max(0, S.stats.maxCombo)}</p>
        <p>Best score <b>${best}</b></p>
        <div class="btns"><button class="btn" data-act="play">Play again</button><button class="btn alt" data-act="menu">Menu</button></div>
        <p>Enter to play again.</p>`);
    }, 900);
  }
  function pause() {
    if (S.state === "play" || S.state === "clearing") {
      S.prev = S.state; S.state = "paused"; held.clear(); S.soft = false;
      show(`<div class="big">⏸</div><h2>Paused</h2><p>Score ${S.score} · Lines ${S.lines} · Level ${S.level}</p>
        <div class="btns"><button class="btn" data-act="resume">Resume</button><button class="btn alt" data-act="play">Restart</button><button class="btn alt" data-act="menu">Menu</button></div>
        <p>P or Esc to resume.</p>`);
    } else if (S.state === "paused") { hide(); S.state = S.prev || "play"; lastT = performance.now(); }
  }
  function menu() {
    S.state = "menu"; S.cur = null;
    if (!S.grid.length) S.grid = emptyGrid();
    const lv = [1, 5, 10, 15].map((n) => `<button data-act="start" data-n="${n}" class="${S.startLevel === n ? "on" : ""}">${n}</button>`).join("");
    show(`<h2>Block <span>Drop</span></h2>
      <p>A classic falling-blocks puzzle. Fill rows to clear them. It speeds up every 10 lines.</p>
      <div class="start-lv">Start at level ${lv}</div>
      <div class="btns"><button class="btn" data-act="play">Play ▶</button></div>
      <table><tr><td>← → / A D</td><td>move</td></tr><tr><td>↑ / X</td><td>rotate right</td></tr><tr><td>Z</td><td>rotate left</td></tr><tr><td>↓ / S</td><td>soft drop</td></tr><tr><td>Space</td><td>hard drop</td></tr><tr><td>C / Shift</td><td>hold</td></tr><tr class="touch"><td>Touch</td><td>tap to rotate, swipe to move, flick up to drop</td></tr></table>
      <p>Best score <b>${best}</b></p>`);
    hud(); drawSide(); draw();
  }
  function show(html) { ov.innerHTML = html; ov.classList.add("show"); }
  function hide() { ov.classList.remove("show"); ov.innerHTML = ""; }
  ov.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "play") newGame();
    else if (a === "resume") pause();
    else if (a === "menu") { sfx.tap(); menu(); }
    else if (a === "start") { S.startLevel = +b.dataset.n; store.set(KEY_START, S.startLevel); sfx.tap(); menu(); }
  });
  ov.addEventListener("pointerdown", (e) => e.stopPropagation());

  // ---------- HUD ----------
  function hud() {
    el("score").textContent = S.score;
    el("best").textContent = "Best " + Math.max(best, S.score);
    el("level").textContent = S.level;
    el("lines").textContent = S.lines;
    el("combo").textContent = S.combo > 0 ? "×" + S.combo : "–";
    el("sub").textContent = S.state === "menu" ? "Falling blocks" : `Level ${S.level} · ${S.lines} lines`;
  }

  // ---------- input: keyboard, pad, touch ----------
  // held: direction holds for auto-repeat (DAS 160ms, ARR 40ms). Keyed by source so keys and pad don't fight.
  const DAS = 160, ARR = 40, SOFT_MS = 30;
  const held = new Map(); // source -> {dir, t, rep}
  let softSources = new Set();
  function press(src, dir) { held.delete(src); held.set(src, { dir, t: 0, rep: 0 }); shift(dir); }
  function release(src) { held.delete(src); }
  function softOn(src) { softSources.add(src); S.soft = true; if (S.state === "play") { softStep(); S.fallAcc = 0; } }
  function softOff(src) { softSources.delete(src); S.soft = softSources.size > 0; }
  const startish = () => { if (S.state === "menu" || S.state === "over") { newGame(); return true; } if (S.state === "paused") { pause(); return true; } return false; };

  addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const game = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "a", "d", "s", "w", "x", "z", "c", "Shift"].includes(k);
    if (game) e.preventDefault();
    if (k === "p" || k === "Escape") { e.preventDefault(); if (S.state === "play" || S.state === "clearing" || S.state === "paused") pause(); return; }
    if (k === "Enter") { if (!(e.target.closest && e.target.closest("button"))) { e.preventDefault(); startish(); } return; }
    if (S.state !== "play" && S.state !== "clearing") { if (k === " " && S.state !== "over") startish(); return; }
    if (e.repeat) return;
    if (k === "ArrowLeft" || k === "a") press("kL", -1);
    else if (k === "ArrowRight" || k === "d") press("kR", 1);
    else if (k === "ArrowDown" || k === "s") softOn("key");
    else if (k === "ArrowUp" || k === "w" || k === "x") rotate(1);
    else if (k === "z") rotate(-1);
    else if (k === " ") hardDrop();
    else if (k === "c" || k === "Shift") doHold();
  });
  addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "ArrowLeft" || k === "a") release("kL");
    else if (k === "ArrowRight" || k === "d") release("kR");
    else if (k === "ArrowDown" || k === "s") softOff("key");
  });
  addEventListener("blur", () => { held.clear(); softSources.clear(); S.soft = false; if (S.state === "play" || S.state === "clearing") pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && (S.state === "play" || S.state === "clearing")) pause(); });
  el("pause-btn").addEventListener("click", (e) => { e.currentTarget.blur(); if (S.state === "menu" || S.state === "over") return; pause(); });

  document.querySelectorAll(".pad button").forEach((b) => {
    const act = b.dataset.b;
    const down = (e) => {
      e.preventDefault(); b.classList.add("down");
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
      if (S.state === "over" || S.state === "dying") return;
      if (startish()) return;
      if (act === "left") press("pL", -1);
      else if (act === "right") press("pR", 1);
      else if (act === "soft") softOn("pad");
      else if (act === "cw") rotate(1);
      else if (act === "ccw") rotate(-1);
      else if (act === "hard") hardDrop();
      else if (act === "hold") doHold();
    };
    const up = () => { b.classList.remove("down"); if (act === "left") release("pL"); if (act === "right") release("pR"); if (act === "soft") softOff("pad"); };
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });

  // Touch gestures on the well: tap = rotate, drag sideways = move cell by cell, drag down = soft drop, swipe up / fast flick down = hard drop.
  let g = null;
  well.addEventListener("pointerdown", (e) => {
    if (S.state !== "play" && S.state !== "clearing") return;
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ax: e.clientX, ay: e.clientY, t0: performance.now(), moved: false, axis: null, hist: [[e.clientX, e.clientY, performance.now()]] };
    try { well.setPointerCapture(e.pointerId); } catch (_) {}
  });
  well.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const cell = well.clientWidth / COLS;
    const tx = e.clientX - g.x0, ty = e.clientY - g.y0;
    g.hist.push([e.clientX, e.clientY, performance.now()]); if (g.hist.length > 6) g.hist.shift();
    if (!g.axis && Math.hypot(tx, ty) > 10) g.axis = Math.abs(tx) > Math.abs(ty) ? "x" : "y";
    if (g.axis === "x") {
      while (e.clientX - g.ax >= cell) { g.ax += cell; shift(1); g.moved = true; }
      while (e.clientX - g.ax <= -cell) { g.ax -= cell; shift(-1); g.moved = true; }
    } else if (g.axis === "y") {
      while (e.clientY - g.ay >= cell) { g.ay += cell; softStep(); g.moved = true; }
    }
  });
  const endG = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dt = performance.now() - g.t0, tx = e.clientX - g.x0, ty = e.clientY - g.y0;
    const h = g.hist, [hx, hy, ht] = h[0];
    const vy = (e.clientY - hy) / Math.max(1, performance.now() - ht); // px per ms over the last few moves
    if (!g.axis && dt < 350 && Math.hypot(tx, ty) < 12) rotate(e.clientX < well.getBoundingClientRect().left + well.clientWidth * 0.25 ? -1 : 1);
    else if (g.axis === "y" && ty < -40) hardDrop();
    else if (g.axis === "y" && ty > 40 && vy > 1.1) hardDrop();
    g = null;
  };
  well.addEventListener("pointerup", endG);
  well.addEventListener("pointercancel", (e) => { g = null; });

  // ---------- drawing ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  function block(c, x, y, s, col, alpha = 1) {
    c.globalAlpha = alpha;
    c.fillStyle = col; rr(c, x + 1, y + 1, s - 2, s - 2, s * 0.2); c.fill();
    c.fillStyle = "rgba(255,255,255,.28)"; rr(c, x + s * 0.16, y + s * 0.12, s * 0.68, s * 0.2, s * 0.1); c.fill();
    c.fillStyle = "rgba(0,0,0,.16)"; rr(c, x + s * 0.12, y + s * 0.72, s * 0.76, s * 0.14, s * 0.07); c.fill();
    c.globalAlpha = 1;
  }
  function ghostY() { let y = S.cur.y; while (fits(S.cur, S.cur.r, S.cur.x, y + 1)) y++; return y; }
  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#191b2e"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#22253c"; ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, cv.height); ctx.stroke(); }
    for (let y = 1; y < ROWS - HIDDEN; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(cv.width, y * CELL + 0.5); ctx.stroke(); }
    const dying = S.state === "dying" || S.state === "over";
    const greyRows = dying ? Math.floor(Math.min(1, S.overT / 700) * ROWS) : 0;
    for (let y = HIDDEN; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const t = S.grid[y] && S.grid[y][x]; if (!t) continue;
      const grey = dying && y >= ROWS - greyRows;
      block(ctx, x * CELL, (y - HIDDEN) * CELL, CELL, grey ? COLORS.X : COLORS[t]);
    }
    if (S.clearing) {
      const k = Math.min(1, S.clearT / CLEAR_MS);
      for (const y of S.clearing) {
        ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - k * 0.6)})`;
        const w = cv.width * (1 - k);
        ctx.fillRect((cv.width - w) / 2, (y - HIDDEN) * CELL + 2, w, CELL - 4);
      }
    }
    if (S.cur && (S.state === "play" || S.state === "paused")) {
      const gy = ghostY();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cv.width, cv.height); ctx.clip();
      for (const [x, y] of cellsOf(S.cur, S.cur.r, S.cur.x, gy)) {
        if (y < HIDDEN) continue;
        ctx.strokeStyle = COLORS[S.cur.t]; ctx.globalAlpha = 0.55; ctx.lineWidth = 2.5;
        rr(ctx, x * CELL + 3, (y - HIDDEN) * CELL + 3, CELL - 6, CELL - 6, CELL * 0.18); ctx.stroke();
        ctx.globalAlpha = 0.1; ctx.fillStyle = COLORS[S.cur.t]; ctx.fill(); ctx.globalAlpha = 1;
      }
      // lock-delay hint: the falling piece dims slightly as its lock timer runs out
      const lockFade = grounded() ? 1 - 0.35 * Math.min(1, S.lockT / LOCK_MS) : 1;
      for (const [x, y] of cellsOf(S.cur)) if (y >= HIDDEN) block(ctx, x * CELL, (y - HIDDEN) * CELL, CELL, COLORS[S.cur.t], lockFade);
      ctx.restore();
    }
    if (S.dropFx && S.dropFx.t > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.18 * S.dropFx.t / 160})`;
      for (const [x, y] of S.dropFx.cells) if (y >= HIDDEN) ctx.fillRect(x * CELL + 4, Math.max(0, (y - HIDDEN - S.dropFx.n) * CELL), CELL - 8, S.dropFx.n * CELL);
    }
  }
  function drawPiece(c, t, cx, cy, s, alpha = 1) {
    const cells = ROT[t][0];
    const xs = cells.map(([x]) => x), ys = cells.map(([, y]) => y);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    const ox = cx - (w * s) / 2 - Math.min(...xs) * s, oy = cy - (h * s) / 2 - Math.min(...ys) * s;
    for (const [x, y] of cells) block(c, ox + x * s, oy + y * s, s, COLORS[t], alpha);
  }
  function drawSide() {
    hctx.clearRect(0, 0, holdCv.width, holdCv.height);
    if (S.hold) drawPiece(hctx, S.hold, holdCv.width / 2, holdCv.height / 2, 24, S.canHold ? 1 : 0.35);
    nctx.clearRect(0, 0, nextCv.width, nextCv.height);
    if (S.state === "menu") return;
    S.queue.slice(0, 3).forEach((t, i) => drawPiece(nctx, t, nextCv.width / 2, 40 + i * 80, i === 0 ? 26 : 22, i === 0 ? 1 : 0.8));
  }

  // ---------- loop ----------
  const LOCK_MS = 500, CLEAR_MS = 220;
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - lastT); lastT = now;
    if (S.state === "play" && S.cur) {
      // auto-repeat for the most recent held direction
      const last = [...held.values()].pop();
      if (last) {
        last.t += dt;
        if (last.t >= DAS) { last.rep += dt; while (last.rep >= ARR) { last.rep -= ARR; if (!shift(last.dir)) { last.rep = 0; break; } } }
      }
      const iv = S.soft ? Math.min(SOFT_MS, fallMs()) : fallMs();
      S.fallAcc += dt;
      let guard = 0;
      while (S.fallAcc >= iv && guard++ < ROWS) {
        S.fallAcc -= iv;
        if (S.cur && fits(S.cur, S.cur.r, S.cur.x, S.cur.y + 1)) {
          S.cur.y++; S.lastRotate = false; if (S.soft) S.score += 1;
          if (S.cur.y > S.lowest) { S.lowest = S.cur.y; S.resets = 0; S.lockT = 0; }
        } else { S.fallAcc = 0; break; }
      }
      if (S.cur && grounded()) {
        S.lockT += dt;
        if (S.lockT >= LOCK_MS || S.resets >= 15) lock();
      } else if (S.cur) S.lockT = 0;
      if (S.soft) hud();
    } else if (S.state === "clearing") {
      S.clearT += dt;
      if (S.clearT >= CLEAR_MS) finishClear();
    } else if (S.state === "dying") S.overT += dt;
    if (S.dropFx) S.dropFx.t -= dt;
    draw();
    requestAnimationFrame(frame);
  }

  // Test hook so automated checks can drive the game.
  window.blockDrop = { S, ROT, fits, cellsOf, shift, rotate, hardDrop, doHold, softStep, newGame, menu, pause, get best() { return best; } };
  S.grid = emptyGrid();
  menu();
  requestAnimationFrame(frame);
})();
