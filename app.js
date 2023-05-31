const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertStatesObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertStateIdObjectToResponseObject = (dbObject) => {
  return {
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  };
};

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Get List Of All States

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT
        *
    FROM 
        state;`;
  const covidDetails = await db.all(getAllStatesQuery);
  response.send(
    covidDetails.map((eachState) =>
      convertStateObjectToResponseObject(eachState)
    )
  );
});

//Get State Details Based On StateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT
        *
    FROM
        state
    WHERE 
        state_id = ${stateId};`;
  const state = await db.get(getStateDetailsQuery);
  response.send(convertStateObjectToResponseObject(state));
});

//Create District Table

app.post("/districts/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const getDistrictDetailsQuery = `
    INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES 
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(getDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//Get DistrictNames Based On DistrictId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        *
    FROM
        district
    WHERE 
        district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

//Delete District Details

app.delete("/districts/:districtId/", (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  const disrict = db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update Districts Based On DistrictsId

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;
  const updateDetailsQuery = `
    UPDATE
        district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
    district_id = ${districtId};`;
  await db.run(updateDetailsQuery);
  response.send("District Details Updated");
});

//Get Static Based On States

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsDetailsQuery = `
    SELECT 
        SUM(cases) AS total_cases,
        SUM(cured) AS total_cured,
        SUM(active) AS total_active,
        SUM(deaths) AS total_deaths
    FROM
        district
    WHERE 
        state_id = ${stateId};`;
  const state = await db.get(getStatsDetailsQuery);
  response.send(convertStateIdObjectToResponseObject(state));
});

//Get District Details

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetailsQuery = `
    SELECT 
        state_name
    FROM state 
        NATURAL JOIN district
    WHERE 
        district_id = ${districtId}`;
  const stateDetails = await db.get(stateDetailsQuery);
  response.send(convertStatesObjectToResponseObject(stateDetails));
});

module.exports = app;
