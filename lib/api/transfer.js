/*

  This example uses the dial verb with INVITE as the SIP method to transfer the call to a human agent via Ultravox serverTools.
  https://docs.jambonz.org/verbs/verbs/dial

  Alternatively, you can use SIP REFER as a method. When opting for this method, uncomment the commented code snippets, and remove the lines marked with "Remove ... when using sip:refer instead of dial".
  Ensure that the carrier of your choice supports SIP REFER.
  https://docs.jambonz.org/verbs/verbs/sip-refer

*/

const express = require('express');
const jambonz = require('@jambonz/node-client');
const {WebhookResponse} = jambonz;
const client = jambonz(process.env.JAMBONZ_ACCOUNT_SID, process.env.JAMBONZ_API_KEY, {baseUrl: process.env.JAMBONZ_BASE_URL});

const routes = express.Router();
routes.post('/', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/transfer');
  
  setTimeout(() => {
    client.calls.update(req.body.call_sid, {call_hook: {
      url: `${process.env.HTTP_BASE_URL}/api/transfer/call-hook`,
      method: 'POST'
    }});
  }, 5000);
  
  let response = {
    message: 'The call is being transferred, say goodbye to the caller'
  }
  res.status(200).json(response);

});

// Remove when using sip:refer instead of dial
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
        actionHook: '/api/transfer/dial-action',
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

// Remove when using sip:refer instead of dial
routes.post('/dial-action', async (req, res) => {
  const {logger} = req.app.locals;
  logger.info({body: req.body}, 'POST /api/transfer/dial-action');
    const app = new WebhookResponse();
    app
      .say({
        text: 'your call with the human agent has ended'
      })
      .hangup()
    res.status(200).json(app);
})

// routes.post('/call-hook', async (req, res) => {
//   const {logger} = req.app.locals;
//   logger.info({body: req.body}, 'POST /api/call-hook');
//     const app = new WebhookResponse();
//     app
//       .pause({length: .5})
//       .say({
//         text: 'please wait while I connect you'
//       })
//       .sip_refer({
//         actionHook: '/api/transfer/sip_refer-action',
//         eventHook: '/api/transfer/sip_refer-event',
//         referTo: process.env.HUMAN_AGENT_NUMBER,
//         referredBy: process.env.HUMAN_AGENT_CALLERID
//       })
//     res.status(200).json(app);
// })

// routes.post('/sip_refer-action', async (req, res) => {
//   const {logger} = req.app.locals;
//   logger.info({body: req.body}, 'POST /api/transfer/sip_refer-action');
  
//   res.status(200).send();
// })

// routes.post('/sip_refer-event', async (req, res) => {
//   const {logger} = req.app.locals;
//   logger.info({body: req.body}, 'POST /api/transfer/sip_refer-event');

//   res.status(200).send();
// })

module.exports = routes;