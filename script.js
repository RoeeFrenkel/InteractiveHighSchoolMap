// Get canvas and context
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = 900;
canvas.height = 700;

// Global variables
let buildings = []; // Will be populated dynamically
let startBuilding = null;
let endBuilding = null;
let pathTiles = []; // Store path tiles separately
let highlightedPath = []; // Store the path tiles that make up the current path

// Get reference to the info and user coordinates divs
const infoBox = document.getElementById("infoBox");

// Function to generate path tiles
function generatePathTiles() {
    const TILE_SIZE = 4; // Smaller tiles for more precise paths
    let pathId = -1;
    
    // Generate a grid of path tiles
    for (let y = 0; y < canvas.height; y += TILE_SIZE) {
        for (let x = 0; x < canvas.width; x += TILE_SIZE) {
            // Check if this position overlaps with any existing building
            let overlapsBuilding = false;
            for (const building of buildings) {
                if (rectanglesIntersect(
                    { x, y, width: TILE_SIZE, height: TILE_SIZE },
                    building
                )) {
                    overlapsBuilding = true;
                    break;
                }
            }
            
            if (!overlapsBuilding) {
                pathTiles.push({
                    id: pathId--,
                    name: "path",
                    info: "walkable path",
                    x: x,
                    y: y,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    isPath: true
                });
            }
        }
    }
}

// Helper function to check if two rectangles intersect
function rectanglesIntersect(rect1, rect2) {
    return !(rect2.x > rect1.x + rect1.width || 
           rect2.x + rect2.width < rect1.x || 
           rect2.y > rect1.y + rect1.height ||
           rect2.y + rect2.height < rect1.y);
}

// Helper function to find closest points between two buildings
function findClosestPoints(building1, building2) {
    // Define points to check on each building (edges)
    const getPoints = (building) => {
        const points = [];
        // Add points along the edges for connections
        for (let i = 0; i <= 1; i += 0.2) {
            // Top edge
            points.push({ 
                x: building.x + building.width * i, 
                y: building.y,
                building: building,
                isHorizontalEdge: true
            });
            // Bottom edge
            points.push({ 
                x: building.x + building.width * i, 
                y: building.y + building.height,
                building: building,
                isHorizontalEdge: true
            });
            // Left edge
            points.push({ 
                x: building.x, 
                y: building.y + building.height * i,
                building: building,
                isHorizontalEdge: false
            });
            // Right edge
            points.push({ 
                x: building.x + building.width, 
                y: building.y + building.height * i,
                building: building,
                isHorizontalEdge: false
            });
        }
        return points;
    };

    const points1 = getPoints(building1);
    const points2 = getPoints(building2);

    let minDistance = Infinity;
    let closestPair = null;

    points1.forEach(p1 => {
        points2.forEach(p2 => {
            // Use Manhattan distance for comparison
            const distance = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPair = { start: p1, end: p2 };
            }
        });
    });

    return closestPair;
}

// Function to find path tiles between two buildings
function findPathBetweenBuildings(start, end) {
    const closestPoints = findClosestPoints(start, end);
    const startPoint = closestPoints.start;
    const endPoint = closestPoints.end;

    // Find the closest path tile to a given point
    function closestTileToPoint(point) {
        let minDist = Infinity;
        let closest = null;
        for (const tile of pathTiles) {
            const tileCenter = {
                x: tile.x + tile.width / 2,
                y: tile.y + tile.height / 2
            };
            const dist = Math.abs(tileCenter.x - point.x) + Math.abs(tileCenter.y - point.y);
            if (dist < minDist) {
                minDist = dist;
                closest = tile;
            }
        }
        return closest;
    }

    const startTile = closestTileToPoint(startPoint);
    const endTile = closestTileToPoint(endPoint);

    // BFS for shortest path
    function bfs(startTile, endTile) {
        const queue = [];
        const visited = new Set();
        const parent = new Map();
        
        // Helper to make a unique key for a tile
        function tileKey(tile) {
            return tile.x + "," + tile.y;
        }

        queue.push(startTile);
        visited.add(tileKey(startTile));
        parent.set(tileKey(startTile), null);

        // Directions: up, down, left, right
        const directions = [
            { dx: 0, dy: -startTile.height },
            { dx: 0, dy: startTile.height },
            { dx: -startTile.width, dy: 0 },
            { dx: startTile.width, dy: 0 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === endTile) {
                // Reconstruct path
                let path = [];
                let cur = current;
                while (cur) {
                    path.push(cur);
                    cur = parent.get(tileKey(cur));
                }
                return path.reverse();
            }
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const neighbor = pathTiles.find(t => t.x === nx && t.y === ny);
                if (neighbor && !visited.has(tileKey(neighbor))) {
                    queue.push(neighbor);
                    visited.add(tileKey(neighbor));
                    parent.set(tileKey(neighbor), current);
                }
            }
        }
        return [];
    }

    highlightedPath = bfs(startTile, endTile);
}

