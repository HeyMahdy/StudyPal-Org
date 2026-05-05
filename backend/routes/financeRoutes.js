const express = require('express');
const controller = require('../controllers/financeController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/budget', controller.listBudget);
router.post('/budget', requireFields(['category', 'limit_amount']), controller.upsertBudget);
router.put('/budget', requireFields(['category', 'limit_amount']), controller.upsertBudget);

router.get('/expenses', controller.listExpenses);
router.post('/expenses', requireFields(['amount', 'category', 'date']), controller.createExpense);
router.delete('/expenses/:id', controller.deleteExpense);

router.get('/summary', controller.summary);

router.get('/goals', controller.listSavingsGoals);
router.post('/goals', requireFields(['title', 'target_amount']), controller.createSavingsGoal);
router.put('/goals/:id', controller.updateSavingsGoal);

router.get('/subscriptions', controller.listSubscriptions);
router.post('/subscriptions', requireFields(['name', 'cost', 'next_due_date']), controller.createSubscription);
router.put('/subscriptions/:id', controller.updateSubscription);
router.delete('/subscriptions/:id', controller.deleteSubscription);

router.get('/bills', controller.listBills);
router.post('/bills', requireFields(['title', 'amount', 'due_date']), controller.createBill);
router.put('/bills/:id', controller.updateBill);
router.delete('/bills/:id', controller.deleteBill);

module.exports = router;
