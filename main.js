// main.js

//import needed methods
import { rectanglesIntersect, pointInRect } from './geometry.js';
import {
    pathTiles,
    highlightedPath,
    generatePathTiles,
    findPathBetweenBuildings
} from './pathfinding.js';

// set up html canvas
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 700;

// set up some variables
let buildings = [];
let startBuilding = null;
let endBuilding = null;
let searchedBuildings = [];
let selectedBuilding = null;
const infoBox = document.getElementById('infoBox');
let lastMouseX = 0, lastMouseY = 0;

// store references to search input and results
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

//adjust color, using for hover effect
function adjustColor(color, percent) {
    // Remove the # from the color
    color = color.replace('#', '');

    // Split color into r,g,b parts
    //2 chars in the hex color
    const red = parseInt(color.substring(0, 2), 16);
    const green = parseInt(color.substring(2, 4), 16);
    const blue = parseInt(color.substring(4, 6), 16);

    // Calculate how much to adjust each color
    // percent of 100 means add 255, percent of -100 means subtract 255
    const adjustment = Math.round(255 * (percent / 100));

    // Adjust each color and make sure it stays between 0 and 255
    const newRed = Math.min(255, Math.max(0, red + adjustment));
    const newGreen = Math.min(255, Math.max(0, green + adjustment));
    const newBlue = Math.min(255, Math.max(0, blue + adjustment));

    // Convert each color back to hex and make sure it's 2 digits
    const toHex = (num) => {
        const hex = num.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    // Put it all back together
    return '#' + toHex(newRed) + toHex(newGreen) + toHex(newBlue);
}

//draw entire map, including paths, highlighted route, and buildings
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw all walkable tiles
    pathTiles.forEach(t => {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(t.x, t.y, t.width, t.height);
    });

    // draw all path tiles
    highlightedPath.forEach(t => {
        ctx.fillStyle = '#FFD700'; // Gold color for the path
        ctx.fillRect(t.x, t.y, t.width, t.height);
    });

    // Buildings
    buildings.forEach(b => {
        let fill = '#8FAADC'; // Default building color

        // Determine building color based on state
        if (b === startBuilding) {
            fill = '#90EE90'; // Start building color
        } else if (b === endBuilding) {
            fill = '#FFB6C1'; // End building color
        } else if (searchedBuildings.includes(b)) {
            fill = '#FFA500'; // Orange for searched buildings
        } else if (b === selectedBuilding) {
            fill = '#FFD700'; // Yellow for selected building
        }

        // Hover effect
        const hover = pointInRect(lastMouseX, lastMouseY, b);
        ctx.fillStyle = hover ? adjustColor(fill, 20) : fill;

        // Add glow effect for selected building
        if (b === selectedBuilding) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowBlur = 0;
        }

        // Rounded rectangle
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(b.x + r, b.y);
        ctx.lineTo(b.x + b.width - r, b.y);
        ctx.quadraticCurveTo(b.x + b.width, b.y, b.x + b.width, b.y + r);
        ctx.lineTo(b.x + b.width, b.y + b.height - r);
        ctx.quadraticCurveTo(b.x + b.width, b.y + b.height, b.x + b.width - r, b.y + b.height);
        ctx.lineTo(b.x + r, b.y + b.height);
        ctx.quadraticCurveTo(b.x, b.y + b.height, b.x, b.y + b.height - r);
        ctx.lineTo(b.x, b.y + r);
        ctx.quadraticCurveTo(b.x, b.y, b.x + r, b.y);
        ctx.closePath();
        ctx.fill();

        // Reset shadow for border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#2d3a4a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#2d3a4a';
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 4;

        // Calculate appropriate font size based on box dimensions and text length
        const maxFontSize = 15; // Maximum font size
        const minFontSize = 8;  // Minimum font size
        const padding = 4;      // Padding from box edges
        const lineHeight = 1.2; // Line height multiplier

        // Start with max font size and reduce until text fits
        let fontSize = maxFontSize;
        let textWidth;
        let words = b.name.split(' ');
        let lines = [];

        do {
            ctx.font = `${fontSize}px "Segoe UI",Arial,sans-serif`;
            lines = [];
            let currentLine = [];

            // Try to fit words into lines
            for (let word of words) {
                const testLine = [...currentLine, word];
                const testWidth = ctx.measureText(testLine.join(' ')).width;

                if (testWidth <= b.width - padding * 2) {
                    currentLine.push(word);
                } else {
                    if (currentLine.length > 0) {
                        lines.push(currentLine.join(' '));
                    }
                    currentLine = [word];
                }
            }
            if (currentLine.length > 0) {
                lines.push(currentLine.join(' '));
            }

            // Check if all lines fit in the box height
            const totalHeight = lines.length * fontSize * lineHeight;
            if (totalHeight > b.height - padding * 2) {
                fontSize = Math.max(minFontSize, fontSize - 1);
            } else {
                break;
            }
        } while (fontSize > minFontSize);

        // Draw each line
        const totalHeight = lines.length * fontSize * lineHeight;
        const startY = b.y + (b.height - totalHeight) / 2 + fontSize / 2;

        lines.forEach((line, index) => {
            const y = startY + index * fontSize * lineHeight;
            ctx.fillText(line, b.x + b.width / 2, y);
        });

        ctx.shadowBlur = 0;
    });
}

