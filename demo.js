var debug = document.getElementById("debug");
var activeRoute = document.getElementById("active_route");

/***************** MAP *************************/
// Creating map options
var mapOptions = {
	center: [49, 8.4],
	zoom: 10,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}

// Creating a map object
var map = new L.map('map', mapOptions);

// Creating a Layer object
var layer = new L.TileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png');

// Adding layer to the map
map.addLayer(layer);

var display = L.featureGroup();

map.addLayer(display)

var popup = L.popup();

map.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    popup.setLatLng(e.latlng)
         .setContent('<b class="poptext">You clicked at:</b><br>Latitude: '
             + lat.toString()
             + '<br>Longitude: '
             + lng.toString()
             + '<br><br><center><button id="addclick">Add Point to Route</button>')
        .openOn(map);

    document.getElementById('addclick').addEventListener('click', (e) => {
        addClickedLocation(lat, lng)
    });
})

/**************************************************/

/****************** GPS **************************/
var x = document.getElementById("p_geoloc");
var lastKnownPosition

function showPosition(position) {
    lastKnownPosition = position
    x.innerHTML = "Latitude: " + position.coords.latitude + 
    "<br>Longitude: " + position.coords.longitude;
	map.setView([position.coords.latitude, position.coords.longitude], 18)
    markerUpdate()
    testForPoint(position)
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("error 1")
            x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Error 2")
            x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            console.log("error 4")
            x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            console.log(" error 5")
            x.innerHTML = "An unknown error occurred."
            break;
    }
}
/******************************************************/

/***************** Follow Location *******************/
var following = false
var id

var marker

function toggleFollow(){
    if(navigator.geolocation){
        if(!following){
            id = navigator.geolocation.watchPosition(showPosition, showError)
            following = true
            document.getElementById("follow").textContent = "Stop Centering"
        } else {
            if(id){
                navigator.geolocation.clearWatch(id)
                following = false
                document.getElementById("follow").textContent = "Center on Location"
            } else {
                debug.innerHTML("There is no ID of the handler.")
            }
        }
    }
}

function markerUpdate(){
    if(marker !== undefined && marker !== null){
        map.removeLayer(marker)
    }
    console.log("Pos: " + lastKnownPosition.coords.latitude + lastKnownPosition.coords.longitude)
    marker = L.marker([lastKnownPosition.coords.latitude, lastKnownPosition.coords.longitude]);
    map.addLayer(marker)
}

/*****************************************************/

/********************** Point Interaction *************/
//Defines how long you have to stand inside a point for it to vanish
const checkInterval = 6

var activePoints = new Map()
var ids = new Map()

function testForPoint(position){
    if(selectedRoute && Object.hasOwn(selectedRoute, 'points')){
        selectedRoute.points.forEach((element) => {
            console.log("Testing")
            if(!activePoints.has(element) && element.color == 'red'){
                if(getDistance(position.coords.latitude, position.coords.longitude, element.latitude, element.longitude) * 1000 <= element.radius){
                    activePoints.set(element, 0)
                    console.log("Started for Element " + JSON.stringify(element))
                    startTimer(element)
                }
            }
        })
    }
}

function startTimer(element){
    var intervalId = window.setInterval(() => {
        if(lastKnownPosition.coords.latitude !== undefined && getDistance(lastKnownPosition.coords.latitude, lastKnownPosition.coords.longitude, element.latitude, element.longitude) * 1000 <= element.radius){
            if(activePoints.get(element) >= checkInterval){
                const index = selectedRoute.points.indexOf(element);
                selectedRoute.points.splice(index, 1);
                console.log("Ready: " + JSON.stringify(element))
                selectedRoute.points.push({
                    latitude: element.latitude,
                    longitude: element.longitude,
                    radius: element.radius,
                    color: 'green',
                    fillColor: 'green'
                })
                activePoints.delete(element)
                window.clearInterval(ids.get(element))
                ids.delete(element)
                loadRoute()
                updateToPoints()
            } else {
                var value = activePoints.get(element)
                value++
                console.log("Tick " + value + " For: " + JSON.stringify(element))
                activePoints.set(element, value)
            }
        } else {
            activePoints.delete(element)
            window.clearInterval(ids.get(element))
            ids.delete(element)
        }
    },
    //Set time interval in milliseconds for checking whether location is still in the radius
     1000)
    ids.set(element, intervalId)
}

/*****************************************************/

/******************** ROUTING ************************/
var selectedRoute

var routeArray

function save(){
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("routearray", JSON.stringify(routeArray));
        debug.innerHTML = "Route successfully saved!"
    } else {
        debug.innerHTML = "Browser is not capable of Local Storage features."
    }
}

function searchRouteByName(searchedName){
    var route
    routeArray.forEach(element => {
        if(element.name === searchedName) route = element
    });
    return route
}

function routeExists(checkedName){
    if(routeArray){
        var flag = false
        routeArray.forEach(element => {
            if(element.name === checkedName) flag = true
        });
        return flag;
    } else {
        return false;
    }
}

function addRoute(toAdd){
    load()
    routeArray.push(toAdd)
    save()
}

