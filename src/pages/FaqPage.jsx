import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { FAQ_ITEMS } from '../content/faq.js';
import { SITE } from '../config/site.js';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function FaqPage() {
  const groups = [...new Set(FAQ_ITEMS.map((item) => item.group))];
  return (
    <ArticleLayout
      title="Image Color Replacement FAQ"
      intro="Answers to the questions people ask most about replacing colors in images with this tool: how it works, file formats, quality, privacy and devices."
      updated={SITE.lastUpdated}
      showAd
      related={[
        ['/how-to-replace-color-in-image', 'Step-by-step guide'],
        ['/how-color-tolerance-works', 'How color tolerance works'],
        ['/contact', 'Ask a question that is not answered here'],
      ]}
    >
      <nav aria-label="FAQ topics">
        <ul>
          {groups.map((g) => (
            <li key={g}>
              <a href={`#${slug(g)}`}>{g}</a>
            </li>
          ))}
        </ul>
      </nav>
      {groups.map((group) => (
        <section key={group} aria-labelledby={slug(group)}>
          <h2 id={slug(group)} className="scroll-mt-20">
            {group}
          </h2>
          {FAQ_ITEMS.filter((item) => item.group === group).map((item) => (
            <div key={item.question}>
              <h3 id={slug(item.question)} className="scroll-mt-20">
                {item.question}
              </h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      ))}
      <p>
        Still stuck? The <Link to="/how-to-replace-color-in-image">how-to guide</Link> includes a troubleshooting table, or you
        can <Link to="/contact">contact us</Link>.
      </p>
    </ArticleLayout>
  );
}
