// Creating map object
var myMap = L.map("map", {
  center: [39.5, -98.35],
  zoom: 4,
});

addLayers(myMap);

// global to hold the choropleth layers and legend, so we can remove it
var stateGeojson;
var countyGeojson;
var legend = null;

/** Takes two color codes as strings and returns you a color code that is a proportion between them
 * @param hexCode1 First color code passed as hex string
 * @param hexCode2 Second color code passed as hex string
 * @param proportion A number between 0 and 1 representing the mix between the colors. 0 returns hexCode1, 1 returns hexCode2 .5 returns a number halfway between them
 *
 */
function interpolateColors(hexCode1, hexCode2, proportion) {
  //Get each color out of the hex codes and convert them to ints
  let red1 = parseInt(hexCode1.substr(1, 2), 16);
  let red2 = parseInt(hexCode2.substr(1, 2), 16);
  let green1 = parseInt(hexCode1.substr(3, 2), 16);
  let green2 = parseInt(hexCode2.substr(3, 2), 16);
  let blue1 = parseInt(hexCode1.substr(5, 2), 16);
  let blue2 = parseInt(hexCode2.substr(5, 2), 16);

  //Get the colors that falls proportionally between the two for each color channel
  // and convert it back into a hex string
  let redScale = d3.scaleLinear().domain([0, 1]).range([red1, red2]);
  let newRed = parseInt(redScale(proportion)).toString(16);

  let greenScale = d3.scaleLinear().domain([0, 1]).range([green1, green2]);
  let newGreen = parseInt(greenScale(proportion)).toString(16);

  let blueScale = d3.scaleLinear().domain([0, 1]).range([blue1, blue2]);
  let newBlue = parseInt(blueScale(proportion)).toString(16);

  //If any of the color codes ended up as only one digit, append a 0
  newRed = newRed.length == 1 ? "0" + newRed : newRed;
  newGreen = newGreen.length == 1 ? "0" + newGreen : newGreen;
  newBlue = newBlue.length == 1 ? "0" + newBlue : newBlue;

  //Append them to a new string
  return `#${newRed}${newGreen}${newBlue}`;
}

//Adds street, light and dark layers to the map
function addLayers(myMap) {
  // Adding tile layer
  var streets = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.streets",
      accessToken: API_KEY,
    }
  );

  var light = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.light",
      accessToken: API_KEY,
    }
  );

  var dark = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.dark",
      accessToken: API_KEY,
    }
  );

  var baseMaps = {
    Streets: streets,
    Light: light,
    Dark: dark,
  };

  //Default to street layer
  dark.addTo(myMap);
  //Add controls to switch between layers
  L.control.layers(baseMaps).addTo(myMap);
}

/**
 * Takes in geoJson object and appends data returned from the API to each states geoJSON entry
 * @param {geoJSON OBJECT} geoData The geoJson that is returned from d3.json when querying the geojson file attached
 * @param {*} apiReturn The return from the API
 */
function zipAPIDataToStateGeoJSON(geoData, apiReturn, mode) {
  //Create array of states in the order that the apiReturn came back in
  apiDataStates = apiReturn.map((datum) => datum.state);

  geoData.features.forEach((geoDatum) => {
    // Lookup the corresponding entry from the API's data return with the most recent date that matches this entry by state
    apiDataIndex = apiDataStates.indexOf(geoDatum.properties.NAME);

    let newProps = {
      GEO_ID: geoDatum.properties.GEO_ID,
      CENSUSAREA: geoDatum.properties.CENSUSAREA,
      ...apiReturn[apiDataIndex],
    };

    geoDatum.properties = newProps;
    geoDatum.mode = mode;
  });

  return geoData;
}

/**
 * Takes in geoJson object and appends data returned from the API to each states geoJSON entry
 * @param {geoJSON OBJECT} geoData The geoJson that is returned from d3.json when querying the geojson file attached
 * @param {*} apiReturn The return from the API
 */
