//Query county unemployment API
function queryCountyUnemploymentAPI(start_date, end_date, county_FIPS) {
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
    queryString += `county_Fips=${county_FIPS}&`;
  }

  return new Promise((resolve) => {
    d3.json(baseURL + queryString, (data) => {
      console.log("data", data);
      resolve(data);
    });
  });
}

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

  //If no data is in the query string, then query all of it
  if (!countyUnemploymentData || countyUnemploymentData.length == 0) {
    countyUnemploymentData = await queryCountyUnemploymentAPI();
    console.log("countyUnemploymentData from API", countyUnemploymentData);
    storeDataLocally("cachedCountyUnemployment", countyUnemploymentData);
  }

  //Filter the data on the front end for faster responsiveness / fewer API calls
  countyUnemploymentData = countyUnemploymentData
    .filter((entry) => {
      entry.file_week_ended > start_date;
    })
    .filter((entry) => {
      entry.file_week_ended < end_date;
    })
    .filter((entry) => {
      county_FIPS.includes(entry.county_FIPS);
    });

  return countyUnemploymentData;
}
