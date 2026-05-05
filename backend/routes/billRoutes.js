const express = require('express');
const controller = require('../controllers/financeController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.listBills);
router.post('/', requireFields(['title', 'amount', 'due_date']), controller.createBill);
router.put('/:id', controller.updateBill);
router.delete('/:id', controller.deleteBill);

module.exports = router;
