const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listTasks(req, res, next) {
  try {
    const filter = req.query.filter;
    const params = [req.user.id];
    let where = 'WHERE user_id = ?';
    if (filter === 'completed') where += ' AND completed = 1';
    if (filter === 'active') where += ' AND completed = 0';
    const tasks = await all(`SELECT * FROM tasks ${where} ORDER BY completed ASC, due_date ASC, created_at DESC`, params);
    sendSuccess(res, { tasks }, 'Tasks loaded');
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description = '', priority = 'medium', due_date = null } = req.body;
    const result = await run(
      'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description, priority, due_date]
    );
    const task = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [result.id, req.user.id]);
    sendSuccess(res, { task }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const current = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return res.status(404).json({ success: false, data: {}, message: 'Task not found' });
    const nextTask = { ...current, ...req.body };
    await run(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, completed = ? WHERE id = ? AND user_id = ?',
      [nextTask.title, nextTask.description, nextTask.priority, nextTask.due_date, nextTask.completed ? 1 : 0, req.params.id, req.user.id]
    );
    const task = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, { task }, 'Task updated');
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, {}, 'Task deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
