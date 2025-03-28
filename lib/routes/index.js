module.exports = ({logger, makeService}) => {
  require('./ultravox-s2s')({logger, makeService});
  require('./call-transfer-agent')({logger, makeService});
};

