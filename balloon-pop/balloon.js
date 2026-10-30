// Balloon Pop: balloons drift up; pop the ones that match the prompt.
// Three good pops moves on to a new prompt, five prompts finishes the game.
const HUES = [
  { name: "red", c: "#ff4d5e" }, { name: "orange", c: "#ff962e" }, { name: "yellow", c: "#ffd23d" },
  { name: "green", c: "#43c76a" }, { name: "blue", c: "#4d8dff" }, { name: "purple", c: "#9d63ff" }, { name: "pink", c: "#ff7ec4" },
];
const ABC = { A: ["🍎", "apple"], B: ["🐝", "bee"], C: ["🐱", "cat"], D: ["🐶", "dog"], E: ["🐘", "elephant"], F: ["🐸", "frog"],
  G: ["🦒", "giraffe"], H: ["🏠", "house"], I: ["🍦", "ice cream"], J: ["🪼", "jellyfish"], K: ["🦘", "kangaroo"], L: ["🍋", "lemon"],
  M: ["🐒", "monkey"], N: ["🪺", "nest"], O: ["🐙", "octopus"], P: ["🐧", "penguin"], Q: ["👸", "queen"], R: ["🌈", "rainbow"],
  S: ["⭐", "star"], T: ["🐢", "turtle"], U: ["☂️", "umbrella"], V: ["🚐", "van"], W: ["🐨", "wombat"], X: ["❌", "x marks the spot"], Y: ["🪀", "yo-yo"], Z: ["🦓", "zebra"] };
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const KINDS = {
  colours: {
    values: HUES, key: (v) => v.name,
    colour: (v) => v.c, label: () => "",
    show: (v) => `<span class="swatch" style="background:${v.c}"></span>`,
    ask: (v) => `Pop the ${v.name} balloons!`, yes: (v) => cap(v.name) + "!", no: (v, t) => `That one's ${v.name}. Find ${t.name}!`,
  },
  letters: {
    values: Object.keys(ABC), key: (v) => v,
    colour: () => pick(HUES).c, label: (v) => v,
    show: (v) => `<span>${v}</span><span class="pic">${ABC[v][0]}</span>`,
    ask: (v) => v === "X" ? "Pop the letter X! X marks the spot." : `Pop the letter ${v}! ${v} is for ${ABC[v][1]}.`,
    yes: (v) => v + "!", no: (v, t) => `That's ${v}. Find ${t}!`,
  },
  numbers: {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], key: (v) => String(v),
    colour: () => pick(HUES).c, label: (v) => String(v),
    show: (v) => `<span>${v}</span><span class="dots">${"●".repeat(v)}</span>`,
    ask: (v) => `Pop the number ${WORDS[v]}!`, yes: (v) => cap(WORDS[v]) + "!", no: (v, t) => `That's ${WORDS[v]}. Find ${WORDS[t]}!`,
  },
};
const NEED = 3, ROUNDS = 5, MAX_UP = 8;

const S = { mode: "colours", kind: null, target: null, hits: 0, round: 0, used: [], list: [], running: false, last: 0, gap: 900, prevT: 0 };
const sky = $("sky");

function begin(mode) {
  S.mode = mode; S.round = 0; S.used = [];
  showScreen("game"); $("party").classList.add("hidden");
  nextTarget();
  S.running = true; S.prevT = performance.now(); S.last = 0;
  requestAnimationFrame(frame);
}
function nextTarget() {
  S.kind = KINDS[S.mode === "mix" ? ["colours", "letters", "numbers"][S.round % 3] : S.mode];
  const fresh = S.kind.values.filter((v) => !S.used.includes(S.kind.key(v)));
  S.target = pick(fresh.length ? fresh : S.kind.values);
  S.used.push(S.kind.key(S.target));
  S.hits = 0;
  // clear balloons from the previous kind so the sky isn't confusing
  S.list.forEach((b) => b.el.remove()); S.list = [];
  $("target").innerHTML = S.kind.show(S.target);
  drawHits(); drawStars();
  wiggle($("prompt"), "hop");
  say(S.kind.ask(S.target));
}
function drawHits() { $("hits").textContent = "🎈".repeat(NEED - S.hits) + "💥".repeat(S.hits); }
function drawStars() { $("stars").textContent = "⭐".repeat(S.round) || ""; }

