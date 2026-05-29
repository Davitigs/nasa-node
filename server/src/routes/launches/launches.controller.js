const {
   getAllLaunches,
   scheduleNewLaunch,
   hasLaunchWithId,
   abortLaunchById
   } = require('../../models/launches.model');

const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit)
  return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if (!launch.rocket || !launch.mission || !launch.launchDate || !launch.target) {
    return res.status(400).json({
      error: 'Some required properties are missing!'
    })
  }
  launch.launchDate = new Date(launch.launchDate);

  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: 'Invalid Launch Date'
    })
  }
  await scheduleNewLaunch(launch);

  return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
  const launchId = +req.params.id;
  const launchExists = await hasLaunchWithId(launchId);
  if (!launchExists) {
    return res.status(404).json({
      error: "Launch not found!"
    })
  }
  const aborted = await abortLaunchById(launchId);

  if (!aborted) {
    return res.status(400).json({
      error: 'Something went wrong!'
    })
  }
  return res.status(200).json({
    ok: true
  })
}

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch
}