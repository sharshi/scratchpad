import { useCallback, useRef, useState } from "react";
import {
  PdfCoordinateMapper,
  downloadFilledPdf,
  fillPdf,
  type FieldMapping,
  type MappingTemplate,
  type ModelData,
} from "pdf-coordinate-mapper";
import { createSamplePdf } from "./createSamplePdf";

// Default field names for a fresh session
const DEFAULT_FIELDS = [
  "field1",
  "field2",
  "field3",
  "field4",
  "field5",
];

export default function App() {
  const [pdfSource, setPdfSource] = useState<string | ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [fieldNames, setFieldNames] = useState<string[]>(DEFAULT_FIELDS);
  const [newFieldName, setNewFieldName] = useState("");
  const [savedTemplate, setSavedTemplate] = useState<Omit<MappingTemplate, "id"> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mapper" | "fill">("mapper");
  const [fillData, setFillData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- PDF loading ---- */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPdfSource(reader.result as ArrayBuffer);
      setPdfName(file.name);
      setMappings([]);
      setPreviewUrl(null);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleLoadSample = useCallback(async () => {
    const dataUri = await createSamplePdf();
    setPdfSource(dataUri);
    setPdfName("sample-invoice.pdf");
    setMappings([]);
    setPreviewUrl(null);
    setFieldNames([
      "invoiceNumber", "invoiceDate", "dueDate",
      "clientName", "clientCompany", "clientAddress", "clientEmail",
      "item1Description", "item1Qty", "item1Price", "item1Amount",
      "subtotal", "tax", "total", "notes",
    ]);
    setFillData({
      invoiceNumber: "INV-2026-0042",
      invoiceDate: "2026-02-16",
      dueDate: "2026-03-16",
      clientName: "Jane Smith",
      clientCompany: "Widget Co.",
      clientAddress: "123 Main St, Springfield",
      clientEmail: "jane@widgetco.com",
      item1Description: "Consulting Services",
      item1Qty: "10",
      item1Price: "$150.00",
      item1Amount: "$1,500.00",
      subtotal: "$1,500.00",
      tax: "$120.00",
      total: "$1,620.00",
      notes: "Payment due within 30 days.",
    });
  }, []);

  /* ---- Field management ---- */
  const handleAddField = useCallback(() => {
    const name = newFieldName.trim();
    if (!name || fieldNames.includes(name)) return;
    setFieldNames((prev) => [...prev, name]);
    setNewFieldName("");
  }, [newFieldName, fieldNames]);

  const handleRemoveField = useCallback((name: string) => {
    setFieldNames((prev) => prev.filter((f) => f !== name));
    setMappings((prev) => prev.filter((m) => m.fieldName !== name));
    setFillData((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /* ---- Template save ---- */
  const handleSave = useCallback((template: Omit<MappingTemplate, "id">) => {
    setSavedTemplate(template);
    console.log("Template saved:", JSON.stringify(template, null, 2));
    alert(`Template "${template.name}" saved with ${template.mappings.length} mappings.\nCheck console for the full JSON.`);
  }, []);

  /* ---- Fill value changes ---- */
  const handleFillValueChange = useCallback((field: string, value: string) => {
    setFillData((prev) => ({ ...prev, [field]: value }));
  }, []);

  /* ---- Fill and preview ---- */
  const handlePreview = useCallback(async () => {
    if (!pdfSource) return;
    const data: ModelData = fillData;
    const bytes = await fillPdf(pdfSource, mappings, data);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  }, [pdfSource, mappings, fillData, previewUrl]);

  /* ---- Fill and download ---- */
  const handleDownload = useCallback(async () => {
    if (!pdfSource) return;
    const data: ModelData = fillData;
    const outName = pdfName ? pdfName.replace(/\.pdf$/i, "-filled.pdf") : "filled.pdf";
    await downloadFilledPdf(pdfSource, mappings, data, outName);
  }, [pdfSource, mappings, fillData, pdfName]);

  /* ---- Upload screen (no PDF loaded yet) ---- */
  if (!pdfSource) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 16px", fontFamily: "sans-serif", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>pdf-coordinate-mapper</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
          Upload a PDF to start mapping fields onto it, or try with a sample invoice.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file?.type === "application/pdf") {
              const reader = new FileReader();
              reader.onload = () => {
                setPdfSource(reader.result as ArrayBuffer);
                setPdfName(file.name);
                setMappings([]);
              };
              reader.readAsArrayBuffer(file);
            }
          }}
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 8,
            padding: "48px 24px",
            cursor: "pointer",
            marginBottom: 24,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2563eb"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#d1d5db"; }}
        >
          <div style={{ fontSize: 36, marginBottom: 12, color: "#9ca3af" }}>PDF</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Click to browse or drag &amp; drop a PDF file here
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>or</div>

        <button
          onClick={handleLoadSample}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try with Sample Invoice
        </button>
      </div>
    );
  }

  /* ---- Main app (PDF loaded) ---- */
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>pdf-coordinate-mapper</h1>
        <span style={{
          fontSize: 12,
          background: "#f3f4f6",
          padding: "2px 8px",
          borderRadius: 4,
          color: "#6b7280",
        }}>
          {pdfName}
        </span>
        <button
          onClick={() => {
            setPdfSource(null);
            setPdfName("");
            setMappings([]);
            setPreviewUrl(null);
          }}
          style={{
            marginLeft: "auto",
            padding: "4px 12px",
            fontSize: 13,
            background: "none",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          Change PDF
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4, marginBottom: 16 }}>
        Drag markers to reposition them. Click the PDF to place new ones.
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #e5e7eb" }}>
        {(["mapper", "fill"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
              background: "none",
              color: activeTab === tab ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              marginBottom: -2,
            }}
          >
            {tab === "mapper" ? "1. Map Fields" : "2. Fill & Download"}
          </button>
        ))}
      </div>

      {/* ---------- Mapper Tab ---------- */}
      {activeTab === "mapper" && (
        <div>
          {/* Field management */}
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Fields</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {fieldNames.map((f) => (
                <span
                  key={f}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    fontSize: 12,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                  }}
                >
                  {f}
                  <button
                    onClick={() => handleRemoveField(f)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: 0,
                    }}
                    title="Remove field"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddField(); }}
                placeholder="Add field name..."
                style={{ padding: "4px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, flex: 1 }}
              />
              <button
                onClick={handleAddField}
                disabled={!newFieldName.trim() || fieldNames.includes(newFieldName.trim())}
                style={{
                  padding: "4px 12px",
                  fontSize: 13,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  opacity: !newFieldName.trim() || fieldNames.includes(newFieldName.trim()) ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 12px" }}>
            Select a field from the dropdown, then click on the PDF to place it. Drag markers to reposition.
          </p>

          <PdfCoordinateMapper
            pdfSource={pdfSource}
            fieldNames={fieldNames}
            initialMappings={mappings}
            onChange={setMappings}
            onSave={handleSave}
            templateName={pdfName.replace(/\.pdf$/i, "") || "Template"}
            scale={1.3}
          />
        </div>
      )}

      {/* ---------- Fill & Download Tab ---------- */}
      {activeTab === "fill" && (
        <div>
          {mappings.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              No mappings yet. Go to the "Map Fields" tab and place some fields on the PDF first.
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 16, marginBottom: 8 }}>Fill Values</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 12px" }}>
                Enter the values for each mapped field, then preview or download.
              </p>
              <table
                style={{
                  borderCollapse: "collapse",
                  fontSize: 13,
                  width: "100%",
                  marginBottom: 16,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #d1d5db", textAlign: "left" }}>
                    <th style={{ padding: "4px 8px", width: "40%" }}>Field</th>
                    <th style={{ padding: "4px 8px" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(mappings.map((m) => m.fieldName))].map((field) => (
                    <tr key={field} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "#4b5563" }}>
                        {field}
                      </td>
                      <td style={{ padding: "4px 8px" }}>
                        <input
                          value={fillData[field] ?? ""}
                          onChange={(e) => handleFillValueChange(field, e.target.value)}
                          placeholder={`Enter ${field}...`}
                          style={{
                            width: "100%",
                            padding: "4px 8px",
                            fontSize: 13,
                            border: "1px solid #e5e7eb",
                            borderRadius: 4,
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={handlePreview}
                  style={{
                    padding: "8px 20px",
                    fontSize: 14,
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Preview Filled PDF
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: "8px 20px",
                    fontSize: 14,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Download Filled PDF
                </button>
              </div>

              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                Active mappings: {mappings.length} | Template saved:{" "}
                {savedTemplate ? `"${savedTemplate.name}"` : "No"}
              </p>

              {previewUrl && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 8 }}>Preview</h3>
                  <iframe
                    src={previewUrl}
                    title="Filled PDF Preview"
                    style={{ width: "100%", height: 600, border: "1px solid #e5e7eb", borderRadius: 4 }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
