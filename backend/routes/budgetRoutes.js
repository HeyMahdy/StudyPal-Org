const express = require('express');
const controller = require('../controllers/financeController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listBudget);
router.post('/', requireFields(['category', 'limit_amount']), controller.upsertBudget);
router.put('/:id', requireFields(['category', 'limit_amount']), controller.updateBudget);
router.delete('/:id', controller.deleteBudget);

module.exports = router;
