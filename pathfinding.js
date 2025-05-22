// pathfinding.js
import { rectanglesIntersect } from './geometry.js';

// Tiles representing walkable grid positions
export let pathTiles = [];
// Sequence of tiles for current highlighted path
export let highlightedPath = [];


export function generatePathTiles(buildings, canvas) {
  pathTiles.length = 0;
  const TILE_SIZE = 4;
  let pathId = -1;

  for (let y = 0; y < canvas.height; y += TILE_SIZE) {
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
      const tile = { x, y, width: TILE_SIZE, height: TILE_SIZE };
      let overlaps = buildings.some(b => rectanglesIntersect(tile, b));
      if (!overlaps) {
        pathTiles.push({
          id: pathId--,
          name: 'path',
          info: 'walkable path',
          ...tile,
          isPath: true
        });
      }
    }
  }
}

/**
 * Find closest edge points between two rectangles (Manhattan metric).
 * @param {{x,y,width,height}} a
 * @param {{x,y,width,height}} b
 * @returns {{start:object,end:object}}
 */
function findClosestPoints(a, b) {
  const sampleEdge = rect => {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.2) {
      pts.push({ x: rect.x + rect.width * t, y: rect.y });
      pts.push({ x: rect.x + rect.width * t, y: rect.y + rect.height });
      pts.push({ x: rect.x, y: rect.y + rect.height * t });
      pts.push({ x: rect.x + rect.width, y: rect.y + rect.height * t });
    }
    return pts;
  };

  const pa = sampleEdge(a), pb = sampleEdge(b);
  let best = { dist: Infinity, pair: null };
  pa.forEach(p1 => pb.forEach(p2 => {
    const d = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    if (d < best.dist) best = { dist: d, pair: { start: p1, end: p2 } };
  }));
  return best.pair;
}

/**
 * Find and highlight shortest path tiles between two buildings.
 * @param {object} startB
 * @param {object} endB
 */
export function findPathBetweenBuildings(startB, endB) {
  const { start, end } = findClosestPoints(startB, endB);
  const tileCenter = t => ({ x: t.x + t.width/2, y: t.y + t.height/2 });

  const nearest = point => {
    let best = { d: Infinity, tile: null };
    for (const t of pathTiles) {
      const c = tileCenter(t);
      const d = Math.abs(c.x - point.x) + Math.abs(c.y - point.y);
      if (d < best.d) best = { d, tile: t };
    }
    return best.tile;
  };

  const sTile = nearest(start);
  const eTile = nearest(end);

  // BFS
  const key = t => `${t.x},${t.y}`;
  const dirs = [
    { dx:0, dy:-sTile.height },
    { dx:0, dy:sTile.height },
    { dx:-sTile.width, dy:0 },
    { dx:sTile.width, dy:0 }
  ];

  const queue = [sTile];
  const parent = new Map();
  parent.set(key(sTile), null);
  const visited = new Set([ key(sTile) ]);

  while (queue.length) {
    const cur = queue.shift();
    if (cur === eTile) break;
    for (const {dx, dy} of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      const nb = pathTiles.find(t => t.x===nx && t.y===ny);
      if (nb && !visited.has(key(nb))) {
        visited.add(key(nb));
        parent.set(key(nb), cur);
        queue.push(nb);
      }
    }
  }

  // Reconstruct path
  highlightedPath = [];
  let step = eTile;
  while (step) {
    highlightedPath.push(step);
    step = parent.get(key(step));
  }
  highlightedPath.reverse();
}
