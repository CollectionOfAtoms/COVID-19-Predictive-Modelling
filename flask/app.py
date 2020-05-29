import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, text

from flask import Flask, jsonify, request
from flask_cors import CORS

# Database Setup
# note that there are two copies of Project2.db
#   to run locally, database must be in same dir as main.py
#   to run on Heroku, database is read from root dir
engine = create_engine("sqlite:///../assets/data/Project2.db")

Base = automap_base()

Base.prepare(engine, reflect=True)

# Save reference to the unemployment table
unemployment = Base.classes.unemploymentData
# save reference to county unemployment data
county_unemployment = Base.classes.countyUnemploymentData

# Flask Setup
app = Flask(__name__)
cors = CORS(app)

@app.route("/")
def welcome():

    start_menu = """<br>
                Explore our US unemployment data API! 
                <br><br><br>
                Follow route "/unemploymentData" for all US Department of Labor unemployment data from Jan 2019 through May 2020
                <br><br>
                Add optional start and end date parameters by inputing dates in the form of:
                <br>
                start_date or end_date=yyyy-mm-dd
                <br><br>
                Add an optional state filter, such as:
                <br>
                state=NY,NJ,CT
                <br>
                Input only two-letter capitalized state and territory abbreviations, with no spaces between list items.
                <br><br>
                You may choose to input only a start date, only an end date, or only a state filter.
                <br>
                Parameters left unspecified will default to the most general query possible.
                <br>
                Query parameters may be input in any order.
                <br><br><br>
                Follow route "/countyUnemploymentEstimates" to view all AGS unemployment estimates for counties, boroughs, and municipalities from March 2020 through May 2020
                <br><br>
                Add optional start and end date parameters by inputing dates in the form of:
                <br>
                start_date or end_date=yyyy-mm-dd
                <br><br>
                Add an optional county filter (with possible multi-selections on county FIPS codes), such as:
                <br>
                county_FIPS=36079,36119,36087 --> Putnam, Westchester, and Rockland, NY
                <br>
                """

    return start_menu

@app.route("/unemploymentData")
def unemploymentData():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    stateparam = request.args.get("state_abbr")

    session = Session(engine)

    if not start_date:
        # query the min of all file_week_ended entries if no date is given in that parameter
        min_start_date = session.query(func.min(unemployment.file_week_ended))
        start_date = min_start_date

    if not end_date:
        # query the max of all file_week_ended entries if no date is given in that parameter
        max_end_date = session.query(func.max(unemployment.file_week_ended))
        end_date = max_end_date

    if not stateparam:
        results = session.query(unemployment).filter(unemployment.file_week_ended >= start_date).filter(unemployment.file_week_ended <= end_date)
    
    if stateparam:
        print("---------------------------")
        print("Whats in State:", stateparam)
        print("Whats it's type:", type(stateparam))
        print("---------------------------")
        stateparam = stateparam.split(',')
        print("Whats in State after split:", stateparam)
        print("What type is it now?", type(stateparam))
        print("---------------------------")

        if isinstance(stateparam, list):
            print("Are you making it to this line?")
            # this should make an array of states valid and handle the single-state case
            results = session.query(unemployment).filter(unemployment.file_week_ended >= start_date).filter(unemployment.file_week_ended <= end_date).filter(unemployment.state_abbr.in_(stateparam)).all()

    session.close()

    data = []
    for result in results:
        data.append({
            "state": result.state,
            "state_abbr": result.state_abbr,
            "file_week_ended": result.file_week_ended,
            "initial_claims": result.initial_claims,
            "reflecting_week_ended": result.reflecting_week_ended,
            "continued_claims": result.continued_claims,
            "covered_employment": result.covered_employment,
            "insured_unemployment_rate": result.insured_unemployment_rate
        })

    return jsonify(data)

# --------------------------------------------------------------------------------------------------------------------------

@app.route("/countyUnemploymentEstimates")
def countyUnemploymentData():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    countyparam = request.args.get("county_FIPS")

    session = Session(engine)

    if not start_date:
        # query the min of all file_week_ended entries if no date is given in that parameter
        min_start_date = session.query(func.min(county_unemployment.file_week_ended))
        start_date = min_start_date

    if not end_date:
        # query the max of all file_week_ended entries if no date is given in that parameter
        max_end_date = session.query(func.max(county_unemployment.file_week_ended))
        end_date = max_end_date

    if not countyparam:
        results = session.query(county_unemployment).filter(county_unemployment.file_week_ended >= start_date).filter(county_unemployment.file_week_ended <= end_date)
    
    if countyparam:
        print("---------------------------")
        print("Whats in County:", countyparam)
        print("Whats it's type:", type(countyparam))
        print("---------------------------")
        countyparam = countyparam.split(',')
        print("Whats in County after split:", countyparam)
        print("What type is it now?", type(countyparam))
        print("---------------------------")

        if isinstance(countyparam, list):
            print("Are you making it to this line?")
            # this should make an array of counties valid and handle the single-county case
            results = session.query(county_unemployment).filter(county_unemployment.file_week_ended >= start_date).filter(county_unemployment.file_week_ended <= end_date).filter(county_unemployment.county_code.in_(countyparam)).all()

    session.close()

    data = []
    for result in results:
        data.append({
            "county_code": result.county_code,
            "county_name": result.county_name,
            "labor_force": result.labor_force,
            "file_week_ended": result.file_week_ended,
            "percent_unemployed": result.percent_unemployed,
            "total_unemployed": result.total_unemployed
        })

    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True)