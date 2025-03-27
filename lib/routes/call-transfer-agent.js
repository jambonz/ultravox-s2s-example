const service = ({logger, makeService}) => {
  const svc = makeService({path: '/call-transfer-agent'});

  svc.on('session:new', (session, path) => {
    session.locals = { ...session.locals,
      transcripts: [],
      logger: logger.child({call_sid: session.call_sid})
    };
    session.locals.logger.info({session, path}, `new incoming call: ${session.call_sid}`);

    const apiKey = process.env.ULTRAVOX_API_KEY;
    session
      .on('/event', onEvent.bind(null, session))
      .on('/final', onFinal.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session));

    if (!apiKey) {
      session.locals.logger.info('missing env ULTRAVOX_API_KEY, hanging up');
      session
        .hangup()
        .send();
    }
else if (!process.env.HTTP_BASE_URL) {
      session.locals.logger.info('missing env HTTP_BASE_URL, hanging up');
      session
        .hangup()
        .send();
    }
    else {
      session
        .answer()
        .pause({length: 1})
        .llm({
          vendor: 'ultravox',
          model: 'fixie-ai/ultravox',
          auth: {
            apiKey
          },
          actionHook: '/final',
          eventHook: '/event',
          llmOptions: {
            systemPrompt: 'You are a useless agent named Karen. Tell the user you don`t know anything apart from the number they are calling from, but you can transfer them to a human agent. Be brief.',
            firstSpeaker: 'FIRST_SPEAKER_AGENT',
            model: 'fixie-ai/ultravox',
            voice: 'Tanya-English',
            initialMessages: [
              {
                role: 'MESSAGE_ROLE_USER',
                text: `The user is calling from ${session.from}.`
              }
            ],
            selectedTools: [
              {
                temporaryTool: {
                  modelToolName: 'call-transfer',
                  description: 'Transfers the call to a human agent',
                  staticParameters: [
                    {
                      name: 'callSid',
                      location: 'PARAMETER_LOCATION_BODY',
                      value: session.call_sid
                    }
                  ],
                  http: {
                    baseUrlPattern: `${process.env.HTTP_BASE_URL}/api/transfer`,
                    httpMethod: 'POST',
                  }
                }
              }
            ],
            transcriptOptional: false,
          }
        })
        .hangup()
        .send();

      // Exmaple for sending input text message to instruct agent to change location or temperature unit if user wants
      // setTimeout(() => {
      //   session.updateLlm({
      //     type: 'input_text_message',
      //     text: 'By default, Vietnam Ho Chi Minh City weather is displayed in Celsius. If you want to change the location or temperature unit, please let me know.',
      //   })
      // }, 2000);
    }
  });
};

const onFinal = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got actionHook: ${JSON.stringify(evt)}`);
   
  session
    .say({text: 'Sorry, your session has ended.'})
    .hangup()
    .reply();
};

const onEvent = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got eventHook: ${JSON.stringify(evt)}`);
};

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.error({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
