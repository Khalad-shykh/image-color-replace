import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import HowToPage from './pages/HowToPage.jsx';
import TolerancePage from './pages/TolerancePage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { findRoute } from './config/routes.js';
import { applyHead } from './lib/head.js';

/** Updates <head>, scroll position and focus after client-side navigation. */
function useRouteChange() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Prerendered pages already have the right head; the dev server does not.
      if (!document.querySelector('[data-head="page"]')) applyHead(findRoute(pathname));
      return;
    }
    applyHead(findRoute(pathname));
    if (hash) return;
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, hash]);
}

export default function App() {
  useRouteChange();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 font-semibold text-brand-800 shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-to-replace-color-in-image" element={<HowToPage />} />
          <Route path="/how-color-tolerance-works" element={<TolerancePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/terms-of-service" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
