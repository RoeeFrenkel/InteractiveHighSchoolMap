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

// Function to fetch building data
async function loadBuildings() {
  try {
    const response = await fetch("buildings.json"); // Load the JSON file
    buildings = await response.json();
    drawMap(); // Redraw the map after loading data
  } catch (error) {
    console.error("Error loading buildings:", error);
  }
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

// Load buildings from JSON file and draw the map
loadBuildings();

