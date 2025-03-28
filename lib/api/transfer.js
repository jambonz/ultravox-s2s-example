const express = require('express');
const jambonz = require('@jambonz/node-client');
const {WebhookResponse} = jambonz;
const client = jambonz(process.env.JAMBONZ_ACCOUNT_SID, process.env.JAMBONZ_API_KEY, {baseUrl: process.env.JAMBONZ_BASE_URL});
console.log(process.env.JAMBONZ_BASE_URL)

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
      .pause({length: .5})
      .say({
        text: 'please wait while I connect you'
      })
      .dial({
        actionHook: '/api/dialAction',
        callerId: process.env.HUMAN_AGENT_CALLERID,
          target: [
            {
              type: 'phone',
              number: process.env.HUMAN_AGENT_NUMBER,
              trunk: process.env.HUMAN_AGENT_TRUNK
            }
          ]
      })
    res.status(200).json(app);
})

routes.post('/dialAction', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/dialAction');
    const app = new WebhookResponse();
    app
      .say({
        text: 'your call with the human agent has ended'
      })
      .hangup()
    res.status(200).json(app);
})
module.exports = routes;