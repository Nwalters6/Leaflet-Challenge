// Choose Color
function chooseColor(magnitude) {
    if (magnitude <= 1) {
        return "greenyellow";
    } else if (magnitude <= 2) {
        return "yellowgreen";
    } else if (magnitude <= 3) {
        return "yellow";
    } else if (magnitude <= 4) {
        return "gold";
    } else if (magnitude <= 5) {
        return "orange";
    } else {
        return "red";
    };
}

// Edit marker size
function markerSize(magnitude) {
    return magnitude * 5;
};

// References
var timeFrame = document.getElementById("selTime");
var quakeType = document.getElementById("selType");
var submitButton = document.getElementById("submit");

submitButton.addEventListener("click", updateURL);

// Function to update URL
function updateURL(event) {

    // Prevent default
    event.preventDefault();

    var timeValue = timeFrame.value;
    var typeValue = quakeType.value

    // Update values
    if (timeValue == "") {
        timePart = "week";
    } else {
        timePart = timeValue;
    };
    if(typeValue == "") {
        typePart = "all";
    } else {
        typePart = typeValue;
    };

    if ((timeValue == "month" && typeValue == "all") || (timeValue == "month" && typeValue == "1.0")) {
        alert("There's too much data to render :'(" + "\n" + "Please pick another option")
    }

    // Store the API endpoints
    var earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${typePart}_${timePart}.geojson";
    var faultLinesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

    // Remove previous map and create div for new map
    map.remove();
    var divElement = document.createElement("div");
    divElement.id = "map";
    divElement.style.height = "100%";
    document.querySelector("body").appendChild(divElement);

    // Call renderMap function
    renderMap(earthquakeURL, faultLinesURL);
}

// Function to render map
function renderMap(earthquakeURL, faultLinesURL) {

    // Perform a GET request to the earthquake URL
    d3.json(earthquakeURL, function(data) {
        console.log(earthquakeURL)
        // Store response into earthquakeData
        var earthquakeData = data;
        // Perform a GET request to the fault lines URL
        d3.json(faultLinesURL, function(data) {
            // Store response into faultLineData
            var faultLineData = data;

            // Pass data into createFeatures
            createFeatures(earthquakeData, faultLineData);
        });
    });

    // Function to create features
    function createFeatures(earthquakeData, faultLineData) {

        // Define two functions we want to run once for each feature in earthquakeData
        function onEachQuakeLayer(feature, layer) {
            return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                fillOpacity: 1,
                color: chooseColor(feature.properties.mag),
                fillColor: chooseColor(feature.properties.mag),
                radius:  markerSize(feature.properties.mag)
            });
        }
        function onEachEarthquake(feature, layer) {
            layer.bindPopup("<h3>" + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + feature.properties.mag + "</p>");
        };

        // Define a function we want to run once for each feature in faultLineData
        function onEachFaultLine(feature, layer) {
            L.polyline(feature.geometry.coordinates);  
        };

        // Create a GeoJSON layer containing the features array on the earthquakeData object
        var earthquakes = L.geoJSON(earthquakeData, {
            onEachFeature: onEachEarthquake,
            pointToLayer: onEachQuakeLayer
        });

        // Create a GeoJSON layer containing the features array on the faultLineData object
        var faultLines = L.geoJSON(faultLineData, {
            onEachFeature: onEachFaultLine,
            style: {
                weight: 2,
                color: 'orange'
            }
        });

        // Create a Timeline layer containing the features array on the earthquakeData object
        // Run a function to get the time interval for each earthquake (length based on magnitude)
        var timelineLayer = L.timeline(earthquakeData, {
            getInterval: function(feature) {
                return {
                    start: feature.properties.time,
                    end: feature.properties.time + feature.properties.mag * 10000000
                };
            },
            pointToLayer: onEachQuakeLayer,
            onEachFeature: onEachEarthquake
        });

        // Sending our earthquakes, fault lines and timeline layers to the createMap function
        createMap(earthquakes, faultLines, timelineLayer);
    };

    // Function to create map
    function createMap(earthquakes, faultLines, timelineLayer) {

        // Define satellite, grayscale, and outdoors layers
        var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoibmlja3dhbHRlcnM4OSIsImEiOiJjamxjdmducTQwMTkwM3BxenMzZDc3dWNpIn0.MtdA7enZnYaJhH-1qDffFA." +
        "A3IKm_S6COZzvBMTqLvukQ");
        var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoibmlja3dhbHRlcnM4OSIsImEiOiJjamxjdmducTQwMTkwM3BxenMzZDc3dWNpIn0.MtdA7enZnYaJhH-1qDffFA." +
        "A3IKm_S6COZzvBMTqLvukQ");
        var outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoibmlja3dhbHRlcnM4OSIsImEiOiJjamxjdmducTQwMTkwM3BxenMzZDc3dWNpIn0.MtdA7enZnYaJhH-1qDffFA." +
        "A3IKm_S6COZzvBMTqLvukQ");

        // Define a baseMaps object to hold our base layers
        var baseMaps = {
            "Satellite": satellite,
            "Dark": darkmap,
            "Outdoors": outdoors
        };

        // Create overlay object to hold our overlay layer
        var overlayMaps = {
            "Earthquakes": earthquakes,
            "Fault Lines": faultLines
        };

        // Create our map, giving it the satellite, earthquakes and faultLines layers to display on load
        var map = L.map("map", {
            center: [39.8283, -98.5785],
            zoom: 3,
            layers: [satellite, faultLines],
            scrollWheelZoom: false
        });

        // Create a layer control
        L.control.layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(map);

        // Adding Legend
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend'),
                        grades = [0, 1, 2, 3, 4, 5],
                        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

            for (var i = 0; i < grades.length; i++) {
                div.innerHTML += '<i style="background:' + chooseColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            };

            return div;
        };
        legend.addTo(map);

        // Adding timeline & timeline control
        var timelineControl = L.timelineSliderControl({
            formatOutput: function(date) {
                return new Date(date).toString();
            }
        });
        timelineControl.addTo(map);
        timelineControl.addTimelines(timelineLayer);
        timelineLayer.addTo(map);
    };
}

// Initial Render - all earthquakes for the past 7 days
var earthquakeURL = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson`;
var faultLinesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
renderMap(earthquakeURL, faultLinesURL);