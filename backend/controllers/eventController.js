const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

async function listEvents(req, res, next) {
  try {
    const events = await all('SELECT * FROM events WHERE user_id = ? ORDER BY start ASC', [req.user.id]);
    sendSuccess(res, { events }, 'Events loaded');
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const { title, start, end = null, color = '#4F46E5' } = req.body;
    const result = await run('INSERT INTO events (user_id, title, start, end, color) VALUES (?, ?, ?, ?, ?)', [req.user.id, title, start, end, color]);
    sendSuccess(res, { event: await get('SELECT * FROM events WHERE id = ?', [result.id]) }, 'Event created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const current = await get('SELECT * FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return res.status(404).json({ success: false, data: {}, message: 'Event not found' });
    const event = { ...current, ...req.body };
    await run('UPDATE events SET title = ?, start = ?, end = ?, color = ? WHERE id = ? AND user_id = ?', [
      event.title,
      event.start,
      event.end,
      event.color,
      req.params.id,
      req.user.id
    ]);
    sendSuccess(res, { event: await get('SELECT * FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]) }, 'Event updated');
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    await run('DELETE FROM events WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, {}, 'Event deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
