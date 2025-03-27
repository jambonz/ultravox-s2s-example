module.exports = ({logger, makeService}) => {
  require('./weather-agent')({logger, makeService});
  require('./call-transfer-agent')({logger, makeService});
};

