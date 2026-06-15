const { all, get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');
const { seedNotesIfEmpty } = require('../services/notesService');

async function listNotes(req, res, next) {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ success: false, data: {}, message: 'Invalid user token' });
    }
    const search = `%${req.query.search || ''}%`;
    const notes = await all(
      `SELECT * FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY updated_at DESC`,
      [userId, search, search, search]
    );
    sendSuccess(res, { notes }, 'Notes loaded');
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, content = '', tags = '' } = req.body;
    const result = await run('INSERT INTO notes (user_id, title, content, tags) VALUES (?, ?, ?, ?)', [req.user.id, title, content, tags]);
    const note = await get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [result.id, req.user.id]);
    sendSuccess(res, { note }, 'Note created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const current = await get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return res.status(404).json({ success: false, data: {}, message: 'Note not found' });
    const note = { ...current, ...req.body };
    await run('UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [
      note.title,
      note.content,
      note.tags,
      req.params.id,
      req.user.id
    ]);
    sendSuccess(res, { note: await get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]) }, 'Note updated');
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    await run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    sendSuccess(res, {}, 'Note deleted');
  } catch (err) {
    next(err);
  }
}

async function seedNotes(req, res, next) {
  try {
    // Development-only endpoint - seed sample notes for current user
    const inserted = await seedNotesIfEmpty(req.user.id);
    sendSuccess(res, { inserted }, `Seeded ${inserted} notes for user`);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, createNote, updateNote, deleteNote, seedNotes };
