/** Brand mark: a color drop split between an "old" and a "new" color. */
export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <path d="M16 5c-4.5 6-8 10-8 14a8 8 0 0 0 8 8z" fill="#f97316" />
      <path d="M16 5c4.5 6 8 10 8 14a8 8 0 0 1-8 8z" fill="#22d3ee" />
      <path d="M16 5c-4.5 6-8 10-8 14a8 8 0 0 0 16 0c0-4-3.5-8-8-14z" fill="none" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}
