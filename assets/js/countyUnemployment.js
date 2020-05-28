//Query county unemployment API
function queryCountyUnemploymentAPI(start_date, end_date, county_FIPS) {
  console.log(start_date, end_date);

  let baseURL =
    "https://unemployment-during-covid19.herokuapp.com/countyUnemploymentEstimates";

  let queryString = `?`;

  if (start_date) {
    queryString += `start_date=${start_date}&`;
  }
  if (end_date) {
    queryString += `end_date=${end_date}&`;
  }
  if (county_FIPS) {
    queryString += `county_FIPS=${county_FIPS}&`;
  }

  return new Promise((resolve) => {
    d3.json(baseURL + queryString, (data) => {
      console.log("data", data);
      resolve(data);
    });
  });
}

//Gets the conty unemployment data from local storage if it exists, otherwise queries the api and writes to storage
async function getCountyUnemploymentData(
  start_date = "2020-01-01",
  end_date,
  county_FIPS = []
) {
  if (!end_date) {
    end_date = moment().subtract(1, "days").format("YYYY[-]MM[-]DD"); //yesterday
  }

  let countyUnemploymentData = getLocalData("cachedCountyUnemployment");
  console.log("local countyUnemploymentData");

  //If no data is in the query string, then query the selected range and save it to the cache
  if (!countyUnemploymentData || countyUnemploymentData.length == 0) {
    countyUnemploymentData = await queryCountyUnemploymentAPI(
      start_date,
      end_date
    );
    console.log("countyUnemploymentData from API", countyUnemploymentData);
    storeDataLocally("cachedCountyUnemployment", countyUnemploymentData);
  }
  //We loaded from the cache
  else {
    //Sort the data by file_week_ended
    countyUnemploymentData.sort((a, b) => {
      if (a.file_week_ended >= b.file_week_ended) {
        return 1;
      } else {
        return -1;
      }
    });

    console.log(
      "latest date in chache: ",
      countyUnemploymentData[0].file_week_ended
    );

    //TODO: If the earliest date in the cache is > start_date, or the latest date in the cache is < end date
    //requery the api and use those results
  }

  console.log("countyUnemploymentData to return", countyUnemploymentData);
  return countyUnemploymentData;
}
