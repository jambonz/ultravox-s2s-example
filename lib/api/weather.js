const express = require('express');
const {getWeather} = require('../utils');

const routes = express.Router();
routes.post('/', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/weather');
  const {location, scale = 'celsius'} = req.body;
  try {
    const weather = await getWeather(location, scale, logger);
    logger.info({weather}, 'got response from weather API');
    res.status(200).json({weather});
  } catch (err) {
    logger.error({err}, 'error calling geocoding or weather API');
    return res.status(500).json({result: 'error', message: `Failed to get weather for location ${location}`});
  }
});
module.exports = routes;