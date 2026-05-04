const fs = require('fs');
const path = require('path');

const defaultEnv = `PORT=5000
JWT_SECRET=change_this_secret
DB_PATH=./database/studypal.db
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
`;

function ensureEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, defaultEnv, 'utf8');
  }
  require('dotenv').config({ path: envPath });
}

module.exports = { ensureEnv };
