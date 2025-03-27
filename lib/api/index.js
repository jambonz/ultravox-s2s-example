const router = require('express').Router();

router.use('/weather', require('./weather'));
router.use('/transfer', require('./transfer'));

module.exports = router;
