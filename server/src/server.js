const http = require('http');
require('dotenv').config();
const app = require('./app');
const { mongoConnect } = require('./services/mongo')
const PORT = 8000;
const server = http.createServer(app);

const { loadPlanetsData } = require('./models/planeets.model');
const { loadLaunchData } = require('./models/launches.model')

async function loadServer() {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
  })
}

loadServer();

