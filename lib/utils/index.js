const axios = require('axios');

const getWeather = async (location, scale, logger) => {
  /* first we need lat and long, then we can get the weather for that location */
  let url = `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&language=en&format=json`;
  let response = await axios.get(url);

  if (!Array.isArray(response.data.results) || 0 == response.data.results.length) {
    throw new Error('location_not_found');
  }
  const {latitude:lat, longitude:lng, name, timezone, population, country} = response.data.results[0];

  logger.info({name, country, lat, lng, timezone, population}, 'got response from geocoding API');

  // eslint-disable-next-line max-len
  url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m&temperature_unit=${scale}`;

  logger.info(`calling weather API with url: ${url}`);
  response = await axios.get(url);
  return response.data;
}

module.exports = {
  getWeather
};