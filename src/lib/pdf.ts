/**
 * Renders the printable declaration (.print-sheet) to an A4 PDF in the browser, so the file the student downloads,
 * the file stored in the record and the file emailed are one and the same, and Arabic is shaped by the browser.
 * Raster at 2× (html-to-image), sliced into A4 pages (pdf-lib). Upgrade path: Cloudflare Browser Rendering for vector.
 */
import { toCanvas } from 'html-to-image';
import { PDFDocument } from 'pdf-lib';

const A4 = { w: 595.28, h: 841.89 }; // points
const SHEET_PX = 794; // A4 width at 96 dpi: the sheet is laid out at this width before capture
const MARGIN_PX = 48;
export const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function renderDeclarationPdf(sheet: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  // Lay the sheet out at print width, off-screen but rendered, then capture it.
  const stage = document.createElement('div');
  stage.setAttribute('aria-hidden', 'true');
  stage.setAttribute('data-capture-stage', ''); // tests and tooling can ignore this transient off-screen element
  Object.assign(stage.style, { position: 'fixed', insetInlineStart: '-10000px', top: '0', width: `${SHEET_PX}px`, background: '#fff', zIndex: '-1' });
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.classList.add('print-sheet--capture');
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try {
    const canvas = await toCanvas(clone, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: false });
    const pdf = await PDFDocument.create();
    pdf.setTitle('KFUPM Pre-Arrival Compliance Form');
    pdf.setProducer('KFUPM Pre-Arrival Compliance Portal');
    const scale = (A4.w - (MARGIN_PX * 2 * A4.w) / SHEET_PX) / canvas.width; // points per canvas pixel
    const pageContentPt = A4.h - (MARGIN_PX * 2 * A4.w) / SHEET_PX;
    const sliceHeightPx = Math.floor(pageContentPt / scale);
    for (let y = 0; y < canvas.height; y += sliceHeightPx) {
      const h = Math.min(sliceHeightPx, canvas.height - y);
      const part = document.createElement('canvas');
      part.width = canvas.width;
      part.height = h;
      part.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      const png = await pdf.embedPng(part.toDataURL('image/png'));
      const page = pdf.addPage([A4.w, A4.h]);
      const marginPt = (MARGIN_PX * A4.w) / SHEET_PX;
      page.drawImage(png, { x: marginPt, y: A4.h - marginPt - h * scale, width: canvas.width * scale, height: h * scale });
    }
    const bytes = await pdf.save();
    if (bytes.length > MAX_PDF_BYTES) throw new Error('pdf too large');
    return new Blob([bytes as BlobPart], { type: 'application/pdf' });
  } finally {
    stage.remove();
  }
}
