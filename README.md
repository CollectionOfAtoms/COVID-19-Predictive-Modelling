# Modeling the Spread of COVID-19

The purpose of this project is to develop a COVID-19 machine learning model that predicts the number of COVID-19 cases 30 days post-lockdown for each county within each US state, using variables from the social vulnerability index maintained by the CDC and unemployment claims.

The model will compute the weight of each input social and economic variable, and the relative predictive power of each variable will change how it informs each case-number prediction. The results will be displayed visually on a dashboard. A multi-layerer, color-coded, interactive map will be the dashboard's main feature, and it will display the predicted case numbers, the input variables, and each variable's predictive power in to-be-determined ways.

The dashboard will at minimum also include a summary statistics panel and a few graphical data viualizations that are user responsive -- the user can select states, counties, and time windows they are interested in, and visualization will update accordingly. We plan to also include a raw data page for transparency into our sources and methods.


### Data Sources
https://svi.cdc.gov
https://rapidapi.com/axisbits-axisbits-default/api/covid-19-statistics
https://oui.doleta.gov/unemploy/claims.asp

### Division of Labor in Development

#### Shaun

- [ ] Updating existing plots on home page to display county data, adding additional plots displaying covid cases, potentially toggling back and forth.

#### Rose

- [x] Write an instance of the most recent COVID data from an API call to a CSV. Distribute to teammates so they may all develop candidate neural nets with different parameters.
- [x] Will take my previously deployed Unemployment API from Heroku and add an additional route with a new unemployment dataset. The new dataset has more updated figures from a different source, and its data is resolved down to the county level, rather than just the state level.
- [x] Will clean up and fork my previous Project 2 repo so the only contributors to this final project are the four of us, and those updates will not erase or overwrite my Project 2 teammates' work.
- [x] Add new data from AGS county unemployment dataset to our master database -- drop old table and re-add with new estimates.
- [x] Expand the summary statistics panel to include covid case info.
- [x] Add covid data to the state popups
- [x] Enable the switching of map layers to toggle between state and county geojson files depending on dataset.
- [ ] Add API route that's connected to a NN file, query params would be NN input vars?
- [x] Enable summary stats panel to switch between county stats and state stats with mode changes.

#### Alec

- [ ] Creating an additional sources page.

#### Ryan

- [ ] Continue fine-tuning the NN to predict % of county populations with COVID 30 days after lockdown.
- [ ] Update a general regression analysis and perhaps create more specific additional regression analyses for additional site table.
