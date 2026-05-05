const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listExpenses(req, res, next) {
  try {
    const params = [req.user.id];
    let where = "WHERE user_id = ? AND type = 'expense'";
    if (req.query.category) {
      where += ' AND category = ?';
      params.push(req.query.category);
    }
    if (req.query.date) {
      where += ' AND date = ?';
      params.push(req.query.date);
    }
    if (req.query.month) {
      where += ' AND substr(date, 1, 7) = ?';
      params.push(req.query.month);
    }
    if (req.query.filter === 'today') {
      where += ' AND date = ?';
      params.push(new Date().toISOString().slice(0, 10));
    }

    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 10);
    const expenses = await all(`SELECT * FROM expenses ${where} ORDER BY date DESC, created_at DESC`, params);
    const summary = await all("SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND type = 'expense' GROUP BY category", [req.user.id]);
    const monthRows = await all(
      "SELECT date, category, SUM(amount) as total FROM expenses WHERE user_id = ? AND type = 'expense' AND substr(date, 1, 7) = ? GROUP BY date, category",
      [req.user.id, month]
    );
    const totalToday = monthRows.filter((row) => row.date === today).reduce((sum, row) => sum + Number(row.total || 0), 0);
    const totalMonth = monthRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const daysWithSpending = new Set(monthRows.map((row) => row.date)).size || 1;
    const categoryTotals = monthRows.reduce((map, row) => {
      map[row.category] = (map[row.category] || 0) + Number(row.total || 0);
      return map;
    }, {});
    const highest = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    sendSuccess(res, {
      expenses,
      summary,
      overview: {
        total_today: totalToday,
        total_month: totalMonth,
        average_daily: totalMonth / daysWithSpending,
        highest_category: highest ? { category: highest[0], total: highest[1] } : null
      }
    }, 'Expenses loaded');
  } catch (err) {
    next(err);
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, amount, category, spent_at, date = spent_at || new Date().toISOString().slice(0, 10), description = title || '', type = 'expense' } = req.body;
    const label = title || description || category;
    const result = await run('INSERT INTO expenses (user_id, title, amount, category, description, date, type, spent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      req.user.id,
      label,
      Number(amount),
      category,
      description || label,
      date,
      type,
      date
    ]);
    sendSuccess(res, { expense: await get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [result.id, req.user.id]) }, 'Expense created', 201);
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
