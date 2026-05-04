# StudyPal

StudyPal is a full-stack student productivity platform for managing tasks, notes, calendars, expenses, habits, and AI-powered study help.

## Tech Stack

- Frontend: React 18, Vite, TailwindCSS, React Router DOM, Axios, React-Quill, FullCalendar, Chart.js, Lucide React
- Backend: Node.js, Express, SQLite with raw SQL, JWT, bcryptjs, helmet, cors, morgan, express-rate-limit
- AI: Google Gemini 2.5 Flash API

## Project Structure

```text
StudyPal/
  backend/
    config/
    controllers/
    middleware/
    routes/
    services/
    database/
    server.js
  frontend/
    src/
      components/
      context/
      pages/
      routes/
      services/
      utils/
```

## Getting Started

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173` by default.
Backend runs at `http://localhost:5000` by default.

## Environment

The backend automatically creates `backend/.env` on first startup if it does not already exist.

Generated defaults:

```env
PORT=5000
JWT_SECRET=change_this_secret
DB_PATH=./database/studypal.db
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

Set `GEMINI_API_KEY` in `backend/.env` to enable live AI responses.

## Features

- JWT authentication with protected routes
- Task CRUD with priorities, due dates, completion state, and filters
- Rich text notes with tags, search, and AI summarization
- Calendar events with FullCalendar
- Expense tracking with category summaries and charts
- Habit tracking for water, sleep, study hours, workouts, and streaks
- AI assistant, note summaries, and flashcard generation
- Responsive dashboard layout with dark mode

## API Response Format

All API responses follow:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## Production Notes

- Replace `JWT_SECRET` before deployment.
- Configure a production `CLIENT_ORIGIN` if deploying frontend and backend separately.
- Keep `backend/.env` and SQLite database files out of version control.
- The app uses raw SQL and auto-creates tables on startup; there is no migration system.
