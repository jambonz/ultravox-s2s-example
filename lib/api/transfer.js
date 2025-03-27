const express = require('express');
const jambonz = require('@jambonz/node-client');
const {WebhookResponse} = jambonz;
const client = jambonz('c322820d-6250-41b0-9129-7929405e52ed', '07ccfd92-1718-4205-bbc9-f2b1a8c0595e', {baseUrl: 'https://jambonz.xyz'});


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

  res.status(200);

});

routes.post('/call-hook', async (req, res) => {

    const app = new WebhookResponse();
    app
      .pause({length: 1.5})
      .say({
        text: 'hi there, and welcome to jambonz!'
      });
    res.status(200).json(app);
    })

module.exports = routes;