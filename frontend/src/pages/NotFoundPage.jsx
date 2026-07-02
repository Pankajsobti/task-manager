import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">404 — Page not found</h1>
      <Link to="/" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
        Go home
      </Link>
    </div>
  );
}