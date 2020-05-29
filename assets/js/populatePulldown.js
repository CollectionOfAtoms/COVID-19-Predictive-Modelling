// Set default dates in date fields
d3.select("#startDate").property("value", "2020-05-01");
d3.select("#endDate").property("value", moment().format("YYYY[-]MM[-]DD"));

// Bind the optionChanged method to the input fields
d3.select("#startDate").on("change", optionChanged);

//Default to percent_unemployed view
d3.select("#percent_unemployed").property("checked", true);

//TODO Separate Mode change functionality from optionChanged.
// option changed should be for filters and trigger new API calls
// modeChanged should just change the data being displayed without making
// a new API call
// d3.selectAll(".btn-secondary").on("click", changeMode);

//For now just hook up the mode changing buttons to optionChanged
d3.selectAll(".btn-secondary").on("click", optionChanged);

//Initial API call on page load
optionChanged();
pullDownMenu();

//Populates the pulldown menu with states
function pullDownMenu() {
  var dropdown = d3.select("#selState");
  // Log the entire dataset

  // For each ID in the array run a function
  stateData.forEach((element) => {
    // console.log(element);
    // Append an option element to the #selDataset dropdown with the id
    // in the value attribute as well as text between the open and closed tags.
    dropdown.append("option").attr("value", element.abbr).text(element.state);
  });
}

/**
 * When the select dropdown or one of the date filters is changed this function will fire
 */
function optionChanged() {
  var selValues = [];
  selValues.push($("#selState").val());
  // d3.select("#h-pulldown").text(selValues);

  let startDate = d3.select("#startDate").property("value");
  let endDate = d3.select("#endDate").property("value");

  // Reformat dates with moment.js
  startDate = moment(startDate).format("YYYY[-]MM[-]DD");
  endDate = moment(endDate).format("YYYY[-]MM[-]DD");

  //Get the value of the selected mode
  let selectedMode = d3.select('input[name="mode"]:checked').property("id");
  console.log("currently selected mode", selectedMode);

  //If one of the county modes is selected then query the county data from the apis
  countyModes = [
    "percent_unemployed",
    "total_unemployed",
    "county_confirmed",
    "county_deaths",
  ];

  //Query county data
  if (countyModes.includes(selectedMode)) {
    console.log("Querying county data...");

    // checks the cache, if empty, queries the county route on unemployment API, awaits promise return
    getCountyUnemploymentData(startDate, endDate).then(
      (countyUnemploymentData) => {
        //Most Recent unemployment data by county
        mostRecentCountyUnemploymentData = filterMostRecentWeekData(
          countyUnemploymentData
        );

        mostRecentCountyUnemploymentDate = moment(
          mostRecentCountyUnemploymentData[0].file_week_ended
        ).format("YYYY[-]MM[-]DD");

        getCovidData(mostRecentCountyUnemploymentDate).then((covidData) => {
          console.log(
            "county covid return",
            covidData,
            mostRecentCountyUnemploymentData
          );

          let allCountyData = stitchCountyData(
            covidData,
            mostRecentCountyUnemploymentData
          );
          console.log("allCountyData", allCountyData);
          buildCountyChloropleth(allCountyData, selectedMode);
        });
      }
    );
  }
  //Query state data
  else {
    //Build Unemployment API call
    baseURL =
      "https://unemployment-during-covid19.herokuapp.com/unemploymentData";
    queryString = `?start_date=${startDate}&end_date=${endDate}`;

    //If no states are selected, default to returning all state data
    if (selValues.length > 0) {
      queryString += `&state_abbr=${selValues.toString()}`;
    }

    // Call out the the Unemployment API with values from the filter fields
    d3.json(`${baseURL}${queryString}`, (unemploymentData) => {
      console.log("unemployment API returned", unemploymentData);

      //Generate a line plot
      buildPlot(unemploymentData);
      buildPlot1(unemploymentData);

      mostRecentUnemploymentData = filterMostRecentWeekData(unemploymentData);

      mostRecentUnemploymentDate = moment(
        mostRecentUnemploymentData[0].file_week_ended
      ).format("YYYY[-]MM[-]DD");

      getCovidData(mostRecentUnemploymentDate).then((covidData) => {
        console.log("getCovidData return", covidData);

        //Stitch covidData and unemploymentData
        let allData = stitchData(covidData, unemploymentData);
        console.log("allData", allData);

        //Put a new chloropleth on the map
        buildStateChloropleth(allData, selectedMode);
        populateSummaryStats(allData);
      });
    });
  }
}

function changeMode(event) {
  console.log("event", event);
}

//Take two arrays of objects with state and date data, and return one array of objects with all data from each.
function stitchData(covidData, unemploymentData) {
  returnArray = [];

  covidData.forEach((covidDatum) => {
    unemploymentData.forEach((unemploymentDatum) => {
      if (
        covidDatum.region.province == unemploymentDatum.state &&
        covidDatum.date ==
          moment(unemploymentDatum.file_week_ended).format("YYYY[-]MM[-]DD")
      ) {
        // "..." grabs all properties within the var that follows
        let returnDatum = { ...covidDatum, ...unemploymentDatum };
        returnArray.push(returnDatum);
      }
    });
  });

  return returnArray;
}

// Takes the result of county unemployment API call and the covid API return (which contains county covid data)
//  and stitches them into an array with one entry per county per date.
function stitchCountyData(covidData, countyUnemploymentData) {
  returnArray = [];

  countyUnemploymentData.forEach((countyUnemploymentDatum) => {
    let matchedCounty = false;

    covidData.forEach((covidDatum) => {
      covidDatum.region.cities.forEach((countyCovidDatum) => {
        if (
          countyUnemploymentDatum.county_code == countyCovidDatum.fips &&
          countyCovidDatum.date ==
            moment(countyUnemploymentDatum.file_week_ended).format(
              "YYYY[-]MM[-]DD"
            )
        ) {
          let returnDatum = {
            ...countyCovidDatum,
            ...countyUnemploymentDatum,
            county_deaths: countyCovidDatum.deaths,
            county_confirmed: countyCovidDatum.confirmed,
          };
          returnArray.push(returnDatum);
          matchedCounty = true;
        }
      });
    });
    if (!matchedCounty) {
      returnArray.push(countyUnemploymentDatum);
    }
  });
  return returnArray;
}

// map layer issue!