function deleteRoute(toDelete){
    var route = searchRouteByName(toDelete)
    if(route){
        const index = routeArray.indexOf(route);
        routeArray.splice(index, 1);
        save()
        return true
    } else {
        return false
    }
}

function load(){
    if (typeof(Storage) !== "undefined") {
        routeArray = JSON.parse(localStorage.getItem("routearray"))
        return true
    } else {
        loadNote.innerHTML = "Browser is not capable of Local Storage features."
        return false
    }
}

function loadRoute(){
    console.debug("Route: " + selectedRoute)
    console.debug("Route has points: " + Object.hasOwn(selectedRoute, 'points'))
    console.debug("Test")
    console.debug("Route has more than one point: " + (selectedRoute.points.length >= 1))
    if(selectedRoute && Object.hasOwn(selectedRoute, 'points') && selectedRoute.points.length >= 0){
        console.log("loadedRoute: " + JSON.stringify(selectedRoute))
        map.removeLayer(display)
        display = null
        display = L.featureGroup()
        selectedRoute.points.forEach(element => {
            L.circle([element.latitude, element.longitude], {
                color: element.color,
                fillColor: element.fillColor,
                fillOpacity: 0.5,
                radius: element.radius
            }).addTo(display);
        });
        map.addLayer(display)
        debug.innerHTML = "Route successfully loaded!"
    } else {
        debug.innerHTML = "Selected Route doesn't contain any elements."
    }
}

function updateToPoints(){
    if(selectedRoute !== undefined && selectedRoute !== null){
        if(Object.hasOwn(selectedRoute, 'points') && selectedRoute.points.length > 0){
            var visited = 0
            selectedRoute.points.forEach((element) => {
                if(element.color == 'green'){
                    visited++
                }
            })
            document.getElementById("topoints").innerHTML = "Visited " + visited + " / " + selectedRoute.points.length + " points."
        } else {
            document.getElementById("topoints").innerHTML = ""
        }
    } else {
        document.getElementById("topoints").innerHTML = ""
    }
}

//!Alle Routen werden gelöscht
function clearAll(){
    localStorage.clear();
}

function selectRoute(){
    load()
    if(routeExists(document.getElementById("myInput").value)){
        selectedRoute = searchRouteByName(document.getElementById("myInput").value)
        activeRoute.innerHTML = selectedRoute.name
        loadRoute()
        updateToPoints()
    } else {
        debug.innerHTML = "There is no Route with that name!"
    }
}

function addNewRoute(){
    debug.innerHTML = document.getElementById("nameRoute").value
    const newRoute = {
        name: document.getElementById("nameRoute").value,
        points: []
    }

    if(load()){
        if(routeArray != null){
            if(!routeExists(newRoute.name)){
                routeArray.push(newRoute)
                save()
                selectedRoute = newRoute
                activeRoute.innerHTML = selectedRoute.name
                loadRoute()
                debug.innerHTML = "Successfully created Route!"
                document.getElementById("nameRoute").value = ""
            } else {
                debug.innerHTML = "A Route with that name already exists!"
            }
        } else {
            routeArray = new Array()
            routeArray.push(newRoute)
            save()
            selectedRoute = newRoute
            activeRoute.innerHTML = selectedRoute.name
            loadRoute()
            debug.innerHTML = "Successfully created Route!"
            document.getElementById("nameRoute").value = ""
        }
    } else {
        routeArray = new Array()
        routeArray.push(newRoute)
        save()
        selectedRoute = newRoute
        activeRoute.innerHTML = selectedRoute.name
        loadRoute()
        debug.innerHTML = "Successfully created Route!"
        document.getElementById("nameRoute").value = ""
    }
    updateToPoints()
    autocomplete(document.getElementById("myInput"), getRouteNames());
}

function addLocToRoute(){
    if(selectedRoute){
        if(Object.hasOwn(selectedRoute, 'points')){
            if(checkPointInputs()){
            load()
            selectedRoute.points.push({
                latitude: parseFloat(document.getElementById("lat").value),
                longitude: parseFloat(document.getElementById("lon").value),
                radius: parseFloat(document.getElementById("rad").value),
                color: 'red',
                fillColor: '#f03'
            })}
            clearPointInput()
            deleteRoute(selectedRoute.name)
            addRoute(selectedRoute)
            loadRoute()
            debug.innerHTML = "Successfully added Point to Route!"
        } else {
            debug.innerHTML = "The Route has no points!"
        }
    } else {
        debug.innerHTML = "There is no Route Selected!"
    }
}

function addClickedLocation(lat, lng){
    if(selectedRoute){
        if(Object.hasOwn(selectedRoute, 'points')){
            load()
            var rad
            try {
                if(parseFloat(document.getElementById("rad").value) > 0){
                    rad = parseFloat(document.getElementById("rad").value)
                } else {
                    rad = 15
                }
            } catch (error) {
                rad = 15
            }
            selectedRoute.points.push({
                latitude: lat,
                longitude: lng,
                radius: rad,
                color: 'red',
                fillColor: '#f03'
            })
            deleteRoute(selectedRoute.name)
            addRoute(selectedRoute)
            loadRoute()
            debug.innerHTML = "Successfully added Point to Route!"
        } else {
            debug.innerHTML = "The Route has no points!"
        }
    } else {
        debug.innerHTML = "There is no Route Selected!"
    }
}

