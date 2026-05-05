const express = require('express');
const controller = require('../controllers/taskController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listTasks);
router.post('/', requireFields(['title']), controller.createTask);
router.get('/:id', controller.getTask);
router.put('/:id', controller.updateTask);
router.patch('/:id/status', requireFields(['status']), controller.updateTaskStatus);
router.delete('/:id', controller.deleteTask);

module.exports = router;
