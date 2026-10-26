import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';

export default function TermsPage() {
  return (
    <ArticleLayout
      title="Terms of Service"
      intro={`These terms apply to your use of the ${SITE.name} website and its image editing tool. By using the website you agree to them.`}
      updated={SITE.lastUpdated}
      related={[
        ['/privacy-policy', 'Privacy policy'],
        ['/contact', 'Contact us'],
      ]}
    >
      <h2>1. The service</h2>
      <p>
        {SITE.name} provides a free, browser-based tool for replacing colors in images, together with guides and other
        informational pages. The tool runs on your device; images you open are not uploaded to us. We may change, suspend or
        discontinue any part of the website at any time.
      </p>

      <h2>2. Your images and your responsibility</h2>
      <ul>
        <li>You keep all rights to the images you open and the results you create. We claim no ownership of them.</li>
        <li>
          You are responsible for making sure you have the right to edit and use the images you work with, including any
          copyright, trademark or privacy rights of other people.
        </li>
        <li>
          You must not use the tool to create content that is unlawful, infringes others’ rights, or is intended to deceive —
          for example altering documents, product photos or evidence to mislead people.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Interfere with or disrupt the website or the infrastructure that serves it;</li>
        <li>Attempt to gain unauthorized access to any system related to the website;</li>
        <li>Use automated means to access the website in a way that places an unreasonable load on it;</li>
        <li>Copy and republish the website’s text or design as your own.</li>
      </ul>

      <h2>4. Our content</h2>
      <p>
        The website’s text, design, logo and code are protected by intellectual property laws. You may link to any page and
        quote short excerpts with attribution. Other reuse requires our permission.
      </p>

      <h2>5. No warranty</h2>
      <p>
        The website and tool are provided “as is” and “as available”, without warranties of any kind, express or implied,
        including fitness for a particular purpose and non-infringement. We do not guarantee that the tool will be error-free,
        that results will meet your expectations, or that it will work in every browser or with every file. Keep a copy of your
        original images.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental, special or consequential
        damages, or for any loss of data, images, profits or business, arising from your use of or inability to use the website.
        Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>7. Third-party links and services</h2>
      <p>
        The website may link to, or display content (such as advertising) from, third parties. We are not responsible for their
        content or practices; their own terms and privacy policies apply. See our <Link to="/privacy-policy">privacy policy</Link>{' '}
        for details.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The “last updated” date shows the latest version. Continuing to use the
        website after a change means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms can be sent through the <Link to="/contact">contact page</Link>.
      </p>
    </ArticleLayout>
  );
}
