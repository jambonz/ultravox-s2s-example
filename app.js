require('dotenv').config()
const express = require('express');
const app = express();
const {createServer} = require('http');
const {createEndpoint} = require('@jambonz/node-client-ws');
const server = createServer(app);
const makeService = createEndpoint({server});
const logger = require('pino')({level: process.env.LOGLEVEL || 'info'});
const port = process.env.PORT || 3000;
const routes = require('./lib/api');

app.locals = {
  ...app.locals,
  logger
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', (req, res, next) => {
  next();
},routes);

// Simple handler for the /final actionHook if it comes over WebHook instead of websocket after the call has been transferred
app.post('/final', async (req, res) => {
  res.status(200).json({})
})

require('./lib/routes')({logger, makeService});

server.listen(port, () => {
  logger.info(`jambonz websocket server listening at http://localhost:${port}`);
});

