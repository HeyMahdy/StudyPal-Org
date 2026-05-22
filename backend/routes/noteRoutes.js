const express = require('express');
const controller = require('../controllers/noteController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listNotes);
router.post('/', requireFields(['title']), controller.createNote);
router.post('/seed', controller.seedNotes);
router.put('/:id', controller.updateNote);
router.delete('/:id', controller.deleteNote);

module.exports = router;
