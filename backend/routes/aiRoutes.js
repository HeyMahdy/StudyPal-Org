const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/aiController');
const { requireFields } = require('../middleware/validators');

const router = express.Router();
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

router.post('/chat', aiLimiter, requireFields(['message']), controller.chat);
router.post('/summarize', aiLimiter, requireFields(['content']), controller.summarize);
router.post('/flashcards', aiLimiter, requireFields(['content']), controller.flashcards);

module.exports = router;
