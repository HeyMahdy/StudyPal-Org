const axios = require('axios');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function askGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key') {
    return 'Gemini is not configured yet. Add GEMINI_API_KEY in backend/.env to enable live AI responses.';
  }

  const response = await axios.post(`${GEMINI_URL}?key=${key}`, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

function makeFlashcardPrompt(text) {
  return `Create concise study flashcards from this material. Return JSON array with front and back fields only:\n\n${text}`;
}

module.exports = { askGemini, makeFlashcardPrompt };