// Helper function to check if a point is inside a building
function isPointInsideBuilding(point, building) {
    return point.x >= building.x && point.x <= building.x + building.width &&
           point.y >= building.y && point.y <= building.y + building.height;
}

// Helper function to check if a line segment intersects with a building
function doesLineIntersectBuilding(start, end, building) {
    // If either endpoint is inside the building, consider it not intersecting
    if (isPointInsideBuilding(start, building) || isPointInsideBuilding(end, building)) {
        return false;
    }

    // Check if the line segment intersects any of the building's edges
    const lines = [
        // Top edge
        { x1: building.x, y1: building.y, 
          x2: building.x + building.width, y2: building.y },
        // Right edge
        { x1: building.x + building.width, y1: building.y, 
          x2: building.x + building.width, y2: building.y + building.height },
        // Bottom edge
        { x1: building.x, y1: building.y + building.height, 
          x2: building.x + building.width, y2: building.y + building.height },
        // Left edge
        { x1: building.x, y1: building.y, 
          x2: building.x, y2: building.y + building.height }
    ];

    return lines.some(line => {
        return doLinesIntersect(
            start.x, start.y, end.x, end.y,
            line.x1, line.y1, line.x2, line.y2
        );
    });
}

// Helper function to check if two line segments intersect
function doLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    if (denominator === 0) return false;

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Function to generate Manhattan path points
function generateManhattanPath(start, end) {
    const points = [start];
    
    // Helper function to check if a line segment intersects any building
    function hasBuildingIntersection(p1, p2) {
        for (let building of buildings) {
            if (doesLineIntersectBuilding(p1, p2, building)) {
                return true;
            }
        }
        return false;
    }

    // Check if direct path is blocked
    if (hasBuildingIntersection(start, end)) {
        // Try horizontal-first path
        const horizontalFirst = [
            { x: end.x, y: start.y },
            end
        ];

        // Try vertical-first path
        const verticalFirst = [
            { x: start.x, y: end.y },
            end
        ];

        // Check if either path works
        if (!hasBuildingIntersection(start, horizontalFirst[0]) && 
            !hasBuildingIntersection(horizontalFirst[0], end)) {
            points.push(...horizontalFirst);
        } else if (!hasBuildingIntersection(start, verticalFirst[0]) && 
                   !hasBuildingIntersection(verticalFirst[0], end)) {
            points.push(...verticalFirst);
        } else {
            // Try going around the obstacle
            const offset = 40; // Initial offset distance
            
            // Try going above
            const overPath = [
                { x: start.x, y: start.y - offset },
                { x: end.x, y: start.y - offset },
                end
            ];
            
            // Try going below
            const underPath = [
                { x: start.x, y: start.y + offset },
                { x: end.x, y: start.y + offset },
                end
            ];

            // Check if either detour path works
            if (!hasBuildingIntersection(start, overPath[0]) && 
                !hasBuildingIntersection(overPath[0], overPath[1]) && 
                !hasBuildingIntersection(overPath[1], end)) {
                points.push(...overPath);
            } else if (!hasBuildingIntersection(start, underPath[0]) && 
                       !hasBuildingIntersection(underPath[0], underPath[1]) && 
                       !hasBuildingIntersection(underPath[1], end)) {
                points.push(...underPath);
            } else {
                // Try with larger offset if initial offset didn't work
                const largerOffset = 80;
                const overPathFar = [
                    { x: start.x, y: start.y - largerOffset },
                    { x: end.x, y: start.y - largerOffset },
                    end
                ];
                
                const underPathFar = [
                    { x: start.x, y: start.y + largerOffset },
                    { x: end.x, y: start.y + largerOffset },
                    end
                ];

                if (!hasBuildingIntersection(start, overPathFar[0]) && 
                    !hasBuildingIntersection(overPathFar[0], overPathFar[1]) && 
                    !hasBuildingIntersection(overPathFar[1], end)) {
                    points.push(...overPathFar);
                } else if (!hasBuildingIntersection(start, underPathFar[0]) && 
                           !hasBuildingIntersection(underPathFar[0], underPathFar[1]) && 
                           !hasBuildingIntersection(underPathFar[1], end)) {
                    points.push(...underPathFar);
                } else {
                    // If all else fails, use the vertical-first path
                    points.push(...verticalFirst);
                }
            }
        }
    } else {
        // Direct path works, use it
        points.push(end);
    }

    return points;
}

