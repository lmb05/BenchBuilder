import { useState } from "react";
import { exportToExcel, exportToPDF, exportToImage } from "../lib/exportUtils";

export default function ExportButtons({ inputs, projection }) {
  const [loading, setLoading] = useState(null);

  const handleExport = async (type) => {
    setLoading(type);
    try {
      if (type === "excel") exportToExcel(inputs, projection);
      if (type === "pdf") exportToPDF(inputs, projection);
      if (type === "image") await exportToImage("results-panel");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    }
    setLoading(null);
  };

  const btnStyle = (color) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: `1px solid ${color}44`,
    background: `${color}11`,
    color: color,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: "0.78rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  });

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: "0.7rem", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>Export</span>

      <button style={btnStyle("#4ade80")} onClick={() => handleExport("excel")} disabled={loading === "excel"}>
        {loading === "excel" ? "Exporting..." : "⬇ Excel"}
      </button>

      <button style={btnStyle("#f87171")} onClick={() => handleExport("pdf")} disabled={loading === "pdf"}>
        {loading === "pdf" ? "Exporting..." : "⬇ PDF"}
      </button>

      <button style={btnStyle("#a78bfa")} onClick={() => handleExport("image")} disabled={loading === "image"}>
        {loading === "image" ? "Capturing..." : "⬇ Image"}
      </button>
    </div>
  );
}