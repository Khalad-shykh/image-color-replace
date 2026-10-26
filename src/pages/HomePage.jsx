import { Link } from 'react-router';
import Editor from '../components/editor/Editor.jsx';
import AdSlot from '../components/AdSlot.jsx';
import Icon from '../components/Icon.jsx';

const STEPS = [
  {
    title: 'Open your image',
    text: 'Drag a PNG, JPEG or WebP file onto the page, paste it, or choose it from your device. Nothing is uploaded.',
  },
  {
    title: 'Click the color to change',
    text: 'Click any pixel to pick its color, or type an exact HEX or RGB value. Then choose the new color.',
  },
  {
    title: 'Fine-tune and download',
    text: 'Adjust tolerance and edge feathering while the preview updates, compare before and after, and download.',
  },
];

const FEATURES = [
  ['Pixel-accurate replacement', 'Works on the actual pixels with a perceptual (CIELAB) color match, not a filter over the whole picture.'],
  ['Keeps shading and texture', 'Shifts the selected shades together, so folds, shadows and highlights still look natural.'],
  ['Transparency preserved', 'The alpha channel is never touched. Transparent PNG and WebP images stay transparent.'],
  ['Several colors, full undo', 'Keep one replacement and pick another. Undo, redo, reset and remove any step at any time.'],
  ['See exactly what changes', 'Highlight the affected area, view side by side or drag a before/after divider.'],
  ['Original size, your format', 'Download as PNG, JPEG or WebP at the same dimensions, with the file name you choose.'],
];

export default function HomePage() {
  return (
    <>
      <div className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Replace a color in an image online
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Pick any color in a photo, logo or illustration and change it to another one. Control how many similar shades are
            included, keep shading and transparency, and download the result — free, with no sign-up and no uploads.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
            <Icon name="lock" className="h-4 w-4" />
            Processed locally in your browser
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Editor />
      </div>

      <div className="mx-auto max-w-7xl space-y-16 px-4 pt-8 sm:px-6">
        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className="text-2xl font-bold tracking-tight text-slate-900">
            How to change a specific color in a photo
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="panel">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-slate-600">
            Want more detail? Read the{' '}
            <Link to="/how-to-replace-color-in-image" className="font-medium text-brand-700 underline underline-offset-2">
              step-by-step guide to replacing a color in an image
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold tracking-tight text-slate-900">
            An image color replacer that respects your picture
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="uses-heading" className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="uses-heading" className="text-2xl font-bold tracking-tight text-slate-900">
              What people use it for
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              <li>Recoloring a logo or icon to match a new brand palette.</li>
              <li>Trying a product photo in a different color before ordering or printing.</li>
              <li>Swapping the background color of a graphic, sticker or slide asset.</li>
              <li>Fixing one off-brand color in a chart, diagram or screenshot.</li>
              <li>Changing the color of clothing, a car or a wall in a photo for a mock-up.</li>
            </ul>
          </div>
          <div className="panel">
            <h2 className="text-lg font-semibold text-slate-900">Tips for clean results</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>
                <strong>Pick a typical pixel</strong>, not a highlight or deep shadow — the tolerance range is centred on it.
              </li>
              <li>
                <strong>Turn on “Highlight affected area”</strong> while you adjust tolerance to see every pixel that will change.
              </li>
              <li>
                <strong>Use feathering for photos</strong> and anti-aliased edges; set it to 0 for crisp flat graphics.
              </li>
              <li>
                <strong>Save as PNG</strong> to keep transparency and avoid compression artifacts.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              <Link to="/how-color-tolerance-works" className="font-medium text-brand-700 underline underline-offset-2">
                Learn how color tolerance works
              </Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="privacy-heading" className="rounded-2xl bg-slate-900 px-6 py-8 text-slate-100 sm:px-10">
          <h2 id="privacy-heading" className="text-2xl font-bold tracking-tight text-white">
            Your images stay on your device
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            The editor reads your file and changes its pixels using your browser’s built-in Canvas API and a background Web
            Worker. There is no upload step and no server-side processing, so the image is never sent to us or anyone else. Close
            or reload the page and it is gone. Read the{' '}
            <Link to="/privacy-policy" className="font-medium text-white underline underline-offset-2">
              privacy policy
            </Link>{' '}
            for details.
          </p>
        </section>

        <section aria-labelledby="faq-teaser-heading">
          <h2 id="faq-teaser-heading" className="text-2xl font-bold tracking-tight text-slate-900">
            Common questions
          </h2>
          <dl className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Can I replace more than one color?</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                Yes. Choose “Keep &amp; pick another color” and select the next one. Every kept replacement can be removed or
                undone later.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Why did other parts of my image change too?</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                Pixels are selected by color, so anything with a similar color is included. Lower the tolerance or feathering until
                only the area you want is highlighted.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Does it keep transparent backgrounds?</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                Yes, transparency is never changed. Download as PNG or WebP to keep it; JPEG fills transparent areas with a
                background color.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Is there a file size limit?</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                Files can be up to 30 MB. Images over about 16.7 megapixels can be scaled down on request to fit browser memory
                limits.
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-sm">
            <Link to="/faq" className="font-medium text-brand-700 underline underline-offset-2">
              Read all frequently asked questions
            </Link>
          </p>
        </section>
      </div>

      <AdSlot placement="home" className="px-4" />
    </>
  );
}
