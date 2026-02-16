# Form Fill Example

A simple example demonstrating how to fill existing PDFs that have fillable form fields (AcroForm).

## What This Example Does

- **Upload an existing PDF** with fillable fields
- **Automatically detect** all form fields in the PDF
- **Fill the fields** with custom data
- **Preview** the filled PDF
- **Download** the filled PDF

## Key Difference from Main Example

This example focuses **only** on form fill functionality:
- Uses existing PDFs with fillable fields
- No coordinate mapping needed
- Simpler, streamlined UI
- Perfect for standard form-filling workflows

The main example (`../example`) includes both coordinate mapping and form filling.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

3. Open your browser to the provided URL

4. Upload a PDF with fillable form fields

## Usage

### Upload a PDF
Click the upload area or drag and drop a PDF file that contains fillable form fields.

### Fill the Form
Once uploaded, the example will automatically detect all form fields and display them. Supported field types:
- **Text fields**: Enter text data
- **Checkboxes**: Check or uncheck
- **Dropdowns**: Select from available options
- **Radio buttons**: Choose one option

### Preview & Download
- Click **Preview** to see the filled PDF
- Click **Download Filled PDF** to save the result

## Testing with Sample PDFs

Many government forms and business documents come with fillable PDF fields. You can test with:
- Tax forms (W-9, 1040, etc.)
- Job applications
- Event registration forms
- Any PDF created with form fields

## API Used

This example uses the `fillFormPdf` function from `pdf-coordinate-mapper`:

```typescript
import { getFormFields, fillFormPdf } from "pdf-coordinate-mapper";

// Detect fields
const fields = await getFormFields(pdfArrayBuffer);

// Fill the PDF
const filledPdf = await fillFormPdf(
  pdfArrayBuffer,
  { fieldName: "value" }
);
```

## Notes

- If a PDF doesn't have form fields, you'll see a warning message
- For PDFs without form fields, use the coordinate mapping example instead
- The filled PDF can optionally be flattened (non-editable) by default
