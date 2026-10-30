// Little Bakery: pick a recipe, then add → stir → bake → decorate → eat.
const FOOD = {
  flour: { e: "🌾", n: "flour", c: "#f3ead6" }, egg: { e: "🥚", n: "eggs", c: "#ffd65c" }, milk: { e: "🥛", n: "milk", c: "#fbfbff" },
  butter: { e: "🧈", n: "butter", c: "#ffe28a" }, sugar: { e: "🍬", n: "sugar", c: "#fff3f8" }, choc: { e: "🍫", n: "chocolate", c: "#7a4a2a" },
  water: { e: "💧", n: "water", c: "#d8f0ff" }, oil: { e: "🫒", n: "olive oil", c: "#c9c45a" }, yeast: { e: "🧂", n: "a pinch of salt", c: "#f4f4f4" },
  fish: { e: "🐟", n: "a fish" }, sock: { e: "🧦", n: "a sock" }, carrot: { e: "🥕", n: "a carrot" }, shoe: { e: "👟", n: "a shoe" }, rock: { e: "🪨", n: "a rock" }, duck: { e: "🦆", n: "a duck" },
};
const RECIPES = [
  { id: "cupcakes", name: "Cupcakes", icon: "🧁", needs: ["flour", "egg", "sugar", "butter"], silly: ["fish", "sock"], batter: "#f6dfa4",
    spreads: [{ e: "🩷", n: "pink icing", c: "#ff9fcf" }, { e: "🤎", n: "chocolate icing", c: "#7a4a2a" }, { e: "💙", n: "blue icing", c: "#8fd0ff" }],
    toppings: ["🍓", "🍒", "🫐", "✨", "🍬", "⭐"] },
  { id: "pizza", name: "Pizza", icon: "🍕", needs: ["flour", "water", "oil", "yeast"], silly: ["choc", "shoe"], batter: "#efe2c2",
    spreads: [{ e: "🥫", n: "tomato sauce", c: "#d8432d", layer: "sauce" }, { e: "🧀", n: "cheese", c: "#ffd75e", layer: "cheese" }],
    toppings: ["🍄", "🫑", "🍍", "🫒", "🍅", "🌿"] },
  { id: "pancakes", name: "Pancakes", icon: "🥞", needs: ["flour", "egg", "milk"], silly: ["carrot", "rock"], batter: "#f6e4b5",
    spreads: [{ e: "🍯", n: "honey", c: "#f2a93b" }, { e: "🍫", n: "chocolate sauce", c: "#6b3a1f" }, { e: "🍓", n: "strawberry sauce", c: "#e8435a" }],
    toppings: ["🍓", "🫐", "🍌", "🧈", "🍒"] },
  { id: "cookies", name: "Cookies", icon: "🍪", needs: ["flour", "butter", "sugar", "choc"], silly: ["duck", "sock"], batter: "#d7a873",
    spreads: [{ e: "🤍", n: "white icing", c: "#fffaf2" }, { e: "🩷", n: "pink icing", c: "#ff9fcf" }],
    toppings: ["🍫", "🍬", "✨", "❤️", "⭐"] },
];
const STEPS = [{ id: "add", e: "🥣" }, { id: "stir", e: "🥄" }, { id: "bake", e: "🔥" }, { id: "decorate", e: "🎨" }, { id: "eat", e: "😋" }];
const BITES = 7, MAX_TOPPINGS = 16;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => "#" + a.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const mixCol = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const blend = (cs) => toHex(cs.map(hex).reduce((s, c) => s.map((v, i) => v + c[i] / cs.length), [0, 0, 0]));
const listOf = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];

const S = { r: null, step: "add", added: [], stir: 0, baked: false, layers: {}, tops: [], bites: [], made: 0 };
const bench = $("bench"), tray = $("tray");