function clearPointInput(){
    document.getElementById("lat").value = ""
    document.getElementById("lon").value = ""
    document.getElementById("rad").value = ""
}   

function checkPointInputs(){
    try {
        var latitude = parseFloat(document.getElementById("lat").value)
        var longitude = parseFloat(document.getElementById("lon").value)
        var radius = parseFloat(document.getElementById("rad").value)
        if(latitude >= 0){
            if(longitude >= 0){
                if(radius > 0){
                    return true
                } else {
                    debug.innerHTML = "Radius has to be greater than 0!"
                }
            } else {
                debug.innerHTML = "Longitude has to be 0 or greater!"
            }
        } else {
            debug.innerHTML = "Latitude has to be 0 or greater!"
        }
    } catch (error) {
        debug.innerHTML = "Please enter valid data for the new point!"
    }
}

function deleteCurrentRoute(){
    if(selectedRoute){
        if(deleteRoute(selectedRoute.name)){
            debug.innerHTML = "Successfully deleted Route!"
            map.removeLayer(display)
            display = null
            display = L.featureGroup()
            map.addLayer(display)
            autocomplete(document.getElementById("myInput"), getRouteNames());
            selectedRoute = null
        } else {
            debug.innerHTML = "Error deleting Route."
        }
    } else {
        debug.innerHTML = "Please select a Route to delete."
    }
}

function getRouteNames(){
    var nameArray = new Array()
    console.log(load())
    if(routeArray){
        routeArray.forEach((element) => {
            nameArray.push(element.name)
        })
        console.log(nameArray)
        return nameArray
    }
}
/*************************************************/

/****************** Arrow ***********************/

//Adapted from https://stackoverflow.com/questions/53307322/leaflet-polyline-arrows

function getArrows(arrLatlngs, color, arrowCount, mapObj) {

    if (typeof arrLatlngs === undefined || arrLatlngs == null ||    
(!arrLatlngs.length) || arrLatlngs.length < 2)          
    return [];

    if (typeof arrowCount === 'undefined' || arrowCount == null)
        arrowCount = 1;

    if (typeof color === 'undefined' || color == null)
        color = '';
    else
        color = 'color:' + color;

    var result = [];
    for (var i = 1; i < arrLatlngs.length; i++) {
        var icon = L.divIcon({ className: 'arrow-icon', bgPos: [5, 5], html: '<div style="' + color + ';transform: rotate(' + getAngle(arrLatlngs[i - 1], arrLatlngs[i], -1).toString() + 'deg)">▶</div>' });
        for (var c = 1; c <= arrowCount; c++) {
            result.push(L.marker(myMidPoint(arrLatlngs[i], arrLatlngs[i - 1], (c / (arrowCount + 1)), mapObj), { icon: icon }));
        }
    }
    return result;
}

function getAngle(latLng1, latlng2, coef) {
    var dy = latlng2[0] - latLng1[0];
    var dx = Math.cos(Math.PI / 180 * latLng1[0]) * (latlng2[1] - latLng1[1]);
    var ang = ((Math.atan2(dy, dx) / Math.PI) * 180 * coef);
    return (ang).toFixed(2);
}

function myMidPoint(latlng1, latlng2, per, mapObj) {
    if (!mapObj)
        throw new Error('map is not defined');

    var halfDist, segDist, dist, p1, p2, ratio,
        points = [];

    p1 = mapObj.project(new L.latLng(latlng1));
    p2 = mapObj.project(new L.latLng(latlng2));

    halfDist = distanceTo(p1, p2) * per;

    if (halfDist === 0)
        return mapObj.unproject(p1);

    dist = distanceTo(p1, p2);

    if (dist > halfDist) {
        ratio = (dist - halfDist) / dist;
        var res = mapObj.unproject(new Point(p2.x - ratio * (p2.x - p1.x), p2.y - ratio * (p2.y - p1.y)));
        return [res.lat, res.lng];
    }

}

function distanceTo(p1, p2) {
    var x = p2.x - p1.x,
        y = p2.y - p1.y;

    return Math.sqrt(x * x + y * y);
}

function toPoint(x, y, round) {
    if (x instanceof Point) {
        return x;
    }
    if (isArray(x)) {
        return new Point(x[0], x[1]);
    }
    if (x === undefined || x === null) {
        return x;
    }
    if (typeof x === 'object' && 'x' in x && 'y' in x) {
        return new Point(x.x, x.y);
    }
    return new Point(x, y, round);
}

function Point(x, y, round) {
    this.x = (round ? Math.round(x) : x);
    this.y = (round ? Math.round(y) : y);
}

/***********************************************/

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

/**************** Autocompletion Madness *****************/
//Adapted from https://www.w3schools.com/howto/howto_js_autocomplete.asp

function autocomplete(inp, arr) {
    if(arr !== undefined && arr !== null){
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(elmnt) {
      /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
   }
  }

  /***********************************************/

  autocomplete(document.getElementById("myInput"), getRouteNames());