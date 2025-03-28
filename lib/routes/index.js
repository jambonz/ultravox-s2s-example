module.exports = ({logger, makeService}) => {
  require('./weather-agent_clientTools')({logger, makeService});
  require('./weather-agent_serverTools')({logger, makeService});
  require('./call-transfer-agent_clientTools')({logger, makeService});
  require('./call-transfer-agent_serverTools')({logger, makeService});

};

