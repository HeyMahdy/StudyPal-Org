const { ensureEnv } = require('./config/env');
ensureEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./config/database');
const { requireAuth } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);
const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && devOriginPattern.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'StudyPal API is healthy' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboardRoutes'));
app.use('/api/tasks', requireAuth, require('./routes/taskRoutes'));
app.use('/api/notes', requireAuth, require('./routes/noteRoutes'));
app.use('/api/events', requireAuth, require('./routes/eventRoutes'));
app.use('/api/budget', requireAuth, require('./routes/budgetRoutes'));
app.use('/api/bills', requireAuth, require('./routes/billRoutes'));
app.use('/api/expenses', requireAuth, require('./routes/expenseRoutes'));
app.use('/api/finance', requireAuth, require('./routes/financeRoutes'));
app.use('/api/habits', requireAuth, require('./routes/habitRoutes'));
app.use('/api/ai', requireAuth, require('./routes/aiRoutes'));

app.use(notFound);
app.use(errorHandler);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`StudyPal API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });

module.exports = app;
