import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';

export default function ContactPage() {
  const email = SITE.contactEmail;
  return (
    <ArticleLayout
      title="Contact Us"
      intro="Questions, bug reports and suggestions about Image Color Replace are welcome."
      related={[
        ['/faq', 'Frequently asked questions'],
        ['/about', 'About Image Color Replace'],
      ]}
    >
      <h2>Email</h2>
      {email ? (
        <p>
          Write to us at{' '}
          <a href={`mailto:${email}?subject=${encodeURIComponent(`${SITE.name} feedback`)}`} className="break-all">
            {email}
          </a>
          . We aim to reply to every message, usually within a few working days.
        </p>
      ) : (
        <p>A contact email address has not been published for this website yet.</p>
      )}

      <h2>Reporting a problem</h2>
      <p>To help us reproduce an issue quickly, please include:</p>
      <ul>
        <li>Your browser and its version, and your device or operating system.</li>
        <li>The image format, its approximate size in pixels, and whether it has a transparent background.</li>
        <li>The colors and tolerance settings you used, and what you expected to happen.</li>
        <li>Any error message shown on the page.</li>
      </ul>
      <p>
        <strong>Please do not send images that contain personal or confidential information.</strong> The tool never uploads
        your images, and we would rather not receive private files by email. If a problem only happens with one image, a
        description or a similar non-private example is usually enough.
      </p>

      <h2>Before you write</h2>
      <p>
        Many questions about formats, transparency, quality and tolerance are answered in the <Link to="/faq">FAQ</Link> and the{' '}
        <Link to="/how-to-replace-color-in-image">step-by-step guide</Link>. For how we handle data, see the{' '}
        <Link to="/privacy-policy">privacy policy</Link>.
      </p>
    </ArticleLayout>
  );
}
