const express = require('express');
const controller = require('../controllers/habitController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listHabits);
router.post('/', requireFields(['title']), controller.createHabit);
router.post('/log', requireFields(['habit_id', 'value']), controller.logHabit);
router.get('/logs', controller.getLogs);
router.get('/:id', controller.getHabit);
router.put('/:id', controller.updateHabit);
router.delete('/:id', controller.deleteHabit);

module.exports = router;
