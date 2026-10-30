// Toy Doctor: pick a patient, choose the right tool, make them all better.
const TOOLS = {
  jar: { e: "🫙", n: "bug jar" }, cream: { e: "🧴", n: "cream" }, bandage: { e: "🩹", n: "bandage" },
  sponge: { e: "🧽", n: "sponge" }, thermo: { e: "🌡️", n: "thermometer", l: "Temp" }, ice: { e: "🧊", n: "ice pack" },
  needle: { e: "🪡", n: "needle and thread" }, scope: { e: "🩺", n: "stethoscope", l: "Listen" },
};
const SCRATCH = `<svg viewBox="0 0 40 40"><path d="M8 14 L32 10 M6 22 L34 18 M9 30 L30 26" stroke="#e23b4a" stroke-width="4" stroke-linecap="round"/></svg>`;
const CREAMED = `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="17" ry="13" fill="#fff" opacity=".85"/><path d="M8 14 L32 10 M6 22 L34 18 M9 30 L30 26" stroke="#f59aa3" stroke-width="3" stroke-linecap="round"/></svg>`;
const MUD = `<svg viewBox="0 0 40 40"><path d="M8 18 C4 10 14 4 20 8 C26 2 38 8 34 16 C40 22 34 34 26 30 C20 38 8 34 10 26 C2 26 4 20 8 18 Z" fill="#7a5230"/><circle cx="14" cy="16" r="3" fill="#9a6a40"/><circle cx="26" cy="24" r="4" fill="#5e3d22"/></svg>`;
const TEAR = `<svg viewBox="0 0 40 40"><path d="M10 20 C14 12 26 12 30 20 C26 28 14 28 10 20 Z" fill="#fff8ec" stroke="#6b4426" stroke-width="2.5"/><circle cx="17" cy="19" r="3" fill="#fff"/><circle cx="23" cy="21" r="3" fill="#f3eadb"/></svg>`;
const STITCH = `<svg viewBox="0 0 40 40"><path d="M10 20 H30" stroke="#6b4426" stroke-width="2.5"/><path d="M13 15 L15 25 M19 15 L21 25 M25 15 L27 25" stroke="#e23b4a" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const FEVER = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#ff5a3c" opacity=".35"/><circle cx="20" cy="20" r="8" fill="#ff5a3c" opacity=".35"/></svg>`;

const BUG = (e) => ({ kind: "bug", show: e, steps: [{ tool: "jar", say: "Got it! Into the jar." }], away: true });
const PATIENTS = [
  { id: "leo", name: "Leo the Lion", icon: "🦁", problem: "Leo has bugs in his mane! Use the bug jar to catch them.",
    spots: [[24, 26, BUG("🐞")], [76, 24, BUG("🐜")], [16, 58, BUG("🪲")], [84, 58, BUG("🐞")], [50, 9, BUG("🐜")]] },
  { id: "rex", name: "Rex the T-Rex", icon: "🦖", problem: "Rex fell over and has scratches. Cream first, then a bandage.",
    spots: [[30, 66, { show: SCRATCH, steps: [{ tool: "cream", show: CREAMED, say: "Cool cream. Now a bandage!" }, { tool: "bandage", show: "🩹", say: "Bandage on!" }] }],
            [64, 86, { show: SCRATCH, steps: [{ tool: "cream", show: CREAMED, say: "Rub rub. Now a bandage!" }, { tool: "bandage", show: "🩹", say: "All patched up!" }] }]] },
  { id: "robo", name: "Robo the Robot", icon: "🤖", problem: "Robo rolled through a puddle! Scrub off the mud with the sponge.",
    spots: [[30, 30, { show: MUD, rub: true, steps: [{ tool: "sponge" }], away: true }], [70, 26, { show: MUD, rub: true, steps: [{ tool: "sponge" }], away: true }],
            [36, 70, { show: MUD, rub: true, steps: [{ tool: "sponge" }], away: true }], [68, 74, { show: MUD, rub: true, steps: [{ tool: "sponge" }], away: true }]] },
  { id: "teddy", name: "Teddy", icon: "🧸", problem: "Teddy feels hot and has a hole in his tummy. Check his temperature first.",
    spots: [[50, 20, { show: FEVER, steps: [{ tool: "thermo", show: FEVER, say: "Thirty nine degrees. Ooh, a bit hot! Let's cool him down.", reading: "39°" }, { tool: "ice", say: "Ahh, nice and cool.", reading: "37°" }], away: true }],
            [50, 72, { show: TEAR, steps: [{ tool: "needle", show: STITCH, say: "Stitch stitch. Good as new!" }] }]] },
];

