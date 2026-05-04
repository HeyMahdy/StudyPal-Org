const express = require('express');
const controller = require('../controllers/habitController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listHabits);
router.post('/', requireFields(['type', 'value', 'entry_date']), controller.upsertHabit);

module.exports = router;
