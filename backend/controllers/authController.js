const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../config/database');
const { sendSuccess } = require('../utils/response');

function signUser(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (password.length < 6) return res.status(400).json({ success: false, data: {}, message: 'Password must be at least 6 characters' });
    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ success: false, data: {}, message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const result = await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email.toLowerCase(), hash]);
    const user = { id: result.id, name, email: email.toLowerCase() };
    sendSuccess(res, { user, token: signUser(user) }, 'Account created', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, data: {}, message: 'Invalid email or password' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email };
    sendSuccess(res, { user: safeUser, token: signUser(safeUser) }, 'Logged in');
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  sendSuccess(res, { user: req.user }, 'Profile loaded');
}

module.exports = { register, login, me };
