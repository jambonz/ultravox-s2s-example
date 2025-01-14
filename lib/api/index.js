const router = require('express').Router();

router.use('/weather', require('./weather'));

module.exports = router;
