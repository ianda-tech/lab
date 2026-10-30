// Tag filter for the hub.
const chips = document.querySelectorAll(".chip");
const tiles = document.querySelectorAll(".tile");
const count = document.getElementById("count");
const empty = document.getElementById("empty");
chips.forEach((chip) => chip.addEventListener("click", () => {
  const tag = chip.dataset.tag;
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
  let shown = 0;
  tiles.forEach((t) => { t.hidden = !!tag && !t.dataset.tags.split(" ").includes(tag); if (!t.hidden) shown++; });
  count.textContent = shown + (shown === 1 ? " project" : " projects");
  empty.hidden = shown > 0;
}));