function balloonSvg(fill, label) {
  return `<svg viewBox="0 0 60 105" aria-hidden="true">
    <path d="M30 70 q-7 10 2 18 q7 7 -1 17" stroke="rgba(255,255,255,.75)" stroke-width="1.4" fill="none"/>
    <path d="M30 2 C48 2 58 18 58 34 C58 54 42 68 30 70 C18 68 2 54 2 34 C2 18 12 2 30 2 Z" fill="${fill}"/>
    <path d="M26 69 h8 l-2 5 h-4 z" fill="${fill}"/>
    <ellipse cx="19" cy="20" rx="6" ry="10" fill="#fff" opacity=".45" transform="rotate(-20 19 20)"/>
    ${label ? `<text x="30" y="36" font-size="${label.length > 1 ? 24 : 30}">${label}</text>` : ""}
  </svg>`;
}
function spawn() {
  const k = S.kind, rect = sky.getBoundingClientRect();
  if (!rect.width) return;
  // about 40% of balloons are the right one, so it never feels hopeless
  const isTarget = Math.random() < 0.4 || !S.list.some((b) => b.match);
  const v = isTarget ? S.target : pick(k.values.filter((x) => k.key(x) !== k.key(S.target)));
  const w = Math.max(64, Math.min(104, rect.width * 0.13));
  const el = document.createElement("button");
  el.className = "balloon"; el.style.setProperty("--w", w + "px");
  el.setAttribute("aria-label", "Balloon " + k.key(v));
  el.innerHTML = balloonSvg(k.colour(v), k.label(v));
  const b = { el, v, match: isTarget, x: Math.random() * (rect.width - w), y: rect.height + 10, w, h: w * 1.75,
    speed: 45 + Math.random() * 35 + S.round * 5, sway: Math.random() * 6.28, done: false };
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); hit(b); });
  sky.appendChild(el); S.list.push(b); place(b);
}
function place(b) { b.el.style.transform = `translate(${b.x + Math.sin(b.sway) * 10}px, ${b.y}px) rotate(${Math.sin(b.sway) * 5}deg)`; }
function frame(t) {
  if (!S.running) return;
  const dt = Math.min(0.05, (t - S.prevT) / 1000); S.prevT = t;
  if (t - S.last > S.gap && S.list.length < MAX_UP) { spawn(); S.last = t; S.gap = 700 + Math.random() * 600; }
  for (const b of S.list) { b.y -= b.speed * dt; b.sway += dt * 1.6; place(b); if (b.y < -b.h - 20) b.done = true; }
  S.list = S.list.filter((b) => { if (b.done) b.el.remove(); return !b.done; });
  requestAnimationFrame(frame);
}
function burst(b, colour) {
  const r = b.el.getBoundingClientRect(), s = sky.getBoundingClientRect();
  const cx = r.left - s.left + r.width / 2, cy = r.top - s.top + r.width * 0.6;
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("span"); p.className = "shard"; p.style.background = colour;
    const a = (i / 10) * 6.28; p.style.left = cx + "px"; p.style.top = cy + "px";
    p.style.setProperty("--dx", Math.cos(a) * 70 + "px"); p.style.setProperty("--dy", Math.sin(a) * 70 + "px");
    sky.appendChild(p); setTimeout(() => p.remove(), 600);
  }
  return [cx, cy];
}
function hit(b) {
  if (b.done || !S.running) return;
  const k = S.kind;
  if (k.key(b.v) === k.key(S.target)) {
    b.done = true; sfx.pop();
    const [x, y] = burst(b, k.colour(b.v) || "#fff");
    b.el.remove();
    const w = document.createElement("span"); w.className = "float-word"; w.textContent = k.yes(b.v);
    w.style.left = x + "px"; w.style.top = y + "px"; sky.appendChild(w); setTimeout(() => w.remove(), 1000);
    S.hits++; drawHits();
    if (S.hits >= NEED) {
      S.round++; drawStars(); sfx.good();
      if (S.round >= ROUNDS) return win();
      say("Brilliant!"); after(nextTarget, 900);
    } else say(k.yes(b.v));
  } else {
    sfx.boing(); wiggle(b.el.firstElementChild); say(k.no(b.v, S.target));
  }
}
function win() {
  S.running = false; sfx.yay(); confetti(["🎈", "⭐", "🎉", "💥"]);
  after(() => { $("party").classList.remove("hidden"); say("Super popper! You did it!"); }, 700);
}
function stop() { S.running = false; cancelAll(); hush(); S.list.forEach((b) => b.el.remove()); S.list = []; }

document.querySelectorAll(".card[data-mode]").forEach((c) => c.addEventListener("click", () => { sfx.tap(); begin(c.dataset.mode); }));
$("back-btn").addEventListener("click", () => { stop(); showScreen("menu"); });
$("again-btn").addEventListener("click", () => { stop(); begin(S.mode); });
$("menu-btn").addEventListener("click", () => { stop(); $("party").classList.add("hidden"); showScreen("menu"); });
$("prompt").addEventListener("click", () => say(S.kind.ask(S.target)));
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.running) S.prevT = performance.now(); });