// Mouse move to track hover
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    lastMouseX = (e.clientX - rect.left) * scaleX;
    lastMouseY = (e.clientY - rect.top) * scaleY;
    drawMap();
});

// Handle building selection (used by both search and click)
function handleBuildingSelection(building) {
    selectedBuilding = building;
    searchedBuildings = []; // Clear searched buildings when selecting a new building

    // Only clear path and colors if there's an existing path
    if (highlightedPath.length > 0) {
        highlightedPath.length = 0;
        startBuilding = null;
        endBuilding = null;
    }

    // Update info box with dynamic buttons
    let buttonHtml = '';
    if (!startBuilding) {
        buttonHtml = '<button id="setStartPoint" class="action-button start-button">Set as Starting Point</button>';
    } else if (!endBuilding && building !== startBuilding) {
        buttonHtml = '<button id="setEndPoint" class="action-button end-button">Set as End Point</button>';
    }

    infoBox.innerHTML = `
    <h2>${building.name}</h2>
    <p>${building.info}</p>
    ${buttonHtml}
  `;

    // Add event listeners for the dynamic buttons
    const setStartButton = document.getElementById('setStartPoint');
    const setEndButton = document.getElementById('setEndPoint');

    if (setStartButton) {
        setStartButton.addEventListener('click', () => {
            startBuilding = building;
            endBuilding = null;
            highlightedPath.length = 0;
            selectedBuilding = null;
            searchedBuildings = []; // Clear searched buildings
            infoBox.innerHTML = `
        <h2>${building.name}</h2>
        <p>${building.info}</p>
        <p class="status-text">(Selected as START)</p>
        <button id="clearSelection" class="action-button clear-button">Clear Selection</button>
      `;
            document.getElementById('clearSelection').onclick = () => {
                startBuilding = endBuilding = null;
                highlightedPath.length = 0;
                selectedBuilding = null;
                searchedBuildings = []; // Clear searched buildings
                infoBox.innerHTML = '';
                drawMap();
            };
            drawMap();
        });
    }

    if (setEndButton) {
        setEndButton.addEventListener('click', () => {
            endBuilding = building;
            findPathBetweenBuildings(startBuilding, endBuilding);
            selectedBuilding = null;
            searchedBuildings = []; // Clear searched buildings
            infoBox.innerHTML = `
        <h2>${building.name}</h2>
        <p>${building.info}</p>
        <p class="status-text">(Selected as END)</p>
        <button id="clearSelection" class="action-button clear-button">Clear Selection</button>
      `;
            document.getElementById('clearSelection').onclick = () => {
                startBuilding = endBuilding = null;
                highlightedPath.length = 0;
                selectedBuilding = null;
                searchedBuildings = []; // Clear searched buildings
                infoBox.innerHTML = '';
                drawMap();
            };
            drawMap();
        });
    }

    // Clear search if it was from search
    if (searchInput.value) {
        searchInput.value = '';
        searchResults.style.display = 'none';
    }

    drawMap();
}

// Click to select start/end and compute path
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const clicked = buildings.find(b => pointInRect(x, y, b)) || null;

    if (clicked) {
        handleBuildingSelection(clicked);
    }
});

function searchLocations(query) {
    query = query.toLowerCase();
    searchedBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(query) ||
        building.info.toLowerCase().includes(query)
    );
    return searchedBuildings;
}

function displaySearchResults(results) {
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.style.display = 'none';
        searchedBuildings = [];
        drawMap();
        return;
    }

    results.forEach(building => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
      <div class="name">${building.name}</div>
      <div class="info">${building.info}</div>
    `;

        div.addEventListener('click', () => {
            handleBuildingSelection(building);
        });

        searchResults.appendChild(div);
    });

    searchResults.style.display = 'block';
    drawMap();
}

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length === 0) {
        searchResults.style.display = 'none';
        searchedBuildings = [];
        drawMap();
        return;
    }

    const results = searchLocations(query);
    displaySearchResults(results);
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
        if (!infoBox.contains(e.target) && !canvas.contains(e.target)) {
            selectedBuilding = null;
            drawMap();
        }
    }
});

/**
 * Load building definitions and initialize map.
 */
async function loadBuildings() {
    try {
        const res = await fetch('buildings.json');
        const data = await res.json();
        buildings = data.filter(b => !b.isPath);
        generatePathTiles(buildings, canvas);
        drawMap();
    } catch (err) {
        console.error('Failed to load buildings:', err);
    }
}

// Kickoff
loadBuildings();
