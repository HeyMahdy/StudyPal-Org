const express = require('express');
const controller = require('../controllers/expenseController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listExpenses);
router.post('/', requireFields(['title', 'amount', 'category', 'spent_at']), controller.createExpense);
router.delete('/:id', controller.deleteExpense);

module.exports = router;
