# PDF Coordinate Mapper

A React library for mapping data fields to PDF coordinates and filling PDFs with custom data.

## Features

- 📍 **Coordinate Mapping**: Visually map fields to any position on a PDF
- 📝 **Form Filling**: Fill existing PDFs with AcroForm fields
- 🎨 **Interactive UI**: Drag-and-drop field placement with live preview
- 💾 **Template Management**: Save and reuse field mappings
- 🔄 **Flexible Input**: Supports URLs, base64, and ArrayBuffer sources

## Examples

### 1. Main Example (Full-Featured)
Location: `example/`

The main example demonstrates all features:
- Upload or create a sample PDF
- Map fields using coordinates (for any PDF)
- Fill PDFs using form fields (for fillable PDFs)
- Save and load templates
- Preview and download results

```bash
cd example
npm install
npm run dev
```

### 2. Form Fill Example (Simple)
Location: `form-fill-example/`

A streamlined example for filling existing PDFs with form fields:
- Upload a PDF with fillable fields
- Automatically detect all form fields
- Fill fields with data
- Preview and download

```bash
cd form-fill-example
npm install
npm run dev
```

**Use this example when:**
- You have existing PDFs with fillable fields
- You only need form-filling (no coordinate mapping)
- You want a simpler, focused implementation

## Quick Start

### Installation

```bash
npm install pdf-coordinate-mapper
```

### Basic Usage - Coordinate Mapping

```tsx
import { PdfCoordinateMapper, fillPdf, downloadFilledPdf } from 'pdf-coordinate-mapper';

function MyApp() {
  const [mappings, setMappings] = useState([]);
  
  return (
    <PdfCoordinateMapper
      pdfSource="/path/to/document.pdf"
      fieldNames={['name', 'email', 'date']}
      initialMappings={mappings}
      onChange={setMappings}
      onSave={(template) => console.log('Saved:', template)}
    />
  );
}
```

### Basic Usage - Form Filling

```tsx
import { getFormFields, fillFormPdf } from 'pdf-coordinate-mapper';

// Detect form fields
const fields = await getFormFields(pdfSource);
console.log(fields); // [{ name: 'firstName', type: 'text' }, ...]

// Fill the form
const filledPdf = await fillFormPdf(
  pdfSource,
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
);

// Download
const blob = new Blob([filledPdf.buffer], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
// ... create download link
```

## API Reference

### Components

#### `<PdfCoordinateMapper />`
Interactive component for mapping fields to PDF coordinates.

**Props:**
- `pdfSource` - PDF source (URL, base64, or ArrayBuffer)
- `fieldNames` - Array of field names to map
- `initialMappings` - Pre-existing mappings to load
- `onChange` - Callback when mappings change
- `onSave` - Callback when user saves template
- `templateName` - Optional template name
- `scale` - Render scale (default: 1.5)

### Functions

#### `fillPdf(pdfSource, mappings, data)`
Fill a PDF using coordinate mappings.

**Parameters:**
- `pdfSource` - The original PDF
- `mappings` - Array of `FieldMapping` objects
- `data` - Key-value pairs of data to fill

**Returns:** `Promise<Uint8Array>` - The filled PDF

#### `fillFormPdf(pdfSource, data, fieldMap?, flatten?)`
Fill a PDF's AcroForm fields.

**Parameters:**
- `pdfSource` - The original PDF
- `data` - Key-value pairs of data to fill
- `fieldMap` - Optional mapping of data keys to PDF field names
- `flatten` - Whether to flatten the form (default: true)

**Returns:** `Promise<Uint8Array>` - The filled PDF

#### `getFormFields(pdfSource)`
Detect AcroForm fields in a PDF.

**Parameters:**
- `pdfSource` - The PDF to inspect

**Returns:** `Promise<FormFieldInfo[]>` - Array of detected fields

#### `downloadFilledPdf(pdfSource, mappings, data, filename)`
Fill and download a PDF in one step.

**Parameters:**
- `pdfSource` - The original PDF
- `mappings` - Array of field mappings
- `data` - Data to fill
- `filename` - Output filename

## Types

```typescript
interface FieldMapping {
  fieldName: string;
  label?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'other';
  options?: string[];
}

interface MappingTemplate {
  id: string;
  name: string;
  pdfName: string;
  mappings: FieldMapping[];
  createdAt: string;
}
```

## Use Cases

### Coordinate Mapping (Use the main example)
- Invoices without form fields
- Certificates and awards
- Custom business documents
- Scanned forms
- Legacy PDFs

### Form Filling (Use the form-fill example)
- Government forms (tax forms, applications)
- HR documents
- Registration forms
- Any PDF with existing fillable fields

## Browser Support

- Modern browsers with ES2020+ support
- Requires `pdf-lib` and `react-pdf` dependencies

## License

MIT

## Contributing

Contributions are welcome! Please check the examples for implementation patterns.
