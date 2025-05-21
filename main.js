// main.js
import { rectanglesIntersect, pointInRect } from './geometry.js';
import {
  pathTiles,
  highlightedPath,
  generatePathTiles,
  findPathBetweenBuildings
} from './pathfinding.js';

// Canvas setup
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 700;

// State
let buildings = [];
let startBuilding = null;
let endBuilding = null;
const infoBox = document.getElementById('infoBox');
let lastMouseX = 0, lastMouseY = 0;

/**
 * Brighten or darken a hex color.
 */
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#',''),16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num>>16) + amt));
  const G = Math.min(255, Math.max(0, (num>>8 & 0xFF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0xFF) + amt));
  return '#' + ((1<<24) + (R<<16) + (G<<8) + B).toString(16).slice(1);
}

/**
 * Draw the entire map: paths, highlighted route, buildings.
 */
function drawMap() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Background paths
  pathTiles.forEach(t => {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(t.x, t.y, t.width, t.height);
  });

  // Highlighted route
  highlightedPath.forEach(t => {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(t.x, t.y, t.width, t.height);
  });

  // Buildings
  buildings.forEach(b => {
    let fill = '#8FAADC';
    if (b === startBuilding) fill = '#90EE90';
    else if (b === endBuilding) fill = '#FFB6C1';

    // Hover effect
    const hover = pointInRect(lastMouseX, lastMouseY, b);
    ctx.fillStyle = hover ? adjustColor(fill,20) : fill;

    // Rounded rectangle
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(b.x+r, b.y);
    ctx.lineTo(b.x+b.width-r, b.y);
    ctx.quadraticCurveTo(b.x+b.width, b.y, b.x+b.width, b.y+r);
    ctx.lineTo(b.x+b.width, b.y+b.height-r);
    ctx.quadraticCurveTo(b.x+b.width, b.y+b.height, b.x+b.width-r, b.y+b.height);
    ctx.lineTo(b.x+r, b.y+b.height);
    ctx.quadraticCurveTo(b.x, b.y+b.height, b.x, b.y+b.height-r);
    ctx.lineTo(b.x, b.y+r);
    ctx.quadraticCurveTo(b.x, b.y, b.x+r, b.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2d3a4a'; ctx.lineWidth = 2; ctx.stroke();

    // Label
    ctx.font = '15px "Segoe UI",Arial,sans-serif';
    ctx.fillStyle = '#2d3a4a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(b.name, b.x + b.width/2, b.y + b.height/2);
    ctx.shadowBlur = 0;
  });
}

// Mouse move to track hover
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  lastMouseX = e.clientX - r.left;
  lastMouseY = e.clientY - r.top;
  drawMap();
});

// Click to select start/end and compute path
canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const clicked = buildings.find(b => pointInRect(x,y,b)) || null;

  if (clicked) {
    if (!startBuilding) {
      startBuilding = clicked;
      highlightedPath.length = 0;
    } else if (!endBuilding && clicked !== startBuilding) {
      endBuilding = clicked;
      findPathBetweenBuildings(startBuilding, endBuilding);
    } else {
      startBuilding = clicked;
      endBuilding = null;
      highlightedPath.length = 0;
    }

    infoBox.innerHTML = `
      <h2>${clicked.name}</h2>
      <p>${clicked.info}</p>
      ${startBuilding===clicked?'<p>(START)</p>':''}
      ${endBuilding===clicked?'<p>(END)</p>':''}
      <button id="clearSelection">Clear</button>
    `;
    document.getElementById('clearSelection').onclick = () => {
      startBuilding = endBuilding = null;
      highlightedPath.length = 0;
      infoBox.innerHTML = '';
      drawMap();
    };
  } else {
    startBuilding = endBuilding = null;
    highlightedPath.length = 0;
    infoBox.innerHTML = '';
  }
  drawMap();
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