// ---------- Drawing the treats (100×100) ----------
const cakeCol = () => (S.baked ? mixCol(S.r.batter, "#c07a32", S.r.id === "pizza" ? 0.35 : 0.45) : S.r.batter);
const SHAPES = {
  cupcakes: {
    eat: [50, 62, 30],
    zone: [50, 42, 22, 9],
    under: () => "",
    draw: () => {
      const body = cakeCol(), f = S.layers.top;
      return `<path d="M24 58 L32 92 H68 L76 58 Z" fill="#ff9fcf"/><path d="M33 58 L37 92 M42 58 L44 92 M50 58 V92 M58 58 L56 92 M67 58 L63 92" stroke="#ff7cbc" stroke-width="2"/>
        ${S.baked ? `<path d="M20 60 C20 40 34 30 50 30 C66 30 80 40 80 60 Z" fill="${body}"/><path d="M28 46 C34 38 42 36 48 36" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`
          : `<path d="M24 60 C24 52 36 50 50 50 C64 50 76 52 76 60 Z" fill="${body}"/>`}
        ${f ? `<path d="M17 58 C12 50 20 43 27 46 C24 36 36 29 43 33 C45 22 58 22 60 31 C68 26 79 34 75 43 C83 43 88 54 82 60 C70 65 30 65 17 58 Z" fill="${f}"/>
          <path d="M30 44 C36 38 44 38 50 40" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>` : ""}`;
    },
  },
  pizza: {
    eat: [50, 54, 38],
    zone: [50, 54, 24, 24],
    under: () => `<circle cx="50" cy="54" r="45" fill="#c98f55"/><rect x="44" y="0" width="12" height="14" rx="5" fill="#c98f55"/><circle cx="50" cy="5" r="2.5" fill="#8a5a2b"/>`,
    draw: () => {
      const crust = cakeCol();
      return `<circle cx="50" cy="54" r="39" fill="${crust}"/><circle cx="50" cy="54" r="33" fill="${S.baked ? mixCol(crust, "#fff", 0.35) : mixCol(crust, "#fff", 0.2)}"/>
        ${S.layers.sauce ? `<circle cx="50" cy="54" r="32" fill="${S.layers.sauce}"/>` : ""}
        ${S.layers.cheese ? `<path d="M50 25 C58 22 64 30 70 30 C78 34 76 42 82 48 C84 56 78 60 80 68 C76 76 68 74 64 80 C56 84 52 78 46 82 C38 82 36 76 28 74 C22 68 26 62 20 56 C20 48 26 46 26 38 C30 30 38 32 42 26 C46 24 48 26 50 25 Z" fill="${S.layers.cheese}" opacity=".95"/>` : ""}`;
    },
  },
  pancakes: {
    eat: [50, 56, 32],
    zone: [50, 40, 22, 5],
    under: () => `<ellipse cx="50" cy="80" rx="44" ry="13" fill="#ffffff"/><ellipse cx="50" cy="79" rx="32" ry="8" fill="#eef2f8"/>`,
    draw: () => {
      const c = cakeCol(), side = mixCol(c, "#7a4a1a", 0.3);
      let out = "";
      [72, 61, 50, 39].forEach((y) => { out += `<ellipse cx="50" cy="${y + 3}" rx="34" ry="9" fill="${side}"/><ellipse cx="50" cy="${y}" rx="34" ry="9" fill="${c}"/>`; });
      if (S.layers.top) out += `<path d="M22 38 C24 31 76 31 78 38 C78 42 76 46 74 52 C72 55 70 52 70 46 C64 48 58 48 54 47 C53 55 50 58 49 50 C44 48 36 48 32 46 C31 54 27 54 27 46 C24 44 22 42 22 38 Z" fill="${S.layers.top}" opacity=".95"/>`;
      return out;
    },
  },
  cookies: {
    eat: [50, 55, 30],
    zone: [50, 54, 19, 19],
    under: () => `<ellipse cx="50" cy="58" rx="46" ry="38" fill="#e9eef7"/><ellipse cx="50" cy="58" rx="36" ry="29" fill="#dbe3f0"/>`,
    draw: () => {
      const c = cakeCol();
      const chips = [[38, 44], [58, 40], [64, 58], [44, 64], [52, 52], [32, 56], [56, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2.4" fill="#5b3216"/>`).join("");
      return `<circle cx="50" cy="55" r="31" fill="${mixCol(c, "#7a4a1a", 0.25)}"/><circle cx="50" cy="54" r="29" fill="${c}"/>${chips}
        ${S.layers.top ? `<path d="M50 30 C60 30 72 38 72 50 C74 62 66 74 52 76 C40 78 28 70 28 56 C26 42 38 30 50 30 Z" fill="${S.layers.top}"/>` : ""}`;
    },
  },
};
const shape = () => SHAPES[S.r.id];
function treatSvg() {
  const sh = shape();
  const tops = S.tops.map((t) => `<text x="${t.x}" y="${t.y}" font-size="10" text-anchor="middle" dominant-baseline="central">${t.e}</text>`).join("");
  const holes = S.bites.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/><circle cx="${x + 9}" cy="${y - 6}" r="8"/><circle cx="${x - 9}" cy="${y + 5}" r="8"/>`).join("");
  return `<svg viewBox="0 0 100 100"><defs><mask id="bites"><rect x="-10" y="-10" width="120" height="120" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
    <g>${sh.under()}</g><g mask="url(#bites)">${sh.draw()}${tops}</g></svg>`;
}
function bowlSvg() {
  const cols = S.added.map((k) => FOOD[k].c);
  const p = Math.min(1, S.stir);
  const mix = cols.length ? (p > 0 ? mixCol(blend(cols), S.r.batter, p) : blend(cols)) : null;
  const level = Math.min(1, S.added.length / S.r.needs.length);
  const lumps = S.added.map((k, i) => {
    const a = (i * 2.4) % 6.28, x = 100 + Math.cos(a) * 34, y = 74 + Math.sin(a) * 6;
    return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="13" ry="5" fill="${FOOD[k].c}" opacity="${(1 - p).toFixed(2)}" stroke="#0001"/>`;
  }).join("");
  return `<svg viewBox="0 0 200 160" class="bowl-svg">
    <ellipse cx="100" cy="68" rx="82" ry="20" fill="#cfe6f7"/>
    ${mix ? `<ellipse cx="100" cy="${76 - level * 6}" rx="${50 + level * 22}" ry="${10 + level * 5}" fill="${mix}"/>` : ""}
    ${lumps}
    <g class="swirl" transform="rotate(${(S.stir * 900) % 360} 100 72)">
      ${S.step === "stir" ? `<path d="M100 72 m-30 0 a30 8 0 1 0 60 0 a22 6 0 1 0 -44 0 a14 4 0 1 0 28 0" stroke="#ffffff" stroke-opacity="${(0.25 + p * 0.5).toFixed(2)}" stroke-width="2.5" fill="none"/>
        <g transform="rotate(-25 128 60)"><rect x="124" y="4" width="8" height="62" rx="4" fill="#c98a4a"/><ellipse cx="128" cy="68" rx="9" ry="13" fill="#c98a4a"/></g>` : ""}
    </g>
    <path d="M18 68 C18 128 58 152 100 152 C142 152 182 128 182 68 C160 84 40 84 18 68 Z" fill="#7fbfea"/>
    <path d="M30 90 C40 120 60 134 80 138" stroke="#fff" stroke-opacity=".45" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="68" rx="82" ry="20" fill="none" stroke="#5aa8de" stroke-width="5"/>
  </svg>`;
}
function ovenSvg() {
  return `<svg viewBox="0 0 100 100">
    <rect x="8" y="6" width="84" height="88" rx="10" fill="#f2f2f6"/><rect x="8" y="6" width="84" height="20" rx="10" fill="#d8dbe6"/>
    <circle cx="24" cy="16" r="5" fill="#9aa1b8"/><circle cx="40" cy="16" r="5" fill="#9aa1b8"/><rect x="58" y="12" width="26" height="8" rx="3" fill="#2a2d3a"/>
    <text id="oven-clock" x="71" y="17" font-size="6" fill="#7dff9a" text-anchor="middle" dominant-baseline="central" font-family="monospace">180°</text>
    <rect x="18" y="34" width="64" height="48" rx="6" fill="#3a2a2a"/><rect class="oven-light" x="22" y="38" width="56" height="40" rx="4" fill="#5a4040"/>
    <rect x="26" y="62" width="48" height="4" rx="2" fill="#999"/>
    <text x="50" y="${S.baked ? 52 : 55}" font-size="${S.baked ? 20 : 14}" text-anchor="middle" dominant-baseline="central">${S.r.icon}</text>
    <rect x="30" y="28" width="40" height="4" rx="2" fill="#b8bccb"/>
  </svg>`;
}

