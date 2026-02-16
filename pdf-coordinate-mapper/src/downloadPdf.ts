import type { FieldMapping, FillOptions, ModelData } from "./types";
import { fillPdf } from "./fillPdf";

/**
 * Fill a PDF with model data and immediately trigger a browser download.
 *
 * @param pdfSource  - The original PDF (URL, base64, or ArrayBuffer)
 * @param mappings   - Coordinate-to-field mappings created by PdfCoordinateMapper
 * @param data       - The model instance whose values will be written into the PDF
 * @param filename   - Name of the downloaded file (default "filled.pdf")
 * @param options    - Font size / color overrides
 * @returns The filled PDF bytes (in case the caller wants to do something else with them)
 */
export async function downloadFilledPdf(
  pdfSource: ArrayBuffer | string,
  mappings: FieldMapping[],
  data: ModelData,
  filename = "filled.pdf",
  options?: FillOptions,
): Promise<Uint8Array> {
  const pdfBytes = await fillPdf(pdfSource, mappings, data, options);

  // Create a temporary object URL and click an invisible link
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return pdfBytes;
}
