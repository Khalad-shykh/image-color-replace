import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';

export default function AboutPage() {
  return (
    <ArticleLayout
      title="About Image Color Replace"
      intro="Image Color Replace is a small, independent web tool with one job: changing a specific color in an image quickly, accurately and privately."
      related={[
        ['/', 'Use the tool'],
        ['/privacy-policy', 'Privacy policy'],
        ['/contact', 'Contact us'],
      ]}
    >
      <h2>Why this tool exists</h2>
      <p>
        Changing one color in a picture is a common task — matching a logo to a new palette, trying a product in another color,
        fixing an off-brand color in a chart — but it usually means installing a large image editor or uploading files to a
        service you know nothing about. {SITE.name} aims to make that one task simple: open an image, click the color, choose a
        new one and download the result.
      </p>

      <h2>What we care about</h2>
      <ul>
        <li>
          <strong>Privacy by design.</strong> Images are processed entirely in your browser. There is no upload step, so your
          files are never sent to or stored on a server.
        </li>
        <li>
          <strong>Honest results.</strong> The tool changes real pixels with a documented, perceptual color-matching method and
          shows you exactly which pixels are affected. It never adds watermarks or quietly lowers the resolution.
        </li>
        <li>
          <strong>Accessible to everyone.</strong> It is free, needs no account, works on phones and desktops, and can be used
          with a keyboard and screen reader.
        </li>
        <li>
          <strong>Useful explanations.</strong> The <Link to="/how-to-replace-color-in-image">how-to guide</Link> and the{' '}
          <Link to="/how-color-tolerance-works">tolerance explainer</Link> describe how the tool works, including its
          limitations, so you can decide whether it is the right tool for your image.
        </li>
      </ul>

      <h2>How it works</h2>
      <p>
        When you open a file, your browser decodes it and the tool reads its pixels with the HTML Canvas API. Each pixel’s color
        is compared with the color you picked using CIELAB color distance (ΔE), and pixels within your tolerance are recolored
        while their transparency is left untouched. The work happens in a background Web Worker so the page stays responsive,
        and every change is recalculated from the untouched original, which is why undo and reset never lose quality.
      </p>

      <h2>Feedback</h2>
      <p>
        Found a bug, or have an idea that would make the tool more useful? We read every message sent through the{' '}
        <Link to="/contact">contact page</Link>.
      </p>
    </ArticleLayout>
  );
}
