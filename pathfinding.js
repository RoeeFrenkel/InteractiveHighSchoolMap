// pathfinding.js
import { rectanglesIntersect } from './geometry.js';

// Tiles representing walkable grid positions
export let pathTiles = [];
// Sequence of tiles for current highlighted path
export let highlightedPath = [];


//path id is negative to distinguish from building id
//builidngs properties: x, y, width, height
export function generatePathTiles(buildings, canvas) {
  pathTiles.length = 0;
  const TILE_SIZE = 6;
  let pathId = -1;

  //go through canvas, and create a grid
  for (let y = 0; y < canvas.height; y += TILE_SIZE) {
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
      //create tile
      const tile = { x, y, width: TILE_SIZE, height: TILE_SIZE };

      //check for overlap with buildings (path is only non overlapping tiles)
      let overlaps = false;
      for (let b of buildings) {
        if (rectanglesIntersect(tile, b)) {
          overlaps = true;
          break;
        }
      }
      //if no overlap, add to the path tiles  array
      if (!overlaps) {
        pathTiles.push({
          id: pathId--,
          name: 'path',
          info: 'walkable path',
          x: tile.x,          
          y: tile.y, 
          width: tile.width,  
          height: tile.height,
          isPath: true
        });
      }
    }
  }
}


//helper function to find closest points between two rectangles
//uses manhattan dist
//returns a pair of points
function findClosestPoints(a, b) {

  //helper function, givven rectangle, return points from each edge
  const sampleEdge = rect => {
    const pts = [];
    //5 points per edge
    for (let t = 0; t <= 1; t += 0.25) {
      pts.push({ x: rect.x + rect.width * t, y: rect.y });
      pts.push({ x: rect.x + rect.width * t, y: rect.y + rect.height });
      pts.push({ x: rect.x, y: rect.y + rect.height * t });
      pts.push({ x: rect.x + rect.width, y: rect.y + rect.height * t });
    }
    return pts;
  };

  //get points from each rectangle
  const pa = sampleEdge(a);
  const pb = sampleEdge(b);

  //set original closest pair distance to infinity, and pair to null
  let best = { dist: Infinity, pair: null };

  //compare all points gathered 
  for (const p1 of pa) {
    for (const p2 of pb) {
      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);
      //manhattan distance
      const d = dx + dy;
      if (d < best.dist) {
        best = { dist: d, pair: { start: p1, end: p2 } };
      }
    }
  }
  return best.pair;
}

//Find shortest path+ highlight
//use BFS
export function findPathBetweenBuildings(startB, endB) {
  //find closest points between two buildings
  const { start, end } = findClosestPoints(startB, endB);
  
  //helper function to find center of tile
  //helps for properly measuring distance
  const tileCenter = tile => ({ x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 });
  
  //helper function to find nearest tile to point
  const nearest = (point, building) => {
    let best = { d: Infinity, tile: null };

    for (const t of pathTiles) {
      const c = tileCenter(t);
      const d = Math.abs(c.x - point.x) + Math.abs(c.y - point.y);
      
      if (d < best.d) {
        best = { d, tile: t };
      }
    }

    return best.tile;
  };

  //find neares tile for start and end points
  const sTile = nearest(start, startB);
  const eTile = nearest(end, endB);

  // BFS

  //arrow func that creates key for each tile
  const key = t => `${t.x},${t.y}`;

  //set directions of movement, up down, lef, right
  const dirs = [
    { dx: 0, dy: -sTile.height },
    { dx: 0, dy: sTile.height },
    { dx: -sTile.width, dy: 0 },
    { dx: sTile.width, dy: 0 }
  ];

  // Helper function to run BFS with given step size
  const runBFS = (stepSize = 1) => {
    // Initialize empty visited tiles object
    const visitedTiles = {};
    
    // Start with the start tile in our queue
    const nextToVisit = [sTile];
    
    //max iterations check to prevent infinite loop
    let iterations = 0;
    const MAX_ITERATIONS = 100000;
    
    while ((nextToVisit.length > 0) && (iterations < MAX_ITERATIONS)) {
      iterations++;
      //remove and get first tile in queue
      const current = nextToVisit.shift();

      // Mark current tile as visited if not already - used for start tile
      if (visitedTiles[key(current)] == null) {
        visitedTiles[key(current)] = { tile: current, visited: true, parent: null };
      }

      

      //iterate through dx, dy pairs in dirs
      for (const { dx, dy } of dirs) {
        const newX = current.x + (dx * stepSize);
        const newY = current.y + (dy * stepSize);
        //find first tile that matches new position
        const neighborTile = pathTiles.find(t => t.x === newX && t.y === newY);
        
        //check if neighbortile found,
        if (neighborTile) {
          const neighborKey = key(neighborTile);
          if (!visitedTiles[neighborKey]) {
            //set it to visited, and set the value in visited, so we don't run into  the if it's not in visisted check from before
            visitedTiles[neighborKey] = { tile: neighborTile, visited: true, parent: current };
            nextToVisit.push(neighborTile);
          }
        }
      }

      //if we've made it to the end, return the visited tiles set
      if (current === eTile) {
        return { found: true, visitedTiles };
      }
    }
    return { found: false, visitedTiles };
  };

  // Try running normal BFS first
  let { found, visitedTiles } = runBFS();

  // If no path found, try with larger steps
  if (!found) {
    ({ found, visitedTiles } = runBFS(2));
  }

  // Reconstruct path
  highlightedPath = [];
  let step = eTile;
  //go through all steps as long as step is defined
  while (step) {
    //add tile to highlighted path
    highlightedPath.push(step);
    step = visitedTiles[key(step)].parent  
  }

  highlightedPath.reverse();

  //main has access to highlighted path
}
