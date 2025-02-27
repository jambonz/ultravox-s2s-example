const { getWeather } = require("../utils");

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/ultravox-s2s'});
  

  svc.on('session:new', (session, path) => {
    session.locals = { ...session.locals,
      transcripts: [],
      logger: logger.child({call_sid: session.call_sid})
    };
    session.locals.logger.info({session, path}, `new incoming call: ${session.call_sid}`);

    const apiKey = process.env.ULTRAVOX_API_KEY;
    session
      .on('/event', onEvent.bind(null, session))
      .on('/toolCall', onToolCall.bind(null, session))
      .on('/final', onFinal.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session));

    if (!apiKey) {
      session.locals.logger.info('missing env ULTRAVOX_API_KEY, hanging up');
      session
        .hangup()
        .send();
    }
else if (process.env.SERVER_TOOL_ENABLED && !process.env.HTTP_BASE_URL) {
      session.locals.logger.info('missing env HTTP_BASE_URL, hanging up');
      session
        .hangup()
        .send();
    }
    else {
      session
        .answer()
        .pause({length: 1})
        .config({
          listen: {
              enable: true,
              mixType: 'stereo', // I have also tried 'mixed' but still no luck
              url: 'wss://5bba-2001-ee0-d744-8e60-d8eb-fd9d-3798-5857.ngrok-free.app/transcribe/listen',
          },
        })
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
            firstSpeaker: 'FIRST_SPEAKER_AGENT',
            initialMessages: [{
              medium: 'MESSAGE_MEDIUM_VOICE',
              role: 'MESSAGE_ROLE_AGENT',
              text: 'Hello, how can I help you today?',
            }],
            model: 'fixie-ai/ultravox',
            voice: 'Tanya-English',
            selectedTools: [
              {
                temporaryTool: {
                  modelToolName: 'get-weather',
                  description: 'Get the weather at a given location',
                  dynamicParameters: [
                    {
                      name: 'location',
                      location: 'PARAMETER_LOCATION_BODY',
                      required: true
                    }
                  ],
                  ...(process.env.SERVER_TOOL_ENABLED === 'true' ? {
                    http: {
                      baseUrlPattern: `${process.env.HTTP_BASE_URL}/api/weather`,
                      httpMethod: 'POST',
                    }
                  } : {
                    client: {}
                  })
                  
                }
              }
            ],
            transcriptOptional: true,
          }
        })
        .hangup()
        .send();

      // Exmaple for sending input text message to instruct agent to change location or temperature unit if user wants
      setTimeout(() => {
        session.updateLlm({
          type: 'input_text_message',
          text: 'By default, Vietnam Ho Chi Minh City weather is displayed in Celsius. If you want to change the location or temperature unit, please let me know.',
        })
      }, 2000);
    }
  });
};

const onFinal = async(session, evt) => {
  const {logger} = session.locals;
  logger.info(`got actionHook: ${JSON.stringify(evt)}`);

  if (['server failure', 'server error'].includes(evt.completion_reason)) {
    if (evt.error.code === 'rate_limit_exceeded') {
      let text = 'Sorry, you have exceeded your open AI rate limits. ';
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
  const {location, scale = 'celsius'} = args;
  logger.info({evt}, `got toolHook for ${name} with tool_call_id ${tool_call_id}`);

  try {
    const weather = await getWeather(location, scale, logger);
    logger.info({weather}, 'got response from weather API');

    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      result: weather
    };

    session.sendToolOutput(tool_call_id, data);

  } catch (err) {
    logger.info({err}, 'error calling geocoding or weather API');
    const data = {
      type: 'client_tool_result',
      invocation_id: tool_call_id,
      error_message: 'Failed to get weather for location'
    };
    session.sendToolOutput(tool_call_id, data);
  }
};

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
