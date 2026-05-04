const express = require('express');
const { overview } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/overview', overview);

module.exports = router;
