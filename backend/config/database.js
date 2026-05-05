const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './database/studypal.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function initDb() {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT CHECK(status IN ('todo','in_progress','completed')) DEFAULT 'todo',
    priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
    due_date TEXT,
    category TEXT DEFAULT '',
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await ensureTaskColumns();
  await run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT,
    color TEXT DEFAULT '#4F46E5',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    date TEXT,
    type TEXT CHECK(type IN ('expense','income')) DEFAULT 'expense',
    spent_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await ensureExpenseColumns();
  await run(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, category),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    saved_amount REAL NOT NULL DEFAULT 0,
    deadline TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
    next_due_date TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','paid')) DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await ensureHabitSchema();
}

async function ensureExpenseColumns() {
  const columns = await all('PRAGMA table_info(expenses)');
  const names = new Set(columns.map((column) => column.name));
  const additions = [
    ['title', "ALTER TABLE expenses ADD COLUMN title TEXT DEFAULT 'Expense'"],
    ['description', "ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT ''"],
    ['date', 'ALTER TABLE expenses ADD COLUMN date TEXT'],
    ['type', "ALTER TABLE expenses ADD COLUMN type TEXT CHECK(type IN ('expense','income')) DEFAULT 'expense'"],
    ['spent_at', 'ALTER TABLE expenses ADD COLUMN spent_at TEXT']
  ];

  for (const [name, sql] of additions) {
    if (!names.has(name)) await run(sql);
  }

  await run("UPDATE expenses SET date = spent_at WHERE (date IS NULL OR date = '') AND spent_at IS NOT NULL");
  await run("UPDATE expenses SET spent_at = date WHERE (spent_at IS NULL OR spent_at = '') AND date IS NOT NULL");
  await run("UPDATE expenses SET date = DATE(created_at) WHERE date IS NULL OR date = ''");
  await run("UPDATE expenses SET spent_at = date WHERE spent_at IS NULL OR spent_at = ''");
  await run("UPDATE expenses SET description = title WHERE description IS NULL OR description = ''");
  await run("UPDATE expenses SET type = 'expense' WHERE type IS NULL OR type = ''");
}

async function ensureTaskColumns() {
  const columns = await all('PRAGMA table_info(tasks)');
  const names = new Set(columns.map((column) => column.name));
  const additions = [
    ['description', "ALTER TABLE tasks ADD COLUMN description TEXT DEFAULT ''"],
    ['status', "ALTER TABLE tasks ADD COLUMN status TEXT CHECK(status IN ('todo','in_progress','completed')) DEFAULT 'todo'"],
    ['category', "ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT ''"],
    ['updated_at', 'ALTER TABLE tasks ADD COLUMN updated_at TEXT'],
    ['completed', 'ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0']
  ];

  for (const [name, sql] of additions) {
    if (!names.has(name)) await run(sql);
  }

  await run("UPDATE tasks SET status = 'completed' WHERE completed = 1 AND (status IS NULL OR status != 'completed')");
  await run("UPDATE tasks SET status = 'todo' WHERE status IS NULL OR status = ''");
  await run("UPDATE tasks SET category = '' WHERE category IS NULL");
  await run("UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL");
}

async function tableExists(name) {
  const row = await get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [name]);
  return Boolean(row);
}

async function ensureHabitSchema() {
  if (await tableExists('habits')) {
    const columns = await all('PRAGMA table_info(habits)');
    const names = new Set(columns.map((column) => column.name));
    if (!names.has('title') && names.has('entry_date')) {
      if (!(await tableExists('habit_legacy_logs'))) {
        await run('ALTER TABLE habits RENAME TO habit_legacy_logs');
      }
    }
  }

  await run(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('boolean','numeric')) DEFAULT 'boolean',
    target_value REAL NOT NULL DEFAULT 1,
    category TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    UNIQUE(habit_id, date),
    FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
  )`);
}

module.exports = { db, run, get, all, initDb };
