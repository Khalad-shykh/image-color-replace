import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';

export { ROUTES, NOT_FOUND_ROUTE } from './config/routes.js';
export { buildHeadTags } from './lib/head.js';
export { SITE } from './config/site.js';
export { ADS } from './config/ads.js';

export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}
