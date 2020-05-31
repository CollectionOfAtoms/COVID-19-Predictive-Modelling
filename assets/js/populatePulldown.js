// Set default dates in date fields
d3.select("#startDate").property("value", "2020-05-01");
d3.select("#endDate").property("value", moment().format("YYYY[-]MM[-]DD"));

// Bind the optionChanged method to the input fields
d3.select("#startDate").on("change", optionChanged);
d3.select("#endDate").on("change", optionChanged);

//Default to percent_unemployed view
d3.select("#covid-unemployment-residual").property("checked", true);

//For now just hook up the mode changing buttons to optionChanged
d3.selectAll(".mode-btn").on("click", optionChanged);

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
  selValues = $("#selState").val();
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

        //Display the date the map refelcts
        addMapDetails(mostRecentCountyUnemploymentDate);

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

          // filters out unselected states, if at least one state is selected
          if (selValues.length > 0) {
            console.log("filtering states...", selValues);
            allCountyData = allCountyData.filter((countyDatum) => {
              return selValues.includes(stateLookup[countyDatum.state]);
            });
          }

          // This is currenly coming back NAN, but works for the state side
          // needs tweaking
          // allCountyData = calcCovidUnemploymentResidual(allCountyData);
          console.log("allCountyData", allCountyData);

          buildCountyChloropleth(allCountyData, selectedMode);
          populateCountySummaryStats(allCountyData);
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

      //Display the date
      addMapDetails(mostRecentUnemploymentDate);

      getCovidData(mostRecentUnemploymentDate).then((covidData) => {
        console.log("getCovidData return", covidData);

        //Stitch covidData and unemploymentData
        let allData = stitchData(covidData, unemploymentData);
        allData = calcCovidUnemploymentResidual(allData);
        console.log("allData", allData);

        //Put a new chloropleth on the map
        buildStateChloropleth(allData, selectedMode);
        populateStateSummaryStats(allData);
      });
    });
  }
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
            state: covidDatum.region.province,
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

//Displays the date the map is showing
function addMapDetails(date) {
  map_deets = d3.select("#map-details");
  map_deets.text(""); //Clear existing
  map_deets.append("p").text(`Displaying data for ${date}`);
}

/**
 * Covid Unemployment Residual is defined to be:
 * The difference between
 * (covid cases within a region / # of unemployment claims within a region)
 * and
 * (covid-cases within the entire provided set / # of unemployment claims within the entire set)
 */
function calcCovidUnemploymentResidual(data) {
  //If it has a total_unemployed column, use that, otherwise use the continued claims
  let unemployment_key;
  if (data.hasOwnProperty("total_unemployed")) {
    unemployment_key = "total_unemployed";
  } else unemployment_key = "continued_claims";

  //Filter out any data that doesn't have both covid && unemployment data
  data = data.filter((datum) => {
    return datum.hasOwnProperty("confirmed");
  });

  //Get total covid cases and unemployment for the set
  total = data.reduce((prev, curr) => {
    return {
      confirmed: prev.confirmed + curr.confirmed,
      [unemployment_key]: prev[unemployment_key] + curr[unemployment_key],
    };
  });

  total_cov_per_unemployment = total.confirmed / total[unemployment_key];

  //Loop through each point and append residual
  data.forEach((datum) => {
    datum["covid-unemployment-residual"] =
      datum.confirmed / datum[unemployment_key] - total_cov_per_unemployment;
  });

  return data;
}
