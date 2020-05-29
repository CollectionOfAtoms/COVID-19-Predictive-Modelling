// make new functions or an altogether new populateSummaryStats() that can handle the content of the stitched county data
//  all the text here is specific to the content of the allData stitched state array

//Populates the summary statistics box according to the data returned
function populateSummaryStats(data) {
  // clears old stats
  d3.select("#uenmpStats").text(" ");
  let unemp = calculateUnempStats(data);

  for (let [key, value] of Object.entries(unemp)) {
    d3.select("#unempStats").append("div").text(`${key} : ${value}`);
  }

  // clears old stats
  d3.select("#covidStats").text(" ");
  let covid = calculateCovidStats(data);

  for (let [key, value] of Object.entries(covid)) {
    d3.select("#covidStats").append("div").text(`${key} : ${value}`);
  }
}

// Takes in unemployment data set and returns an object of relevant statistics
function calculateUnempStats(data) {
  unemp = {};

  unemp[
    "State With the Most Continued Claims (Entire Set)"
  ] = getStateWithMaxContClaims(data);
  unemp[
    "State with Most Continued Claims (Most Current Week)"
  ] = getStateWithMaxContClaims(filterMostRecentWeekData(data));
  unemp["Average Number of New Claims"] = getAvgNewClaims(data);
  unemp["Average Unemployment Rate"] = getAvgUnemploymentRate(data);
  unemp["State With Highest Unemployment Rate"] = getStateWithMaxUnempRate(
    data
  );

  maxDate = filterMostRecentWeekData(data);

  return unemp;
}

// Takes in covid data set and returns an object of relevant statistics
function calculateCovidStats(data) {
  covid = {};

  stateMaxCovidCasesES = getStateWithMaxCovidCases(data)
  stateMaxCovidCasesRW = getStateWithMaxNewCovidCases(filterMostRecentWeekData(data))
  stateMaxCovidDeathsES = getStateWithMaxCovidDeaths(data)
  stateMaxCovidDeathsRW = getStateWithMaxNewCovidDeaths(filterMostRecentWeekData(data))

  covid[
    "State With Most COVID Cases (Entire Set)"
  ] = `${stateMaxCovidCasesES[0]}, ${stateMaxCovidCasesES[1]}`;
  covid[
    "State with Most COVID Cases (Most Recent Week)"
  ] = `${stateMaxCovidCasesRW[0]}, ${stateMaxCovidCasesRW[1]}`;
  covid[
    "State With Most COVID Deaths (Entire Set)"
  ] = `${stateMaxCovidDeathsES[0]}, ${stateMaxCovidDeathsES[1]}`;
  covid[
    "State with Most COVID Deaths (Most Recent Week)"
  ] = `${stateMaxCovidDeathsRW[0]}, ${stateMaxCovidDeathsRW[1]}`;


  maxDate = filterMostRecentWeekData(data);

  return covid;

}

function getStateWithMaxContClaims(data) {
  //Get the state with the most open claims within the period.
  let allContinuedClaims = data.map((entry) => {
    return entry.continued_claims;
  });

  let maxContinuedClaim = Math.max(...allContinuedClaims);

  let maxContinuedClaimsIndex = allContinuedClaims.indexOf(maxContinuedClaim);

  return data[maxContinuedClaimsIndex].state;
}

function getAvgNewClaims(data) {
  //Get the state with the most open claims within the period.
  let allInitialClaims = data.map((entry) => {
    return entry.initial_claims;
  });

  // take an elegant sum
  const total = allInitialClaims.reduce(
    (accumulator, element) => accumulator + element,
    0
  );
  // calculate an average
  let avgInitialClaims = total / allInitialClaims.length;

  return avgInitialClaims.toFixed(2);
}

function getAvgUnemploymentRate(data) {
  //Get the state with the most open claims within the period.
  let unemploymentRate = data.map((entry) => {
    return entry.insured_unemployment_rate;
  });

  // take an elegant sum
  const total = unemploymentRate.reduce(
    (accumulator, element) => accumulator + element,
    0
  );
  // calculate an average
  let avgUnemploymentRate = total / unemploymentRate.length;

  return `${avgUnemploymentRate.toFixed(2)}%`;
}

function getStateWithMaxUnempRate(data) {
  data.sort((a, b) => (a.state > b.state ? 1 : -1));

  //Get the unemployment rate.
  let unemploymentRate = data.map((entry) => {
    return entry.insured_unemployment_rate;
  });

  //   Get all the states
  let states = data.map((entry) => {
    return entry.state;
  });

  //Define empty list to take your avg unemployment by state
  var stateAvgs = [];
  instancesOfState = 0;
  stateSum = 0;
  //Loop through unemploymentRate
  unemploymentRate.forEach((entry, index) => {
    //Increment a counter (represents total number of entries for each state)
    instancesOfState += 1;
    //Add current value to variable that holds sum of averages by state
    stateSum = stateSum + entry;

    if (states[index] != states[index + 1]) {
      //When this condition is run we are on the last entry for this state
      //Calculate your average and save it to array
      stateAvgs.push({
        state: states[index],
        avg: stateSum / instancesOfState,
      });
      // Reset counter vars
      instancesOfState = 0;
      stateSum = 0;
    }
  });

  let avgs = stateAvgs.map((entry) => {
    return entry.avg;
  });

  let maxUnemploymentRate = Math.max(...avgs);
  let maxUnemploymentRateIndex = avgs.indexOf(maxUnemploymentRate);

  return stateAvgs[maxUnemploymentRateIndex].state;
}

//Takes in the data set and returns only the elements where week filed is most recent
function filterMostRecentWeekData(data) {
  maxDate = moment(data[0].file_week_ended).format("YYYY[-]MM[-]DD");

  data.forEach((entry, i) => {
    entryDate = moment(entry.file_week_ended).format("YYYY[-]MM[-]DD");
    if (entryDate > maxDate) {
      maxDate = entryDate;
    }
  });

  filteredSet = data.filter((entry) => {
    return moment(entry.file_week_ended).format("YYYY[-]MM[-]DD") == maxDate;
  });

  return filteredSet;
}

// COVID functions start here:
// ------------------------------------------------------------------------------------

function getStateWithMaxCovidCases(data) {
  //Get the state with the most covid cases within the period.
  let allCases = data.map((entry) => {
    return entry.confirmed;
  });

  let maxCases = Math.max(...allCases);
  let maxCasesIndex = allCases.indexOf(maxCases);

  return [data[maxCasesIndex].state, maxCases];
}

function getStateWithMaxNewCovidCases(data) {
  let allNewCases = data.map((entry) => {
    return entry.confirmed_diff;
  });

  let maxNewCases = Math.max(...allNewCases);
  let maxNewCasesIndex = allNewCases.indexOf(maxNewCases);

  return [data[maxNewCasesIndex].state, maxNewCases];
}

function getStateWithMaxCovidDeaths(data) {
  let allDeaths = data.map((entry) => {
    return entry.deaths;
  });

  let maxDeaths = Math.max(...allDeaths);
  let maxDeathsIndex = allDeaths.indexOf(maxDeaths);

  return [data[maxDeathsIndex].state, maxDeaths];
}

function getStateWithMaxNewCovidDeaths(data) {
  let allNewDeaths = data.map((entry) => {
    return entry.deaths_diff;
  });

  let maxNewDeaths = Math.max(...allNewDeaths);
  let maxNewDeathsIndex = allNewDeaths.indexOf(maxNewDeaths);

  return [data[maxNewDeathsIndex].state, maxNewDeaths];
}