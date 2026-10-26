/**
 * Draws a small built-in sample picture so visitors can try the tool without
 * uploading anything. It contains flat colors, a shaded shape, anti-aliased
 * edges and a transparent corner, which exercises every part of the editor.
 */
export function createSampleImage(width = 960, height = 640) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Hills
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.quadraticCurveTo(width * 0.25, height * 0.55, width * 0.5, height * 0.7);
  ctx.quadraticCurveTo(width * 0.75, height * 0.82, width, height * 0.66);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Shaded red balloon
  const cx = width * 0.36;
  const cy = height * 0.38;
  const r = height * 0.2;
  const balloon = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  balloon.addColorStop(0, '#fca5a5');
  balloon.addColorStop(0.45, '#dc2626');
  balloon.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = balloon;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.85, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + r);
  ctx.bezierCurveTo(cx - 20, cy + r * 1.6, cx + 20, cy + r * 2, cx, height * 0.78);
  ctx.stroke();

  // Flat yellow sun and orange house
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(width * 0.82, height * 0.2, height * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(width * 0.62, height * 0.5, width * 0.18, height * 0.2);
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.moveTo(width * 0.6, height * 0.5);
  ctx.lineTo(width * 0.71, height * 0.38);
  ctx.lineTo(width * 0.82, height * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(width * 0.69, height * 0.6, width * 0.04, height * 0.1);

  // Transparent top-left corner to demonstrate alpha preservation
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, height * 0.28);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.6, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, height * 0.3, height * 0.3);
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, width, height);
  canvas.width = 0;
  return imageData;
}
