import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { FieldMapping, FillOptions, ModelData } from "./types";

/**
 * Parse a CSS hex color (#rrggbb) into an rgb() call compatible with pdf-lib.
 */
function parseColor(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/**
 * Load a PDF from various source types into a Uint8Array.
 */
async function loadPdfBytes(source: ArrayBuffer | string): Promise<Uint8Array> {
  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }

  // data-uri / base64
  if (source.startsWith("data:")) {
    const base64 = source.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // URL – fetch it
  const res = await fetch(source);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Fill a PDF with model data according to the supplied field mappings.
 *
 * Returns the filled PDF as a Uint8Array.
 *
 * Coordinate system note: `FieldMapping.y` is measured from the **top** of
 * the page (like browser coordinates) while pdf-lib measures from the
 * **bottom**. The conversion is handled automatically.
 */
export async function fillPdf(
  pdfSource: ArrayBuffer | string,
  mappings: FieldMapping[],
  data: ModelData,
  options: FillOptions = {},
): Promise<Uint8Array> {
  const {
    defaultFontSize = 12,
    defaultFontColor = "#000000",
  } = options;

  const pdfBytes = await loadPdfBytes(pdfSource);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const mapping of mappings) {
    const value = data[mapping.fieldName];
    if (value === undefined || value === null) continue;

    const text = String(value);
    const pageIndex = mapping.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { height: pageHeight } = page.getSize();
    const fontSize = mapping.fontSize ?? defaultFontSize;
    const color = parseColor(mapping.fontColor ?? defaultFontColor);

    // Convert top-origin Y to bottom-origin Y
    const pdfY = pageHeight - mapping.y - fontSize;

    page.drawText(text, {
      x: mapping.x,
      y: pdfY,
      size: fontSize,
      font,
      color,
    });
  }

  return pdfDoc.save();
}
