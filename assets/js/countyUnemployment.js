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

//Gets the county unemployment data from local storage if it exists, otherwise queries the api and writes to storage
async function getCountyUnemploymentData(
  start_date = "2020-01-01",
  end_date
) {
  if (!end_date) {
    end_date = moment().subtract(1, "days").format("YYYY[-]MM[-]DD"); //yesterday
  }

  let countyUnemploymentData = getLocalData("cachedCountyUnemployment");
  console.log("local countyUnemploymentData");
  // saving old query date seperately in cache to be used in below condition
  //  previously erroring while trying to compare string to date object
  //  this enables comparison btwn strings
  let lastQueriedStartDate = getLocalData("lastQueriedStartDate");
  let lastQueriedEndDate = getLocalData("lastQueriedEndDate");

  //If no data is in the query string, then query the selected range and save it to the cache
  if (!countyUnemploymentData || countyUnemploymentData.length == 0 || !lastQueriedStartDate || !lastQueriedEndDate) {
    console.log("no data in cache, querying API")
    countyUnemploymentData = await queryCountyUnemploymentAPI(
      start_date,
      end_date
    );
    console.log("countyUnemploymentData from API", countyUnemploymentData);
    storeDataLocally("cachedCountyUnemployment", countyUnemploymentData);
    lastQueriedStartDate = storeDataLocally("lastQueriedStartDate", start_date)
    lastQueriedEndDate = storeDataLocally("lastQueriedEndDate", end_date)
  }
  // if the earliest date in the cache is > start_date, or the latest date in the cache is < end date
  //  re-query the api and use those results.
  else if (
    start_date > lastQueriedStartDate || 
    end_date < lastQueriedEndDate) {
      console.log("cache does not overlap with selected dates, querying API")
      countyUnemploymentData = await queryCountyUnemploymentAPI(
        start_date,
        end_date
        );
        // above condition assumes sorted data from cache
        countyUnemploymentData.sort((a, b) => {
          if (a.file_week_ended >= b.file_week_ended) {
            return 1;
          } else {
            return -1;
          }
        });
        console.log("countyUnemploymentData on new start/end date condition", countyUnemploymentData);
        try {
          storeDataLocally("cachedCountyUnemployment", countyUnemploymentData);
          lastQueriedStartDate = storeDataLocally("lastQueriedStartDate", start_date)
          lastQueriedEndDate = storeDataLocally("lastQueriedEndDate", end_date)
        }
        catch(err) {
          console.log(err.message)
        }
      }
  //We loaded from the cache
  else {
    console.log("data loaded from cache")
    //Sort the data by file_week_ended
    countyUnemploymentData.sort((a, b) => {
      if (a.file_week_ended >= b.file_week_ended) {
        return 1;
      } else {
        return -1;
      }
    });

    countyUnemploymentData = countyUnemploymentData.filter((unemploymentDatum) => {
      return (unemploymentDatum.file_week_ended >= start_date || unemploymentDatum.file_week_ended <= end_date)
    })

    console.log(
      "latest date in cache: ",
      countyUnemploymentData[0].file_week_ended
    );

  }

  console.log("countyUnemploymentData to return", countyUnemploymentData);
  return countyUnemploymentData;
}
