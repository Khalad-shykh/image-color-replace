import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';

const Chip = ({ hex }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    <span className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-400 align-middle" style={{ backgroundColor: hex }} aria-hidden="true" />
    <code>{hex}</code>
  </span>
);

// Distances computed with the same code the editor uses (src/lib/color.js).
const EXAMPLES = [
  ['#ff0000', '#e60000', 'Slightly darker red', '9.4', '5.7'],
  ['#ff0000', '#cc0000', 'Clearly darker red', '19.4', '11.5'],
  ['#ff0000', '#ff8000', 'Orange', '40.3', '29.0'],
  ['#ff0000', '#ff6666', 'Light red / salmon', '43.8', '32.7'],
  ['#808080', '#a0a0a0', 'Lighter grey', '12.3', '12.5'],
  ['#000080', '#0000b0', 'Brighter navy', '22.4', '10.9'],
  ['#f0f0f0', '#ffffff', 'Off-white to white', '5.2', '5.9'],
  ['#000000', '#ffffff', 'Black to white', '100.0', '100.0'],
];

export default function TolerancePage() {
  return (
    <ArticleLayout
      title="How Color Tolerance Works"
      intro="Tolerance is the single most important setting when you replace a color. Here is what it actually measures, how feathering extends it, and how to choose values that change only the pixels you mean to change."
      updated={SITE.lastUpdated}
      showAd
      related={[
        ['/how-to-replace-color-in-image', 'How to replace a color in an image'],
        ['/faq', 'Image color replacement FAQ'],
        ['/', 'Try it in the Image Color Replace tool'],
      ]}
    >
      <h2>Tolerance is a distance limit</h2>
      <p>
        Every pixel’s color can be described by three numbers. The tool measures how far each pixel’s color is from the color
        you picked, and compares that distance with the tolerance:
      </p>
      <ul>
        <li>
          If the distance is <strong>at or below the tolerance</strong>, the pixel is fully replaced.
        </li>
        <li>
          If it is <strong>within the feathering band</strong> just beyond the tolerance, it is partly replaced.
        </li>
        <li>
          Otherwise the pixel is <strong>left exactly as it was</strong>.
        </li>
      </ul>
      <p>
        A tolerance of 0 therefore matches only pixels with exactly the picked color. That works for computer-generated graphics,
        but almost never for photos, where light, texture and compression create many slightly different shades of the “same”
        color.
      </p>

      <h2>How the distance is measured</h2>
      <p>The editor offers two ways to measure color distance, both on a scale where black to white is 100.</p>
      <h3>Perceptual distance (CIELAB ΔE) — the default</h3>
      <p>
        The colors are first converted to <strong>CIELAB</strong>, a color space designed so that equal distances look roughly
        equally different to people. It separates lightness (L*) from two color axes: green–red (a*) and blue–yellow (b*). The
        distance between two colors in this space is called <strong>ΔE</strong> (“delta E”). The tool uses the classic CIE76
        formula, the straight-line distance between the two points, which is fast enough to run on millions of pixels as you
        drag the slider.
      </p>
      <p>As a rough guide to what ΔE values mean visually:</p>
      <table>
        <thead>
          <tr>
            <th scope="col">ΔE</th>
            <th scope="col">How the difference looks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Below 1</td>
            <td>Not visible to the human eye</td>
          </tr>
          <tr>
            <td>About 1–3</td>
            <td>Visible only when the colors are side by side and you look closely</td>
          </tr>
          <tr>
            <td>About 3–10</td>
            <td>Noticeable at a glance, but clearly “the same color”</td>
          </tr>
          <tr>
            <td>About 10–40</td>
            <td>A different shade, or a neighbouring hue</td>
          </tr>
          <tr>
            <td>Above about 50</td>
            <td>Clearly different colors</td>
          </tr>
        </tbody>
      </table>

      <h3>RGB distance</h3>
      <p>
        The alternative measures the straight-line distance between the raw red, green and blue values, scaled so that black to
        white is 100. It is simple and predictable, and fine for flat graphics, but it does not match human perception well:
        screens and eyes are much more sensitive to some changes than others.
      </p>

      <h2>Real examples</h2>
      <p>
        These distances were calculated with the same code the editor uses. Notice how the two metrics disagree: in RGB, a
        brighter navy (10.9) looks “closer” than a lighter grey (12.5), while perceptually the navy change is almost twice as large.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Picked color</th>
            <th scope="col">Other color</th>
            <th scope="col">Description</th>
            <th scope="col">ΔE (CIELAB)</th>
            <th scope="col">RGB distance</th>
          </tr>
        </thead>
        <tbody>
          {EXAMPLES.map(([a, b, desc, de, rgb]) => (
            <tr key={a + b}>
              <td>
                <Chip hex={a} />
              </td>
              <td>
                <Chip hex={b} />
              </td>
              <td>{desc}</td>
              <td>{de}</td>
              <td>{rgb}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        So with the default perceptual mode, picking pure red <code>#ff0000</code> with a tolerance of 20 includes the clearly
        darker <code>#cc0000</code> but not orange or salmon. You would need a tolerance above 40 before orange started to change.
      </p>

      <h2>Feathering: a soft edge for the selection</h2>
      <p>
        Without feathering, a pixel is either fully replaced or not at all. Real edges are anti-aliased — they contain blended
        colors between the object and its background — so a hard cut-off leaves a jagged line or a thin halo of the old color.
      </p>
      <p>
        Feathering adds a band beyond the tolerance in which pixels are blended between their original and new color. The blend
        follows a smooth S-shaped curve rather than a straight line, so there is no visible step where the band starts or ends.
        For example, with tolerance 20 and feathering 10:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Pixel’s distance from picked color</th>
            <th scope="col">Amount of replacement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0 – 20</td>
            <td>100%</td>
          </tr>
          <tr>
            <td>22</td>
            <td>90%</td>
          </tr>
          <tr>
            <td>25</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>28</td>
            <td>10%</td>
          </tr>
          <tr>
            <td>30 or more</td>
            <td>0% (unchanged)</td>
          </tr>
        </tbody>
      </table>

      <h2>Choosing good values</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Image type</th>
            <th scope="col">Tolerance</th>
            <th scope="col">Feathering</th>
            <th scope="col">Preserve shading</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pixel art, exact-color graphics</td>
            <td>0–3</td>
            <td>0</td>
            <td>Off</td>
          </tr>
          <tr>
            <td>Logos and icons (anti-aliased)</td>
            <td>5–10</td>
            <td>3–8</td>
            <td>Off for an exact brand color</td>
          </tr>
          <tr>
            <td>Screenshots, charts, illustrations</td>
            <td>8–15</td>
            <td>5–10</td>
            <td>Either</td>
          </tr>
          <tr>
            <td>Photos (clothing, walls, cars)</td>
            <td>15–30</td>
            <td>10–20</td>
            <td>On</td>
          </tr>
          <tr>
            <td>Low-quality JPEGs</td>
            <td>20–35</td>
            <td>15–25</td>
            <td>On</td>
          </tr>
        </tbody>
      </table>
      <p>
        These are starting points, not rules. The fastest way to find the right value is to turn on{' '}
        <strong>Highlight affected area</strong>, start low, and raise the tolerance until the area you want is fully covered —
        stopping before anything else lights up.
      </p>

      <h2>What “Preserve shading” does to the color</h2>
      <p>
        Tolerance decides <em>which</em> pixels change; shading decides <em>what they become</em>. With Preserve shading on, each
        selected pixel is moved in CIELAB space by the same offset that separates the picked color from the replacement color. A
        pixel that was a little darker than the picked color ends up a little darker than the replacement, so folds, shadows and
        texture survive. With it off, every fully selected pixel becomes exactly the replacement color.
      </p>

      <h2>Limitations of color distance</h2>
      <ul>
        <li>
          <strong>Distance knows nothing about objects.</strong> Two different objects with similar colors are equally close to
          the picked color. No tolerance value can separate them.
        </li>
        <li>
          <strong>CIE76 is an approximation.</strong> Newer formulas such as CIEDE2000 correct some inaccuracies, especially for
          saturated blues, but are several times slower. For selecting pixels with an adjustable slider, CIE76 is a good balance.
        </li>
        <li>
          <strong>Very dark colors are noisy.</strong> Camera noise and compression affect shadows strongly, so dark areas often
          need a higher tolerance than bright ones.
        </li>
      </ul>
      <p>
        Want to see it in action? <Link to="/">Open the tool</Link>, load the sample image and try changing the red balloon with
        different tolerance values.
      </p>
    </ArticleLayout>
  );
}
