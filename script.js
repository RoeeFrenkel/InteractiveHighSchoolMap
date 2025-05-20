// Get canvas and context
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Global variables
let buildings = []; // Will be populated dynamically
let userLocation = { x: 50, y: 50 };
let targetLocation = null;

// Get reference to the info and user coordinates divs
const infoBox = document.getElementById("infoBox");
const userCoordsDiv = document.getElementById("userCoords");

// Function to load the buildings data
async function loadBuildings() {
  try {
    const response = await fetch('buildings.json');
    const buildings = await response.json();
    return buildings;
  } catch (error) {
    console.error('Error loading buildings:', error);
    return [];
  }
}

// Function to create a button for a building
function createBuildingButton(building) {
  const button = document.createElement('button');
  button.className = 'building-button';
  button.textContent = building.name;
  button.style.width = '100%';
  button.style.height = '100%';
  
  // Add click event listener
  button.addEventListener('click', () => showBuildingInfo(building));
  
  return button;
}

// Function to display building information
function showBuildingInfo(building) {
  const infoElement = document.getElementById('buildingInfo');
  infoElement.innerHTML = `
    <h3>Building ${building.name}</h3>
    <p><strong>ID:</strong> ${building.id}</p>
    <p><strong>Information:</strong> ${building.info}</p>
    <p><strong>Location:</strong> (${building.x}, ${building.y})</p>
    <p><strong>Dimensions:</strong> ${building.width}x${building.height}</p>
  `;
}

// Function to draw the map
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each building
  buildings.forEach(building => {
    ctx.fillStyle = "#8FAADC";
    ctx.fillRect(building.x, building.y, building.width, building.height);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(building.x, building.y, building.width, building.height);

    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(building.name, building.x + building.width / 2, building.y + building.height / 2);
  });

  // Draw the user's location as a red circle
  ctx.beginPath();
  ctx.arc(userLocation.x, userLocation.y, 8, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // Draw navigation path if needed
  if (targetLocation) {
    ctx.beginPath();
    ctx.moveTo(userLocation.x, userLocation.y);
    ctx.lineTo(targetLocation.x, targetLocation.y);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// Utility function to check if a point is inside a rectangle
function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
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
    targetLocation = {
      x: clickedBuilding.x + clickedBuilding.width / 2,
      y: clickedBuilding.y + clickedBuilding.height / 2
    };

    infoBox.innerHTML = `<div>
                           <h2>${clickedBuilding.name}</h2>
                           <p>${clickedBuilding.info}</p>
                           <button id="navigateButton">Navigate</button>
                         </div>`;

    document.getElementById("navigateButton").addEventListener("click", function () {
      drawMap();
    });
  } else {
    targetLocation = null;
    infoBox.innerHTML = "";
  }

  drawMap();
});

// Try to get the user's GPS location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    userCoordsDiv.innerHTML = `Your Location: Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
    userLocation.x = 50; // Replace with conversion logic if needed
    userLocation.y = 50;

    drawMap();
  }, function (error) {
    console.log("Geolocation error. Using default location.");
    userCoordsDiv.innerHTML = "Using default location.";
  });
} else {
  console.log("Geolocation not supported. Using default location.");
  userCoordsDiv.innerHTML = "Geolocation not supported. Using default location.";
}

// Initialize the application
async function initializeApp() {
  const buildings = await loadBuildings();
  const buildingButtonsContainer = document.getElementById('buildingButtons');
  
  // Sort buildings by ID for consistent display
  buildings.sort((a, b) => a.id - b.id);
  
  // Create buttons for each building
  buildings.forEach(building => {
    const button = createBuildingButton(building);
    buildingButtonsContainer.appendChild(button);
  });
}

// Start the application when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);

