// Monster Munch: the monster asks for N of a food. Feed it that many, by tapping or dragging into its mouth.
const FOODS = [
  { e: "🍎", one: "apple", many: "apples" }, { e: "🍌", one: "banana", many: "bananas" }, { e: "🍓", one: "strawberry", many: "strawberries" },
  { e: "🥕", one: "carrot", many: "carrots" }, { e: "🍪", one: "cookie", many: "cookies" }, { e: "🍩", one: "doughnut", many: "doughnuts" },
  { e: "🍊", one: "orange", many: "oranges" }, { e: "🍇", one: "bunch of grapes", many: "bunches of grapes" }, { e: "🧁", one: "cupcake", many: "cupcakes" },
  { e: "🥦", one: "broccoli", many: "broccolis" }, { e: "🍉", one: "watermelon slice", many: "watermelon slices" }, { e: "🍕", one: "slice of pizza", many: "slices of pizza" },
];
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const SKINS = ["#7bd389", "#76a8ff", "#c08cff", "#ff9f68", "#ff7eb6", "#4fd1d9", "#f2c94c"];
const S = { stars: 0, n: 0, fed: 0, food: null, skin: null, busy: false, eyes: 2 };

function monsterSvg(skin, eyes) {
  const eyeSpots = eyes === 1 ? [[50, 36, 15]] : eyes === 3 ? [[32, 38, 9], [50, 30, 10], [68, 38, 9]] : [[35, 36, 11], [65, 36, 11]];
  return `<svg viewBox="0 0 100 100" aria-label="Hungry monster">
    <path d="M30 18 Q22 4 30 2 Q34 10 38 14 Z" fill="#ffe9a8"/><path d="M70 18 Q78 4 70 2 Q66 10 62 14 Z" fill="#ffe9a8"/>
    <ellipse cx="8" cy="60" rx="7" ry="13" fill="${skin}" transform="rotate(-25 8 60)"/>
    <ellipse cx="92" cy="60" rx="7" ry="13" fill="${skin}" transform="rotate(25 92 60)"/>
    <ellipse cx="33" cy="95" rx="13" ry="5.5" fill="${skin}"/><ellipse cx="67" cy="95" rx="13" ry="5.5" fill="${skin}"/>
    <path d="M50 9 C80 9 93 30 93 57 C93 84 76 96 50 96 C24 96 7 84 7 57 C7 30 20 9 50 9 Z" fill="${skin}"/>
    <path d="M50 9 C80 9 93 30 93 57 C88 34 72 18 50 18 C28 18 12 34 7 57 C7 30 20 9 50 9 Z" fill="#fff" opacity=".18"/>
    <ellipse cx="50" cy="80" rx="22" ry="12" fill="#fff" opacity=".2"/>
    <circle cx="20" cy="70" r="3.5" fill="#000" opacity=".1"/><circle cx="82" cy="46" r="2.5" fill="#000" opacity=".1"/><circle cx="78" cy="78" r="4" fill="#000" opacity=".1"/>
    ${eyeSpots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><g class="pupil" data-x="${x}" data-y="${y}" data-r="${r}"><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#23194a"/><circle cx="${x + r * 0.18}" cy="${y - r * 0.18}" r="${r * 0.15}" fill="#fff"/></g>`).join("")}
    <g class="open"><ellipse id="mouth" cx="50" cy="66" rx="21" ry="15" fill="#5a1f3a"/><ellipse cx="50" cy="75" rx="11" ry="5" fill="#ff7b9c"/>
      <path d="M36 53 L40 60 L44 53 Z M56 53 L60 60 L64 53 Z" fill="#fff"/></g>
    <path class="shut" d="M30 64 Q50 80 70 64" stroke="#5a1f3a" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function look(x, y) {
  document.querySelectorAll("#monster .pupil").forEach((p) => {
    const svg = p.ownerSVGElement, r = svg.getBoundingClientRect(), k = r.width / 100;
    const ex = r.left + +p.dataset.x * k, ey = r.top + +p.dataset.y * k;
    const a = Math.atan2(y - ey, x - ex), d = Math.min(1, Math.hypot(x - ex, y - ey) / 200) * +p.dataset.r * 0.45;
    p.setAttribute("transform", `translate(${(Math.cos(a) * d).toFixed(1)} ${(Math.sin(a) * d).toFixed(1)})`);
  });
}
const mouthEl = () => document.querySelector("#monster #mouth") || $("monster");