// ---------- Flow ----------
function renderMenu() {
  const list = $("recipes"); list.innerHTML = "";
  for (const r of RECIPES) {
    const b = document.createElement("button"); b.className = "card";
    b.innerHTML = `<span class="art">${r.icon}</span><span>${r.name}</span>`;
    b.addEventListener("click", () => { sfx.tap(); start(r); });
    list.appendChild(b);
  }
}
function start(r) {
  cancelAll();
  Object.assign(S, { r, added: [], stir: 0, baked: false, layers: {}, tops: [], bites: [] });
  $("recipe-name").textContent = `${r.icon} ${r.name}`;
  $("party").classList.add("hidden");
  showScreen("kitchen");
  go("add");
}
function go(step) {
  S.step = step;
  const now = STEPS.findIndex((s) => s.id === step);
  $("steps").innerHTML = STEPS.map((s, i) => `<li class="${i < now ? "done" : i === now ? "now" : ""}">${s.e}</li>`).join("");
  ({ add: stepAdd, stir: stepStir, bake: stepBake, decorate: stepDecorate, eat: stepEat })[step]();
}
function box(cls, html) {
  bench.innerHTML = `<div class="box ${cls}" id="box">${html}</div>`;
  return $("box");
}
function stepAdd() {
  box("bowl", bowlSvg());
  tray.innerHTML = "";
  for (const k of shuffle([...S.r.needs, ...S.r.silly])) {
    const f = FOOD[k], b = thingButton(f.e, cap(f.n.replace(/^a (pinch of )?/, "")));
    b.dataset.k = k;
    makeDraggable(b, f.e, {
      onTap: () => addThing(k, b),
      onMove: (x, y) => $("box").classList.toggle("glow", isOver($("box"), x, y, 0)),
      onDrop: (x, y) => { $("box").classList.remove("glow"); if (isOver($("box"), x, y)) addThing(k, b, x, y + LIFT); },
    });
    tray.appendChild(b);
  }
  say(`Let's make ${S.r.name.toLowerCase()}! Put in the ${listOf(S.r.needs.map((k) => FOOD[k].n))}.`);
}
function flyIn(icon, from, done) {
  const r = from.getBoundingClientRect ? from.getBoundingClientRect() : null, t = $("box").getBoundingClientRect();
  const l = document.createElement("div"); l.className = "lump"; l.textContent = icon;
  l.style.left = (r ? r.left + r.width / 2 : t.left) + "px"; l.style.top = (r ? r.top : t.top) + "px";
  document.body.appendChild(l);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    l.style.transform = `translate(${t.left + t.width / 2 - parseFloat(l.style.left) - 0}px, ${t.top + t.height * 0.4 - parseFloat(l.style.top)}px) translate(-50%,-50%) scale(.5)`;
    l.style.opacity = "0.2";
  }));
  setTimeout(() => { l.remove(); done(); }, 460);
}
function addThing(k, btn) {
  if (S.step !== "add") return;
  const f = FOOD[k];
  if (!S.r.needs.includes(k)) { sfx.nope(); wiggle(btn); say(`Silly! ${cap(f.n)} doesn't go in ${S.r.name.toLowerCase()}!`); return; }
  if (S.added.includes(k)) { say(`We already have ${f.n}!`); wiggle(btn); return; }
  S.added.push(k); btn.classList.add("used");
  flyIn(f.e, btn, () => {
    sfx.pop(); $("box").innerHTML = bowlSvg();
    const left = S.r.needs.filter((x) => !S.added.includes(x));
    if (!left.length) { sfx.good(); say("Everything's in! Now let's stir."); after(() => go("stir"), 1300); }
    else say(`${cap(f.n)}! Now the ${listOf(left.map((x) => FOOD[x].n))}.`);
  });
}
function stepStir() {
  const b = box("bowl", bowlSvg() + `<div class="meter"><i id="meter"></i></div>`);
  tray.innerHTML = "";
  const spoon = thingButton("🥄", "Stir!");
  spoon.addEventListener("click", () => stirBy(0.12));
  tray.appendChild(spoon);
  say("Stir stir stir! Rub your finger round and round the bowl.");
  let last = null;
  b.addEventListener("pointerdown", (e) => { last = [e.clientX, e.clientY]; b.setPointerCapture && b.setPointerCapture(e.pointerId); b.classList.add("stirring"); });
  b.addEventListener("pointermove", (e) => {
    if (!last) return;
    const d = Math.hypot(e.clientX - last[0], e.clientY - last[1]); last = [e.clientX, e.clientY];
    stirBy(d / (b.clientWidth * 7));
  });
  const stopStir = () => { last = null; b.classList.remove("stirring"); };
  b.addEventListener("pointerup", stopStir); b.addEventListener("pointercancel", stopStir);
}
let _lastSwish = 0;
function stirBy(n) {
  if (S.step !== "stir" || S.stir >= 1) return;
  S.stir = Math.min(1, S.stir + n);
  const svg = $("box").querySelector("svg"); svg.outerHTML = bowlSvg();
  $("meter").style.width = S.stir * 100 + "%";
  const t = performance.now(); if (t - _lastSwish > 180) { hiss(0.08, 0.06); _lastSwish = t; }
  if (S.stir >= 1) { sfx.good(); say("Lovely and smooth! Into the oven."); after(() => go("bake"), 1200); }
}
function stepBake() {
  const b = box("oven", ovenSvg() + `<div id="timer" class="timer"></div>`);
  tray.innerHTML = "";
  const btn = thingButton("🔥", "Bake!"); btn.classList.add("go");
  const bake = () => {
    if (S.baking || S.baked) return;
    S.baking = true; b.classList.add("baking"); btn.classList.add("used");
    say("Into the hot oven. Let's count!");
    let n = 3;
    const tick = () => {
      if (n > 0) { $("timer").textContent = n; tone(500, 0.08, "square", 0.06); say(String(n), false); n--; after(tick, 1000); }
      else {
        S.baking = false; S.baked = true; b.classList.remove("baking"); $("timer").textContent = "";
        b.querySelector("svg").outerHTML = ovenSvg(); sfx.ding();
        say(`Ding! The ${S.r.name.toLowerCase()} ${S.r.id === "pizza" ? "is" : "are"} ready!`);
        after(() => go("decorate"), 1600);
      }
    };
    after(tick, 600);
  };
  btn.addEventListener("click", bake); b.addEventListener("click", bake);
  tray.appendChild(btn);
  say("Tap the oven to bake it!");
}
function stepDecorate() {
  const b = box("treat", treatSvg());
  tray.innerHTML = "";
  for (const sp of S.r.spreads) {
    const t = thingButton(sp.e, cap(sp.n));
    t.addEventListener("click", () => {
      S.layers[sp.layer || "top"] = sp.c; sfx.good(); redraw();
      say(`${cap(sp.n)}! Yum.`);
    });
    tray.appendChild(t);
  }
  for (const e of S.r.toppings) {
    const t = thingButton(e);
    makeDraggable(t, e, {
      onTap: () => topping(e),
      onDrop: (x, y) => { if (isOver($("box"), x, y, 0)) topping(e, x, y); },
    });
    tray.appendChild(t);
  }
  const done = thingButton("✅", "All done!"); done.classList.add("go");
  done.addEventListener("click", () => go("eat"));
  tray.appendChild(done);
  say("Decorate it! Tap the toppings, or drag them where you like.");
}
function toSvg(x, y) { const r = $("box").getBoundingClientRect(); return [((x - r.left) / r.width) * 100, ((y - r.top) / r.height) * 100]; }
function topping(e, x, y) {
  const [cx, cy, rx, ry] = shape().zone;
  let px, py;
  if (x != null) {
    [px, py] = toSvg(x, y);
    const dx = (px - cx) / rx, dy = (py - cy) / ry, d = Math.hypot(dx, dy);
    if (d > 1) { px = cx + (dx / d) * rx; py = cy + (dy / d) * ry; }
  } else { const a = Math.random() * 6.28, d = Math.sqrt(Math.random()); px = cx + Math.cos(a) * rx * d; py = cy + Math.sin(a) * ry * d; }
  S.tops.push({ e, x: +px.toFixed(1), y: +py.toFixed(1) });
  if (S.tops.length > MAX_TOPPINGS) S.tops.shift();
  tone(700 + Math.random() * 400, 0.08); redraw();
}
function redraw() { $("box").innerHTML = treatSvg(); }
function stepEat() {
  const b = box("treat", treatSvg());
  tray.innerHTML = "";
  const bite = thingButton("😋", "Take a bite"); bite.classList.add("go");
  bite.addEventListener("click", () => chomp());
  tray.appendChild(bite);
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); chomp(e.clientX, e.clientY); });
  say("It looks delicious! Tap it to take a bite.");
}
function chomp(x, y) {
  if (S.step !== "eat" || S.bites.length >= BITES) return;
  const [cx, cy, rx, ry] = shape().zone;
  let p;
  if (x != null) { p = toSvg(x, y); if (Math.hypot((p[0] - cx) / (rx + 18), (p[1] - cy) / (ry + 18)) > 1.3) p = null; }
  if (!p) { const [ex, ey, er] = shape().eat, a = S.bites.length * 2.1 + Math.random() * 0.6; p = [ex + Math.cos(a) * er * 0.85, ey + Math.sin(a) * er * 0.85]; }
  S.bites.push(p.map((v) => +v.toFixed(1)));
  sfx.chomp(); crumbs(x, y);
  const left = BITES - S.bites.length;
  if (left <= 0) {
    // gobble the rest
    for (let i = 0; i < 40; i++) S.bites.push([5 + (i % 7) * 15, 5 + Math.floor(i / 7) * 16]);
    redraw(); S.made++;
    after(() => {
      sfx.yay(); confetti([S.r.icon, "⭐", "😋", "💖"]);
      $("sticker").textContent = S.r.icon;
      $("party-text").textContent = `Yum! All gone!`;
      $("party").classList.remove("hidden");
      say(`Yum yum! You baked ${S.r.name.toLowerCase()} and gobbled ${S.r.id === "pizza" ? "it" : "them"} all up!`, false);
    }, 600);
  } else { redraw(); say(pick(["Nom nom!", "Yummy!", "Mmm!", "Crunch!", "Delicious!"])); }
}
function crumbs(x, y) {
  const r = $("box").getBoundingClientRect();
  x = x == null ? r.left + r.width / 2 : x; y = y == null ? r.top + r.height / 2 : y;
  for (let i = 0; i < 6; i++) {
    const c = document.createElement("span"); c.className = "crumb"; c.style.background = cakeCol();
    c.style.left = x + "px"; c.style.top = y + "px"; c.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
    document.body.appendChild(c); setTimeout(() => c.remove(), 700);
  }
}
$("back-btn").addEventListener("click", () => { cancelAll(); hush(); S.baking = false; showScreen("menu"); });
$("again-btn").addEventListener("click", () => start(S.r));
$("menu-btn").addEventListener("click", () => { $("party").classList.add("hidden"); showScreen("menu"); });
renderMenu();