// ---------- Toy art (100×100), mood: "sad" | "happy" ----------
function face(cx, cy, s, mood, eyeCol = "#2b2233") {
  const happy = mood === "happy";
  return `<g>
    <ellipse cx="${cx - 9 * s}" cy="${cy}" rx="${3.2 * s}" ry="${happy ? 2.2 * s : 3.6 * s}" fill="${eyeCol}"/>
    <ellipse cx="${cx + 9 * s}" cy="${cy}" rx="${3.2 * s}" ry="${happy ? 2.2 * s : 3.6 * s}" fill="${eyeCol}"/>
    ${happy ? `<circle cx="${cx - 14 * s}" cy="${cy + 7 * s}" r="${3.5 * s}" fill="#ff7b9c" opacity=".55"/><circle cx="${cx + 14 * s}" cy="${cy + 7 * s}" r="${3.5 * s}" fill="#ff7b9c" opacity=".55"/>
      <path d="M${cx - 7 * s} ${cy + 9 * s} Q${cx} ${cy + 16 * s} ${cx + 7 * s} ${cy + 9 * s}" stroke="${eyeCol}" stroke-width="${2 * s}" fill="${happy ? "#c9364c" : "none"}" stroke-linecap="round"/>`
      : `<path d="M${cx - 13 * s} ${cy - 5 * s} L${cx - 5 * s} ${cy - 8 * s} M${cx + 13 * s} ${cy - 5 * s} L${cx + 5 * s} ${cy - 8 * s}" stroke="${eyeCol}" stroke-width="${1.6 * s}" stroke-linecap="round"/>
      <path d="M${cx - 6 * s} ${cy + 13 * s} Q${cx} ${cy + 8 * s} ${cx + 6 * s} ${cy + 13 * s}" stroke="${eyeCol}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>
      <path d="M${cx + 10 * s} ${cy + 4 * s} q${1.5 * s} ${3 * s} 0 ${4.5 * s} q${-1.5 * s} ${-1.5 * s} 0 ${-4.5 * s}" fill="#7cc8ff"/>`}
  </g>`;
}
const ART = {
  leo: (m) => {
    let mane = ""; for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283; mane += `<circle cx="${50 + Math.cos(a) * 33}" cy="${44 + Math.sin(a) * 33}" r="13" fill="${i % 2 ? "#d9731f" : "#e8892b"}"/>`; }
    return `<ellipse cx="50" cy="92" rx="26" ry="10" fill="#f0b64a"/>${mane}<circle cx="50" cy="44" r="33" fill="#e8892b"/>
      <circle cx="30" cy="22" r="7" fill="#f7c65a"/><circle cx="70" cy="22" r="7" fill="#f7c65a"/><circle cx="30" cy="22" r="3.5" fill="#e79a7a"/><circle cx="70" cy="22" r="3.5" fill="#e79a7a"/>
      <circle cx="50" cy="47" r="24" fill="#f7c65a"/><ellipse cx="50" cy="58" rx="11" ry="8" fill="#fde3a0"/><path d="M45 53 L55 53 L50 58 Z" fill="#7a3b2a"/>
      ${face(50, 44, 0.9, m)}`;
  },
  rex: (m) => `<path d="M70 70 C86 72 96 84 98 96 C88 90 78 88 68 86 Z" fill="#4fb35c"/>
      <ellipse cx="50" cy="72" rx="26" ry="24" fill="#5cc46a"/><ellipse cx="50" cy="76" rx="15" ry="17" fill="#c9eea0"/>
      <path d="M36 86 L34 98 H46 L46 90 M56 90 L56 98 H68 L66 86" fill="#4fb35c"/>
      <path d="M26 62 Q18 64 20 70" stroke="#4fb35c" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M74 62 Q82 64 80 70" stroke="#4fb35c" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M40 8 L44 2 L48 8 L52 1 L56 8 L60 3 L62 10" fill="#3d9a4a"/>
      <rect x="24" y="8" width="52" height="40" rx="20" fill="#5cc46a"/><rect x="30" y="34" width="40" height="12" rx="6" fill="#c9eea0"/>
      <path d="M34 38 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4" stroke="#fff" stroke-width="1.6" fill="none"/>
      ${face(50, 24, 0.8, m)}`,
  robo: (m) => `<rect x="47" y="2" width="6" height="10" fill="#9aa4b8"/><circle cx="50" cy="3" r="4" fill="${m === "happy" ? "#7dff9a" : "#ff6a6a"}"/>
      <rect x="22" y="10" width="56" height="40" rx="9" fill="#b9c3d6"/><rect x="28" y="16" width="44" height="28" rx="6" fill="#2a3346"/>
      ${face(50, 26, 0.75, m, "#7dfcff")}
      <rect x="14" y="24" width="8" height="14" rx="3" fill="#9aa4b8"/><rect x="78" y="24" width="8" height="14" rx="3" fill="#9aa4b8"/>
      <rect x="44" y="50" width="12" height="5" fill="#9aa4b8"/>
      <rect x="20" y="54" width="60" height="36" rx="8" fill="#a6b2c8"/><circle cx="38" cy="70" r="7" fill="#ffd166"/><rect x="52" y="64" width="20" height="4" rx="2" fill="#5fd3c6"/><rect x="52" y="72" width="14" height="4" rx="2" fill="#ff8fab"/>
      <rect x="8" y="58" width="12" height="24" rx="6" fill="#9aa4b8"/><rect x="80" y="58" width="12" height="24" rx="6" fill="#9aa4b8"/>
      <rect x="26" y="90" width="48" height="8" rx="4" fill="#59627a"/><circle cx="32" cy="94" r="4" fill="#2a3346"/><circle cx="50" cy="94" r="4" fill="#2a3346"/><circle cx="68" cy="94" r="4" fill="#2a3346"/>`,
  teddy: (m) => `<circle cx="24" cy="12" r="10" fill="#a8703f"/><circle cx="76" cy="12" r="10" fill="#a8703f"/><circle cx="24" cy="12" r="5" fill="#e6b98a"/><circle cx="76" cy="12" r="5" fill="#e6b98a"/>
      <ellipse cx="22" cy="68" rx="9" ry="14" fill="#a8703f" transform="rotate(25 22 68)"/><ellipse cx="78" cy="68" rx="9" ry="14" fill="#a8703f" transform="rotate(-25 78 68)"/>
      <ellipse cx="50" cy="72" rx="26" ry="24" fill="#b57b45"/><ellipse cx="50" cy="74" rx="15" ry="15" fill="#e6b98a"/>
      <ellipse cx="34" cy="94" rx="11" ry="6" fill="#a8703f"/><ellipse cx="66" cy="94" rx="11" ry="6" fill="#a8703f"/>
      <circle cx="50" cy="30" r="25" fill="#b57b45"/><ellipse cx="50" cy="40" rx="11" ry="8" fill="#e6b98a"/><ellipse cx="50" cy="36" rx="4" ry="3" fill="#3b2418"/>
      ${face(50, 28, 0.8, m)}<path d="M40 52 L60 52 L50 58 Z" fill="#e23b4a"/>`,
};