// Helper function to check if a point is in the path corridor
function isPointInPathCorridor(point, start, end, corridorWidth) {
    const lineLength = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.y - start.y, 2)
    );
    
    if (lineLength === 0) return false;
    
    const u = (
        ((point.x - start.x) * (end.x - start.x)) +
        ((point.y - start.y) * (end.y - start.y))
    ) / (lineLength * lineLength);
    
    if (u < -0.02 || u > 1.02) return false;
    
    const x = start.x + u * (end.x - start.x);
    const y = start.y + u * (end.y - start.y);
    
    const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + 
        Math.pow(y - point.y, 2)
    );
    
    return distance <= corridorWidth;
}

// Function to fetch building data
async function loadBuildings() {
    try {
        const response = await fetch("buildings.json");
        const data = await response.json();
        
        // Separate buildings and path tiles
        buildings = data.filter(b => !b.isPath);
        
        // Generate path tiles
        generatePathTiles();
        
        drawMap();
    } catch (error) {
        console.error("Error loading buildings:", error);
    }
}

// Function to draw the map
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw path tiles first (underneath everything else)
    pathTiles.forEach(tile => {
        if (highlightedPath.includes(tile)) {
            ctx.fillStyle = "rgba(255, 111, 0, 0.8)";
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        }
    });

    // Draw buildings
    buildings.forEach(building => {
        ctx.fillStyle = building === startBuilding ? "#90EE90" : 
                       building === endBuilding ? "#FFB6C1" : "#8FAADC";
        ctx.fillRect(building.x, building.y, building.width, building.height);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(building.x, building.y, building.width, building.height);

        // Text rendering with wrapping and scaling
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        
        // Calculate font size based on building dimensions with better scaling
        const minFontSize = 16; // Increased minimum font size for better readability
        const maxFontSize = 24; // Maximum font size for large buildings
        const area = building.width * building.height;
        
        // Calculate font size using a more aggressive scale for small buildings
        let fontSize = Math.min(
            maxFontSize,
            Math.max(
                minFontSize,
                Math.sqrt(area) * 0.2 // Increased scale factor for larger text in small buildings
            )
        );
        
        ctx.font = `${fontSize}px Arial`;
        
        // Split text into words
        const words = building.name.split(' ');
        const lines = [];
        let currentLine = words[0];

        // Create wrapped lines
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < building.width * 0.9) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        // Draw each line
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = building.y + (building.height - totalHeight) / 2 + fontSize;

        lines.forEach((line, index) => {
            ctx.fillText(line, building.x + building.width / 2, startY + index * lineHeight);
        });
    });
}

// Handle canvas clicks to detect building clicks
canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let clickedBuilding = null;
    for (let building of buildings) {
        if (pointInRect(clickX, clickY, building)) {
            clickedBuilding = building;
            break;
        }
    }

    if (clickedBuilding) {
        if (!startBuilding) {
            startBuilding = clickedBuilding;
            highlightedPath = []; // Clear existing path
        } else if (!endBuilding && clickedBuilding !== startBuilding) {
            endBuilding = clickedBuilding;
            findPathBetweenBuildings(startBuilding, endBuilding);
        } else {
            startBuilding = clickedBuilding;
            endBuilding = null;
            highlightedPath = [];
        }

        infoBox.innerHTML = `<div>
                            <h2>${clickedBuilding.name}</h2>
                            <p>${clickedBuilding.info}</p>
                            ${startBuilding === clickedBuilding ? '<p>(Selected as START)</p>' : ''}
                            ${endBuilding === clickedBuilding ? '<p>(Selected as END)</p>' : ''}
                            <button id="clearSelectionButton">Clear Selection</button>
                            </div>`;

        document.getElementById("clearSelectionButton").addEventListener("click", function () {
            startBuilding = null;
            endBuilding = null;
            highlightedPath = [];
            infoBox.innerHTML = "";
            drawMap();
        });
    } else {
        startBuilding = null;
        endBuilding = null;
        highlightedPath = [];
        infoBox.innerHTML = "";
    }

    drawMap();
});

// Utility function to check if a point is inside a rectangle
function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && 
           y >= rect.y && y <= rect.y + rect.height;
}

// Load buildings from JSON file and draw the map
loadBuildings();