function zipAPIDataToCountyGeoJSON(geoData, apiReturn, mode) {
  //Create array of states in the order that the apiReturn came back in
  countyCodes = apiReturn.map((datum) => {
    let county_code = String(datum.county_code);
    if (county_code.length < 5) {
      county_code = "0" + county_code;
    }

    return county_code;
  });

  geoData.features.forEach((geoDatum) => {
    countyFips = geoDatum.properties.STATE + geoDatum.properties.COUNTY;

    // Lookup the corresponding entry from the API's data return with the most recent date that matches this entry by state
    apiDataIndex = countyCodes.indexOf(countyFips);

    let newProps = {
      GEO_ID: geoDatum.properties.GEO_ID,
      CENSUSAREA: geoDatum.properties.CENSUSAREA,
      ...apiReturn[apiDataIndex],
    };

    geoDatum.properties = newProps;
    geoDatum.mode = mode;
  });

  return geoData;
}

//Given a value returns a color code
function getColor(d, mode) {
  options = getColorModeOptions(mode);

  for (var ii = 0; ii < options.bins.length; ii++) {
    if (d > options.bins[ii]) {
      return interpolateColors(
        options.highColor,
        options.lowColor,
        ii / (options.bins.length - 1)
      );
    }
  }

  return "black";
}

//Gets the color options for a given mode
function getColorModeOptions(mode) {
  if (mode == "initial_claims") {
    return {
      highColor: "#008000",
      lowColor: "#ffff00",
      bins: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 1],
    };
  } else if (mode == "confirmed") {
    return {
      highColor: "#e9294a",
      lowColor: "#f6a5b3",
      bins: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 1],
    };
  } else if (mode == "continued_claims") {
    return {
      highColor: "#000080",
      lowColor: "#73c2fb",
      bins: [1000000, 700000, 500000, 300000, 100000, 50000, 10000, 1],
    };
  } else if (mode == "deaths") {
    return {
      highColor: "#301934",
      lowColor: "#b19cd9",
      bins: [3000, 2000, 1000, 500, 100, 50, 30, 10, 1],
    };
  } else if (mode == "percent_unemployed") {
    return {
      highColor: "#EE0000",
      lowColor: "#FFFFFF",
      bins: [60, 50, 40, 30, 20, 10, 5, 0],
    };
  } else if (mode == "total_unemployed") {
    return {
      highColor: "#EE0000",
      lowColor: "#FFFFFF",
      bins: [
        2000000,
        1000000,
        500000,
        100000,
        50000,
        10000,
        5000,
        2500,
        1000,
        500,
        100,
        0,
      ],
    };
  } else if (mode == "county_confirmed") {
    return {
      highColor: "#1F3D0C",
      lowColor: "#ffffff",
      bins: [10000, 5000, 2500, 1000, 500, 250, 100, 50, 30, 10, 0],
    };
  } else if (mode == "county_deaths") {
    return {
      highColor: "#1F3D0C",
      lowColor: "#ffffff",
      bins: [5000, 2500, 1000, 500, 250, 100, 75, 50, 30, 20, 10, 5, 1, 0],
    };
  }
}

//Add the legend
function addLegend(myMap, mode) {
  //If legend is defined call its remove function to prevent making new legends each time.
  legend && legend.remove();

  legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend"),
      grades = getColorModeOptions(mode).bins.reverse();

    //Add special label for no data (( getColor(grades[0] + 1) ))
    div.innerHTML += '<i style="background:' + "black" + '"></i> No Data <br>';

    // loop through our density intervals and generate a label with a colored square for each interval
    for (let i = 1; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' +
        getColor(grades[i] + 1, mode) +
        '"></i> ' +
        grades[i] +
        (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
    }

    return div;
  };

  legend.addTo(myMap);
}

