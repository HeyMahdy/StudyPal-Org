const fs = require('fs');
const path = require('path');

const defaultEnv = `PORT=5000
JWT_SECRET=change_this_secret
DB_PATH=./database/studypal.db
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
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
