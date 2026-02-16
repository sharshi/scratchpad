/**
 * A single field mapping: ties a model field name to a coordinate on a specific PDF page.
 */
export interface FieldMapping {
  /** The key in the model/data object this mapping corresponds to */
  fieldName: string;
  /** 1-based page number */
  page: number;
  /** X coordinate in PDF points (from left) */
  x: number;
  /** Y coordinate in PDF points (from top) */
  y: number;
  /** Optional render width in PDF points */
  width?: number;
  /** Optional render height in PDF points */
  height?: number;
  /** Font size in points (default 12) */
  fontSize?: number;
  /** Font color as CSS color string (default "#000000") */
  fontColor?: string;
  /** Human-readable label shown in the mapper UI */
  label?: string;
}

/**
 * A complete mapping template: a PDF source + all its field mappings.
 */
export interface MappingTemplate {
  /** Unique identifier for this template */
  id: string;
  /** Human-readable name */
  name: string;
  /** The original PDF file as an ArrayBuffer, base64 string, or URL */
  pdfSource: ArrayBuffer | string;
  /** All field-to-coordinate mappings */
  mappings: FieldMapping[];
}

/**
 * A record whose keys are field names and values are the text to render.
 */
export type ModelData = Record<string, string | number | boolean | undefined | null>;

/**
 * Options passed to the filler.
 */
export interface FillOptions {
  /** Default font size when not specified per-mapping (default 12) */
  defaultFontSize?: number;
  /** Default font color when not specified per-mapping */
  defaultFontColor?: string;
  /** Font to embed – currently only Helvetica is supported */
  fontFamily?: string;
}
