/**
 * FAQ content. Kept as plain text so the same answers can be rendered on the
 * page and used in FAQPage structured data without drifting apart.
 * `group` is used for the on-page section headings.
 */
export const FAQ_ITEMS = [
  {
    group: 'Using the tool',
    question: 'How do I replace one color with another in a picture?',
    answer:
      'Upload your image, click the area whose color you want to change, and choose the new color. The edited preview updates as you go. Raise the tolerance if parts of the area are missed, lower it if other parts of the picture change, then download the result as PNG, JPEG or WebP.',
  },
  {
    group: 'Using the tool',
    question: 'Can I replace more than one color in the same image?',
    answer:
      'Yes. When the first replacement looks right, choose "Keep & pick another color". That replacement is locked in and you can click a different color. Each kept replacement is listed in the editor, where you can remove it individually, and undo and redo work across all of them.',
  },
  {
    group: 'Using the tool',
    question: 'What does the tolerance slider do?',
    answer:
      'Tolerance controls how different a pixel may be from the color you picked and still be replaced. At 0 only pixels of exactly that color change. Higher values include lighter, darker and slightly different shades. The "Highlight affected area" option shows exactly which pixels the current settings select.',
  },
  {
    group: 'Using the tool',
    question: 'What is feathering and when should I use it?',
    answer:
      'Feathering adds a soft transition band beyond the tolerance limit. Pixels in that band are only partially recolored, which blends anti-aliased edges and gradients instead of leaving a hard outline or a fringe of the old color. Set it to 0 for flat graphics such as logos where you want crisp edges.',
  },
  {
    group: 'Using the tool',
    question: 'What does "Preserve shading" mean?',
    answer:
      'With Preserve shading on, the tool shifts each selected pixel by the difference between the original and the new color in a perceptual color space, so highlights, shadows and texture remain visible. With it off, every selected pixel becomes exactly the new color, which suits flat icons and illustrations.',
  },
  {
    group: 'Using the tool',
    question: 'Why did parts of my image change that I did not want to change?',
    answer:
      'Color replacement selects pixels by color, not by object. If another part of the image has a similar color, it is selected too. Lower the tolerance, reduce feathering, or pick the source color from a more typical part of the area. Very similar colors in different objects cannot be separated by color alone.',
  },
  {
    group: 'Formats and quality',
    question: 'Which image formats are supported?',
    answer:
      'You can open PNG, JPEG and WebP images up to 30 MB. You can download the result as PNG, JPEG or WebP. WebP saving depends on your browser; if it is not available the option is disabled and PNG is recommended.',
  },
  {
    group: 'Formats and quality',
    question: 'Does the tool keep transparent backgrounds?',
    answer:
      'Yes. The alpha channel is never changed, so transparent and semi-transparent areas stay exactly as they were. Download as PNG or WebP to keep the transparency. JPEG cannot store transparency, so transparent areas are filled with a background color you choose.',
  },
  {
    group: 'Formats and quality',
    question: 'Will replacing a color reduce my image quality or size?',
    answer:
      'The image keeps its original width and height. PNG output is lossless. JPEG and WebP use compression controlled by the quality slider; higher quality gives larger files. Very large images (over about 16.7 megapixels) can optionally be scaled down when you open them, and the tool asks before doing so.',
  },
  {
    group: 'Formats and quality',
    question: 'Why do edges look jagged or keep a thin outline of the old color?',
    answer:
      'Edges in most images are anti-aliased: they contain in-between colors that blend the object with its background. Increase feathering so those pixels are partially recolored, or increase tolerance slightly. Heavily compressed JPEGs also contain blocky color noise that may need a higher tolerance.',
  },
  {
    group: 'Privacy and safety',
    question: 'Are my images uploaded to a server?',
    answer:
      'No. Your image is opened and processed entirely inside your web browser using the Canvas API and a Web Worker. It is not uploaded, stored or shared, and it disappears when you close or reload the page.',
  },
  {
    group: 'Privacy and safety',
    question: 'Is Image Color Replace free?',
    answer:
      'Yes. The tool is free to use without an account. There are no watermarks added to your downloads.',
  },
  {
    group: 'Browsers and devices',
    question: 'Does it work on phones and tablets?',
    answer:
      'Yes, it works in current versions of Chrome, Edge, Firefox and Safari on desktop and mobile. On phones, tap the image to pick a color. Very large photos use a lot of memory, so older phones may handle them more slowly.',
  },
  {
    group: 'Browsers and devices',
    question: 'Can I use the editor with a keyboard?',
    answer:
      'Yes. All controls are reachable with the Tab key. When an image preview is focused, the arrow keys move the picker (hold Shift for larger steps) and Enter or Space selects the color under it. Ctrl+Z and Ctrl+Y (Cmd on Mac) undo and redo.',
  },
];
