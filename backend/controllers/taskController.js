const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listTasks(req, res, next) {
  try {
    const params = [req.user.id];
    let where = 'WHERE user_id = ?';
    const { status, priority, category, search, due, sort, filter } = req.query;

    if (filter === 'completed') where += " AND status = 'completed'";
    if (filter === 'active') where += " AND status != 'completed'";
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      where += ' AND priority = ?';
      params.push(priority);
    }
    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const today = new Date().toISOString().slice(0, 10);
    if (due === 'today') {
      where += ' AND due_date = ?';
      params.push(today);
    }
    if (due === 'upcoming') {
      where += " AND due_date > ? AND status != 'completed'";
      params.push(today);
    }
    if (due === 'overdue') {
      where += " AND due_date < ? AND status != 'completed'";
      params.push(today);
    }

    const sortMap = {
      due_date: "due_date IS NULL ASC, due_date ASC, status = 'completed' ASC",
      priority: "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC, due_date ASC",
      created_at: 'created_at DESC'
    };
    const orderBy = sortMap[sort] || "status = 'completed' ASC, due_date IS NULL ASC, due_date ASC, created_at DESC";

    const tasks = await all(`SELECT * FROM tasks ${where} ORDER BY ${orderBy}`, params);
    sendSuccess(res, { tasks }, 'Tasks loaded');
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description = '', status = 'todo', priority = 'medium', due_date = null, category = '' } = req.body;
    const completed = status === 'completed' ? 1 : 0;
    const result = await run(
      'INSERT INTO tasks (user_id, title, description, status, priority, due_date, category, completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, status, priority, due_date || null, category, completed]
    );
    const task = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [result.id, req.user.id]);
    sendSuccess(res, { task }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ success: false, data: {}, message: 'Task not found' });
    sendSuccess(res, { task }, 'Task loaded');
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const current = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return res.status(404).json({ success: false, data: {}, message: 'Task not found' });
    const nextTask = { ...current, ...req.body };
    if (req.body.completed !== undefined && req.body.status === undefined) {
      nextTask.status = req.body.completed ? 'completed' : 'todo';
    }
    const completed = nextTask.status === 'completed' ? 1 : 0;
    await run(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, category = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [
        nextTask.title,
        nextTask.description || '',
        nextTask.status || 'todo',
        nextTask.priority || 'medium',
        nextTask.due_date || null,
        nextTask.category || '',
        completed,
        req.params.id,
        req.user.id
      ]
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

async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, data: {}, message: 'Invalid status' });
    }
    const result = await run(
      'UPDATE tasks SET status = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [status, status === 'completed' ? 1 : 0, req.params.id, req.user.id]
    );
    if (!result.changes) return res.status(404).json({ success: false, data: {}, message: 'Task not found' });
    const task = await get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, { task }, 'Task status updated');
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask, updateTaskStatus };
