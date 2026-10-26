/**
 * Metadata for every public page. Used for <head> tags (prerendered at build
 * time and updated on client-side navigation), sitemap.xml and the footer.
 */
export const ROUTES = [
  {
    path: '/',
    title: 'Image Color Replace – Change a Color in Any Image Online',
    description:
      'Free online image color replacer. Click a color in your photo or graphic, pick a new one, adjust tolerance and download. Images never leave your browser.',
    navLabel: 'Tool',
  },
  {
    path: '/how-to-replace-color-in-image',
    title: 'How to Replace a Color in an Image: Step-by-Step Guide',
    description:
      'Learn how to change a specific color in a photo or graphic: picking the right source color, tuning tolerance and feathering, fixing edges and choosing an export format.',
    navLabel: 'How-to guide',
  },
  {
    path: '/how-color-tolerance-works',
    title: 'How Color Tolerance Works When Replacing Colors',
    description:
      'What color tolerance and feathering actually measure, why perceptual (CIELAB) distance often beats RGB, and how to pick values that change only the pixels you want.',
    navLabel: 'Color tolerance',
  },
  {
    path: '/faq',
    title: 'Image Color Replacement FAQ – Formats, Privacy & Quality',
    description:
      'Answers to common questions about replacing colors in images: supported formats, transparency, privacy, image quality, file size limits and browser support.',
    navLabel: 'FAQ',
  },
  {
    path: '/about',
    title: 'About Image Color Replace',
    description:
      'Why Image Color Replace exists, how the tool works, and the principles behind it: free to use, private by design and focused on doing one job well.',
    navLabel: 'About',
  },
  {
    path: '/contact',
    title: 'Contact Image Color Replace',
    description:
      'Get in touch about Image Color Replace: report a bug, suggest a feature or ask a question about the tool or this website.',
    navLabel: 'Contact',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy – Image Color Replace',
    description:
      'How Image Color Replace handles your data. Images are processed locally in your browser and are never uploaded to our servers.',
    navLabel: 'Privacy Policy',
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service – Image Color Replace',
    description: 'The terms that apply when you use the Image Color Replace website and tool.',
    navLabel: 'Terms of Service',
  },
];

export const NOT_FOUND_ROUTE = {
  path: '/404',
  title: 'Page Not Found – Image Color Replace',
  description: 'The page you were looking for does not exist.',
  noindex: true,
};

export function findRoute(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return ROUTES.find((r) => r.path === clean) ?? NOT_FOUND_ROUTE;
}
