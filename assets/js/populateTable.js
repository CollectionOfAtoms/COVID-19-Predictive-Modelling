//Initial API call on page load
pullDownMenu();
optionChanged1();

d3.select("#startDateTable").property("value", "01/01/2020");
d3.select("#startDateTable").property(
  "value",
  moment().format("MM[/]DD[/]YYYY")
);

//Bind date filters to optionChanged
d3.select("#startDateTable").on("change", optionChanged1);
d3.select("#endDateTable").on("change", optionChanged1);

// Get a reference to the table body
var tbody = d3.select("tbody");

function buildTable(data) {
  // Clear table
  tbody.html("");
  // read the data
  data.forEach((datum) => {
    var row = tbody.append("tr");

    row.append("td").attr("class", "tableDatum").text(datum.state);
    row.append("td").attr("class", "tableDatum").text(datum.state_abbr);
    row.append("td").attr("class", "tableDatum").text(datum.initial_claims);
    row.append("td").attr("class", "tableDatum").text(datum.continued_claims);
    row.append("td").attr("class", "tableDatum").text(datum.covered_employment);
    row
      .append("td")
      .attr("class", "tableDatum")
      .text(datum.insured_unemployment_rate);
    row.append("td").attr("class", "tableDatum").text(datum.file_week_ended);

    // Object.entries(data).forEach(([key, value]) => {
    //   var cell = row.append("td");
    //   cell.text(value);
    // });
  });
}

//

function pullDownMenu() {
  var dropdown = d3.select("#selStateTable");
  // Log the entire dataset

  // For each ID in the array run a function
  stateData.forEach((element) => {
    // Append an option element to the #selDataset dropdown with the id
    // in the value attribute as well as text between the open and closed tags.
    dropdown.append("option").attr("value", element.abbr).text(element.state);
  });
}

function optionChanged1() {
  var selValues = [];
  selValues.push($("#selStateTable").val());
  // d3.select("#h-pulldown").text(selValues);

  let startDate = d3.select("#startDateTable").property("value");
  let endDate = d3.select("#endDateTable").property("value");
  console.log("startDate direct from field: ", startDate);

  // Reformat dates with moment.js
  startDate = moment(startDate).format("YYYY[-]MM[-]DD");
  endDate = moment(endDate).format("YYYY[-]MM[-]DD");
  console.log(startDate);

  //Build API call
  baseURL =
    "https://unemployment-during-covid19.herokuapp.com/unemploymentData";
  queryString = `?start_date=${startDate}&end_date=${endDate}`;

  //If no states are selected, default to returning all state data
  if (selValues.length > 0) {
    queryString += `&state_abbr=${selValues.toString()}`;
  }

  // Call out the the API with values from the filter fields
  d3.json(`${baseURL}${queryString}`, (data) => {
    console.log("api query: ", `${baseURL}${queryString}`);
    console.log("api returned", data);

    //Generate a populate Table
    buildTable(data);
  });
}
