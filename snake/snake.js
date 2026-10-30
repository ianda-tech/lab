"use strict";
const SIZE = 20;
const cv = document.getElementById("board");
const g = cv.getContext("2d");
const C = cv.width / SIZE;
const scoreEl = document.getElementById("score"), bestEl = document.getElementById("best"), msg = document.getElementById("msg");
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

let best = 0;
try { best = +localStorage.getItem("lab-snake-best") || 0; } catch (e) {}
const showBest = () => (bestEl.textContent = best ? "best " + best : "");
showBest();

let body, heading, turns, apple, score, state = "ready", loopId = null, pulse = 0;

function fresh() {
  body = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  heading = { x: 1, y: 0 }; turns = []; score = 0; scoreEl.textContent = "0";
  dropApple();
}
function dropApple() {
  const free = [];
  for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) if (!body.some((p) => p.x === x && p.y === y)) free.push({ x, y });
  apple = free[Math.floor(Math.random() * free.length)];
}
function steer(x, y) {
  const last = turns.length ? turns[turns.length - 1] : heading;
  if ((last.x === -x && last.y === -y) || (last.x === x && last.y === y)) { if (state !== "running") go(); return; }
  if (turns.length < 3) turns.push({ x, y });
  if (state !== "running") go();
}
function go() {
  if (state === "running") return;
  if (state === "over") fresh();
  state = "running"; msg.textContent = "";
  step();
}
function pause() {
  if (state === "running") { state = "paused"; clearTimeout(loopId); msg.textContent = "Paused. Space or tap to carry on."; }
  else if (state === "paused") go();
}
function blip(f) {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    blip.ac = blip.ac || new A(); const a = blip.ac, o = a.createOscillator(), v = a.createGain();
    o.frequency.value = f; v.gain.setValueAtTime(0.12, a.currentTime); v.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.12);
    o.connect(v).connect(a.destination); o.start(); o.stop(a.currentTime + 0.13);
  } catch (e) {}
}
function step() {
  if (turns.length) heading = turns.shift();
  const head = { x: body[0].x + heading.x, y: body[0].y + heading.y };
  const out = head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE;
  const tailMoves = !(head.x === apple.x && head.y === apple.y);
  const hitsSelf = body.some((p, i) => p.x === head.x && p.y === head.y && !(tailMoves && i === body.length - 1));
  if (out || hitsSelf) return crash();
  body.unshift(head);
  if (!tailMoves) { score++; scoreEl.textContent = score; blip(660 + score * 10); pulse = 6; if (body.length === SIZE * SIZE) return crash(true); dropApple(); }
  else body.pop();
  paint();
  loopId = setTimeout(step, Math.max(55, 135 - score * 3));
}
function crash(won) {
  state = "over"; clearTimeout(loopId);
  if (score > best) { best = score; try { localStorage.setItem("lab-snake-best", best); } catch (e) {} showBest(); }
  blip(150);
  msg.textContent = (won ? "You filled the board! " : "Ouch! ") + "Score " + score + ". Space or tap to play again.";
  paint(true);
}
function paint(dead) {
  g.clearRect(0, 0, cv.width, cv.height);
  g.fillStyle = css("--grid");
  for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) if ((x + y) % 2) g.fillRect(x * C, y * C, C, C);
  // apple
  const r = C * 0.36 + (pulse > 0 ? pulse-- * 0.6 : 0);
  g.fillStyle = css("--food");
  g.beginPath(); g.arc((apple.x + .5) * C, (apple.y + .55) * C, r, 0, 7); g.fill();
  g.fillStyle = "#6fcf5a"; g.beginPath(); g.ellipse((apple.x + .62) * C, (apple.y + .18) * C, C * .14, C * .07, -0.6, 0, 7); g.fill();
  // snake
  body.forEach((p, i) => {
    const t = i / Math.max(1, body.length - 1);
    g.fillStyle = dead ? "#c9605b" : (i === 0 ? css("--snake") : mix(css("--snake"), css("--snake-dark"), t));
    const pad = i === 0 ? 1 : 2.5;
    g.beginPath();
    if (g.roundRect) g.roundRect(p.x * C + pad, p.y * C + pad, C - pad * 2, C - pad * 2, 8); else g.rect(p.x * C + pad, p.y * C + pad, C - pad * 2, C - pad * 2);
    g.fill();
  });
  // eyes
  const h = body[0], ex = heading.y !== 0, cx = (h.x + .5) * C, cy = (h.y + .5) * C;
  g.fillStyle = "#10241a";
  for (const s of [-1, 1]) {
    const x = cx + (ex ? s * C * .2 : heading.x * C * .15), y = cy + (ex ? heading.y * C * .15 : s * C * .2);
    g.beginPath(); g.arc(x, y, C * .08, 0, 7); g.fill();
  }
}
function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")";
}

const KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (KEYS[k]) { e.preventDefault(); steer(...KEYS[k]); }
  else if (k === " " || k === "enter") { e.preventDefault(); state === "running" ? pause() : go(); }
  else if (k === "p" || k === "escape") pause();
});
let t0 = null;
cv.addEventListener("touchstart", (e) => { t0 = e.touches[0]; }, { passive: true });
document.body.addEventListener("touchstart", (e) => { if (!t0) t0 = e.touches[0]; }, { passive: true });
addEventListener("touchend", (e) => {
  if (!t0 || e.target.closest(".pad,a")) { t0 = null; return; }
  const t = e.changedTouches[0], dx = t.clientX - t0.clientX, dy = t.clientY - t0.clientY;
  t0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return state === "running" ? null : go();
  Math.abs(dx) > Math.abs(dy) ? steer(Math.sign(dx), 0) : steer(0, Math.sign(dy));
});
document.addEventListener("touchmove", (e) => { if (!e.target.closest("a")) e.preventDefault(); }, { passive: false });
cv.addEventListener("click", () => { if (state !== "running") go(); });
document.querySelectorAll(".pad button").forEach((b) => b.addEventListener("pointerdown", (e) => { e.preventDefault(); steer(...b.dataset.d.split(",").map(Number)); }));

fresh();
paint();
