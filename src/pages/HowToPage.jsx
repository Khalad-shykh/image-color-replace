import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';

export default function HowToPage() {
  return (
    <ArticleLayout
      title="How to Replace a Color in an Image"
      intro="A practical, step-by-step guide to changing one specific color in a photo or graphic — and to getting clean edges, natural shading and the right file format at the end."
      updated={SITE.lastUpdated}
      showAd
      related={[
        ['/', 'Open the Image Color Replace tool'],
        ['/how-color-tolerance-works', 'How color tolerance works'],
        ['/faq', 'Image color replacement FAQ'],
      ]}
    >
      <p>
        Replacing a color means finding every pixel that is close to one color and giving it a different one. It sounds simple,
        but real images rarely contain a single flat color: a red shirt in a photo is made of hundreds of slightly different reds,
        and even a “flat” logo has blended pixels along its edges. The steps below use the free{' '}
        <Link to="/">Image Color Replace tool</Link>, but the ideas apply to any editor.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>
          <strong>Use the best copy of the image you have.</strong> A PNG or a high-quality JPEG gives cleaner results than a
          small, heavily compressed screenshot.
        </li>
        <li>
          <strong>Know your target color.</strong> If you are matching a brand, have its HEX code (for example{' '}
          <code>#1e40af</code>) or RGB values ready. Otherwise you can pick one visually.
        </li>
        <li>
          <strong>Check what else shares the color.</strong> The tool selects pixels by color, not by object. If the sky and a
          car are the same blue, both will be selected.
        </li>
      </ul>

      <h2>Step 1: Open your image</h2>
      <p>
        Drag a PNG, JPEG or WebP file onto the upload area, paste an image you have copied with <kbd>Ctrl</kbd>+<kbd>V</kbd> (
        <kbd>Cmd</kbd>+<kbd>V</kbd> on a Mac), or press <strong>Choose image</strong>. Files up to 30 MB are accepted. The file
        is opened by your browser and never uploaded. If an image is larger than about 16.7 megapixels, the tool explains the
        reason and asks before scaling it down; otherwise the original dimensions are kept.
      </p>

      <h2>Step 2: Pick the color you want to replace</h2>
      <p>
        Click or tap the area you want to change. The selected color appears as a swatch with its HEX, RGB and HSL values, and a
        small ring marks the pixel you clicked. Some tips:
      </p>
      <ul>
        <li>
          <strong>Choose a typical pixel</strong>, not the brightest highlight or the darkest shadow. Tolerance is measured
          outward from this color, so a middle tone catches the light and dark shades evenly.
        </li>
        <li>
          <strong>Zoom in for small details.</strong> Use the zoom buttons or <strong>100%</strong> to click exactly on a thin
          line or a small icon. The pixel under your pointer and its color are shown above each preview.
        </li>
        <li>
          <strong>Type the color if you know it.</strong> For digital graphics with an exact known color, enter it in the HEX or
          RGB fields instead of clicking.
        </li>
        <li>
          <strong>Use the keyboard if you prefer.</strong> Focus a preview with <kbd>Tab</kbd>, move the picker with the arrow
          keys (hold <kbd>Shift</kbd> for bigger steps) and press <kbd>Enter</kbd>.
        </li>
      </ul>

      <h2>Step 3: Choose the replacement color</h2>
      <p>
        Pick the new color with the color picker, or type a HEX code or individual red, green and blue values from 0 to 255.
        The edited preview updates immediately. If you change your mind about which color is which, the <strong>Swap</strong>{' '}
        button exchanges the two.
      </p>

      <h2>Step 4: Adjust the tolerance</h2>
      <p>
        Tolerance decides how different a pixel can be from the selected color and still be replaced. Turn on{' '}
        <strong>Highlight affected area</strong> while you adjust it: everything shown in magenta will change.
      </p>
      <ul>
        <li>
          <strong>Parts of the area are not changing?</strong> Increase the tolerance a few steps at a time.
        </li>
        <li>
          <strong>Other parts of the image are changing?</strong> Decrease it, or pick a more representative source pixel.
        </li>
      </ul>
      <p>
        As a starting point, values around 5–10 suit flat graphics, and 15–30 suit photos with lighting and texture. The{' '}
        <Link to="/how-color-tolerance-works">color tolerance guide</Link> explains what the numbers mean.
      </p>

      <h2>Step 5: Smooth the edges and keep the shading</h2>
      <p>
        <strong>Edge feathering</strong> adds a soft transition just beyond the tolerance limit. Pixels in this band are only
        partly recolored, which hides the jagged outline or thin fringe of the old color that often appears around anti-aliased
        edges. Use more feathering for photos and soft shapes, and set it to 0 for pixel art or logos with sharp edges.
      </p>
      <p>
        <strong>Preserve shading</strong> (on by default) moves all selected shades together, so a shadow on a red sweater
        becomes a shadow on a blue sweater. Turn it off when you want every selected pixel to become exactly the new color — for
        example when recoloring a flat icon to an exact brand color.
      </p>

      <h2>Step 6: Replace additional colors (optional)</h2>
      <p>
        When the first replacement looks right, press <strong>Keep &amp; pick another color</strong>. It is added to the list of
        kept replacements, and you can pick the next color. Later replacements work on the result of earlier ones, so you can
        even recolor something you have already changed. Each kept step can be removed individually, and <strong>Undo</strong>,{' '}
        <strong>Redo</strong> and <strong>Reset</strong> work at any time without damaging the original image.
      </p>

      <h2>Step 7: Compare and download</h2>
      <p>
        Use <strong>Side by side</strong> or the <strong>Compare slider</strong> to check the result against the original, then
        choose a format, adjust the file name if you like, and press <strong>Download</strong>. The download has the same pixel
        dimensions as the image you edited.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Format</th>
            <th scope="col">Transparency</th>
            <th scope="col">Best for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>PNG</td>
            <td>Yes</td>
            <td>Logos, graphics, screenshots and anything you will edit again. Lossless, larger files.</td>
          </tr>
          <tr>
            <td>JPEG</td>
            <td>No — transparent areas are filled with a background color you choose</td>
            <td>Photos where a small file matters more than perfect quality.</td>
          </tr>
          <tr>
            <td>WebP</td>
            <td>Yes</td>
            <td>Web use: smaller than PNG with transparency. Saving depends on your browser’s support.</td>
          </tr>
        </tbody>
      </table>

      <h2>Worked examples</h2>
      <h3>Recolor a flat logo</h3>
      <p>
        A red logo on a transparent background needs to become navy. Click the red, enter <code>#1e3a8a</code> as the
        replacement, set tolerance to about 8 and feathering to 4, and turn <strong>Preserve shading</strong> off so the logo
        becomes exactly the brand color. The small feathering recolors the blended edge pixels, and the transparent background
        stays transparent. Save as PNG.
      </p>
      <h3>Change the color of a shirt in a photo</h3>
      <p>
        Click a mid-tone area of the shirt, not a fold or a highlight. Pick the new color, keep <strong>Preserve shading</strong>{' '}
        on, and raise the tolerance until the whole shirt is highlighted — often around 20–30. Add 10–15 feathering to soften the
        boundary with skin and background. If the shirt is still patchy in deep folds, keep this replacement and pick a second,
        darker shade of the original color.
      </p>
      <h3>Swap a solid background color</h3>
      <p>
        For a product shot on a light grey backdrop, click the backdrop and choose the new color. Backdrops usually have a gentle
        gradient, so start around 12–18 and check that the product itself is not highlighted. If the product contains a similar
        grey, lower the tolerance and accept a slightly visible gradient rather than recoloring the product.
      </p>

      <h2>Limitations to be aware of</h2>
      <ul>
        <li>
          <strong>Color is not the same as an object.</strong> This kind of tool cannot tell a blue car from a blue sky. If two
          things share a color, both change. For those images, a layer-based editor with manual masking is the better tool.
        </li>
        <li>
          <strong>Extreme lightness changes are hard.</strong> Turning black into white, or white into a dark color, while
          preserving shading can look flat or greyish because detail is compressed near pure black and white. Switching off{' '}
          <em>Preserve shading</em> often works better for such changes.
        </li>
        <li>
          <strong>Compression artifacts.</strong> Low-quality JPEGs contain blocky color noise around edges, which may need a
          higher tolerance and more feathering, and can still leave traces.
        </li>
        <li>
          <strong>Very saturated targets.</strong> Some combinations of lightness and saturation cannot be shown on screen. Such
          colors are brought to the nearest displayable color, which can make them slightly less vivid than expected.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Problem</th>
            <th scope="col">What to try</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A thin outline of the old color remains</td>
            <td>Increase edge feathering, or raise tolerance by a few points.</td>
          </tr>
          <tr>
            <td>Unrelated areas also changed</td>
            <td>Lower tolerance and feathering; pick a more typical source pixel.</td>
          </tr>
          <tr>
            <td>The new color looks flat or lifeless</td>
            <td>Make sure Preserve shading is on.</td>
          </tr>
          <tr>
            <td>The new color is not exactly the HEX I entered</td>
            <td>That is expected with Preserve shading; turn it off for an exact match.</td>
          </tr>
          <tr>
            <td>Transparent areas turned white or black</td>
            <td>You saved as JPEG. Save as PNG or WebP instead.</td>
          </tr>
          <tr>
            <td>Nothing changes when I click</td>
            <td>The clicked pixel may be fully transparent, or tolerance may be 0 on a noisy photo — increase it.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Ready to try it? <Link to="/">Open the image color replacer</Link> and use the built-in sample image if you do not have
        a picture at hand.
      </p>
    </ArticleLayout>
  );
}
