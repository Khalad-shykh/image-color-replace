import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('root');
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Production pages are prerendered to HTML and hydrated; the dev server
// serves an empty shell and renders on the client.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
