// Playroom kit: helpers shared by every kids' game in the Lab.
"use strict";
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Round timers, so leaving a screen cancels anything pending.
let _timers = [];
const after = (fn, ms) => { _timers.push(setTimeout(fn, ms)); };
const cancelAll = () => { _timers.forEach(clearTimeout); _timers = []; };

// ---- Sound (Web Audio) + voice ----
let _ac = null;
let muted = false;
try { muted = localStorage.getItem("lab-muted") === "1"; } catch (e) {}
function ac() {
  if (!_ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; _ac = new C(); }
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}
function tone(freq = 600, dur = 0.12, type = "sine", vol = 0.18, slide = 0) {
  if (muted) return;
  try {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
function hiss(dur = 0.1, vol = 0.25) {
  if (muted) return;
  try {
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = vol; s.buffer = b; s.connect(g).connect(c.destination); s.start();
  } catch (e) {}
}
const sfx = {
  tap:   () => tone(520, 0.07, "sine", 0.15),
  good:  () => { tone(660, 0.1); setTimeout(() => tone(990, 0.14), 90); },
  nope:  () => tone(220, 0.22, "triangle", 0.2, -80),
  pop:   () => { hiss(0.07, 0.35); tone(900, 0.06, "square", 0.05, -500); },
  chomp: () => { hiss(0.05, 0.3); setTimeout(() => hiss(0.05, 0.25), 110); },
  boing: () => tone(300, 0.25, "sine", 0.2, 500),
  ding:  () => { tone(1320, 0.5, "sine", 0.18); tone(1980, 0.4, "sine", 0.06); },
  snap:  () => { hiss(0.04, 0.4); setTimeout(() => hiss(0.06, 0.25), 60); },
  yay:   () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2, "triangle", 0.18), i * 110)),
};
// Little ones may not read yet, so prompts are spoken as well as shown.
function say(text, show = true) {
  const h = $("hint"); if (h && show) h.textContent = text;
  if (muted || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, ""));
    u.lang = "en-AU"; u.rate = 0.95; u.pitch = 1.25;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const hush = () => { try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {} };

function muteButton() {
  const b = document.createElement("button");
  b.className = "round-btn mute-btn"; b.setAttribute("aria-label", "Sound on or off");
  const draw = () => (b.textContent = muted ? "🔇" : "🔊");
  draw();
  b.addEventListener("click", () => { muted = !muted; try { localStorage.setItem("lab-muted", muted ? "1" : "0"); } catch (e) {} if (muted) hush(); draw(); });
  document.body.appendChild(b);
}
document.addEventListener("DOMContentLoaded", muteButton);

function showScreen(id) { document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id)); }

function confetti(bits = ["🎉", "⭐", "💖", "✨", "🌈"], count = 28) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "bits"; c.textContent = bits[i % bits.length];
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    c.style.animationDelay = Math.random() * 0.7 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5200);
  }
}
function wiggle(el, cls = "nope") { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// Is a point over an element (with slack for small fingers)?
function isOver(el, x, y, pad = 16) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
}

// Touch-first drag and drop. The ghost floats a little above the finger so it stays visible.
// A press that hardly moves counts as a tap.
const LIFT = 50, SLOP = 10;
let _drag = null;
function makeDraggable(el, icon, { onTap, onDrop, onMove } = {}) {
  el.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    endDrag();
    const g = document.createElement("div");
    g.className = "ghost"; g.textContent = typeof icon === "function" ? icon() : icon;
    g.style.display = "none";
    document.body.appendChild(g);
    _drag = { el, g, onTap, onDrop, onMove, x0: e.clientX, y0: e.clientY, moved: false };
    el.classList.add("dragging");
    sfx.tap();
  });
}
function _ghostAt(x, y) { _drag.g.style.left = x + "px"; _drag.g.style.top = y - LIFT + "px"; }
function endDrag() { if (!_drag) return; _drag.g.remove(); _drag.el.classList.remove("dragging"); _drag = null; }
document.addEventListener("pointermove", (e) => {
  if (!_drag) return;
  if (!_drag.moved && Math.hypot(e.clientX - _drag.x0, e.clientY - _drag.y0) > SLOP) { _drag.moved = true; _drag.g.style.display = ""; }
  if (!_drag.moved) return;
  _ghostAt(e.clientX, e.clientY);
  if (_drag.onMove) _drag.onMove(e.clientX, e.clientY - LIFT);
});
document.addEventListener("pointerup", (e) => {
  if (!_drag) return;
  const d = _drag; endDrag();
  if (!d.moved) { if (d.onTap) d.onTap(); }
  else if (d.onDrop) d.onDrop(e.clientX, e.clientY - LIFT);
});
document.addEventListener("pointercancel", endDrag);

function thingButton(icon, label = "") {
  const b = document.createElement("button");
  b.type = "button"; b.className = "thing";
  b.innerHTML = `<span class="icon">${icon}</span>${label ? `<span class="label">${label}</span>` : ""}`;
  if (label) b.setAttribute("aria-label", label);
  return b;
}

// Save an SVG element as a PNG download (used for photos and finished pictures).
function svgToPng(svgEl, filename, scale = 4, done) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = (clone.getAttribute("viewBox") || "0 0 100 100").split(/[ ,]+/).map(Number);
  const w = vb[2] * scale, h = vb[3] * scale;
  clone.setAttribute("width", w); clone.setAttribute("height", h);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    let url;
    try { url = c.toDataURL("image/png"); } catch (err) { if (done) done(null); return; }
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    if (done) done(url);
  };
  img.onerror = () => { if (done) done(null); };
  img.src = src;
}