// ---------- State & flow ----------
const cured = new Set();
let P = null, spots = [], tool = null, idx = 0;
const box = $("box"), tray = $("tray");

function renderMenu() {
  const list = $("patients"); list.innerHTML = "";
  PATIENTS.forEach((p, i) => {
    const b = document.createElement("button"); b.className = "card";
    b.innerHTML = `<span class="art">${p.icon}</span><span>${p.name}</span>${cured.has(p.id) ? '<span class="cured">✅</span>' : ""}`;
    b.addEventListener("click", () => { sfx.tap(); openPatient(i); });
    list.appendChild(b);
  });
}
function openPatient(i) {
  cancelAll(); idx = i; P = PATIENTS[i]; tool = null;
  $("patient-name").textContent = `${P.icon} ${P.name}`;
  $("party").classList.add("hidden");
  spots = P.spots.map(([x, y, s]) => ({ x, y, ...s, stage: 0, dirt: 1, done: false }));
  drawToy("sad"); drawSpots(); drawTray(); progress();
  showScreen("clinic");
  say(P.problem);
}
function drawToy(mood) {
  let svg = box.querySelector(":scope > svg");
  const html = `<svg viewBox="0 0 100 100">${ART[P.id](mood)}</svg>`;
  if (svg) svg.outerHTML = html; else box.insertAdjacentHTML("afterbegin", html);
}
function drawSpots() {
  box.querySelectorAll(".spot,.reading,.heart,.sparkle").forEach((el) => el.remove());
  spots.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "spot" + (s.kind === "bug" ? " bug" : "");
    b.style.left = s.x + "%"; b.style.top = s.y + "%";
    b.setAttribute("aria-label", "Problem " + (i + 1));
    b.innerHTML = s.show;
    s.el = b;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); treat(s); });
    box.appendChild(b);
  });
}
function drawTray() {
  tray.innerHTML = "";
  for (const [k, t] of Object.entries(TOOLS)) {
    const b = thingButton(t.e, t.l || cap(t.n.split(" and")[0]));
    b.dataset.k = k;
    makeDraggable(b, t.e, {
      onTap: () => pickTool(k),
      onMove: (x, y) => { pickTool(k, true); const s = spotAt(x, y); if (s && s.rub && s.steps[s.stage].tool === k) rub(s, 0.06); },
      onDrop: (x, y) => { const s = spotAt(x, y); if (s && !s.rub) treat(s); else if (k === "scope" && isOver(box, x, y, 0)) listen(); },
    });
    tray.appendChild(b);
  }
}
function pickTool(k, quiet) {
  if (tool === k) return;
  tool = k;
  tray.querySelectorAll(".thing").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
  if (!quiet) { sfx.tap(); say(k === "scope" ? "The stethoscope! Tap the toy to listen." : `The ${TOOLS[k].n}.`, true); }
}
const spotAt = (x, y) => spots.find((s) => !s.done && s.el && isOver(s.el, x, y, 6));
function treat(s) {
  if (s.done) return;
  if (!tool) { say(`What do we need? Pick a tool.`); wiggle(s.el); return; }
  const step = s.steps[s.stage];
  if (tool !== step.tool) {
    sfx.nope(); wiggle(s.el);
    say(tool === "scope" ? "Ba-dum, ba-dum. Sounds fine! Try another tool." : `Hmm, the ${TOOLS[tool].n} won't help that. Try the ${TOOLS[step.tool].n}!`);
    return;
  }
  if (s.rub) { rub(s, 0.34); return; }
  advance(s);
}
function rub(s, n) {
  if (s.done) return;
  s.dirt -= n; s.el.style.opacity = Math.max(0.05, s.dirt).toFixed(2); s.el.classList.add("quiet");
  hiss(0.06, 0.12);
  if (s.dirt <= 0) { say(pick(["Squeaky clean!", "Shiny!", "Scrub a dub!"])); advance(s); }
}
function advance(s) {
  const step = s.steps[s.stage];
  if (step.reading) showReading(step.reading);
  s.stage++;
  sfx.good(); sparkle(s.x, s.y);
  if (step.say) say(step.say);
  if (s.stage >= s.steps.length) {
    s.done = true;
    if (s.away) {
      s.el.classList.add("fixed");
      const jar = s.kind === "bug";
      s.el.style.setProperty("--tx", jar ? "0px" : "0px"); s.el.style.setProperty("--ty", jar ? "60vh" : "0px");
      s.el.classList.add("gone"); setTimeout(() => s.el.remove(), 650);
      if (!jar) sfx.ding();
    } else { s.el.innerHTML = step.show || ""; s.el.classList.add("fixed"); }
    progress(); checkDone();
  } else { s.el.innerHTML = step.show || s.show; }
}
function showReading(t) {
  box.querySelectorAll(".reading").forEach((r) => r.remove());
  const r = document.createElement("div"); r.className = "reading"; r.textContent = "🌡️ " + t; box.appendChild(r);
  setTimeout(() => r.remove(), 2600);
}
function sparkle(x, y) {
  const s = document.createElement("span"); s.className = "sparkle"; s.textContent = "✨";
  s.style.left = x + "%"; s.style.top = y + "%"; box.appendChild(s); setTimeout(() => s.remove(), 800);
}
function progress() {
  $("progress").textContent = spots.map((s) => (s.done ? "⭐" : "·")).join("");
}
function listen() {
  const h = document.createElement("span"); h.className = "heart"; h.textContent = "💓"; box.appendChild(h);
  setTimeout(() => h.remove(), 1600);
  [0, 500, 1000].forEach((t) => { setTimeout(() => tone(70, 0.1, "sine", 0.4), t); setTimeout(() => tone(60, 0.12, "sine", 0.35), t + 160); });
  const left = spots.filter((s) => !s.done).length;
  say(left ? "Ba-dum, ba-dum! A good strong heart." : "Ba-dum! Healthy and happy!");
}
box.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".spot")) return;
  if (tool === "scope") listen();
});
// Rubbing with the sponge by dragging a finger across the toy once it's picked.
let rubbing = false;
box.addEventListener("pointerdown", () => { rubbing = tool === "sponge"; });
window.addEventListener("pointerup", () => { rubbing = false; });
box.addEventListener("pointermove", (e) => {
  if (!rubbing) return;
  const s = spotAt(e.clientX, e.clientY);
  if (s && s.rub) rub(s, 0.05);
});
function checkDone() {
  if (spots.some((s) => !s.done)) return;
  cured.add(P.id);
  after(() => {
    drawToy("happy"); box.classList.remove("bump"); void box.offsetWidth; box.classList.add("bump"); sfx.boing();
    say(`All better! ${P.name.split(" ")[0]} says thank you, doctor!`);
  }, 700);
  after(() => {
    sfx.yay(); confetti(["⭐", "💖", "🩹", P.icon, "✨"]);
    $("sticker").textContent = P.icon;
    $("party-text").textContent = `${P.name.split(" ")[0]} is all better!`;
    $("party").classList.remove("hidden");
  }, 2300);
}
$("back-btn").addEventListener("click", () => { cancelAll(); hush(); renderMenu(); showScreen("menu"); });
$("next-btn").addEventListener("click", () => openPatient((idx + 1) % PATIENTS.length));
$("menu-btn").addEventListener("click", () => { $("party").classList.add("hidden"); renderMenu(); showScreen("menu"); });
renderMenu();
