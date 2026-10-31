// Snake 2 level layouts on a 24×24 grid.
// walls: [x,y] cells · movers: sliding blocks · portals: linked pairs · wrap: edges wrap around.
window.SNAKE_LEVELS = (() => {
  const N = 24;
  const rect = (x, y, w, h) => { const c = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) c.push([x + i, y + j]); return c; };
  const hline = (x1, x2, y) => rect(x1, y, x2 - x1 + 1, 1);
  const vline = (x, y1, y2) => rect(x, y1, 1, y2 - y1 + 1);
  const ring = (x1, y1, x2, y2, gaps = []) => {
    const c = [...hline(x1, x2, y1), ...hline(x1, x2, y2), ...vline(x1, y1 + 1, y2 - 1), ...vline(x2, y1 + 1, y2 - 1)];
    return c.filter(([x, y]) => !gaps.some(([gx, gy]) => gx === x && gy === y));
  };
  const minus = (cells, holes) => cells.filter(([x, y]) => !holes.some(([hx, hy]) => hx === x && hy === y));
  // mover: slides along an axis between min and max (inclusive lane), len cells long, one step every `every` obstacle ticks
  const mover = (axis, fixed, min, max, len, every = 1, at = min) => ({ axis, fixed, min, max, len, every, pos: at, sgn: 1 });
  const portal = (ax, ay, bx, by) => ({ a: [ax, ay], b: [bx, by] });

  return { N, list: [
    { name: "Open Field", goal: 6, start: [6, 12, 1, 0], walls: [] },
    { name: "Four Pillars", goal: 8, start: [4, 12, 1, 0], walls: [...rect(5, 5, 3, 3), ...rect(16, 5, 3, 3), ...rect(5, 16, 3, 3), ...rect(16, 16, 3, 3), ...rect(11, 11, 2, 2)] },
    { name: "Wraparound", goal: 8, wrap: true, start: [4, 3, 1, 0],
      walls: [...hline(4, 9, 12), ...hline(14, 19, 12), ...vline(12, 5, 9), ...vline(12, 14, 19)], tip: "No edges here: go off one side, come back the other." },
    { name: "Corridors", goal: 9, start: [4, 2, 1, 0], walls: [...hline(0, 17, 6), ...hline(6, 23, 12), ...hline(0, 17, 18)] },
    { name: "Portals", goal: 9, start: [4, 14, 0, -1], walls: minus(vline(12, 0, 23), []),
      portals: [portal(6, 5, 18, 18), portal(6, 18, 18, 5)], tip: "Swirls are portals. In one, out the other." },
    { name: "Patrol", goal: 10, start: [4, 21, 1, 0], walls: [...rect(3, 3, 2, 2), ...rect(19, 3, 2, 2), ...rect(11, 11, 2, 2)],
      movers: [mover("x", 7, 0, 23, 4, 1), mover("x", 16, 0, 23, 4, 1, 16), mover("y", 18, 0, 13, 3, 2, 4)], tip: "Red blocks move. Time your run." },
    { name: "Spiral", goal: 10, start: [4, 1, 1, 0],
      walls: [...ring(3, 3, 20, 20, [[11, 3], [12, 3]]), ...ring(7, 7, 16, 16, [[11, 16], [12, 16]]), ...rect(11, 11, 2, 2)],
      movers: [mover("y", 22, 2, 21, 3, 2)] },
    { name: "Four Rooms", goal: 11, start: [4, 4, 1, 0],
      walls: minus([...vline(12, 0, 23), ...hline(0, 23, 12)], [[12, 5], [12, 6], [12, 17], [12, 18], [5, 12], [6, 12], [17, 12], [18, 12]]),
      portals: [portal(2, 2, 21, 21), portal(21, 2, 2, 21)],
      movers: [mover("x", 9, 14, 23, 3, 2), mover("x", 15, 0, 11, 3, 2)] },
    { name: "Rush Hour", goal: 11, wrap: true, start: [4, 2, 1, 0],
      movers: [mover("x", 5, 0, 23, 5, 1), mover("x", 9, 0, 23, 4, 2, 12), mover("x", 13, 0, 23, 6, 1, 6), mover("x", 17, 0, 23, 4, 2, 18), mover("x", 21, 0, 23, 5, 1, 9)],
      walls: [], tip: "Edges wrap. Dodge the traffic." },
    { name: "The Gauntlet", goal: 12, start: [4, 2, 1, 0],
      walls: [...hline(0, 9, 5), ...hline(14, 23, 5), ...vline(5, 9, 15), ...vline(18, 9, 15), ...hline(8, 15, 12), ...hline(0, 9, 19), ...hline(14, 23, 19)],
      portals: [portal(1, 12, 22, 12)],
      movers: [mover("x", 8, 6, 17, 3, 1), mover("x", 16, 6, 17, 3, 1, 14), mover("y", 11, 20, 23, 2, 2), mover("y", 12, 0, 4, 2, 2, 2)] },
  ] };
})();