// this function is necessary to control for variances in loading speed between county and state geojson layers
//  both must be searched for and deleted at the time of a mode switch
//  to ensure that the on-page-load county layer doesn't repopulate the map before a potential incoming state layer.
function removeAllGeojson() {
  stateGeojson && stateGeojson.remove();
  countyGeojson && countyGeojson.remove();
}

//Generates a chloropleth map layer of states colored by the variable in the mode
function buildStateChloropleth(apiReturn, mode = "initial_claims") {
  removeAllGeojson();

  // Load in geojson data
  var geoDataPath = "assets/data/US.geojson";

  d3.json(geoDataPath, function (data) {
    apiReturn = filterMostRecentWeekData(apiReturn);
    data = zipAPIDataToStateGeoJSON(data, apiReturn, mode);

    function style(feature) {
      return {
        fillColor: getColor(feature.properties[mode], feature.mode),
        weight: 2,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    }

    function onEachFeature(feature, layer) {
      layer.bindPopup(
        `${feature.properties.state}
        <br/>File Week Ended: ${moment(
          feature.properties.file_week_ended
        ).format("MMMM Do YYYY")}
          <br/>New Unemployment Claims: ${feature.properties.initial_claims}
          <br/>Continued Claims: ${feature.properties.continued_claims}
          <br/>Unemployment Rate: ${
            feature.properties.insured_unemployment_rate
          }
          `
      );
    }

    stateGeojson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature,
    }).addTo(myMap);
  });

  addLegend(myMap, mode);
}

//Generates a chloropleth map layer of counties colored by the variable in the mode
function buildCountyChloropleth(apiReturn, mode = "initial_claims") {
  removeAllGeojson();

  // Load in geojson data
  var geoDataPath = "assets/data/geojson-counties-fips.json";

  d3.json(geoDataPath, function (data) {
    apiReturn = filterMostRecentWeekData(apiReturn);
    data = zipAPIDataToCountyGeoJSON(data, apiReturn, mode);

    console.log("county_data", data);

    function style(feature) {
      return {
        fillColor: getColor(feature.properties[mode], feature.mode),
        weight: 1,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    }

    function onEachFeature(feature, layer) {
      layer.bindPopup(
        `${feature.properties.state}
        <br/>File Week Ended: ${moment(
          feature.properties.file_week_ended
        ).format("MMMM Do YYYY")}
          <br/>New Unemployment Claims: ${feature.properties.initial_claims}
          <br/>Continued Claims: ${feature.properties.continued_claims}
          <br/>Unemployment Rate: ${
            feature.properties.insured_unemployment_rate
          }
          `
      );
    }

    countyGeojson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature,
    }).addTo(myMap);
  });

  addLegend(myMap, mode);
}

//Generates a chloropleth map layer of counties colored by the variable in the mode
function buildCountyChloropleth(apiReturn, mode = "initial_claims") {
  if (geojson) {
    console.log("removing old geojson");
    geojson.remove();
  }

  // Load in geojson data
  var geoDataPath = "assets/data/geojson-counties-fips.json";

  d3.json(geoDataPath, function (data) {
    apiReturn = filterMostRecentWeekData(apiReturn);
    data = zipAPIDataToCountyGeoJSON(data, apiReturn, mode);

    console.log("county_data", data);

    function style(feature) {
      return {
        fillColor: getColor(feature.properties[mode], feature.mode),
        weight: 1,
        opacity: 1,
        color: "black",
        fillOpacity: 0.7,
      };
    }

    function onEachFeature(feature, layer) {
      layer.bindPopup(
        `${feature.properties.state}
        <br/>File Week Ended: ${moment(
          feature.properties.file_week_ended
        ).format("MMMM Do YYYY")}
          <br/>New Unemployment Claims: ${feature.properties.initial_claims}
          <br/>Continued Claims: ${feature.properties.continued_claims}
          <br/>Unemployment Rate: ${
            feature.properties.insured_unemployment_rate
          }
          `
      );
    }

    geojson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature,
    }).addTo(myMap);
  });

  addLegend(myMap, mode);
}
