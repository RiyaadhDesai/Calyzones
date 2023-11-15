mapboxgl.accessToken = 'pk.eyJ1Ijoicml5YWFkaGRlc2FpIiwiYSI6ImNsb3d3ODRrZDE4cjIyamxsOGVuaHJuZmkifQ.NHKGfl2vM1zDlgmkuiPPBw';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-77.04, 38.907],
    zoom: 11
});

// Add the geocoder control to the map
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

document.getElementById('geocoder-container').appendChild(geocoder.onAdd(map));

// Function to handle the selection of a location in the geocoder
geocoder.on('result', function (result) {
    // Add a marker on the map at the selected location
    var marker = new mapboxgl.Marker()
        .setLngLat(result.result.center)
        .addTo(map);
});

// Add the Mapbox Directions control to the map
var directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken
});

map.addControl(directions, 'top-left');

// Add the Mapbox Matrix control to the map
var matrix = new MapboxMatrix({
    accessToken: mapboxgl.accessToken
});

map.addControl(matrix, 'top-left');

// Function to add a new address input field
function addAddress() {
    var container = document.getElementById('address-container');
    var newAddress = document.createElement('div');
    newAddress.className = 'address-input';
    newAddress.innerHTML = '<input type="text" placeholder="Enter Address">';
    container.appendChild(newAddress);
}

// Function to remove an address input field
function removeAddress(element) {
    element.parentNode.removeChild(element);
}

// Function to find the midpoint of the addresses and update the map
async function findMidpoint() {
    var addresses = document.getElementsByClassName('address-input');
    var coordinates = [];

    // Get coordinates from address input fields
    for (var i = 0; i < addresses.length; i++) {
        var addressValue = addresses[i].getElementsByTagName('input')[0].value;

        // Use Mapbox Geocoding API to convert address to coordinates
        var geocodeUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(addressValue) + '.json?access_token=' + mapboxgl.accessToken;
        var response = await fetch(geocodeUrl);
        var data = await response.json();

        if (data.features && data.features.length > 0) {
            var coords = data.features[0].center;
            coordinates.push(coords);
        }
    }

    // Calculate the midpoint
    var midpoint = calculateMidpoint(coordinates);

    // Remove existing midpoint marker
    map.removeSource('midpoint');
    map.removeLayer('midpoint-marker');

    // Add a marker at the midpoint
    map.addSource('midpoint', {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: midpoint
            }
        }
    });

    map.addLayer({
        id: 'midpoint-marker',
        type: 'circle',
        source: 'midpoint',
        paint: {
            'circle-radius': 10,
            'circle-color': '#FF0000'
        }
    });

    // Fit the map to the bounding box of the addresses and midpoint
    var allCoordinates = coordinates.concat([midpoint]);
    var bounds = getBounds(allCoordinates);
    map.fitBounds(bounds, { padding: 50 });
}

// Function to calculate the midpoint given an array of coordinates
function calculateMidpoint(coordsArray) {
    var numCoords = coordsArray.length;
    var sumLng = 0;
    var sumLat = 0;

    coordsArray.forEach(function (coords) {
        sumLng += coords[0];
        sumLat += coords[1];
    });

    var midpointLng = sumLng / numCoords;
    var midpointLat = sumLat / numCoords;

    return [midpointLng, midpointLat];
}

// Function to get the bounding box of an array of coordinates
function getBounds(coordsArray) {
    var bounds = new mapboxgl.LngLatBounds();

    coordsArray.forEach(function (coords) {
        bounds.extend(coords);
    });

    return bounds;
}
