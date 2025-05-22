// pathfinding.js
import { rectanglesIntersect } from './geometry.js';

// Tiles representing walkable grid positions
export let pathTiles = [];
// Sequence of tiles for current highlighted path
export let highlightedPath = [];


export function generatePathTiles(buildings, canvas) {
  pathTiles.length = 0;
  const TILE_SIZE = 8; // Increased tile size for better performance
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
    for (let t = 0; t <= 1; t += 0.25) {
      pts.push({ x: rect.x + rect.width * t, y: rect.y });
      pts.push({ x: rect.x + rect.width * t, y: rect.y + rect.height });
      pts.push({ x: rect.x, y: rect.y + rect.height * t });
      pts.push({ x: rect.x + rect.width, y: rect.y + rect.height * t });
    }
    return pts;
  };

  const pa = sampleEdge(a), pb = sampleEdge(b);
  let best = { dist: Infinity, pair: null };
  
  for (const p1 of pa) {
    for (const p2 of pb) {
      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);
      const d = dx + dy;
      if (d < best.dist) {
        best = { dist: d, pair: { start: p1, end: p2 } };
      }
    }
  }
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

  // Find the nearest path tile to the building
  const nearest = (point, building) => {
    let best = { d: Infinity, tile: null };
    
    // First try to find an adjacent tile
    for (const t of pathTiles) {
      const c = tileCenter(t);
      const d = Math.abs(c.x - point.x) + Math.abs(c.y - point.y);
      
      const isAdjacent = 
        (t.x + t.width === building.x) || // Right of building
        (t.x === building.x + building.width) || // Left of building
        (t.y + t.height === building.y) || // Below building
        (t.y === building.y + building.height); // Above building
      
      if (d < best.d && isAdjacent) {
        best = { d, tile: t };
      }
    }

    // If no adjacent tile found, find the closest non-adjacent tile
    if (!best.tile) {
      for (const t of pathTiles) {
        const c = tileCenter(t);
        const d = Math.abs(c.x - point.x) + Math.abs(c.y - point.y);
        if (d < best.d) {
          best = { d, tile: t };
        }
      }
    }

    return best.tile;
  };

  const sTile = nearest(start, startB);
  const eTile = nearest(end, endB);

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

  // Maximum iterations to prevent infinite loops
  const MAX_ITERATIONS = 100000;
  let iterations = 0;
  let found = false;

  while (queue.length && iterations < MAX_ITERATIONS) {
    iterations++;
    const cur = queue.shift();
    
    if (cur === eTile) {
      found = true;
      break;
    }

    for (const {dx, dy} of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      const nb = pathTiles.find(t => t.x === nx && t.y === ny);
      if (nb && !visited.has(key(nb))) {
        visited.add(key(nb));
        parent.set(key(nb), cur);
        queue.push(nb);
      }
    }
  }

  // If we still haven't found a path, try a more aggressive approach
  if (!found) {
    visited.clear();
    queue.length = 0;
    queue.push(sTile);
    parent.clear();
    parent.set(key(sTile), null);
    visited.add(key(sTile));

    while (queue.length && iterations < MAX_ITERATIONS * 2) {
      iterations++;
      const cur = queue.shift();
      
      if (cur === eTile) {
        found = true;
        break;
      }

      for (const {dx, dy} of dirs) {
        const nx = cur.x + dx * 2, ny = cur.y + dy * 2;
        const nb = pathTiles.find(t => t.x === nx && t.y === ny);
        if (nb && !visited.has(key(nb))) {
          visited.add(key(nb));
          parent.set(key(nb), cur);
          queue.push(nb);
        }
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
