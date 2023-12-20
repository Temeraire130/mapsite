var debug = document.getElementById("debug");
var saveNote = document.getElementById("saveNote");
var loadNote = document.getElementById("loadNote");

/***************** MAP *************************/
// Creating map options
var mapOptions = {
	center: [17.385044, 78.486671],
	zoom: 10,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

// Creating a map object
var map = new L.map('map', mapOptions);

// Creating a Layer object
var layer = new L.TileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png');

// Adding layer to the map
map.addLayer(layer);
/**************************************************/

/****************** GPS **************************/
var x = document.getElementById("p_geoloc");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude;	
	map.setView([position.coords.latitude, position.coords.longitude], 18)
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred."
            break;
    }
}
/******************************************************/

/******************** ROUTING ************************/
var selectedRoute
var routeNames

var routeArray

const routeObjOne = {
    latitude: 49.0073,
    longitude: 8.4227,
    radius: 3
}

const routeObjTwo = {
    latitude: 49.0072,
    longitude: 8.4226,
    radius: 3
}

function save(){
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("routearray", JSON.stringify(routeArray));
        saveNote.innerHTML = "Route successfully saved!"
    } else {
        saveNote.innerHTML = "Browser is not capable of Local Storage features."
    }
}

function load(){
    if (typeof(Storage) !== "undefined") {
        // Retrieve
        return localStorage.getItem("firstroute");
    } else {
        loadNote.innerHTML = "Browser is not capable of Local Storage features."
    }
}

function loadRoute(){
    const routeToLoad = JSON.parse(load());
    if(routeToLoad && routeToLoad.length >= 1){
        debug.innerHTML = JSON.stringify(routeToLoad)
        routeToLoad.forEach(element => {
            const route = element
            L.circle([route.latitude, route.longitude], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: route.radius
            }).addTo(map);
            
        });
        loadNote.innerHTML = "Route successfully loaded!"
    } else {
        loadNote.innerHTML = "Route doesn't contain any elements."
    }
}

//!Alle Routen werden gelöscht
function clearAll(){
    localStorage.clear();
}

function selectRoute(form){

}

function addRoute(form){

}

function addLocToRoute(form){

}

function deleteCurrentRoute(){

}
/*************************************************/

/*****************Distance computation***********/

function getDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371; // Radius of the Earth in kilometers

    // Convert latitude and longitude from degrees to radians
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const radLat1 = degreesToRadians(lat1);
    const radLat2 = degreesToRadians(lat2);

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) *
              Math.cos(radLat1) * Math.cos(radLat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance
    const distance = earthRadiusKm * c;
    return distance;
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/*****************************************************/