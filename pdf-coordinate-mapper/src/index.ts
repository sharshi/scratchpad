// Types
export type {
  FieldMapping,
  MappingTemplate,
  ModelData,
  FillOptions,
} from "./types";

// React component
export { PdfCoordinateMapper } from "./PdfCoordinateMapper";
export type { PdfCoordinateMapperProps } from "./PdfCoordinateMapper";

// Coordinate-based filler
export { fillPdf } from "./fillPdf";

// AcroForm (fillable PDF) utilities
export { getFormFields, fillFormPdf } from "./fillFormPdf";
export type { FormFieldInfo } from "./fillFormPdf";

// Download helper
export { downloadFilledPdf } from "./downloadPdf";
