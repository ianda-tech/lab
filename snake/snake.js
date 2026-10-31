// Snake 2: ten levels, obstacles, portals, power-ups and lives.
(() => {
  "use strict";
  const { N, list: LEVELS } = window.SNAKE_LEVELS;
  const cv = document.getElementById("board"), ctx = cv.getContext("2d");
  const C = cv.width / N;
  const el = (id) => document.getElementById(id);
  const ov = el("overlay");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const KEY_UNLOCK = "lab-snake2-unlocked", KEY_BEST = "lab-snake2-best", KEY_LVBEST = "lab-snake2-level-best";
  let unlocked = Math.max(1, Math.min(LEVELS.length, store.get(KEY_UNLOCK, 1)));
  let best = store.get(KEY_BEST, 0);
  let levelBest = store.get(KEY_LVBEST, {});

  const POWERS = {
    slow:   { e: "🐢", n: "Slow-mo", c: "#6fd3ff", ms: 6000, w: 3 },
    fast:   { e: "⚡", n: "Boost", c: "#ffd84a", ms: 5000, w: 2 },
    shrink: { e: "✂️", n: "Shrink", c: "#ff9ad5", ms: 0, w: 2 },
    mult:   { e: "✖️", n: "Double points", c: "#b48cff", ms: 10000, w: 3, label: "×2" },
    ghost:  { e: "👻", n: "Ghost", c: "#e8f0ff", ms: 6000, w: 2 },
    life:   { e: "❤️", n: "Extra life", c: "#ff6b6b", ms: 0, w: 1 },
  };
  const MAX_LIVES = 5, START_LIVES = 3, POWER_LIFE = 8000;

  // ---------- game state ----------
  const G = { state: "menu", lvl: 0, score: 0, lives: START_LIVES, eaten: 0, snake: [], dir: [1, 0], queue: [], grow: 0,
    food: null, power: null, powerIn: 5000, fx: {}, invuln: 0, walls: new Set(), movers: [], portals: [], lanes: new Set(),
    acc: 0, oacc: 0, otick: 0, countdown: 0, flash: 0, particles: [], levelScore: 0, t: 0 };
  const key = (x, y) => x + "," + y;
  const L = () => LEVELS[G.lvl];

  function loadLevel(i) {
    G.lvl = i;
    const lv = L();
    G.walls = new Set((lv.walls || []).map(([x, y]) => key(x, y)));
    G.movers = (lv.movers || []).map((m) => ({ ...m }));
    G.portals = (lv.portals || []).map((p) => ({ ...p }));
    G.lanes = new Set();
    for (const m of G.movers) for (let p = m.min; p <= m.max; p++) G.lanes.add(m.axis === "x" ? key(p, m.fixed) : key(m.fixed, p));
    G.eaten = 0; G.levelScore = 0; G.fx = {}; G.power = null; G.powerIn = 4000 + Math.random() * 3000;
    G.particles = []; G.otick = 0;
    resetSnake();
    G.food = freeCell();
    hud();
  }
  function resetSnake() {
    const [x, y, dx, dy] = L().start;
    G.snake = [0, 1, 2, 3].map((k) => [x - dx * k, y - dy * k]);
    G.dir = [dx, dy]; G.queue = []; G.grow = 0; G.acc = 0;
  }
  function moverCells() {
    const s = new Set();
    for (const m of G.movers) for (let i = 0; i < m.len; i++) s.add(m.axis === "x" ? key(m.pos + i, m.fixed) : key(m.fixed, m.pos + i));
    return s;
  }
  const portalAt = (x, y) => { for (const p of G.portals) { if (p.a[0] === x && p.a[1] === y) return p.b; if (p.b[0] === x && p.b[1] === y) return p.a; } return null; };
  function freeCell() {
    const taken = new Set([...G.walls, ...G.lanes, ...G.snake.map(([x, y]) => key(x, y))]);
    for (const p of G.portals) { taken.add(key(...p.a)); taken.add(key(...p.b)); }
    if (G.food) taken.add(key(...G.food));
    if (G.power) taken.add(key(G.power.x, G.power.y));
    const [hx, hy] = G.snake[0];
    const free = [];
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!taken.has(key(x, y)) && Math.abs(x - hx) + Math.abs(y - hy) > 2) free.push([x, y]);
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }
  const ghosty = () => G.fx.ghost > 0 || G.invuln > 0;
  function interval() {
    let ms = Math.max(68, 150 - G.lvl * 6 - G.eaten * 2);
    if (G.fx.slow > 0) ms *= 1.7;
    if (G.fx.fast > 0) ms *= 0.6;
    return ms;
  }

  // ---------- sound (shared Lab kit) ----------
  const snd = {
    eat: () => { tone(620, 0.06, "square", 0.07); setTimeout(() => tone(880, 0.06, "square", 0.06), 50); },
    power: () => sfx.good(),
    portal: () => tone(300, 0.25, "sine", 0.15, 700),
    crash: () => { sfx.nope(); hiss(0.18, 0.25); },
    clear: () => sfx.yay(),
    over: () => [440, 349, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.22, "triangle", 0.16), i * 160)),
    tick: () => tone(500, 0.05, "square", 0.05),
    go: () => tone(880, 0.12, "square", 0.07),
    life: () => sfx.ding(),
  };

  // ---------- step ----------
  function step() {
    if (G.queue.length) G.dir = G.queue.shift();
    let [x, y] = G.snake[0];
    x += G.dir[0]; y += G.dir[1];
    const wrapping = L().wrap || ghosty();
    const out = () => x < 0 || y < 0 || x >= N || y >= N;
    const wrap = () => { x = (x + N) % N; y = (y + N) % N; };
    if (out()) { if (wrapping) wrap(); else return crash(); }
    const pt = portalAt(x, y);
    if (pt) { x = pt[0] + G.dir[0]; y = pt[1] + G.dir[1]; snd.portal(); burst(pt[0], pt[1], "#9fdcff", 8); if (out()) { if (wrapping) wrap(); else return crash(); } }
    const k = key(x, y);
    const body = G.snake.slice(0, G.grow > 0 ? G.snake.length : G.snake.length - 1);
    const hitSelf = body.some(([a, b]) => a === x && b === y);
    if ((G.walls.has(k) || moverCells().has(k) || hitSelf) && !ghosty()) return crash();
    G.snake.unshift([x, y]);
    if (G.grow > 0) G.grow--; else G.snake.pop();

    if (G.food && x === G.food[0] && y === G.food[1]) {
      const pts = 10 * (G.fx.mult > 0 ? 2 : 1);
      addScore(pts); G.eaten++; G.grow += 2; snd.eat(); burst(x, y, "#ff7b3a", 12);
      if (G.eaten >= L().goal) return levelClear();
      G.food = freeCell();
    }
    if (G.power && x === G.power.x && y === G.power.y) takePower(G.power.type);
    hud();
  }
  function moveObstacles() {
    G.otick++;
    for (const m of G.movers) {
      if (G.otick % m.every) continue;
      const hi = m.max - m.len + 1;
      if (m.pos + m.sgn > hi || m.pos + m.sgn < m.min) m.sgn *= -1;
      m.pos += m.sgn;
    }
    if (!ghosty() && moverCells().has(key(...G.snake[0]))) crash();
  }
  function addScore(n) { G.score += n; G.levelScore += n; }
  function takePower(t) {
    const p = POWERS[t];
    G.power = null; G.powerIn = 7000 + Math.random() * 6000;
    burst(G.snake[0][0], G.snake[0][1], p.c, 16);
    if (t === "shrink") { const cut = Math.min(3, G.snake.length - 3); G.snake.splice(G.snake.length - cut, cut); G.grow = 0; addScore(5); }
    else if (t === "life") { G.lives = Math.min(MAX_LIVES, G.lives + 1); snd.life(); }
    else { if (t === "slow") G.fx.fast = 0; if (t === "fast") G.fx.slow = 0; G.fx[t] = p.ms; }
    if (t !== "life") snd.power();
    toast(`${p.label || p.e} ${p.n}!`);
    hud();
  }
  function spawnPower() {
    const pool = Object.entries(POWERS).filter(([t]) => t !== "life" || G.lives < MAX_LIVES);
    let r = Math.random() * pool.reduce((s, [, p]) => s + p.w, 0), type = pool[0][0];
    for (const [t, p] of pool) { r -= p.w; if (r <= 0) { type = t; break; } }
    const c = freeCell(); if (!c) return;
    G.power = { type, x: c[0], y: c[1], life: POWER_LIFE };
  }
  function crash() {
    snd.crash(); G.lives--; G.flash = 1; G.fx = {};
    const [hx, hy] = G.snake[0]; burst(hx, hy, "#ff5a5a", 20);
    hud();
    if (G.lives <= 0) { G.state = "dead"; setTimeout(gameOver, 700); return; }
    G.state = "dead";
    setTimeout(() => { resetSnake(); G.invuln = 1800; G.state = "count"; G.countdown = 3000; G.lastCount = 4; toast(`${G.lives} ${G.lives === 1 ? "life" : "lives"} left`); }, 700);
  }
  function levelClear() {
    G.state = "clear";
    const bonus = G.lives * 25 + (G.lvl + 1) * 20;
    addScore(bonus);
    const n = G.lvl + 1;
    if (n < LEVELS.length && unlocked < n + 1) { unlocked = n + 1; store.set(KEY_UNLOCK, unlocked); }
    if (n === LEVELS.length) store.set(KEY_UNLOCK, LEVELS.length);
    levelBest[n] = Math.max(levelBest[n] || 0, G.levelScore); store.set(KEY_LVBEST, levelBest);
    saveBest(); snd.clear(); hud();
    const last = n === LEVELS.length;
    setTimeout(() => show(`
      <div class="big">${last ? "🏆" : "⭐"}</div>
      <h2>${last ? "You beat Snake 2!" : `Level ${n} clear!`}</h2>
      <p>${L().name} done. Bonus <b>+${bonus}</b> (${G.lives} ${G.lives === 1 ? "life" : "lives"} left). Score <b>${G.score}</b>.</p>
      <div class="btns">${last ? `<button class="btn" data-act="menu">Level select</button>` : `<button class="btn" data-act="next">Level ${n + 1} ➜</button><button class="btn alt" data-act="menu">Levels</button>`}</div>
      <p>${last ? "Every level cleared. Legend." : "Space for the next level."}</p>`), 500);
  }
  function gameOver() {
    G.state = "over"; snd.over(); saveBest();
    show(`<div class="big">💥</div><h2>Game over</h2>
      <p>You reached level ${G.lvl + 1}, <b>${L().name}</b>, with ${G.eaten}/${L().goal} apples. Score <b>${G.score}</b>. Best <b>${best}</b>.</p>
      <div class="btns"><button class="btn" data-act="retry">Try level ${G.lvl + 1} again</button><button class="btn alt" data-act="menu">Levels</button></div>
      <p>Space to retry.</p>`);
  }
  function saveBest() { if (G.score > best) { best = G.score; store.set(KEY_BEST, best); } hud(); }

  // ---------- screens ----------
  function show(html, light = false) { ov.innerHTML = html; ov.classList.add("show"); ov.classList.toggle("light", light); }
  function hide() { ov.classList.remove("show"); ov.innerHTML = ""; }
  function menu() {
    G.state = "menu"; loadLevel(Math.min(unlocked, LEVELS.length) - 1);
    const btns = LEVELS.map((lv, i) => {
      const n = i + 1, open = n <= unlocked, done = n < unlocked || (n === LEVELS.length && levelBest[n]);
      return `<button data-act="level" data-n="${i}" class="${done ? "done" : ""}" ${open ? "" : "disabled"} aria-label="Level ${n} ${lv.name}${open ? "" : " locked"}">${open ? n : "🔒"}<small>${lv.name}</small></button>`;
    }).join("");
    show(`<h2>Snake <span class="two">2</span></h2>
      <p>Ten levels. Eat the apples to clear each one. Watch out for walls and moving blocks.</p>
      <div class="levels">${btns}</div>
      <div class="legend"><span>🐢 slow-mo</span><span>⚡ boost</span><span>✂️ shrink</span><span><b style="color:#b48cff">×2</b> double points</span><span>👻 ghost</span><span>❤️ extra life</span></div>
      <p>Best score <b>${best}</b>. Space plays level ${unlocked}.</p>`);
    msg("Arrows or WASD, swipe on a phone. P to pause.");
  }
  function startLevel(i, fresh) {
    if (fresh) { G.score = 0; G.lives = START_LIVES; }
    loadLevel(i);
    const lv = L();
    G.state = "ready";
    show(`<p>Level ${i + 1} of ${LEVELS.length}</p><h2>${lv.name}</h2>
      <p>Eat <b>${lv.goal}</b> apples to clear it.${lv.tip ? " " + lv.tip : ""}</p>
      <div class="btns"><button class="btn" data-act="go">Go! ▶</button></div><p>Press any arrow, space, or tap to start.</p>`, true);
  }
  function go() { if (G.state !== "ready") return; hide(); G.state = "count"; G.countdown = 2000; G.lastCount = 3; G.invuln = 0; }
  function pause() {
    if (G.state === "play" || G.state === "count") {
      G.prev = G.state; G.state = "paused";
      show(`<div class="big">⏸</div><h2>Paused</h2><p>Level ${G.lvl + 1}, ${L().name}. Score ${G.score}.</p>
        <div class="btns"><button class="btn" data-act="resume">Resume</button><button class="btn alt" data-act="restart">Restart level</button><button class="btn alt" data-act="menu">Levels</button></div><p>P or Esc to resume.</p>`);
    } else if (G.state === "paused") { hide(); G.state = "count"; G.countdown = 1000; G.lastCount = 2; }
  }
  ov.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) { if (G.state === "ready") go(); return; }
    sfx.tap();
    const a = b.dataset.act;
    if (a === "level") startLevel(+b.dataset.n, true);
    else if (a === "go") go();
    else if (a === "next") startLevel(G.lvl + 1, false);
    else if (a === "retry") startLevel(G.lvl, true);
    else if (a === "resume") pause();
    else if (a === "restart") startLevel(G.lvl, true);
    else if (a === "menu") menu();
  });

  // ---------- HUD ----------
  let toastT = 0;
  function msg(t) { el("msg").textContent = t; }
  function toast(t) { msg(t); toastT = 2200; }
  function hud() {
    el("score").textContent = G.score;
    el("best").textContent = "Best " + Math.max(best, G.score);
    el("lvl-name").textContent = `Level ${G.lvl + 1} · ${L().name}`;
    el("lives").textContent = "❤️".repeat(Math.max(0, G.lives)) + "🖤".repeat(Math.max(0, START_LIVES - G.lives));
    el("eaten").textContent = `${G.eaten}/${L().goal}`;
    el("gfill").style.width = Math.min(100, (G.eaten / L().goal) * 100) + "%";
  }
  let fxSig = "";
  function hudFx() {
    const act = Object.entries(G.fx).filter(([, v]) => v > 0);
    const sig = act.map(([k]) => k).join();
    const box = el("effects");
    if (sig !== fxSig) {
      fxSig = sig;
      box.innerHTML = act.map(([k]) => `<span class="fx" style="--c:${POWERS[k].c}" title="${POWERS[k].n}">${POWERS[k].label || POWERS[k].e}<i><b data-k="${k}"></b></i></span>`).join("");
    }
    for (const b of box.querySelectorAll("b[data-k]")) b.style.width = (G.fx[b.dataset.k] / POWERS[b.dataset.k].ms) * 100 + "%";
  }

  // ---------- input ----------
  const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
  function turn(d) {
    if (G.state === "ready") { go(); }
    if (!["play", "count", "ready"].includes(G.state)) return;
    const last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
    if ((d[0] === -last[0] && d[1] === -last[1]) || (d[0] === last[0] && d[1] === last[1])) return;
    if (G.queue.length < 3) G.queue.push(d);
  }
  addEventListener("keydown", (e) => {
    if (DIRS[e.key]) { e.preventDefault(); turn(DIRS[e.key]); return; }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") { e.preventDefault(); pause(); return; }
    if (e.key === " " || e.key === "Enter") {
      if (e.target.closest && e.target.closest("button") && e.key === "Enter") return;
      e.preventDefault();
      if (G.state === "menu") startLevel(unlocked - 1, true);
      else if (G.state === "ready") go();
      else if (G.state === "clear" && ov.classList.contains("show")) { if (G.lvl + 1 < LEVELS.length) startLevel(G.lvl + 1, false); else menu(); }
      else if (G.state === "over") startLevel(G.lvl, true);
      else if (G.state === "paused") pause();
    }
    if (G.state === "menu" && /^[0-9]$/.test(e.key)) { const n = e.key === "0" ? 10 : +e.key; if (n <= unlocked) startLevel(n - 1, true); }
  });
  el("pause-btn").addEventListener("click", (e) => { e.currentTarget.blur(); pause(); });
  let sw = null;
  const stage = el("stage");
  stage.addEventListener("pointerdown", (e) => { sw = [e.clientX, e.clientY]; });
  stage.addEventListener("pointerup", (e) => {
    if (!sw) return;
    const dx = e.clientX - sw[0], dy = e.clientY - sw[1]; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
  });
  document.querySelectorAll(".pad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); turn(b.dataset.d.split(",").map(Number)); }));
  document.addEventListener("visibilitychange", () => { if (document.hidden && (G.state === "play" || G.state === "count")) pause(); });

  // ---------- effects ----------
  function burst(x, y, c, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = 0.04 + Math.random() * 0.12; G.particles.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c }); }
  }

  // ---------- drawing ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function draw(now) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#18281e"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#1d3024";
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x * C, y * C, C, C);
    if (L().wrap) { ctx.strokeStyle = "rgba(111,211,255,.35)"; ctx.setLineDash([8, 10]); ctx.lineWidth = 4; ctx.strokeRect(2, 2, cv.width - 4, cv.height - 4); ctx.setLineDash([]); }
    // lanes for movers
    ctx.fillStyle = "rgba(224,100,74,.08)";
    for (const k of G.lanes) { const [x, y] = k.split(",").map(Number); ctx.fillRect(x * C, y * C, C, C); }
    // walls
    for (const k of G.walls) {
      const [x, y] = k.split(",").map(Number);
      ctx.fillStyle = "#3d5c47"; rr(x * C + 1, y * C + 1, C - 2, C - 2, 6); ctx.fill();
      ctx.fillStyle = "#4d7058"; rr(x * C + 4, y * C + 3, C - 8, C / 3, 4); ctx.fill();
    }
    // portals
    G.portals.forEach((p, i) => {
      const col = i % 2 ? "#c58cff" : "#6fd3ff";
      for (const [x, y] of [p.a, p.b]) {
        const cx = x * C + C / 2, cy = y * C + C / 2;
        ctx.fillStyle = col + "33"; ctx.beginPath(); ctx.arc(cx, cy, C * 0.48, 0, 7); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        for (let r = 0; r < 2; r++) { ctx.beginPath(); ctx.arc(cx, cy, C * (0.4 - r * 0.16), now / (300 - r * 100) + r, now / (300 - r * 100) + r + 4.2); ctx.stroke(); }
      }
    });
    // movers
    for (const m of G.movers) {
      const x = m.axis === "x" ? m.pos : m.fixed, y = m.axis === "x" ? m.fixed : m.pos;
      const w = m.axis === "x" ? m.len : 1, h = m.axis === "x" ? 1 : m.len;
      ctx.fillStyle = "#e0644a"; rr(x * C + 2, y * C + 2, w * C - 4, h * C - 4, 8); ctx.fill();
      ctx.save(); ctx.beginPath(); rr(x * C + 2, y * C + 2, w * C - 4, h * C - 4, 8); ctx.clip();
      ctx.strokeStyle = "#f5a04a"; ctx.lineWidth = 5;
      for (let s = -h * C; s < w * C + h * C; s += 16) { ctx.beginPath(); ctx.moveTo(x * C + s, y * C); ctx.lineTo(x * C + s + h * C, y * C + h * C); ctx.stroke(); }
      ctx.restore();
    }
    // food
    if (G.food) {
      const [fx, fy] = G.food, bob = Math.sin(now / 250) * 1.5;
      ctx.fillStyle = "#ff7b3a"; ctx.beginPath(); ctx.arc(fx * C + C / 2, fy * C + C / 2 + bob, C * 0.36, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.arc(fx * C + C * 0.38, fy * C + C * 0.38 + bob, C * 0.09, 0, 7); ctx.fill();
      ctx.strokeStyle = "#6bc26b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx * C + C / 2, fy * C + C * 0.18 + bob); ctx.lineTo(fx * C + C * 0.62, fy * C + C * 0.06 + bob); ctx.stroke();
    }
    // power-up with lifetime ring
    if (G.power) {
      const p = G.power, P = POWERS[p.type], cx = p.x * C + C / 2, cy = p.y * C + C / 2;
      const blink = p.life < 2000 && Math.floor(now / 150) % 2;
      if (!blink) {
        const pulse = 1 + Math.sin(now / 160) * 0.06;
        ctx.fillStyle = P.c + "55"; ctx.beginPath(); ctx.arc(cx, cy, C * 0.62 * pulse, 0, 7); ctx.fill();
        ctx.fillStyle = "#10200f"; ctx.beginPath(); ctx.arc(cx, cy, C * 0.48, 0, 7); ctx.fill();
        ctx.strokeStyle = P.c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, C * 0.56, -Math.PI / 2, -Math.PI / 2 + 6.283 * (p.life / POWER_LIFE)); ctx.stroke();
        ctx.font = `${Math.round(C * 0.6)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (P.label) { ctx.fillStyle = P.c; ctx.font = `900 ${Math.round(C * 0.5)}px ui-rounded, system-ui, sans-serif`; ctx.fillText(P.label, cx, cy + 1); }
        else ctx.fillText(P.e, cx, cy + 1);
      }
    }
    // snake
    const blinkOff = G.invuln > 0 && Math.floor(now / 110) % 2;
    ctx.globalAlpha = G.fx.ghost > 0 ? 0.5 : blinkOff ? 0.35 : 1;
    const tint = G.fx.fast > 0 ? ["#ffe98a", "#e0b93a"] : G.fx.slow > 0 ? ["#a8e6ff", "#5fb4d8"] : ["#8be28f", "#4fae5f"];
    G.snake.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? tint[0] : tint[1];
      const pad = i === 0 ? 1 : 2.5;
      rr(x * C + pad, y * C + pad, C - pad * 2, C - pad * 2, 8); ctx.fill();
    });
    if (G.snake.length) {
      const [hx, hy] = G.snake[0], [dx, dy] = G.dir;
      ctx.fillStyle = "#10200f";
      const ex = hx * C + C / 2 + dx * C * 0.15, ey = hy * C + C / 2 + dy * C * 0.15;
      const px = -dy * C * 0.2, py = dx * C * 0.2;
      ctx.beginPath(); ctx.arc(ex + px, ey + py, 2.8, 0, 7); ctx.arc(ex - px, ey - py, 2.8, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // particles
    for (const p of G.particles) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x * C, p.y * C, 3.5, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // crash flash
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,70,70,${G.flash * 0.35})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    // countdown
    if (G.state === "count") {
      const n = Math.ceil(G.countdown / 1000);
      ctx.fillStyle = "rgba(10,20,14,.35)"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#eaf5ec"; ctx.font = `800 ${C * 4}px ui-rounded, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n, cv.width / 2, cv.height / 2);
      // direction hint arrow at head
      const [hx, hy] = G.snake[0], d = G.queue[0] || G.dir;
      ctx.fillStyle = "rgba(234,245,236,.7)"; ctx.font = `${C}px system-ui, sans-serif`;
      ctx.fillText(d[0] > 0 ? "→" : d[0] < 0 ? "←" : d[1] > 0 ? "↓" : "↑", (hx + d[0] * 1.6) * C + C / 2, (hy + d[1] * 1.6) * C + C / 2);
    }
  }

  // ---------- loop ----------
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - lastT); lastT = now; G.t = now;
    if (G.state === "count") {
      G.countdown -= dt;
      const n = Math.ceil(G.countdown / 1000);
      if (n !== G.lastCount && n > 0) { G.lastCount = n; snd.tick(); }
      if (G.countdown <= 0) { G.state = "play"; snd.go(); msg(`Level ${G.lvl + 1}: eat ${L().goal} apples.`); }
    } else if (G.state === "play") {
      G.acc += dt;
      const iv = interval();
      while (G.acc >= iv && G.state === "play") { G.acc -= iv; step(); }
      G.oacc += dt;
      const oiv = 170 * (G.fx.slow > 0 ? 1.7 : 1);
      while (G.oacc >= oiv && G.state === "play") { G.oacc -= oiv; moveObstacles(); }
      for (const k of Object.keys(G.fx)) if (G.fx[k] > 0) { G.fx[k] -= dt; if (G.fx[k] <= 0) { G.fx[k] = 0; if (k === "ghost") G.invuln = Math.max(G.invuln, 900); } }
      if (G.invuln > 0) G.invuln -= dt;
      if (G.power) { G.power.life -= dt; if (G.power.life <= 0) { G.power = null; G.powerIn = 6000 + Math.random() * 5000; } }
      else { G.powerIn -= dt; if (G.powerIn <= 0) spawnPower(); }
    }
    if (toastT > 0) { toastT -= dt; }
    G.flash = Math.max(0, G.flash - dt / 600);
    for (const p of G.particles) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.life -= dt / 600; }
    G.particles = G.particles.filter((p) => p.life > 0);
    hudFx();
    draw(now);
    requestAnimationFrame(frame);
  }
  // Test hook: lets automated checks drive the game deterministically.
  window.snake2 = { G, LEVELS, startLevel, go, spawnPower, takePower, POWERS, get unlocked() { return unlocked; } };
  menu();
  requestAnimationFrame(frame);
})();