function newRound() {
  cancelAll(); S.busy = false;
  S.skin = pick(SKINS.filter((c) => c !== S.skin)); S.eyes = pick([1, 2, 2, 3]);
  const max = Math.min(10, 3 + Math.floor(S.stars / 2)), min = S.stars < 4 ? 1 : 2;
  let n; do n = rand(min, max); while (n === S.n && max > min);
  S.n = n; S.fed = 0; S.food = pick(FOODS.filter((f) => f !== S.food));
  const m = $("monster"); m.innerHTML = monsterSvg(S.skin, S.eyes); m.className = "monster hungry";
  $("want-num").textContent = n;
  $("want-slots").innerHTML = Array.from({ length: n }, () => `<span class="slot">${S.food.e}</span>`).join("");
  wiggle($("bubble"), "pop");
  const tray = $("tray"); tray.innerHTML = "";
  const options = shuffle([S.food, ...shuffle(FOODS.filter((f) => f !== S.food)).slice(0, 3)]);
  for (const f of options) {
    const b = thingButton(f.e, cap(f.many));
    makeDraggable(b, f.e, {
      onTap: () => feed(f, b),
      onMove: (x, y) => { look(x, y); $("monster").classList.toggle("target", isOver($("monster"), x, y, 0)); },
      onDrop: (x, y) => { $("monster").classList.remove("target"); if (isOver($("monster"), x, y, 10)) feed(f, b); },
    });
    tray.appendChild(b);
  }
  ask();
}
function ask() { say(`I want ${NUM[S.n]} ${S.n === 1 ? S.food.one : S.food.many}! ${S.n === 1 ? "" : "Count them in."}`); }
function popNumber(text) {
  const r = mouthEl().getBoundingClientRect(), p = document.createElement("div");
  p.className = "count-pop"; p.textContent = text; p.style.left = r.left + r.width / 2 + "px"; p.style.top = r.top + "px";
  document.body.appendChild(p); setTimeout(() => p.remove(), 1000);
}
function feed(f, btn) {
  if (S.busy) return;
  const m = $("monster");
  if (f !== S.food) {
    sfx.nope(); wiggle(m, "yuck"); wiggle(btn);
    say(`Yuck! I don't want ${f.many}. I want ${S.food.many}!`);
    return;
  }
  S.fed++;
  sfx.chomp(); wiggle(m, "chomp");
  const slots = document.querySelectorAll("#want-slots .slot"); if (slots[S.fed - 1]) slots[S.fed - 1].classList.add("full");
  popNumber(S.fed);
  tone(300 + S.fed * 60, 0.15, "triangle", 0.15);
  if (S.fed >= S.n) {
    S.busy = true; S.stars++;
    $("stars").textContent = "⭐ " + S.stars;
    after(() => {
      m.className = "monster happy"; sfx.yay();
      if (S.stars % 5 === 0) confetti(["⭐", "🎉", S.food.e, "💚"]);
      say(`${cap(NUM[S.n])}! Yum yum, thank you! I'm full.`);
    }, 350);
    after(newRound, 2900);
  } else say(cap(NUM[S.fed]) + "!");
}
$("menu-monster").innerHTML = monsterSvg("#7bd389", 2).replace('class="open"', 'class="open" style="display:inline"').replace('class="shut"', 'class="shut" style="display:none"');
$("start-btn").addEventListener("click", () => { sfx.tap(); showScreen("game"); newRound(); });
$("back-btn").addEventListener("click", () => { cancelAll(); hush(); showScreen("menu"); });
$("bubble").addEventListener("click", ask);
document.addEventListener("pointermove", (e) => { if ($("game").classList.contains("active")) look(e.clientX, e.clientY); });
