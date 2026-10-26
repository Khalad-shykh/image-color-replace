import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from '../../App.jsx';
import ColorField from '../editor/ColorField.jsx';
import AdSlot from '../AdSlot.jsx';
import { ROUTES, findRoute, NOT_FOUND_ROUTE } from '../../config/routes.js';
import { buildHeadTags } from '../../lib/head.js';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('routes and pages', () => {
  it.each(ROUTES.map((r) => r.path))('%s renders exactly one h1 plus header and footer', (path) => {
    renderAt(path);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('unknown routes show the 404 page', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(findRoute('/does-not-exist')).toBe(NOT_FOUND_ROUTE);
    expect(findRoute('/faq/')).toBe(ROUTES.find((r) => r.path === '/faq'));
  });

  it('footer links to every public page', () => {
    renderAt('/');
    const footer = screen.getByRole('contentinfo');
    for (const r of ROUTES) {
      expect(within(footer).getAllByRole('link').some((a) => a.getAttribute('href') === r.path)).toBe(true);
    }
  });

  it('titles and descriptions are unique and reasonably sized', () => {
    const titles = new Set(ROUTES.map((r) => r.title));
    const descriptions = new Set(ROUTES.map((r) => r.description));
    expect(titles.size).toBe(ROUTES.length);
    expect(descriptions.size).toBe(ROUTES.length);
    for (const r of ROUTES) {
      expect(r.title.length).toBeLessThanOrEqual(65);
      expect(r.description.length).toBeGreaterThan(50);
      expect(r.description.length).toBeLessThanOrEqual(170);
    }
  });

  it('head tags: no canonical without a site URL, noindex on 404, escaped JSON-LD', () => {
    const home = buildHeadTags(ROUTES[0]);
    expect(home).not.toContain('rel="canonical"');
    expect(home).toContain('"@type":"WebApplication"');
    expect(home).not.toContain('name="keywords"');
    expect(buildHeadTags(NOT_FOUND_ROUTE)).toContain('noindex');
    expect(buildHeadTags(ROUTES.find((r) => r.path === '/faq'))).toContain('"@type":"FAQPage"');
    expect(buildHeadTags(ROUTES.find((r) => r.path === '/about'))).not.toContain('ld+json');
  });

  it('privacy policy states local processing and, with ads disabled, no advertising', () => {
    renderAt('/privacy-policy');
    expect(screen.getByText(/Your images never leave your device/)).toBeInTheDocument();
    expect(screen.getByText(/does not currently display advertising/)).toBeInTheDocument();
  });
});

describe('ColorField', () => {
  it('shows HEX, RGB and HSL for a value', () => {
    render(<ColorField label="Color" value={{ r: 255, g: 0, b: 0 }} onChange={() => {}} />);
    expect(screen.getByText('#FF0000')).toBeInTheDocument();
    expect(screen.getByText('rgb(255, 0, 0)')).toBeInTheDocument();
    expect(screen.getByText('hsl(0, 100%, 50%)')).toBeInTheDocument();
  });

  it('applies valid HEX, rejects invalid HEX on blur', async () => {
    const onChange = vi.fn();
    render(<ColorField label="Color" value={{ r: 0, g: 0, b: 0 }} onChange={onChange} />);
    const hex = screen.getByLabelText('HEX');
    await userEvent.clear(hex);
    await userEvent.type(hex, '#1e90ff');
    expect(onChange).toHaveBeenLastCalledWith({ r: 30, g: 144, b: 255 }, expect.any(String));
    onChange.mockClear();
    await userEvent.clear(hex);
    await userEvent.type(hex, 'zzz1');
    fireEvent.blur(hex);
    expect(await screen.findByRole('alert')).toHaveTextContent('3 or 6 hex digits');
    expect(hex).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('edits individual RGB channels with validation', async () => {
    const onChange = vi.fn();
    render(<ColorField label="Color" value={{ r: 10, g: 20, b: 30 }} onChange={onChange} />);
    const green = screen.getByLabelText(/Green/);
    fireEvent.change(green, { target: { value: '200' } });
    expect(onChange).toHaveBeenLastCalledWith({ r: 10, g: 200, b: 30 }, expect.any(String));
    onChange.mockClear();
    fireEvent.change(green, { target: { value: '256' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('0 to 255');
  });

  it('shows the empty hint when no color is selected', () => {
    render(<ColorField label="Source" value={null} onChange={() => {}} emptyHint="Click the image" />);
    expect(screen.getByText('Click the image')).toBeInTheDocument();
  });
});

describe('upload and ads', () => {
  it('shows a clear error for an invalid upload and stays on the upload screen', async () => {
    renderAt('/');
    const input = screen.getByLabelText('Choose an image file');
    fireEvent.change(input, { target: { files: [new File(['not an image'], 'cat.png', { type: 'image/png' })] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not a PNG, JPEG or WebP'));
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument();
  });

  it('AdSlot renders nothing without AdSense configuration', () => {
    const { container } = render(<AdSlot placement="home" />);
    expect(container).toBeEmptyDOMElement();
    expect(window.adsbygoogle).toBeUndefined();
  });
});
