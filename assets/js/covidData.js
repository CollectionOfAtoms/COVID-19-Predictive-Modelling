//Queries the covid API
function queryCovidAPI(country_code, date) {
  let baseURL = "https://covid-19-statistics.p.rapidapi.com/reports";
  let queryString = `?iso=${country_code}&date=${date}`;

  return new Promise((resolve) => {
    d3.json(baseURL + queryString)
      .header("x-rapidapi-host", "covid-19-statistics.p.rapidapi.com")
      .header("x-rapidapi-key", covidAPI_KEY)
      .get((err, root) => {
        console.log("root.data", root.data);
        resolve(root.data);
      });
  });
}

/** Queries the CovidAPI to get data for a specific date.
 * if none is provided, then it defaults to yesterday
 */
async function getCovidData(date = null) {
  console.log("getCovidData date", date);

  let data = getLocalData("cachedCovidData");
  let yesterday = moment().subtract(1, "days").format("YYYY[-]MM[-]DD");

  if (!date) {
    date = yesterday;
  }

  console.log("local data", data);

  //If no data was found in the cache (or empty array)
  if (!data || data.length == 0) {
    //Query the API
    data = await queryCovidAPI("USA", date);
    //Cache the contents on the user's browser
    storeDataLocally("cachedCovidData", data);
  }
  //Data was found in the cache
  else {
    //Check if local data has date < today
    datesInCache = data.map((entry) => entry.date);
    //Sort dates descending
    datesInCache.sort((a, b) => (a > b ? 1 : -1));
    console.log("last date in cache:", datesInCache[0]);

    if (datesInCache[0] != date) {
      //Query the API
      data = await queryCovidAPI("USA", date);
      //Cache the contents on the user's browser
      storeDataLocally("cachedCovidData", data);
    }
  }

  return data;
}

function storeDataLocally(key, value) {
  return localStorage.setItem(key, JSON.stringify(value));
}
function getLocalData(key) {
  localData = localStorage.getItem(key);
  // console.log("localData Debug", key, typeof localData, localData);

  //Data always comes back from the cache as a string so we need to check against
  // string undefined rather thann undefined literal
  if (localData === "undefined") {
    return undefined;
  } else {
    return JSON.parse(localStorage.getItem(key));
  }
}
