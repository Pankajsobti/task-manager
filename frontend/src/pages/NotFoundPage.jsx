import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-900">404 — Page not found</h1>
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        Go home
      </Link>
    </div>
  );
}
