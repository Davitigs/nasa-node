// const launches = new Map();

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');
const axios = require('axios');

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_URL = 'https://api.spacexdata.com/v5/launches/query';

async function populateLaunches() {
  const response = await axios.post(SPACEX_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1
          }
        },
        {
          path: 'payloads',
          select: {
            customers: 1
          }
        }
      ]
    }
  });

  if (response.status !== 200) {
    throw new Error('Launch data failed to download!');
  }
  const launchDocs = response.data.docs;
  for(const launchDoc of launchDocs) {

    const payloads = launchDoc.payloads;
    const customers = payloads.flatMap((payload) => {
      return payload.customers
    })
    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: launchDoc.date_local,
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
      customers
    }
    console.log(launch);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch  = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat'
  })
  if (firstLaunch) {
    return;
  }
  await populateLaunches();
}

async function findLaunch(filter) {
  return await launches.findOne(filter);
}

async function saveLaunch(launch) {
  await launches.findOneAndUpdate({
    flightNumber: launch.flightNumber
  }, launch, {
    upsert: true
  })
}
async function getAllLaunches(skip, limit) {
  return await launches.find({}, {
    '_id': 0,
    '__v': 0
  }).sort({flightNumber: 1}).skip(skip).limit(limit)
}

async function getLatestFlightNumber() {
  const lastFlight =  await launches.findOne().sort('-flightNumber');

  if (!lastFlight) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return lastFlight.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const lastFlightNumber = await getLatestFlightNumber() + 1;
  const newLaunch  = Object.assign(launch, {
    customers: ['ZTM', "NASA"],
    upcoming: true,
    success: true,
    flightNumber: lastFlightNumber
  })

  const planet = await planets.findOne({
    keplerName: newLaunch.target
  })
  if (!planet) {
    throw new Error('Such planet does not exist');
  }
  await saveLaunch(newLaunch);
}

async function hasLaunchWithId(id) {
  return await findLaunch({
    flightNumber: id
  })
}

async function abortLaunchById(id) {
  const resp =  await launches.updateOne({
    flightNumber: id
  }, {
    upcoming: false,
    success: false
  })

  return resp.modifiedCount === 1
}

module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  hasLaunchWithId,
  abortLaunchById
}