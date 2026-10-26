import { Link } from 'react-router';
import Logo from './Logo.jsx';
import { SITE } from '../../config/site.js';

const GROUPS = [
  {
    title: 'Tool & guides',
    links: [
      ['/', 'Image Color Replace tool'],
      ['/how-to-replace-color-in-image', 'How to replace a color'],
      ['/how-color-tolerance-works', 'How color tolerance works'],
      ['/faq', 'FAQ'],
    ],
  },
  {
    title: 'About',
    links: [
      ['/about', 'About us'],
      ['/contact', 'Contact us'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['/privacy-policy', 'Privacy policy'],
      ['/terms-of-service', 'Terms of service'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-md font-bold text-slate-900">
            <Logo className="h-7 w-7" />
            {SITE.name}
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            A free tool for replacing a specific color in a photo or graphic. Images are processed in your browser and never
            uploaded.
          </p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-slate-600 hover:text-brand-700 hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
