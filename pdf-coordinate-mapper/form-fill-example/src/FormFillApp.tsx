import { useCallback, useEffect, useRef, useState } from "react";
import {
  getFormFields,
  fillFormPdf,
  type FormFieldInfo,
} from "pdf-coordinate-mapper";

/**
 * A simple example that demonstrates filling an existing PDF
 * that contains form fields (AcroForm).
 * 
 * This example:
 * - Uploads an existing PDF
 * - Automatically detects form fields
 * - Lets users fill those fields
 * - Downloads the filled PDF
 */
export default function FormFillApp() {
  const [pdfSource, setPdfSource] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [formFields, setFormFields] = useState<FormFieldInfo[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [flattenOnDownload, setFlattenOnDownload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect form fields when PDF is loaded
  useEffect(() => {
    if (!pdfSource) {
      setFormFields([]);
      return;
    }
    
    getFormFields(pdfSource).then((fields: FormFieldInfo[]) => {
      setFormFields(fields);
      // Initialize form data with empty strings
      const initialData: Record<string, string> = {};
      fields.forEach((field: FormFieldInfo) => {
        initialData[field.name] = "";
      });
      setFormData(initialData);
    });
  }, [pdfSource]);

  // Handle PDF file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPdfSource(reader.result as ArrayBuffer);
      setPdfName(file.name);
      setPreviewUrl(null);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Handle form field value changes
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  // Preview the filled PDF
  const handlePreview = useCallback(async () => {
    if (!pdfSource) return;
    
    try {
      setError(null);
      const bytes = await fillFormPdf(pdfSource, formData, undefined, false);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to preview PDF. The PDF might have complex form fields.");
    }
  }, [pdfSource, formData, previewUrl]);

  // Download the filled PDF
  const handleDownload = useCallback(async () => {
    if (!pdfSource) return;
    
    try {
      setError(null);
      let bytes: Uint8Array;
      
      // Try with the user's flatten preference
      try {
        bytes = await fillFormPdf(pdfSource, formData, undefined, flattenOnDownload);
      } catch (flattenError) {
        // If flattening fails, try without flattening
        if (flattenOnDownload) {
          console.warn("Flattening failed, downloading without flattening:", flattenError);
          setError("Note: Downloaded PDF without flattening due to complex form structure.");
          bytes = await fillFormPdf(pdfSource, formData, undefined, false);
        } else {
          throw flattenError;
        }
      }
      
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName ? pdfName.replace(/\.pdf$/i, "-filled.pdf") : "filled.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (!error) {
        setError(null); // Clear any previous errors on success
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(`Failed to fill PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [pdfSource, formData, pdfName, flattenOnDownload, error]);

  // Upload screen (no PDF loaded)
  if (!pdfSource) {
    return (
      <div style={styles.uploadContainer}>
        <h1 style={styles.title}>PDF Form Filler</h1>
        <p style={styles.description}>
          Upload a PDF with fillable form fields to get started.
          <br />
          This example automatically detects and fills AcroForm fields.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file?.type === "application/pdf") {
              const reader = new FileReader();
              reader.onload = () => {
                setPdfSource(reader.result as ArrayBuffer);
                setPdfName(file.name);
              };
              reader.readAsArrayBuffer(file);
            }
          }}
          style={styles.dropzone}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#2563eb";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#d1d5db";
          }}
        >
          <div style={styles.dropzoneIcon}>📄</div>
          <div style={styles.dropzoneText}>
            Click to browse or drag & drop a PDF file here
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>
    );
  }

  // Main form fill screen
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>PDF Form Filler</h1>
          <p style={styles.headerSubtitle}>{pdfName}</p>
        </div>
        <button
          onClick={() => {
            setPdfSource(null);
            setPdfName("");
            setFormFields([]);
            setFormData({});
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          style={styles.secondaryButton}
        >
          Load Different PDF
        </button>
      </div>

      {formFields.length === 0 ? (
        <div style={styles.noFieldsContainer}>
          <p style={styles.noFieldsText}>
            ⚠️ This PDF does not contain any fillable form fields.
          </p>
          <p style={styles.noFieldsSubtext}>
            Try a different PDF with AcroForm fields, or use the coordinate mapper example
            to add fields to any PDF.
          </p>
        </div>
      ) : (
        <div style={styles.mainContent}>
          <div style={styles.formPanel}>
            <h2 style={styles.sectionTitle}>
              Form Fields ({formFields.length})
            </h2>
            
            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}
            
            <div style={styles.formGrid}>
              {formFields.map((field) => (
                <div key={field.name} style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>
                    {field.name}
                    <span style={styles.fieldType}> [{field.type}]</span>
                  </label>
                  
                  {field.type === "text" && (
                    <input
                      type="text"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      style={styles.input}
                      placeholder={`Enter ${field.name}...`}
                    />
                  )}
                  
                  {field.type === "checkbox" && (
                    <input
                      type="checkbox"
                      checked={formData[field.name] === "true"}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.checked ? "true" : "false")
                      }
                      style={styles.checkbox}
                    />
                  )}
                  
                  {field.type === "dropdown" && field.options && (
                    <select
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      style={styles.select}
                    >
                      <option value="">-- Select --</option>
                      {field.options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {field.type === "radio" && field.options && (
                    <div style={styles.radioGroup}>
                      {field.options.map((opt: string) => (
                        <label key={opt} style={styles.radioLabel}>
                          <input
                            type="radio"
                            name={field.name}
                            value={opt}
                            checked={formData[field.name] === opt}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            style={styles.radio}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.optionsContainer}>
              <label style={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={flattenOnDownload}
                  onChange={(e) => setFlattenOnDownload(e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.optionText}>
                  Flatten PDF (make fields non-editable)
                  <span style={styles.optionHint}>
                    {" "}(Note: Some PDFs may not support flattening)
                  </span>
                </span>
              </label>
            </div>

            <div style={styles.actions}>
              <button onClick={handlePreview} style={styles.secondaryButton}>
                Preview
              </button>
              <button onClick={handleDownload} style={styles.primaryButton}>
                Download Filled PDF
              </button>
            </div>
          </div>

          {previewUrl && (
            <div style={styles.previewPanel}>
              <h2 style={styles.sectionTitle}>Preview</h2>
              <iframe
                src={previewUrl}
                style={styles.previewIframe}
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  uploadContainer: {
    maxWidth: 600,
    margin: "80px auto",
    padding: "0 16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    textAlign: "center" as const,
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    color: "#1f2937",
  },
  description: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 1.6,
  },
  dropzone: {
    border: "2px dashed #d1d5db",
    borderRadius: 12,
    padding: "64px 24px",
    cursor: "pointer",
    transition: "border-color 0.2s",
    backgroundColor: "#f9fafb",
  },
  dropzoneIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  dropzoneText: {
    fontSize: 14,
    color: "#6b7280",
  },
  container: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: 1400,
    margin: "0 auto",
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: "1px solid #e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    margin: 0,
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  formPanel: {
    backgroundColor: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    margin: "0 0 16px 0",
    color: "#1f2937",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    marginBottom: 24,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  },
  fieldType: {
    fontSize: 12,
    fontWeight: 400,
    color: "#9ca3af",
  },
  input: {
    padding: 8,
    fontSize: 14,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    outline: "none",
    transition: "border-color 0.15s",
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },
  select: {
    padding: 8,
    fontSize: 14,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    outline: "none",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
  },
  radio: {
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },
  primaryButton: {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  secondaryButton: {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background-color 0.15s, border-color 0.15s",
  },
  previewPanel: {
    backgroundColor: "#fff",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    padding: 24,
  },
  previewIframe: {
    width: "100%",
    height: 800,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
  },
  noFieldsContainer: {
    textAlign: "center" as const,
    padding: "64px 24px",
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    border: "1px solid #fde68a",
  },
  noFieldsText: {
    fontSize: 16,
    color: "#92400e",
    margin: "0 0 8px 0",
  },
  noFieldsSubtext: {
    fontSize: 14,
    color: "#a16207",
    margin: 0,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 1.5,
  },
  optionsContainer: {
    marginBottom: 16,
    paddingTop: 8,
    borderTop: "1px solid #e5e7eb",
    paddingBottom: 8,
  },
  optionLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
  },
  optionText: {
    display: "flex",
    flexDirection: "column" as const,
  },
  optionHint: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: 400,
  },
};
