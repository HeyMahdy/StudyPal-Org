const express = require('express');
const controller = require('../controllers/eventController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listEvents);
router.post('/', requireFields(['title', 'start']), controller.createEvent);
router.put('/:id', controller.updateEvent);
router.delete('/:id', controller.deleteEvent);

module.exports = router;
