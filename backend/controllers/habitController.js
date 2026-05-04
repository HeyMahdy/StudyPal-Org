const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listHabits(req, res, next) {
  try {
    const habits = await all('SELECT * FROM habits WHERE user_id = ? ORDER BY entry_date DESC, type ASC', [req.user.id]);
    sendSuccess(res, { habits }, 'Habits loaded');
  } catch (err) {
    next(err);
  }
}

async function upsertHabit(req, res, next) {
  try {
    const { type, value, target = 1, entry_date } = req.body;
    const yesterday = new Date(new Date(entry_date).getTime() - 86400000).toISOString().slice(0, 10);
    const previous = await get('SELECT streak FROM habits WHERE user_id = ? AND type = ? AND entry_date = ?', [req.user.id, type, yesterday]);
    const streak = Number(value) >= Number(target) ? (previous?.streak || 0) + 1 : 0;
    await run(
      `INSERT INTO habits (user_id, type, value, target, entry_date, streak)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, type, entry_date)
       DO UPDATE SET value = excluded.value, target = excluded.target, streak = excluded.streak`,
      [req.user.id, type, Number(value), Number(target), entry_date, streak]
    );
    const habit = await get('SELECT * FROM habits WHERE user_id = ? AND type = ? AND entry_date = ?', [req.user.id, type, entry_date]);
    sendSuccess(res, { habit }, 'Habit saved');
  } catch (err) {
    next(err);
  }
}

module.exports = { listHabits, upsertHabit };
