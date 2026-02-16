import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { FieldMapping, MappingTemplate } from "./types";

// Tell react-pdf where to find the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface PdfCoordinateMapperProps {
  /** PDF source – URL string, base64 data-uri, or ArrayBuffer */
  pdfSource: string | ArrayBuffer;
  /** Pre-existing mappings to render (e.g. when editing a saved template) */
  initialMappings?: FieldMapping[];
  /** Model field names the user can pick from */
  fieldNames: string[];
  /** Called whenever the mapping list changes */
  onChange?: (mappings: FieldMapping[]) => void;
  /** Called when the user clicks "Save" */
  onSave?: (template: Omit<MappingTemplate, "id">) => void;
  /** Optional template name shown in the header */
  templateName?: string;
  /** Scale factor for rendering – default 1.5 */
  scale?: number;
  /** Extra class name for the outermost wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Marker                                                             */
/* ------------------------------------------------------------------ */

interface MarkerProps {
  mapping: FieldMapping;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function Marker({ mapping, scale, selected, onSelect, onRemove }: MarkerProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: mapping.x * scale,
        top: mapping.y * scale,
        width: (mapping.width ?? 120) * scale,
        height: (mapping.height ?? 20) * scale,
        border: selected ? "2px solid #2563eb" : "2px dashed #6b7280",
        backgroundColor: selected
          ? "rgba(37,99,235,0.15)"
          : "rgba(107,114,128,0.10)",
        borderRadius: 3,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11 * scale,
        color: selected ? "#1e40af" : "#374151",
        fontFamily: "sans-serif",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }}>
        {mapping.label || mapping.fieldName}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          position: "absolute",
          top: -8 * scale,
          right: -8 * scale,
          width: 16 * scale,
          height: 16 * scale,
          borderRadius: "50%",
          border: "none",
          background: "#ef4444",
          color: "#fff",
          fontSize: 10 * scale,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
        title="Remove mapping"
      >
        ×
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PdfCoordinateMapper({
  pdfSource,
  initialMappings = [],
  fieldNames,
  onChange,
  onSave,
  templateName = "Untitled Template",
  scale = 1.5,
  className,
}: PdfCoordinateMapperProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<string>(fieldNames[0] ?? "");
  const pageRef = useRef<HTMLDivElement>(null);

  // Propagate changes upward
  useEffect(() => {
    onChange?.(mappings);
  }, [mappings, onChange]);

  const handleDocumentLoad = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  /* ---- click on the page to place a new marker ---- */
  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pageRef.current || !activeField) return;
      const rect = pageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newMapping: FieldMapping = {
        fieldName: activeField,
        page: currentPage,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        width: 120,
        height: 20,
      };

      setMappings((prev) => {
        const next = [...prev, newMapping];
        return next;
      });
      setSelectedIdx(mappings.length); // select the new one
    },
    [activeField, currentPage, scale, mappings.length],
  );

  const removeMapping = useCallback((idx: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({
      name: templateName,
      pdfSource,
      mappings,
    });
  }, [onSave, templateName, pdfSource, mappings]);

  /* ---- filter mappings for the current page ---- */
  const pageMappings = mappings
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.page === currentPage);

  /* ---- unused fields helper ---- */
  const usedFields = new Set(mappings.map((m) => m.fieldName));
  const unusedFields = fieldNames.filter((f) => !usedFields.has(f));

  return (
    <div className={className} style={{ fontFamily: "sans-serif" }}>
      {/* ---- Toolbar ---- */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          padding: "8px 0",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 13 }}>
          Field:&nbsp;
          <select
            value={activeField}
            onChange={(e) => setActiveField(e.target.value)}
            style={{ padding: "4px 8px", fontSize: 13 }}
          >
            {fieldNames.map((f) => (
              <option key={f} value={f}>
                {f} {usedFields.has(f) ? "✓" : ""}
              </option>
            ))}
          </select>
        </label>

        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Page {currentPage} / {numPages}
        </span>

        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          style={{ padding: "4px 10px", fontSize: 13 }}
        >
          ← Prev
        </button>
        <button
          disabled={currentPage >= numPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          style={{ padding: "4px 10px", fontSize: 13 }}
        >
          Next →
        </button>

        {onSave && (
          <button
            onClick={handleSave}
            style={{
              marginLeft: "auto",
              padding: "6px 16px",
              fontSize: 13,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Save Template
          </button>
        )}
      </div>

      {/* ---- Unmapped fields hint ---- */}
      {unusedFields.length > 0 && (
        <div style={{ fontSize: 12, color: "#9ca3af", padding: "0 0 6px" }}>
          Unmapped: {unusedFields.join(", ")}
        </div>
      )}

      {/* ---- PDF + overlays ---- */}
      <div style={{ position: "relative", display: "inline-block", border: "1px solid #e5e7eb" }}>
        <div ref={pageRef} onClick={handlePageClick} style={{ position: "relative", cursor: "crosshair" }}>
          <Document file={pdfSource} onLoadSuccess={handleDocumentLoad}>
            <Page pageNumber={currentPage} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>

          {/* markers */}
          {pageMappings.map(({ m, idx }) => (
            <Marker
              key={idx}
              mapping={m}
              scale={scale}
              selected={selectedIdx === idx}
              onSelect={() => setSelectedIdx(idx)}
              onRemove={() => removeMapping(idx)}
            />
          ))}
        </div>
      </div>

      {/* ---- Mapping table ---- */}
      {mappings.length > 0 && (
        <table
          style={{
            marginTop: 12,
            borderCollapse: "collapse",
            fontSize: 13,
            width: "100%",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #d1d5db" }}>
              <th style={{ padding: "4px 8px" }}>Field</th>
              <th style={{ padding: "4px 8px" }}>Page</th>
              <th style={{ padding: "4px 8px" }}>X</th>
              <th style={{ padding: "4px 8px" }}>Y</th>
              <th style={{ padding: "4px 8px" }}>W</th>
              <th style={{ padding: "4px 8px" }}>H</th>
              <th style={{ padding: "4px 8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, idx) => (
              <tr
                key={idx}
                style={{
                  background: selectedIdx === idx ? "#eff6ff" : "transparent",
                  cursor: "pointer",
                  borderBottom: "1px solid #f3f4f6",
                }}
                onClick={() => {
                  setSelectedIdx(idx);
                  setCurrentPage(m.page);
                }}
              >
                <td style={{ padding: "4px 8px" }}>{m.fieldName}</td>
                <td style={{ padding: "4px 8px" }}>{m.page}</td>
                <td style={{ padding: "4px 8px" }}>{m.x}</td>
                <td style={{ padding: "4px 8px" }}>{m.y}</td>
                <td style={{ padding: "4px 8px" }}>{m.width ?? "-"}</td>
                <td style={{ padding: "4px 8px" }}>{m.height ?? "-"}</td>
                <td style={{ padding: "4px 8px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMapping(idx);
                    }}
                    style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
