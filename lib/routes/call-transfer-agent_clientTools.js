/*

  This example uses the dial verb with INVITE as the SIP method to transfer the call to a human agent via Ultravox clientTools.
  https://docs.jambonz.org/verbs/verbs/dial

  Alternatively, you can use SIP REFER as a method. When opting for this method, uncomment the commented code snippets, 
  and remove the lines marked with "Remove ... when using sip:refer instead of dial".
  Ensure that the carrier of your choice supports SIP REFER.
  https://docs.jambonz.org/verbs/verbs/sip-refer

*/

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/call-transfer-agent'});
  

  svc.on('session:new', (session, path) => {
    session.locals = { ...session.locals,
      transcripts: [],
      logger: logger.child({call_sid: session.call_sid})
    };
    session.locals.logger.info({session, path}, `Call transfer agent, new incoming call: ${session.call_sid}`);

    const apiKey = process.env.ULTRAVOX_API_KEY;
    session
      .on('/event', onEvent.bind(null, session))
      .on('/toolCall', onToolCall.bind(null, session))
      .on('/final', onFinal.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('/dialAction', dialAction.bind(null, session))    //Remove when using sip:refer instead of dial
      // .on('/sip_referAction', sip_referAction.bind(null, session))  
      // .on('/sip_referEvent', sip_referEvent.bind(null, session))  
      .on('error', onError.bind(null, session));

    if (!apiKey) {
      session.locals.logger.info('missing env ULTRAVOX_API_KEY, hanging up');
      session
        .hangup()
        .send();
    }
    else {
      session
        .answer()
        .pause({length: 0.5})
        .llm({
          vendor: 'ultravox',
          model: 'fixie-ai/ultravox',
          auth: {
            apiKey
          },
          actionHook: '/final',
          eventHook: '/event',
          toolHook: '/toolCall',
          llmOptions: {
            systemPrompt: 'You are an agent named Karen. you don`t know anything apart from the number they are calling from, but you can transfer them to a human agent. Be brief.',
            firstSpeaker: 'FIRST_SPEAKER_AGENT',
            initialMessages: [{
              medium: 'MESSAGE_MEDIUM_VOICE',
              role: 'MESSAGE_ROLE_USER',
              text: `The user is calling from ${session.from}.`,
            }],
            model: 'fixie-ai/ultravox',
            voice: 'Tanya-English',
            selectedTools: [
              {
                temporaryTool: {
                  modelToolName: 'call-transfer',
                  description: 'Transfers the call to a human agent',
                  client: {}
                }
              }
            ],
            transcriptOptional: true,
          }
        })
        .hangup()
        .send();

    }
  });
};

const onFinal = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got actionHook: ${JSON.stringify(evt)}`);

  if (['server failure', 'server error'].includes(evt.completion_reason)) {
    if (evt.error.code === 'rate_limit_exceeded') {
      let text = 'Sorry, you have exceeded your  rate limits. ';
      const arr = /try again in (\d+)/.exec(evt.error.message);
      if (arr) {
        text += `Please try again in ${arr[1]} seconds.`;
      }
      session
        .say({text});
    }
    else {
      session
        .say({text: 'Sorry, there was an error processing your request.'});
    }
    session.hangup();
  }
  session.reply();
};

const onEvent = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got eventHook: ${JSON.stringify(evt)}`);
};

const onToolCall = async(session, evt) => {
  const {logger} = session.locals;

  const {name, args, tool_call_id} = evt;
  const {callSid} = args;
  logger.info({evt}, `got toolHook for ${name} with tool_call_id ${tool_call_id}`);

  try {
    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      result: "Successfully transferred call to agent, telling user to wait for a moment.",
    };

    setTimeout(() => {
      session.sendCommand('redirect', [
        {
          verb: 'say',
          text: 'Please wait while I connect your call'
        },
        {
          verb: 'dial',
          actionHook: '/dialAction',
          callerId: process.env.HUMAN_AGENT_CALLERID,
          target: [
            {
              type: 'phone',
              number: process.env.HUMAN_AGENT_NUMBER,
              trunk: process.env.HUMAN_AGENT_TRUNK
            }
          ]
        } // Remove this object when using sip:refer instead of dial

        // {
        //   verb: 'sip:refer',
        //   actionHook: '/sip_referAction',
        //   eventHook: '/sip_referEvent',
        //   referTo: process.env.HUMAN_AGENT_NUMBER,
        //   referredBy: process.env.HUMAN_AGENT_CALLERID          
        // } // Remove this object when using dial instead of sip:refer
      ]);
    }, 5000);

    session.sendToolOutput(tool_call_id, data);

  } catch (err) {
    logger.info({err}, 'error transferring call');
    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      error_message: 'Failed to transfer call'
    };
    session.sendToolOutput(tool_call_id, data);
  }
};

// Remove when using sip:refer instead of dial
const dialAction = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`dialAction: `)
  console.log(evt)
  session
  .say({text: "The call with a human agent has ended"})
  .hangup()
  .reply();
}

// const sip_referAction = async(session, evt) => {
//   const {logger} = session.locals;
//   logger.info({evt}, `session ${session.call_sid} successfully transferred`);
  
// } 

// const sip_referEvent = async(session, evt) => {
//   const {logger} = session.locals;
//   logger.info({evt},`session ${session.call_sid} received event`);
  
// }

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
