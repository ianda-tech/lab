// Colour In: tap a crayon, tap a shape to fill it. Fills are remembered per picture.
const CRAYONS = [
  ["red", "#ff4d4d"], ["orange", "#ff9a2e"], ["yellow", "#ffe03d"], ["lime", "#a8e05a"], ["green", "#3dbb5c"],
  ["sky blue", "#7fd3ff"], ["blue", "#3f7dff"], ["purple", "#9a5cff"], ["pink", "#ff86c8"], ["brown", "#9b6a43"],
  ["peach", "#ffd2b0"], ["grey", "#a7a7b5"], ["black", "#2b2140"], ["white", "#ffffff"],
  ["magic rainbow", "rainbow"],
];
const INK = "#2b2140";
const RAINBOW = ["#ff4d4d", "#ff9a2e", "#ffe03d", "#3dbb5c", "#3f7dff", "#9a5cff"];
const CHEERS = ["Beautiful!", "What a masterpiece!", "Gorgeous colours!", "Wow, that's lovely!", "Fridge-worthy!"];

let saved = {};
try { saved = JSON.parse(localStorage.getItem("lab-colour-in") || "{}"); } catch (e) {}
const persist = () => { try { localStorage.setItem("lab-colour-in", JSON.stringify(saved)); } catch (e) {} };
const S = { pic: null, crayon: CRAYONS[0] };
let uid = 0;

// Build a picture as a live <svg>, with presentation attributes so it also exports cleanly to PNG.
function buildSvg(pic, interactive) {
  const id = "rbw" + uid++;
  const wrap = document.createElement("div");
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${pic.name} colouring page">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${RAINBOW.map((c, i) => `<stop offset="${(i / (RAINBOW.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("")}</linearGradient></defs>
    ${pic.svg}</svg>`;
  const svg = wrap.firstElementChild;
  svg.dataset.rbw = id;
  const fills = saved[pic.id] || {};
  svg.querySelectorAll(".r").forEach((el, i) => {
    el.dataset.i = i;
    el.setAttribute("stroke", INK); el.setAttribute("stroke-width", "1.1"); el.setAttribute("stroke-linejoin", "round");
    paint(el, fills[i] || "#ffffff", svg);
  });
  svg.querySelectorAll(".ln").forEach((el) => { el.setAttribute("fill", "none"); el.setAttribute("stroke", INK); el.setAttribute("stroke-width", "1.1"); el.setAttribute("stroke-linecap", "round"); });
  svg.querySelectorAll(".dot").forEach((el) => el.setAttribute("fill", INK));
  if (!interactive) svg.style.pointerEvents = "none";
  return svg;
}
function paint(el, colour, svg) { el.setAttribute("fill", colour === "rainbow" ? `url(#${svg.dataset.rbw})` : colour); }

function renderMenu() {
  const list = $("pictures"); list.innerHTML = "";
  for (const p of PICTURES) {
    const b = document.createElement("button"); b.className = "card";
    const art = document.createElement("span"); art.className = "art"; art.appendChild(buildSvg(p, false));
    const name = document.createElement("span"); name.textContent = p.name;
    b.append(art, name);
    b.addEventListener("click", () => { sfx.tap(); openPic(p); });
    list.appendChild(b);
  }
}
function crayonSvg(c) {
  const fill = c === "rainbow" ? "url(#crayon-rbw)" : c;
  return `<svg viewBox="0 0 40 70" aria-hidden="true">
    ${c === "rainbow" ? `<defs><linearGradient id="crayon-rbw" x1="0" y1="0" x2="0" y2="1">${RAINBOW.map((r, i) => `<stop offset="${i / 5}" stop-color="${r}"/>`).join("")}</linearGradient></defs>` : ""}
    <path d="M20 2 L30 20 H10 Z" fill="${fill}" stroke="#0003" stroke-width="1"/>
    <rect x="8" y="20" width="24" height="48" rx="4" fill="${fill}" stroke="#0003" stroke-width="1"/>
    <rect x="8" y="28" width="24" height="6" fill="#fff" opacity=".45"/><rect x="8" y="56" width="24" height="6" fill="#fff" opacity=".45"/>
    <rect x="11" y="22" width="4" height="44" rx="2" fill="#fff" opacity=".35"/>
    ${c === "rainbow" ? `<text x="20" y="50" font-size="14" text-anchor="middle">✨</text>` : ""}
  </svg>`;
}
function renderPalette() {
  const pal = $("palette"); pal.innerHTML = "";
  for (const c of CRAYONS) {
    const b = document.createElement("button");
    b.className = "crayon" + (c === S.crayon ? " on" : ""); b.setAttribute("aria-label", c[0]);
    b.innerHTML = crayonSvg(c[1]);
    b.addEventListener("click", () => {
      S.crayon = c; sfx.tap();
      pal.querySelectorAll(".crayon").forEach((x) => x.classList.toggle("on", x === b));
      say(c[1] === "rainbow" ? "The magic rainbow crayon!" : cap(c[0]) + "!");
    });
    pal.appendChild(b);
  }
}
function openPic(pic) {
  S.pic = pic;
  $("pic-name").textContent = pic.name;
  const page = $("page"); page.innerHTML = "";
  const svg = buildSvg(pic, true);
  svg.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".r"); if (!el) return;
    e.preventDefault();
    const c = S.crayon[1];
    paint(el, c, svg);
    (saved[pic.id] = saved[pic.id] || {})[el.dataset.i] = c;
    persist();
    if (c === "rainbow") { sparkle(e.clientX, e.clientY); tone(880, 0.1); setTimeout(() => tone(1320, 0.12), 80); }
    else tone(400 + Math.random() * 300, 0.08, "triangle", 0.12);
  });
  page.appendChild(svg);
  renderPalette();
  showScreen("colouring");
  say(`Let's colour the ${pic.name.toLowerCase()}! Pick a crayon, then tap the picture.`);
}
function sparkle(x, y) {
  for (let i = 0; i < 4; i++) {
    const s = document.createElement("span"); s.className = "sparkle"; s.textContent = pick(["✨", "⭐", "🌈"]);
    s.style.left = x + (Math.random() - 0.5) * 50 + "px"; s.style.top = y + (Math.random() - 0.5) * 30 + "px";
    document.body.appendChild(s); setTimeout(() => s.remove(), 750);
  }
}
function finish() {
  const f = $("framed"); f.innerHTML = ""; f.appendChild(buildSvg(S.pic, false));
  const msg = pick(CHEERS); $("party-text").textContent = msg;
  $("party").classList.remove("hidden");
  sfx.yay(); confetti(["🖍️", "🎨", "⭐", "🌈", "✨"]); say(msg, false);
}
$("back-btn").addEventListener("click", () => { hush(); renderMenu(); showScreen("menu"); });
$("done-btn").addEventListener("click", finish);
$("keep-btn").addEventListener("click", () => $("party").classList.add("hidden"));
$("new-btn").addEventListener("click", () => { $("party").classList.add("hidden"); renderMenu(); showScreen("menu"); });
$("clear-btn").addEventListener("click", () => { delete saved[S.pic.id]; persist(); $("party").classList.add("hidden"); openPic(S.pic); });
$("save-btn").addEventListener("click", () => {
  svgToPng($("framed").querySelector("svg"), `my-${S.pic.id}.png`, 8, (ok) => say(ok ? "Saved!" : "Sorry, saving didn't work here.", false));
});
renderMenu();
