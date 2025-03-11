// Get canvas and context
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Define buildings as simple rectangles with building info
const buildings = [
  { id: 1, name: "Library", info: "The school library, a hub of learning.", x: 100, y: 100, width: 150, height: 100 },
  { id: 2, name: "Science Center", info: "Science labs and classrooms.", x: 400, y: 150, width: 200, height: 150 },
  { id: 3, name: "Gymnasium", info: "The school gymnasium for sports and events.", x: 250, y: 400, width: 180, height: 120 }
];

// Default user location on the canvas (if geolocation not available)
let userLocation = { x: 50, y: 50 };

// This will store the target location (building center) when a building is clicked
let targetLocation = null;

// Get reference to the info and user coordinates divs
const infoBox = document.getElementById("infoBox");
const userCoordsDiv = document.getElementById("userCoords");

// Function to draw the map
function drawMap() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the background
  ctx.fillStyle = "#e0e0e0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw each building
  buildings.forEach(building => {
    ctx.fillStyle = "#8FAADC";
    ctx.fillRect(building.x, building.y, building.width, building.height);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(building.x, building.y, building.width, building.height);
    
    // Draw building name at center
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
  
  // If a navigation target is set, draw a blue line (the path)
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
  return (x >= rect.x && x <= rect.x + rect.width &&
          y >= rect.y && y <= rect.y + rect.height);
}

// Handle canvas clicks to detect building clicks
canvas.addEventListener("click", function(e) {
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
    // Set target location to the center of the clicked building
    targetLocation = {
      x: clickedBuilding.x + clickedBuilding.width / 2,
      y: clickedBuilding.y + clickedBuilding.height / 2
    };
    
    // Update the info box with building info and a "Navigate" button
    infoBox.innerHTML = `<div>
                           <h2>${clickedBuilding.name}</h2>
                           <p>${clickedBuilding.info}</p>
                           <button id="navigateButton">Navigate</button>
                         </div>`;
    
    // Add click handler to the Navigate button
    document.getElementById("navigateButton").addEventListener("click", function() {
      // Redraw the map (the blue path is drawn automatically if targetLocation is set)
      drawMap();
    });
  } else {
    // If no building was clicked, clear info and the navigation path
    targetLocation = null;
    infoBox.innerHTML = "";
  }
  
  drawMap();
});

// Try to get the user's GPS location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    
    // Display the user's coordinates
    userCoordsDiv.innerHTML = `Your Location: Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
    
    // NOTE: In a real application, convert (lat, lon) to your map's coordinate system.
    // For this prototype, we simply update the user location to a fixed point for demonstration.
    userLocation.x = 50; // Replace with conversion logic if needed
    userLocation.y = 50; // Replace with conversion logic if needed
    
    drawMap();
  }, function(error) {
    console.log("Geolocation error or permission denied. Using default location.");
    userCoordsDiv.innerHTML = "Using default location.";
  });
} else {
  console.log("Geolocation not supported. Using default location.");
  userCoordsDiv.innerHTML = "Geolocation not supported. Using default location.";
}

// Initial draw
drawMap();
