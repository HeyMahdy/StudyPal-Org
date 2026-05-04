const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listExpenses(req, res, next) {
  try {
    const expenses = await all('SELECT * FROM expenses WHERE user_id = ? ORDER BY spent_at DESC', [req.user.id]);
    const summary = await all('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category', [req.user.id]);
    sendSuccess(res, { expenses, summary }, 'Expenses loaded');
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, amount, category, spent_at } = req.body;
    const result = await run('INSERT INTO expenses (user_id, title, amount, category, spent_at) VALUES (?, ?, ?, ?, ?)', [
      req.user.id,
      title,
      Number(amount),
      category,
      spent_at
    ]);
    sendSuccess(res, { expense: await get('SELECT * FROM expenses WHERE id = ?', [result.id]) }, 'Expense created', 201);
  } catch (err) {
    next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    await run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, {}, 'Expense deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { listExpenses, createExpense, deleteExpense };
