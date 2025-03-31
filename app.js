require('dotenv').config()
const express = require('express');
const app = express();
const {createServer} = require('http');
const {createEndpoint} = require('@jambonz/node-client-ws');
const server = createServer(app);
const makeService = createEndpoint({server});
const logger = require('pino')({level: process.env.LOGLEVEL || 'info'});
const port = process.env.WS_PORT || 3000;
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

require('./lib/routes')({logger, makeService});

app.post('/final', (req, res) => {
  logger.info({body: req.body}, 'POST /final');
  
  res.status(200).send();
});

app.post('/event', (req, res) => {
  logger.info({body: req.body}, 'POST /event');
  
  res.status(200).send();
});

server.listen(port, () => {
  logger.info(`jambonz websocket server listening at http://localhost:${port}`);
});
