const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return toDateString(date);
}

function lastSevenDays(dateString) {
  return Array.from({ length: 7 }, (_, index) => addDays(dateString, index - 6));
}

function isComplete(habit, value) {
  if (habit.type === 'boolean') return Number(value) >= 1;
  return Number(value) >= Number(habit.target_value || 1);
}

function calculateCurrentStreak(habit, logMap, dateString) {
  let streak = 0;
  let cursor = dateString;
  while (isComplete(habit, logMap.get(cursor) || 0)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function calculateLongestStreak(habit, logs) {
  let longest = 0;
  let current = 0;
  let previousDate = null;

  for (const log of logs) {
    if (!isComplete(habit, log.value)) {
      current = 0;
      previousDate = log.date;
      continue;
    }
    current = previousDate && log.date === addDays(previousDate, 1) ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDate = log.date;
  }

  return longest;
}

async function enrichHabits(userId, dateString) {
  const habits = await all('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  const week = lastSevenDays(dateString);

  return Promise.all(habits.map(async (habit) => {
    const logs = await all('SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date ASC', [habit.id]);
    const logMap = new Map(logs.map((log) => [log.date, Number(log.value)]));
    const todayValue = logMap.get(dateString) || 0;
    const weekly = week.map((date) => {
      const value = logMap.get(date) || 0;
      return { date, value, completed: isComplete(habit, value) };
    });

    return {
      ...habit,
      today_value: todayValue,
      completed_today: isComplete(habit, todayValue),
      current_streak: calculateCurrentStreak(habit, logMap, dateString),
      longest_streak: calculateLongestStreak(habit, logs),
      weekly
    };
  }));
}

async function enrichHabitById(userId, habitId, dateString) {
  const habits = await enrichHabits(userId, dateString);
  return habits.find((habit) => habit.id === Number(habitId));
}

async function listHabits(req, res, next) {
  try {
    const date = req.query.date || toDateString(new Date());
    const habits = await enrichHabits(req.user.id, date);
    const completedToday = habits.filter((habit) => habit.completed_today).length;
    const weeklySlots = habits.length * 7 || 1;
    const weeklyCompleted = habits.reduce((sum, habit) => sum + habit.weekly.filter((day) => day.completed).length, 0);
    const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.current_streak), 0);

    sendSuccess(res, {
      habits,
      overview: {
        completed_today: completedToday,
        total_habits: habits.length,
        best_streak: bestStreak,
        weekly_completion_rate: Math.round((weeklyCompleted / weeklySlots) * 100)
      }
    }, 'Habits loaded');
  } catch (err) {
    next(err);
  }
}

async function createHabit(req, res, next) {
  try {
    const { title, type = 'boolean', target_value = 1, category = '' } = req.body;
    const result = await run('INSERT INTO habits (user_id, title, type, target_value, category) VALUES (?, ?, ?, ?, ?)', [
      req.user.id,
      title,
      type,
      Number(target_value || 1),
      category
    ]);
    const habit = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [result.id, req.user.id]);
    sendSuccess(res, { habit }, 'Habit created', 201);
  } catch (err) {
    next(err);
  }
}

async function getHabit(req, res, next) {
  try {
    const date = req.query.date || toDateString(new Date());
    const habit = await enrichHabitById(req.user.id, req.params.id, date);
    if (!habit) return res.status(404).json({ success: false, data: {}, message: 'Habit not found' });
    sendSuccess(res, { habit }, 'Habit loaded');
  } catch (err) {
    next(err);
  }
}

async function updateHabit(req, res, next) {
  try {
    const current = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return res.status(404).json({ success: false, data: {}, message: 'Habit not found' });
    const habit = { ...current, ...req.body };
    await run('UPDATE habits SET title = ?, type = ?, target_value = ?, category = ? WHERE id = ? AND user_id = ?', [
      habit.title,
      habit.type,
      Number(habit.target_value || 1),
      habit.category || '',
      req.params.id,
      req.user.id
    ]);
    sendSuccess(res, { habit: await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]) }, 'Habit updated');
  } catch (err) {
    next(err);
  }
}

async function deleteHabit(req, res, next) {
  try {
    await run('DELETE FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, {}, 'Habit deleted');
  } catch (err) {
    next(err);
  }
}

async function logHabit(req, res, next) {
  try {
    const { habit_id, date = toDateString(new Date()), value } = req.body;
    const habit = await get('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habit_id, req.user.id]);
    if (!habit) return res.status(404).json({ success: false, data: {}, message: 'Habit not found' });
    await run(
      `INSERT INTO habit_logs (habit_id, date, value)
       VALUES (?, ?, ?)
       ON CONFLICT(habit_id, date)
       DO UPDATE SET value = excluded.value`,
      [habit_id, date, Number(value)]
    );
    const habits = await enrichHabits(req.user.id, date);
    sendSuccess(res, { habit: habits.find((item) => item.id === Number(habit_id)), habits }, 'Habit logged');
  } catch (err) {
    next(err);
  }
}

async function getLogs(req, res, next) {
  try {
    const date = req.query.date || toDateString(new Date());
    const logs = await all(
      `SELECT habit_logs.*, habits.title, habits.type, habits.target_value
       FROM habit_logs
       JOIN habits ON habits.id = habit_logs.habit_id
       WHERE habits.user_id = ? AND habit_logs.date = ?
       ORDER BY habits.title ASC`,
      [req.user.id, date]
    );
    sendSuccess(res, { logs }, 'Habit logs loaded');
  } catch (err) {
    next(err);
  }
}

module.exports = { listHabits, createHabit, getHabit, updateHabit, deleteHabit, logHabit, getLogs };
