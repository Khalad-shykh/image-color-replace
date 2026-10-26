import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import Logo from './Logo.jsx';
import Icon from '../Icon.jsx';
import { SITE } from '../../config/site.js';

const NAV = [
  { to: '/', label: 'Tool', end: true },
  { to: '/how-to-replace-color-in-image', label: 'How-to guide' },
  { to: '/how-color-tolerance-works', label: 'Color tolerance' },
  { to: '/faq', label: 'FAQ' },
];

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-md text-slate-900">
          <Logo />
          <span className="text-lg font-bold tracking-tight">{SITE.name}</span>
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="btn-ghost px-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-slate-200 bg-white md:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={(s) => `block ${linkClass(s)}`}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
