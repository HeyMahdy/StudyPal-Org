const express = require('express');
const controller = require('../controllers/aiExpenseController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.post('/', requireFields(['amount', 'item', 'category', 'expense_date']), controller.createExpense);
router.get('/', controller.listExpenses);
router.get('/summary', controller.summary);
router.delete('/:id', controller.deleteExpense);

module.exports = router;
