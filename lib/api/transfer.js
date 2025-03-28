const express = require('express');
const jambonz = require('@jambonz/node-client');
const {WebhookResponse} = jambonz;
const client = jambonz(process.env.JAMBONZ_ACCOUNT_SID, process.env.JAMBONZ_API_KEY, {baseUrl: process.env.JAMBONZ_BASE_URL});


const routes = express.Router();
routes.post('/', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/transfer');
  console.log('TRANSFERRING CALL');
  
  let result = await client.calls.update(req.body.call_sid, {call_hook: {
    url: `${process.env.HTTP_BASE_URL}/api/transfer/call-hook`,
    method: 'POST'
  }});

  console.log(result);

  res.send('Transferring the call now');

});

routes.post('/call-hook', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/call-hook');
    const app = new WebhookResponse();
    app
      .pause({length: 1.5})
      .say({
        text: 'hi there, and welcome to jambonz!'
      });
    res.status(200).json(app);
    })

module.exports = routes;