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
      .on('/dialAction', dialAction.bind(null, session))
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
    const humanAgentNumber = '+441934834213';
    const humanAgentTrunk = 'AA'
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
          callerId: '447973994474',
          target: [
            {
              type: 'phone',
              number: humanAgentNumber,
              trunk: humanAgentTrunk
            }
          ]
        }
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

const dialAction = async(session, evt) => {
  console.log
  const {logger} = session.locals;
  logger.info(`dialAction: `)
  console.log(evt)
  session
  .say({text: "The call with a human agent has ended"})
  .hangup()
  .reply();
}

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
