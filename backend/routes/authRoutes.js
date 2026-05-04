const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { requireFields } = require('../middleware/validators');

const router = express.Router();

router.post('/register', requireFields(['name', 'email', 'password']), register);
router.post('/login', requireFields(['email', 'password']), login);
router.get('/me', requireAuth, me);

module.exports = router;
