const crypto = require('crypto');
const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function createExpense(req, res, next) {
  try {
    const {
      amount,
      original_currency = 'BDT',
      item,
      vendor = null,
      location = null,
      category,
      sub_category = null,
      is_academic = false,
      academic_reason = null,
      is_exam_week = false,
      expense_date,
      raw_input = ''
    } = req.body;

    const id = crypto.randomUUID();
    await run(
      `INSERT INTO ai_expenses
        (id, user_id, amount, original_currency, item, vendor, location, category, sub_category, is_academic, academic_reason, is_exam_week, expense_date, raw_input)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        Number(amount),
        original_currency,
        item,
        vendor,
        location,
        category,
        sub_category,
        is_academic ? 1 : 0,
        academic_reason,
        is_exam_week ? 1 : 0,
        expense_date,
        raw_input
      ]
    );

    await run(
      `INSERT INTO expenses (user_id, title, amount, category, description, date, type, spent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        item,
        Number(amount),
        category,
        vendor || item,
        expense_date,
        'expense',
        expense_date
      ]
    );

    const expense = await get('SELECT * FROM ai_expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return sendSuccess(res, { expense }, 'Expense created', 201);
  } catch (err) {
    return next(err);
  }
}

async function listExpenses(req, res, next) {
  try {
    const params = [req.user.id];
    let where = 'WHERE user_id = ?';

    if (req.query.startDate) {
      where += ' AND expense_date >= ?';
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      where += ' AND expense_date <= ?';
      params.push(req.query.endDate);
    }
    if (req.query.category) {
      where += ' AND category = ?';
      params.push(req.query.category);
    }
    if (req.query.is_academic !== undefined) {
      const flag = req.query.is_academic === 'true' ? 1 : 0;
      where += ' AND is_academic = ?';
      params.push(flag);
    }

    const expenses = await all(
      `SELECT * FROM ai_expenses ${where} ORDER BY expense_date DESC, created_at DESC`,
      params
    );
    return sendSuccess(res, { expenses }, 'Expenses loaded');
  } catch (err) {
    return next(err);
  }
}

async function summary(req, res, next) {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const rows = await all(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM ai_expenses
       WHERE user_id = ? AND substr(expense_date, 1, 7) = ?
       GROUP BY category`,
      [req.user.id, month]
    );

    const totalSum = rows.reduce((sum, row) => sum + Number(row.total || 0), 0) || 1;
    const summary = rows.map((row) => ({
      category: row.category,
      total: Number(row.total || 0),
      count: Number(row.count || 0),
      percentage: Math.round((Number(row.total || 0) / totalSum) * 100)
    }));

    return sendSuccess(res, { summary }, 'Summary loaded');
  } catch (err) {
    return next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    await run('DELETE FROM ai_expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return sendSuccess(res, {}, 'Expense deleted');
  } catch (err) {
    return next(err);
  }
}

module.exports = { createExpense, listExpenses, summary, deleteExpense };
