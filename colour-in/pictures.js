// Colouring pages, drawn in a 100×100 box. Shapes with class "r" can be filled;
// "ln" is a line that stays black; "dot" is a solid black detail. Later shapes sit on top.
const star5 = (cx, cy, R, r = R * 0.45) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return `<path class="r" d="${d}Z"/>`;
};
const daisy = (x, y, s = 1) => [0, 72, 144, 216, 288].map((a) => {
  const px = x + Math.cos((a * Math.PI) / 180) * 3.6 * s, py = y + Math.sin((a * Math.PI) / 180) * 3.6 * s;
  return `<circle class="r" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(2.6 * s).toFixed(1)}"/>`;
}).join("") + `<circle class="r" cx="${x}" cy="${y}" r="${(2.4 * s).toFixed(1)}"/>`;

const PICTURES = [
  { id: "fish", name: "Fish", svg: `
    <rect class="r" x="0" y="0" width="100" height="100"/>
    <path class="r" d="M0 82 C20 76 40 88 60 82 S90 78 100 84 V100 H0 Z"/>
    <path class="r" d="M8 84 C3 72 12 64 7 52 C16 60 15 72 14 84 Z"/>
    <path class="r" d="M30 86 C28 76 35 72 31 63 C39 69 38 78 37 86 Z"/>
    ${star5(80, 91, 6.5)}
    <path class="r" d="M14 94 a7 6 0 0 1 14 0 Z"/><path class="ln" d="M21 94 v-5 M17.5 94 l-1.5-4 M24.5 94 l1.5-4"/>
    <path class="r" d="M27 46 L8 31 L13 46 L8 61 Z"/>
    <path class="r" d="M44 31 C48 19 61 19 65 30 Z"/>
    <path class="r" d="M47 61 C49 71 58 73 61 62 Z"/>
    <path class="r" d="M26 46 C34 28 66 26 81 44 C83 46 83 50 81 52 C66 70 34 66 26 46 Z"/>
    <path class="r" d="M43 31 C38 40 38 54 43 63 L52 65 C47 54 47 40 52 29 Z"/>
    <path class="ln" d="M67 35 C63 43 63 52 67 58"/>
    <circle class="r" cx="73" cy="42" r="5"/><circle class="dot" cx="74" cy="42" r="2.2"/>
    <path class="ln" d="M81 50 q-3 2 -6 1"/>
    <circle class="r" cx="89" cy="30" r="4"/><circle class="r" cx="93" cy="18" r="3"/><circle class="r" cx="87" cy="8" r="2.2"/>` },
  { id: "house", name: "House", svg: `
    <rect class="r" x="0" y="0" width="100" height="78"/>
    <path class="r" d="M0 74 C30 69 70 79 100 72 V100 H0 Z"/>
    <circle class="r" cx="85" cy="15" r="8"/>
    <path class="ln" d="M85 3 v-2 M97 15 h2 M93.5 6.5 l1.5-1.5 M93.5 23.5 l1.5 1.5 M73 15 h-2 M76.5 6.5 l-1.5-1.5"/>
    <path class="r" d="M10 20 a6 6 0 0 1 10-5 a7 7 0 0 1 12 1 a5 5 0 0 1 2 9 H12 a5 5 0 0 1 -2 -5 Z"/>
    <rect class="r" x="62" y="22" width="9" height="16"/>
    <path class="r" d="M16 47 L50 19 L84 47 Z"/>
    <rect class="r" x="23" y="47" width="54" height="33"/>
    <path class="r" d="M44 80 V64 a6 6 0 0 1 12 0 V80 Z"/><circle class="dot" cx="53" cy="72" r="1"/>
    <rect class="r" x="28" y="54" width="11" height="11"/><rect class="r" x="61" y="54" width="11" height="11"/>
    <path class="ln" d="M33.5 54 v11 M28 59.5 h11 M66.5 54 v11 M61 59.5 h11"/>
    <circle class="r" cx="50" cy="38" r="4.5"/>
    <path class="r" d="M44 80 L38 100 H62 L56 80 Z"/>
    <path class="r" d="M80 82 a6 6 0 0 1 6-8 a6 6 0 0 1 10 2 a5 5 0 0 1 1 8 H82 a4 4 0 0 1 -2 -2 Z"/>
    <path class="ln" d="M12 96 v-8"/>${daisy(12, 86)}
    <path class="ln" d="M24 98 v-6"/>${daisy(24, 90, 0.8)}` },
  { id: "butterfly", name: "Butterfly", svg: `
    <rect class="r" x="0" y="0" width="100" height="100"/>
    <path class="r" d="M0 88 C30 84 70 94 100 86 V100 H0 Z"/>
    <path class="r" d="M48 46 C32 16 6 16 9 38 C11 53 34 55 48 50 Z"/>
    <path class="r" d="M52 46 C68 16 94 16 91 38 C89 53 66 55 52 50 Z"/>
    <path class="r" d="M48 53 C34 56 18 66 25 78 C32 88 46 74 48 59 Z"/>
    <path class="r" d="M52 53 C66 56 82 66 75 78 C68 88 54 74 52 59 Z"/>
    <circle class="r" cx="26" cy="35" r="6"/><circle class="r" cx="74" cy="35" r="6"/>
    <circle class="r" cx="37" cy="44" r="3"/><circle class="r" cx="63" cy="44" r="3"/>
    <circle class="r" cx="33" cy="69" r="4"/><circle class="r" cx="67" cy="69" r="4"/>
    <ellipse class="r" cx="50" cy="54" rx="3.6" ry="19"/>
    <circle class="r" cx="50" cy="32" r="5"/>
    <path class="ln" d="M48 28 Q43 16 38 12 M52 28 Q57 16 62 12"/>
    <circle class="r" cx="37.5" cy="11.5" r="2"/><circle class="r" cx="62.5" cy="11.5" r="2"/>
    <path class="ln" d="M12 96 v-8 M88 96 v-8"/>${daisy(12, 85)}${daisy(88, 85)}` },
  { id: "rocket", name: "Rocket", svg: `
    <rect class="r" x="0" y="0" width="100" height="100"/>
    <circle class="r" cx="17" cy="80" r="12"/>
    <path class="r" d="M2 84 C10 76 28 74 33 76 C34 79 30 80 28 79 C20 79 10 82 4 86 Z"/>
    <path class="r" d="M80 8 a11 11 0 1 0 12 14 a9 9 0 1 1 -12 -14 Z"/>
    ${star5(16, 18, 6)}${star5(84, 58, 5)}${star5(30, 48, 3.5)}${star5(74, 88, 4)}
    <path class="r" d="M37 54 L24 72 L38 67 Z"/><path class="r" d="M63 54 L76 72 L62 67 Z"/>
    <path class="r" d="M50 10 C63 22 65 40 62 67 H38 C35 40 37 22 50 10 Z"/>
    <path class="r" d="M50 10 C55 15 58 20 60 26 H40 C42 20 45 15 50 10 Z"/>
    <path class="r" d="M37 55 H63 V60 H37.3 Z"/>
    <circle class="r" cx="50" cy="40" r="8"/><circle class="r" cx="50" cy="40" r="5"/>
    <rect class="r" x="42" y="67" width="16" height="5" rx="1"/>
    <path class="r" d="M42 72 Q50 99 58 72 Z"/><path class="r" d="M46 72 Q50 88 54 72 Z"/>` },
  { id: "icecream", name: "Ice Cream", svg: `
    <rect class="r" x="0" y="0" width="100" height="100"/>
    <path class="r" d="M0 92 H100 V100 H0 Z"/>
    ${star5(14, 20, 6)}${star5(86, 30, 5)}${star5(18, 64, 4)}${star5(84, 74, 4.5)}
    <path class="r" d="M33 56 L50 94 L67 56 Z"/>
    <path class="ln" d="M38 62 L60 66 M36 58 L63 63 M41 70 L57 73 M45 79 L55 81 M40 58 L56 90 M50 58 L60 74 M60 57 L64 61 M46 56 L41 64"/>
    <path class="r" d="M29 58 C24 46 38 40 50 43 C62 40 76 46 71 58 C68 62 64 56 60 60 C56 64 54 58 50 60 C45 63 42 57 38 60 C34 63 31 61 29 58 Z"/>
    <path class="r" d="M33 44 C29 30 42 24 50 27 C58 24 71 30 67 44 C60 40 40 40 33 44 Z"/>
    <path class="r" d="M38 29 C36 17 45 12 50 14 C55 12 64 17 62 29 C56 26 44 26 38 29 Z"/>
    <path class="ln" d="M52 9 Q53 3 58 1"/><circle class="r" cx="51" cy="10" r="4.5"/>
    <rect class="r" x="42" y="18" width="5" height="2" rx="1" transform="rotate(-30 44 19)"/>
    <rect class="r" x="54" y="20" width="5" height="2" rx="1" transform="rotate(25 56 21)"/>
    <rect class="r" x="40" y="34" width="5" height="2" rx="1" transform="rotate(20 42 35)"/>
    <rect class="r" x="55" y="33" width="5" height="2" rx="1" transform="rotate(-25 57 34)"/>` },
];
