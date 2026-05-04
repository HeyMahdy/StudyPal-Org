import { Bot, CalendarDays, CheckSquare, DollarSign, NotebookPen, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';

const features = [
  ['Task Management', 'Prioritize deadlines, toggle progress, and keep coursework moving.', CheckSquare],
  ['Smart Notes with AI', 'Capture rich notes and turn them into summaries or flashcards.', NotebookPen],
  ['Calendar and Deadlines', 'Plan classes, exams, and study blocks in one calendar.', CalendarDays],
  ['Finance Tracking', 'Understand monthly student spending by category.', DollarSign],
  ['Habit Tracking', 'Track water, sleep, study hours, workouts, and streaks.', Sprout],
  ['AI Assistant', 'Ask for explanations, study plans, and revision help.', Bot]
];

export default function Landing() {
  return (
    <div className="bg-slate-100 text-gray-950 dark:bg-appdark dark:text-gray-100">
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Study smarter. Stay organized.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-indigo-100">Tasks, notes, calendar, finance, habits, and AI study help in one focused student workspace.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link className="btn-primary bg-white text-primary hover:bg-indigo-50" to="/register">Get Started</Link>
            <Link className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20" to="/login">Login</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([title, text, Icon]) => (
          <Card key={title}>
            <Icon className="text-primary" size={26} />
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3">
        {['Create tasks and notes', 'Track progress', 'Use AI to study smarter'].map((step, index) => (
          <Card key={step}>
            <span className="text-sm font-bold text-primary">0{index + 1}</span>
            <h2 className="mt-3 text-2xl font-bold">{step}</h2>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <Card>
          <div className="grid gap-4 md:grid-cols-4">
            {['Tasks due', 'Study hours', 'Monthly spend', 'Habit streak'].map((item, index) => (
              <div key={item} className="rounded-2xl bg-slate-100 p-4 dark:bg-gray-950">
                <p className="text-sm text-gray-500">{item}</p>
                <p className="mt-3 text-3xl font-bold">{[8, 24, '$320', 12][index]}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16 text-center">
        <Card>
          <h2 className="text-3xl font-bold">Build a calmer study rhythm today.</h2>
          <Link className="btn-primary mt-6" to="/register">Start using StudyPal</Link>
        </Card>
      </section>
      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-gray-500 dark:border-gray-800">StudyPal · Productivity for students</footer>
    </div>
  );
}
