import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generate a sample invoice-style PDF entirely in memory using pdf-lib.
 * Returns a base64 data-URI that can be passed directly to PdfCoordinateMapper.
 */
export async function createSamplePdf(): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]); // US Letter

  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  const lightGray = rgb(0.92, 0.92, 0.92);

  // --- Header ---
  page.drawText("INVOICE", { x: 50, y: 740, size: 28, font: bold, color: black });
  page.drawText("Acme Corp.", { x: 50, y: 715, size: 12, font, color: gray });

  // --- Labels (right column) ---
  page.drawText("Invoice #:", { x: 400, y: 740, size: 10, font: bold, color: gray });
  page.drawText("Date:", { x: 400, y: 722, size: 10, font: bold, color: gray });
  page.drawText("Due Date:", { x: 400, y: 704, size: 10, font: bold, color: gray });

  // --- Divider ---
  page.drawLine({ start: { x: 50, y: 695 }, end: { x: 562, y: 695 }, thickness: 1, color: lightGray });

  // --- Bill To Section ---
  page.drawText("Bill To:", { x: 50, y: 670, size: 10, font: bold, color: gray });
  // The actual name / company / address / email will be filled by the mapper

  // --- Table Header ---
  const tableTop = 580;
  page.drawRectangle({ x: 50, y: tableTop - 4, width: 512, height: 22, color: lightGray });
  page.drawText("Description", { x: 55, y: tableTop, size: 10, font: bold, color: black });
  page.drawText("Qty", { x: 320, y: tableTop, size: 10, font: bold, color: black });
  page.drawText("Unit Price", { x: 380, y: tableTop, size: 10, font: bold, color: black });
  page.drawText("Amount", { x: 490, y: tableTop, size: 10, font: bold, color: black });

  // --- Empty rows ---
  for (let i = 0; i < 5; i++) {
    const rowY = tableTop - 26 - i * 24;
    if (i % 2 === 1) {
      page.drawRectangle({ x: 50, y: rowY - 4, width: 512, height: 22, color: rgb(0.97, 0.97, 0.97) });
    }
    page.drawLine({
      start: { x: 50, y: rowY - 4 },
      end: { x: 562, y: rowY - 4 },
      thickness: 0.5,
      color: lightGray,
    });
  }

  // --- Totals Section ---
  const totalsY = 420;
  page.drawText("Subtotal:", { x: 400, y: totalsY, size: 10, font, color: gray });
  page.drawText("Tax:", { x: 400, y: totalsY - 20, size: 10, font, color: gray });
  page.drawLine({
    start: { x: 400, y: totalsY - 32 },
    end: { x: 562, y: totalsY - 32 },
    thickness: 1,
    color: lightGray,
  });
  page.drawText("Total:", { x: 400, y: totalsY - 48, size: 12, font: bold, color: black });

  // --- Notes ---
  page.drawText("Notes:", { x: 50, y: 350, size: 10, font: bold, color: gray });

  // --- Footer ---
  page.drawLine({ start: { x: 50, y: 60 }, end: { x: 562, y: 60 }, thickness: 0.5, color: lightGray });
  page.drawText("Thank you for your business!", { x: 50, y: 42, size: 9, font, color: gray });

  const bytes = await doc.save();
  const base64 = btoa(String.fromCharCode(...bytes));
  return `data:application/pdf;base64,${base64}`;
}
