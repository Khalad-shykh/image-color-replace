import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Page not found</h1>
      <p className="mt-4 text-slate-600">
        The page you were looking for does not exist or may have moved. Here are some places to go instead:
      </p>
      <ul className="mx-auto mt-8 grid max-w-md gap-3 text-left">
        {[
          ['/', 'Image Color Replace tool', 'Replace a color in your image'],
          ['/how-to-replace-color-in-image', 'How to replace a color', 'A step-by-step guide'],
          ['/how-color-tolerance-works', 'How color tolerance works', 'Choose the right settings'],
          ['/faq', 'FAQ', 'Answers to common questions'],
        ].map(([to, label, desc]) => (
          <li key={to}>
            <Link to={to} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand-600 hover:bg-brand-50">
              <span className="font-semibold text-slate-900">{label}</span>
              <span className="block text-sm text-slate-600">{desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
