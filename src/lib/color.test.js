import { describe, it, expect } from 'vitest';
import {
  isValidHex, hexToRgb, rgbToHex, isValidChannel, isValidRgb, parseRgbString,
  rgbToHsl, rgbToLab, labToRgb, deltaE76, rgbDistance, readableTextColor,
} from './color.js';

describe('HEX validation and parsing', () => {
  it('accepts 3 and 6 digit hex with or without #', () => {
    for (const v of ['#fff', 'fff', '#FFFFFF', 'a1B2c3', ' #123456 ']) expect(isValidHex(v)).toBe(true);
  });
  it('rejects invalid hex', () => {
    for (const v of ['', '#', '#ff', '#ffff', '#gggggg', '12345', '#1234567', null, 123, 'rgb(1,2,3)']) {
      expect(isValidHex(v)).toBe(false);
      expect(hexToRgb(v)).toBeNull();
    }
  });
  it('expands short hex and parses channels', () => {
    expect(hexToRgb('#f0a')).toEqual({ r: 255, g: 0, b: 170 });
    expect(hexToRgb('1e90ff')).toEqual({ r: 30, g: 144, b: 255 });
  });
});

describe('RGB validation', () => {
  it('validates channels', () => {
    expect(isValidChannel(0)).toBe(true);
    expect(isValidChannel(255)).toBe(true);
    expect(isValidChannel('128')).toBe(true);
    for (const v of [-1, 256, 1.5, '', 'abc', '1e2', '-3', NaN, '1000']) expect(isValidChannel(v)).toBe(false);
    expect(isValidRgb({ r: 1, g: 2, b: 3 })).toBe(true);
    expect(isValidRgb({ r: 1, g: 2 })).toBe(false);
  });
  it('parses rgb strings', () => {
    expect(parseRgbString('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseRgbString('10,20,30')).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseRgbString('10 20 30')).toEqual({ r: 10, g: 20, b: 30 });
    expect(parseRgbString('rgb(300, 0, 0)')).toBeNull();
    expect(parseRgbString('red')).toBeNull();
  });
});

describe('conversions', () => {
  it('converts RGB to HEX (clamped, rounded, lowercase)', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 170 })).toBe('#ff00aa');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 300, g: -5, b: 12.6 })).toBe('#ff000d');
  });
  it('round-trips HEX -> RGB -> HEX', () => {
    for (const hex of ['#000000', '#ffffff', '#1e90ff', '#7f7f7f', '#c0ffee']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });
  it('converts RGB to HSL', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  });
  it('converts to CIELAB with known reference values', () => {
    const white = rgbToLab(255, 255, 255);
    expect(white[0]).toBeCloseTo(100, 1);
    expect(Math.abs(white[1])).toBeLessThan(0.05);
    const red = rgbToLab(255, 0, 0);
    expect(red[0]).toBeCloseTo(53.24, 1);
    expect(red[1]).toBeCloseTo(80.09, 0);
    expect(red[2]).toBeCloseTo(67.2, 0);
  });
  it('round-trips through CIELAB within 1 unit', () => {
    for (let i = 0; i < 200; i++) {
      const r = (i * 37) % 256, g = (i * 91) % 256, b = (i * 53) % 256;
      const lab = rgbToLab(r, g, b);
      const back = labToRgb(lab[0], lab[1], lab[2]);
      expect(Math.abs(back[0] - r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back[1] - g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back[2] - b)).toBeLessThanOrEqual(1);
    }
  });
});

describe('color distance', () => {
  it('ΔE is 0 for identical colors and ~100 for black vs white', () => {
    expect(deltaE76(rgbToLab(10, 20, 30), rgbToLab(10, 20, 30))).toBe(0);
    expect(deltaE76(rgbToLab(0, 0, 0), rgbToLab(255, 255, 255))).toBeCloseTo(100, 0);
  });
  it('RGB distance is normalised to 0–100', () => {
    expect(rgbDistance(0, 0, 0, 255, 255, 255)).toBeCloseTo(100, 5);
    expect(rgbDistance(5, 5, 5, 5, 5, 5)).toBe(0);
  });
  it('chooses readable swatch text', () => {
    expect(readableTextColor({ r: 255, g: 255, b: 255 })).toBe('#111827');
    expect(readableTextColor({ r: 0, g: 0, b: 80 })).toBe('#ffffff');
  });
});
