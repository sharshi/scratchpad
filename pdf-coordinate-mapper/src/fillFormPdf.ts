import { PDFDocument, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFTextField } from "pdf-lib";
import type { ModelData } from "./types";

/**
 * Describes a single form field found inside a PDF.
 */
export interface FormFieldInfo {
  /** The internal field name (used as the key when filling) */
  name: string;
  /** The field type: text, checkbox, dropdown, radio, or other */
  type: "text" | "checkbox" | "dropdown" | "radio" | "other";
  /** For dropdowns: the available options */
  options?: string[];
}

/**
 * Load a PDF from various source types into a Uint8Array.
 */
async function loadPdfBytes(source: ArrayBuffer | string): Promise<Uint8Array> {
  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }

  if (source.startsWith("data:")) {
    const base64 = source.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const res = await fetch(source);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Inspect a PDF and return the list of AcroForm fields it contains.
 *
 * Returns an empty array if the PDF has no form fields.
 */
export async function getFormFields(pdfSource: ArrayBuffer | string): Promise<FormFieldInfo[]> {
  const pdfBytes = await loadPdfBytes(pdfSource);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    return fields.map((field) => {
      const name = field.getName();

      if (field instanceof PDFTextField) {
        return { name, type: "text" as const };
      }
      if (field instanceof PDFCheckBox) {
        return { name, type: "checkbox" as const };
      }
      if (field instanceof PDFDropdown) {
        return { name, type: "dropdown" as const, options: field.getOptions() };
      }
      if (field instanceof PDFRadioGroup) {
        return { name, type: "radio" as const, options: field.getOptions() };
      }
      return { name, type: "other" as const };
    });
  } catch {
    return [];
  }
}

/**
 * Fill a PDF's AcroForm fields using the supplied data.
 *
 * `fieldMap` maps your model's field names to the PDF's form field names.
 * If not provided, the data keys are used directly as form field names.
 *
 * @param pdfSource  - The original PDF (URL, base64, or ArrayBuffer)
 * @param data       - Key/value pairs to fill into the form
 * @param fieldMap   - Optional mapping: { yourKey: "pdfFieldName" }
 * @param flatten    - If true, flattens the form so fields are no longer editable (default true)
 * @returns The filled PDF as a Uint8Array
 */
export async function fillFormPdf(
  pdfSource: ArrayBuffer | string,
  data: ModelData,
  fieldMap?: Record<string, string>,
  flatten = true,
): Promise<Uint8Array> {
  const pdfBytes = await loadPdfBytes(pdfSource);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  for (const [dataKey, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const pdfFieldName = fieldMap ? fieldMap[dataKey] : dataKey;
    if (!pdfFieldName) continue;

    try {
      const field = form.getField(pdfFieldName);
      const text = String(value);

      if (field instanceof PDFTextField) {
        field.setText(text);
      } else if (field instanceof PDFCheckBox) {
        const truthy = text === "true" || text === "1" || text === "yes";
        if (truthy) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown) {
        field.select(text);
      } else if (field instanceof PDFRadioGroup) {
        field.select(text);
      }
    } catch {
      // Field not found or incompatible – skip silently
    }
  }

  if (flatten) {
    form.flatten();
  }

  return pdfDoc.save();
}
