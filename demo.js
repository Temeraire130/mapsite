var debug = document.getElementById("debug");
var saveNote = document.getElementById("saveNote");
var loadNote = document.getElementById("loadNote");
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
    var flag = false
    routeArray.forEach(element => {
        if(element.name === checkedName) flag = true
    });
    return flag;
}

function addRoute(toAdd){
    routeArray.add(toAdd)
}

function deleteRoute(toDelete){
    var route
    routeArray.forEach(element => {
        if(element.name === toDelete) {
            route = element
        }
    });
    if(route){
        const index = routeArray.indexOf(5);
        routeArray.splice(index, 1);
        return true
    }
    return false
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

function selectRoute(){
    load()
    if(routeExists(document.getElementById("myInput").value)){
        selectedRoute = searchRouteByName(document.getElementById("myInput").value)
        activeRoute.innerHTML = selectedRoute.name
    } else {
        //debug.innerHTML = "There is no Route with that name!"
        debug.innerHTML = document.getElementById("myInput").value
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
                //TODO: Set new Route as selected Route
                debug.innerHTML = "Successfully created Route!"
            } else {
                debug.innerHTML = "A Route with that name already exists!"
            }
        } else {
            routeArray = new Array()
            routeArray.push(newRoute)
            save()
            //TODO: Set new Route as selected Route
            debug.innerHTML = "Successfully created Route!"
        }
    } else {
        routeArray = new Array()
        routeArray.push(newRoute)
        save()
        //TODO: Set new Route as selected Route
        debug.innerHTML = "Successfully created Route!"
    }

}

function addLocToRoute(form){
    if(selectedRoute){
        if(Object.hasOwn(selectedRoute, 'points')){
            selectedRoute.points.push({
                //TODO: Sanitize Inputs
                latitude: form.elements["lat"].value,
                longitude: form.elements["lon"].value,
                radius: form.elements["rad"].value
            })
            deleteRoute(selectedRoute.name)
            addRoute(selectedRoute)
        } else {
            debug.innerHTML = "The Route has no points!"
        }
    } else {
        debug.innerHTML = "There is no Route Selected!"
    }
}

function deleteCurrentRoute(){

}

function getRouteNames(){
    var nameArray
    routeArray.forEach((element) => {
        nameArray.push(element.name)
    })
    return nameArray
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

/**************** Autocompletion Madness *****************/
//Adapted from https://www.w3schools.com/howto/howto_js_autocomplete.asp

function autocomplete(inp, arr) {
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

  /***********************************************/

  //autocomplete(document.getElementById("myInput"), getRouteNames);