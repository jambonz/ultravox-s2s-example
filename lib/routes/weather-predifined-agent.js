const service = ({logger, makeService}) => {
  const svc = makeService({path: '/weather-predefined-agent'});
  

  svc.on('session:new', (session, path) => {
    session.locals = { ...session.locals,
      transcripts: [],
      logger: logger.child({call_sid: session.call_sid})
    };
    session.locals.logger.info({session, path}, `new incoming call: ${session.call_sid}`);

    const apiKey = process.env.ULTRAVOX_API_KEY;
    const agentId = process.env.ULTRAVOX_AGENT_ID;
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
    else if (!agentId) {
      session.locals.logger.info('missing env ULTRAVOX_AGENT_ID, hanging up');
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
            apiKey,
            agent_id: agentId
          },
          actionHook: '/final',
          eventHook: '/event',
          llmOptions: {}
        })
        .hangup()
        .send();
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

const onEvent = async(session, _evt) => {
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
