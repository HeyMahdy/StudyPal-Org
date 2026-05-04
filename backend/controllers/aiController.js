const { askGemini, makeFlashcardPrompt } = require('../services/aiService');
const { sendSuccess } = require('../utils/response');

async function chat(req, res, next) {
  try {
    const reply = await askGemini(`You are StudyPal, a focused study assistant. Help clearly and concisely.\n\nUser: ${req.body.message}`);
    sendSuccess(res, { reply }, 'AI response ready');
  } catch (err) {
    next(err);
  }
}

async function summarize(req, res, next) {
  try {
    const summary = await askGemini(`Summarize these notes into clear study bullets and key takeaways:\n\n${req.body.content}`);
    sendSuccess(res, { summary }, 'Summary ready');
  } catch (err) {
    next(err);
  }
}

async function flashcards(req, res, next) {
  try {
    const cards = await askGemini(makeFlashcardPrompt(req.body.content));
    sendSuccess(res, { cards }, 'Flashcards ready');
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, summarize, flashcards };
