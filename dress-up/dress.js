// Dress-Up Party: pick a friend, tap clothes to put them on (tap again to take them off),
// pick a place to go, and snap a photo you can save as a PNG.
const PALS = [
  { id: "bear", name: "Bear", icon: "🐻", fur: "#b57d4e", soft: "#e8c49c", nose: "#3a2618" },
  { id: "bunny", name: "Bunny", icon: "🐰", fur: "#f3eefb", soft: "#ffd3e4", nose: "#ff7aa6" },
  { id: "kitty", name: "Kitty", icon: "🐱", fur: "#f5a54a", soft: "#ffe2b8", nose: "#ff7aa6" },
  { id: "froggy", name: "Froggy", icon: "🐸", fur: "#6cc66b", soft: "#cdf2b8", nose: "#2f6b2e" },
];
// Where each kind of thing goes, in the 100×140 stage, and how big the emoji is drawn.
const SPOTS = {
  hat: [[50, 13, 26]], glasses: [[50, 31, 17]], neck: [[50, 48, 14]], top: [[50, 70, 36]], bottom: [[50, 97, 26]],
  shoes: [[38.5, 119, 13], [61.5, 119, 13]], hand: [[83, 76, 20]],
};
const DRESS_SPOT = [50, 82, 52];
const it = (e, n, slot, full) => ({ e, n, slot, full: !!full });
const TABS = [
  { id: "pals", icon: "🐾", label: "Friends" },
  { id: "places", icon: "🗺️", label: "Places" },
  { id: "hats", icon: "👒", label: "Hats", items: [it("👒", "sun hat", "hat"), it("🎩", "top hat", "hat"), it("🧢", "cap", "hat"), it("👑", "crown", "hat"), it("🎓", "graduation hat", "hat"), it("⛑️", "helmet", "hat"), it("🎀", "bow", "hat"), it("🥳", "party hat", "hat")] },
  { id: "face", icon: "🕶️", label: "Glasses", items: [it("👓", "glasses", "glasses"), it("🕶️", "sunnies", "glasses"), it("🥽", "goggles", "glasses"), it("🧣", "scarf", "neck"), it("🏅", "medal", "neck"), it("👔", "tie", "neck"), it("📿", "necklace", "neck")] },
  { id: "clothes", icon: "👕", label: "Clothes", items: [it("👕", "T-shirt", "top"), it("👚", "blouse", "top"), it("🧥", "coat", "top"), it("🥼", "lab coat", "top"), it("🦺", "safety vest", "top"), it("🎽", "singlet", "top"),
    it("👗", "dress", "top", 1), it("👘", "kimono", "top", 1), it("🩱", "bathers", "top", 1), it("👖", "jeans", "bottom"), it("🩳", "shorts", "bottom"), it("🩲", "swimmers", "bottom")] },
  { id: "shoes", icon: "👢", label: "Shoes", items: [it("👟", "runners", "shoes"), it("👞", "school shoes", "shoes"), it("👢", "boots", "shoes"), it("🥾", "hiking boots", "shoes"), it("👠", "high heels", "shoes"), it("🩴", "thongs", "shoes"), it("🛼", "roller skates", "shoes"), it("🩰", "ballet shoes", "shoes")] },
  { id: "fun", icon: "🎈", label: "Fun", items: [it("🎈", "balloon", "hand"), it("☂️", "umbrella", "hand"), it("🪄", "magic wand", "hand"), it("🧸", "teddy", "hand"), it("💐", "flowers", "hand"), it("👜", "handbag", "hand"), it("🍦", "ice cream", "hand"), it("⚽", "footy", "hand"), it("🎸", "guitar", "hand"), it("🪁", "kite", "hand")] },
];
const PLACES = [
  { id: "home", icon: "🏠", name: "home", draw: () => `<rect width="100" height="140" fill="#ffe9d6"/><rect y="104" width="100" height="36" fill="#d9a877"/>
      <path d="M0 104 H100" stroke="#b88552" stroke-width="2"/><rect x="66" y="18" width="24" height="28" rx="2" fill="#bfe8ff" stroke="#fff" stroke-width="3"/>
      <path d="M78 18 V46 M66 32 H90" stroke="#fff" stroke-width="2"/>${emo("🪴", 10, 92, 16)}${emo("🖼️", 16, 24, 14)}` },
  { id: "park", icon: "🌳", name: "the park", draw: () => `<rect width="100" height="140" fill="#bfe9ff"/><path d="M0 92 C30 86 70 96 100 88 V140 H0 Z" fill="#8fd17a"/>
      <circle cx="86" cy="14" r="8" fill="#ffe14d"/>${emo("🌳", 12, 74, 28)}${emo("🦋", 86, 46, 9)}${emo("🌼", 88, 126, 9)}${emo("🌷", 10, 128, 9)}${emo("☁️", 30, 14, 14)}` },
  { id: "beach", icon: "🏖️", name: "the beach", draw: () => `<rect width="100" height="140" fill="#9fdcff"/><rect y="72" width="100" height="20" fill="#3fb0e8"/>
      <path d="M0 92 C30 88 70 94 100 90 V140 H0 Z" fill="#f7dc9a"/><circle cx="16" cy="14" r="8" fill="#ffe14d"/>
      ${emo("🌴", 12, 72, 30)}${emo("⛱️", 88, 92, 22)}${emo("🦀", 14, 128, 10)}${emo("🐚", 86, 130, 8)}${emo("⛵", 80, 70, 10)}` },
  { id: "snow", icon: "❄️", name: "the snow", at: "in", draw: () => `<rect width="100" height="140" fill="#d6e8ff"/><path d="M0 94 C30 88 70 98 100 90 V140 H0 Z" fill="#fff"/>
      <path d="M0 70 L22 40 L44 70 Z M56 72 L80 36 L100 64 V72 Z" fill="#b8cdec"/><path d="M16 48 L22 40 L28 48 Z M74 45 L80 36 L86 45 Z" fill="#fff"/>
      ${emo("⛄", 86, 104, 22)}${emo("🌲", 12, 96, 22)}${emo("❄️", 20, 16, 8)}${emo("❄️", 82, 22, 7)}${emo("❄️", 50, 6, 6)}` },
  { id: "castle", icon: "🏰", name: "the castle", draw: () => `<rect width="100" height="140" fill="#ffdcf1"/><path d="M0 96 C30 92 70 100 100 94 V140 H0 Z" fill="#c9a7e8"/>
      ${emo("🏰", 86, 82, 26)}${emo("🦄", 13, 106, 18)}${emo("🌈", 80, 18, 18)}${emo("✨", 14, 20, 9)}` },
  { id: "space", icon: "🚀", name: "outer space", at: "in", draw: () => `<rect width="100" height="140" fill="#1b1440"/><circle cx="70" cy="30" r="60" fill="#3a2d80" opacity=".5"/>
      ${[[8, 30], [40, 8], [92, 50], [20, 60], [70, 100], [94, 120], [30, 132], [60, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff"/>`).join("")}
      ${emo("🪐", 84, 16, 18)}${emo("🌙", 14, 14, 13)}${emo("🚀", 12, 90, 16)}${emo("👽", 88, 122, 12)}${emo("⭐", 88, 60, 7)}` },
  { id: "party", icon: "🎉", name: "a party", draw: () => `<rect width="100" height="140" fill="#ffe7a8"/><rect y="70" width="100" height="70" fill="#ffc4d8"/>
      <path d="M0 8 Q25 22 50 8 Q75 22 100 8" stroke="#ff6fa8" stroke-width="1.5" fill="none"/>
      ${[10, 30, 50, 70, 90].map((x, i) => `<path d="M${x - 4} ${9 + (i % 2) * 4} l4 8 l4 -8z" fill="${["#ff4d5e", "#4d8dff", "#ffd23d", "#43c76a", "#9d63ff"][i]}"/>`).join("")}
      ${emo("🎈", 11, 38, 16)}${emo("🎈", 89, 44, 14)}${emo("🎂", 86, 126, 15)}${emo("🎁", 13, 126, 13)}` },
];
const NICE = ["Ooh, fancy!", "Looking great!", "So stylish!", "Love it!", "Wow!", "Very snazzy!", "Gorgeous!"];
function emo(e, x, y, s, extra = "") { return `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="central"${extra}>${e}</text>`; }

const S = { pal: PALS[0], place: PLACES[1], tab: "hats", worn: {}, fresh: null };

function palSvg(p) {
  const f = p.fur, s = p.soft, o = "#00000022";
  let ears = "", face = "";
  if (p.id === "bear") ears = `<circle cx="35" cy="17" r="7" fill="${f}"/><circle cx="65" cy="17" r="7" fill="${f}"/><circle cx="35" cy="17" r="3.5" fill="${s}"/><circle cx="65" cy="17" r="3.5" fill="${s}"/>`;
  if (p.id === "bunny") ears = `<ellipse cx="41" cy="6" rx="5.5" ry="15" fill="${f}" stroke="${o}" transform="rotate(-8 41 6)"/><ellipse cx="59" cy="6" rx="5.5" ry="15" fill="${f}" stroke="${o}" transform="rotate(8 59 6)"/><ellipse cx="41" cy="7" rx="2.6" ry="10" fill="${s}" transform="rotate(-8 41 7)"/><ellipse cx="59" cy="7" rx="2.6" ry="10" fill="${s}" transform="rotate(8 59 7)"/>`;
  if (p.id === "kitty") ears = `<path d="M33 24 L35 9 L46 17 Z" fill="${f}"/><path d="M67 24 L65 9 L54 17 Z" fill="${f}"/><path d="M36 21 L37 13 L43 17 Z" fill="${s}"/><path d="M64 21 L63 13 L57 17 Z" fill="${s}"/>`;
  if (p.id === "froggy") ears = `<circle cx="39" cy="17" r="8" fill="${f}"/><circle cx="61" cy="17" r="8" fill="${f}"/>`;
  const eyeY = p.id === "froggy" ? 16 : 28;
  const eyeR = p.id === "froggy" ? 4.4 : 2.6;
  const eyes = [41, 59].map((x, i) => `${p.id === "froggy" ? `<circle cx="${x - (i ? -0 : 0)}" cy="${eyeY}" r="5.6" fill="#fff"/>` : ""}<circle cx="${p.id === "froggy" ? x : x + (i ? -1 : 1)}" cy="${eyeY}" r="${p.id === "froggy" ? 2.8 : eyeR}" fill="#2a1d33"/><circle cx="${(p.id === "froggy" ? x : x + (i ? -1 : 1)) + 0.9}" cy="${eyeY - 0.9}" r="0.9" fill="#fff"/>`).join("");
  if (p.id === "froggy") face = `<path d="M38 34 Q50 44 62 34" stroke="#2f6b2e" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="46" cy="29" r=".8" fill="#2f6b2e"/><circle cx="54" cy="29" r=".8" fill="#2f6b2e"/>`;
  else face = `<ellipse cx="50" cy="35" rx="8.5" ry="6.5" fill="${s}"/><ellipse cx="50" cy="32.5" rx="2.6" ry="1.8" fill="${p.nose}"/>
      <path d="M46.5 36.5 Q50 39.5 53.5 36.5" stroke="#2a1d33" stroke-width="1" fill="none" stroke-linecap="round"/>
      ${p.id === "kitty" ? `<path d="M40 34 H30 M40 36 L31 38 M60 34 H70 M60 36 L69 38" stroke="#2a1d33" stroke-width=".6"/>` : ""}
      ${p.id === "bunny" ? `<rect x="48.6" y="37.3" width="2.8" height="2.4" rx=".5" fill="#fff" stroke="#0002" stroke-width=".3"/>` : ""}`;
  const head = p.id === "froggy" ? `<ellipse cx="50" cy="30" rx="20" ry="14" fill="${f}"/>` : `<circle cx="50" cy="29" r="16" fill="${f}" ${p.id === "bunny" ? `stroke="${o}"` : ""}/>`;
  return `<g class="pal">
    <ellipse cx="50" cy="128" rx="26" ry="4" fill="#0002"/>
    ${ears}
    <rect x="33" y="94" width="11" height="24" rx="5.5" fill="${f}"/><rect x="56" y="94" width="11" height="24" rx="5.5" fill="${f}"/>
    <ellipse cx="38.5" cy="120" rx="8" ry="4.6" fill="${f}"/><ellipse cx="61.5" cy="120" rx="8" ry="4.6" fill="${f}"/>
    <ellipse cx="25" cy="66" rx="5.5" ry="14" fill="${f}" transform="rotate(25 25 66)"/><ellipse cx="76" cy="66" rx="5.5" ry="14" fill="${f}" transform="rotate(-35 76 66)"/>
    <circle cx="20" cy="77" r="5" fill="${f}"/><circle cx="83" cy="76" r="5" fill="${f}"/>
    <ellipse cx="50" cy="72" rx="20" ry="26" fill="${f}" ${p.id === "bunny" ? `stroke="${o}"` : ""}/>
    <ellipse cx="50" cy="76" rx="12.5" ry="17" fill="${s}"/>
    ${head}
    <circle cx="38" cy="36" r="3" fill="#ff8fb0" opacity=".55"/><circle cx="62" cy="36" r="3" fill="#ff8fb0" opacity=".55"/>
    ${eyes}${face}
  </g>`;
}
function wornSvg() {
  let out = "";
  const order = ["shoes", "bottom", "top", "neck", "glasses", "hat", "hand"];
  for (const slot of order) {
    const w = S.worn[slot]; if (!w) continue;
    const spots = w.full ? [DRESS_SPOT] : SPOTS[slot];
    spots.forEach(([x, y, size], i) => {
      const flip = slot === "shoes" && i === 0 ? ` transform="translate(${2 * x} 0) scale(-1 1)"` : "";
      out += emo(w.e, x, y, size, ` data-slot="${slot}" class="${S.fresh === slot ? "new" : ""}"${flip}`);
    });
  }
  return out;
}
function render() {
  $("stage").innerHTML = `<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">
    <g class="bg">${S.place.draw()}</g>${palSvg(S.pal)}<g class="worn">${wornSvg()}</g></svg>`;
  S.fresh = null;
}
function renderTabs() {
  const tabs = $("tabs"); tabs.innerHTML = "";
  for (const t of TABS) {
    const b = document.createElement("button"); b.className = "tab" + (t.id === S.tab ? " on" : ""); b.setAttribute("role", "tab");
    b.textContent = `${t.icon} ${t.label}`;
    b.addEventListener("click", () => { S.tab = t.id; sfx.tap(); renderTabs(); renderItems(); });
    tabs.appendChild(b);
  }
}
function renderItems() {
  const box = $("items"); box.innerHTML = ""; box.scrollLeft = 0;
  const t = TABS.find((x) => x.id === S.tab);
  if (t.id === "pals") PALS.forEach((p) => add(p.icon, p.name, p === S.pal, () => choosePal(p)));
  else if (t.id === "places") PLACES.forEach((p) => add(p.icon, cap(p.name.replace(/^(the|a) /, "")), p === S.place, () => choosePlace(p)));
  else t.items.forEach((x) => add(x.e, x.n, S.worn[x.slot] === x, () => toggle(x)));
  function add(icon, label, on, fn) {
    const b = thingButton(icon, label); if (on) b.classList.add("on");
    b.addEventListener("click", () => { fn(); renderItems(); });
    box.appendChild(b);
  }
}
function hop() { const g = document.querySelector("#stage .pal"); if (g) wiggle(g, "hop"); }
function toggle(x) {
  if (S.worn[x.slot] === x) { delete S.worn[x.slot]; sfx.boing(); render(); say(`Off comes the ${x.n}.`); return; }
  S.worn[x.slot] = x;
  if (x.full) delete S.worn.bottom;
  if (x.slot === "bottom" && S.worn.top && S.worn.top.full) delete S.worn.top;
  S.fresh = x.slot; sfx.good(); render(); hop();
  say(`${cap(x.n)}! ${pick(NICE)}`);
}
function choosePal(p) { S.pal = p; sfx.good(); render(); hop(); say(`Hello, ${p.name}!`); }
function choosePlace(p) { S.place = p; sfx.good(); render(); say(`Off to ${p.name}!`); }
function surprise() {
  S.worn = {};
  for (const t of TABS) if (t.items) {
    const bySlot = {}; t.items.forEach((x) => (bySlot[x.slot] = bySlot[x.slot] || []).push(x));
    for (const slot in bySlot) if (Math.random() < 0.8) S.worn[slot] = pick(bySlot[slot]);
  }
  if (S.worn.top && S.worn.top.full) delete S.worn.bottom;
  S.place = pick(PLACES); sfx.boing(); render(); hop();
  say(`Surprise! ${S.pal.name} is going ${S.place.id === "home" ? "" : "to "}${S.place.name}!`);
  renderItems();
}
function photo() {
  sfx.snap(); wiggle($("flash"), "go");
  const svg = $("stage").querySelector("svg");
  svgToPngUrl(svg, (url) => {
    if (!url) { say("Oops, the camera didn't work here."); return; }
    $("snap").src = url; $("save-link").href = url;
    $("party-text").textContent = `${S.pal.name} ${S.place.at || "at"} ${S.place.name}!`;
    $("party").classList.remove("hidden");
    say(`Say cheese! ${S.pal.name} looks great.`);
  });
}
// Like kit svgToPng, but hands back the image instead of downloading straight away.
function svgToPngUrl(svgEl, done) {
  const c = svgEl.cloneNode(true); c.setAttribute("width", 600); c.setAttribute("height", 840);
  c.querySelectorAll(".new").forEach((n) => n.removeAttribute("class"));
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement("canvas"); cv.width = 600; cv.height = 840;
    const g = cv.getContext("2d"); g.drawImage(img, 0, 0, 600, 840);
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "bold 22px sans-serif"; g.textAlign = "right"; g.fillText("Dress-Up Party · The Lab", 588, 828);
    try { done(cv.toDataURL("image/png")); } catch (e) { done(null); }
  };
  img.onerror = () => done(null);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(c));
}
$("stage").addEventListener("click", (e) => {
  const t = e.target.closest("text[data-slot]");
  if (t) { const w = S.worn[t.dataset.slot]; if (w) { toggle(w); renderItems(); } return; }
  if (e.target.closest(".pal")) { hop(); sfx.boing(); say(pick(["Hee hee!", "That tickles!", `I'm ${S.pal.name}!`])); }
});
$("dice-btn").addEventListener("click", surprise);
$("photo-btn").addEventListener("click", photo);
$("close-btn").addEventListener("click", () => $("party").classList.add("hidden"));
render(); renderTabs(); renderItems();
say("Pick some clothes for Bear! Tap them to put them on.");
