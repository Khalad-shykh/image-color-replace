import { Link } from 'react-router';
import AdSlot from '../AdSlot.jsx';

/**
 * Shared layout for guide, informational and legal pages: breadcrumb, a
 * single <h1>, optional intro/updated date, the article body and related
 * links.
 */
export default function ArticleLayout({ title, intro, updated, related = [], showAd = false, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/" className="hover:text-brand-700 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-900">
            {title}
          </li>
        </ol>
      </nav>
      <article className="mt-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {intro ? <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p> : null}
          {updated ? (
            <p className="mt-3 text-sm text-slate-500">
              Last updated: <time dateTime={updated}>{formatDate(updated)}</time>
            </p>
          ) : null}
        </header>
        <div className="prose-page mt-6">{children}</div>
      </article>
      {showAd ? <AdSlot placement="article" /> : null}
      {related.length > 0 ? (
        <aside aria-labelledby="related-heading" className="mt-12 rounded-xl border border-slate-200 bg-white p-5">
          <h2 id="related-heading" className="text-base font-semibold text-slate-900">
            Related
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {related.map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}
