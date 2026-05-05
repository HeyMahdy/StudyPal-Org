const { all, get } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function overview(req, res, next) {
  try {
    const [taskStats, upcomingTasks, upcomingEvents, finance, habits] = await Promise.all([
      get('SELECT COUNT(*) as total, SUM(completed) as completed FROM tasks WHERE user_id = ?', [req.user.id]),
      all('SELECT * FROM tasks WHERE user_id = ? AND completed = 0 ORDER BY due_date ASC LIMIT 5', [req.user.id]),
      all('SELECT * FROM events WHERE user_id = ? ORDER BY start ASC LIMIT 5', [req.user.id]),
      all('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category', [req.user.id]),
      all('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC LIMIT 8', [req.user.id])
    ]);
    sendSuccess(res, { taskStats, upcomingTasks, upcomingEvents, finance, habits, suggestions: ['Review overdue tasks', 'Summarize one note', 'Plan tomorrow in calendar'] }, 'Overview loaded');
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
