import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import type { RestaurantTable } from '../types';

export function createQrToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function slugifyTable(name: string, fallback: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return slug || fallback;
}

export function tableQrSlug(table: RestaurantTable) {
  return table.qrToken;
}

export function normalizePublicOrderBaseUrl(publicBase: string) {
  const cleanBase = publicBase.replace(/\/$/, '');
  return /\/(mesa|menu)$/i.test(cleanBase) ? cleanBase : `${cleanBase}/mesa`;
}

export function tableQrUrl(table: RestaurantTable, publicBase: string) {
  return `${normalizePublicOrderBaseUrl(publicBase)}/${table.qrToken}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function createQrCardDataUrl(table: RestaurantTable, publicBase: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1300;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponivel para gerar QR Code');

  const gradient = ctx.createLinearGradient(0, 0, 900, 1300);
  gradient.addColorStop(0, '#151d29');
  gradient.addColorStop(0.55, '#080b10');
  gradient.addColorStop(1, '#1f1110');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1300);

  ctx.save();
  roundRect(ctx, 52, 52, 796, 1196, 54);
  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#ff6b1a';
  ctx.beginPath();
  ctx.arc(450, 172, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px Inter, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GF', 450, 187);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 48px Inter, Arial';
  ctx.fillText('GrillFlow Burger', 450, 286);
  ctx.fillStyle = '#ffb000';
  ctx.font = '800 62px Inter, Arial';
  ctx.fillText(table.name, 450, 392);

  const qrDataUrl = await QRCode.toDataURL(tableQrUrl(table, publicBase), {
    margin: 2,
    width: 520,
    errorCorrectionLevel: 'H',
    color: { dark: '#080b10', light: '#ffffff' }
  });

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 160, 455, 580, 580, 42);
      ctx.fill();
      ctx.drawImage(image, 190, 485, 520, 520);
      resolve();
    };
    image.onerror = reject;
    image.src = qrDataUrl;
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px Inter, Arial';
  ctx.fillText('Escaneie para acessar o', 450, 1120);
  ctx.fillText('cardapio digital', 450, 1174);
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  ctx.font = '500 24px Inter, Arial';
  ctx.fillText(tableQrUrl(table, publicBase), 450, 1224);

  return canvas.toDataURL('image/png', 1);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function downloadQrPng(table: RestaurantTable, publicBase: string) {
  const dataUrl = await createQrCardDataUrl(table, publicBase);
  downloadDataUrl(dataUrl, `${tableQrSlug(table)}-qr-card.png`);
}

export async function downloadQrPdf(tables: RestaurantTable[], publicBase: string) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let index = 0; index < tables.length; index += 1) {
    if (index > 0) pdf.addPage();
    const dataUrl = await createQrCardDataUrl(tables[index], publicBase);
    pdf.addImage(dataUrl, 'PNG', 36, 12, 138, 199);
  }

  pdf.save('grillflow-qr-codes.pdf');
}
