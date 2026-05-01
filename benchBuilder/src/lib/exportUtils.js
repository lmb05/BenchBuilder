import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────
export function exportToExcel(inputs, projection) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const lastRow = projection[projection.length - 1];
  const summaryData = [
    ["BenchBuilder — Workforce Analysis"],
    [],
    ["SUMMARY RESULTS"],
    ["Humans (Final Year)", lastRow.humans],
    ["Bots (Final Year)", lastRow.bots],
    ["Total Cost (Final Year)", lastRow.totalCost],
    ["vs All-Human Baseline", lastRow.delta],
    ["Final Bot Ratio", `${lastRow.botRatio}x`],
    [],
    ["INPUT PARAMETERS"],
    ["Current Headcount", inputs.currentHeadcount],
    ["Avg Annual Salary", inputs.avgSalary],
    ["Attrition Rate", `${inputs.attritionRate}%`],
    ["Backfill Rate", `${inputs.backfillRate}%`],
    ["Annual Growth Rate", `${inputs.growthRate}%`],
    ["Span of Control", `1:${inputs.spanOfControl}`],
    ["Starting Bot Ratio", `${inputs.startingBotRatio}x`],
    ["Target Bot Ratio", `${inputs.targetBotRatio}x`],
    ["Ramp Period", `${inputs.rampYears} yr`],
    ["Cost Per Bot / Year", inputs.costPerBot],
    ["Projection Horizon", `${inputs.projectionYears} yr`],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: Year-by-Year Table
  const tableHeaders = [
    "Year", "Humans", "Bots", "Bot:Human Ratio", "Managers",
    "Human Cost", "Bot Cost", "Total Cost", "All-Human Baseline", "vs Baseline"
  ];
  const tableRows = projection.map(row => [
    row.year,
    row.humans,
    row.bots,
    `${row.botRatio}x`,
    row.managers,
    row.humanCost,
    row.botCost,
    row.totalCost,
    row.baselineCost,
    row.delta,
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([tableHeaders, ...tableRows]);
  ws2["!cols"] = tableHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws2, "Year-by-Year");

  XLSX.writeFile(wb, "BenchBuilder-Analysis.xlsx");
}

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────
export function exportToPDF(inputs, projection) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lastRow = projection[projection.length - 1];
  const savings = lastRow.delta;
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(34, 211, 238);
  doc.text("BenchBuilder", 20, y);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("AI / Human Workforce Analysis", 20, y + 7);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, y, { align: "right" });
  y += 20;

  // Summary KPIs
  doc.setFontSize(11);
  doc.setTextColor(241, 245, 249);
  doc.text("Summary Results", 20, y);
  y += 6;
  doc.setDrawColor(30, 41, 59);
  doc.line(20, y, 190, y);
  y += 6;

  const kpis = [
    ["Humans (Final Year)", String(lastRow.humans)],
    ["Bots (Final Year)", String(lastRow.bots)],
    ["Total Cost (Final Year)", formatCurrency(lastRow.totalCost)],
    ["vs All-Human Baseline", `${savings < 0 ? "−" : "+"}${formatCurrency(Math.abs(savings))} ${savings < 0 ? "savings" : "premium"}`],
    ["Final Bot Ratio", `${lastRow.botRatio}x`],
  ];

  doc.setFontSize(9);
  kpis.forEach(([label, value]) => {
    doc.setTextColor(148, 163, 184);
    doc.text(label, 20, y);
    doc.setTextColor(241, 245, 249);
    doc.text(value, 130, y);
    y += 6;
  });
  y += 6;

  // Parameters
  doc.setFontSize(11);
  doc.setTextColor(241, 245, 249);
  doc.text("Input Parameters", 20, y);
  y += 6;
  doc.setDrawColor(30, 41, 59);
  doc.line(20, y, 190, y);
  y += 6;

  const params = [
    ["Current Headcount", String(inputs.currentHeadcount)],
    ["Avg Annual Salary", formatCurrency(inputs.avgSalary)],
    ["Attrition Rate", `${inputs.attritionRate}%`],
    ["Backfill Rate", `${inputs.backfillRate}%`],
    ["Annual Growth Rate", `${inputs.growthRate}%`],
    ["Span of Control", `1:${inputs.spanOfControl}`],
    ["Starting Bot Ratio", `${inputs.startingBotRatio}x`],
    ["Target Bot Ratio", `${inputs.targetBotRatio}x`],
    ["Ramp Period", `${inputs.rampYears} yr`],
    ["Cost Per Bot / Year", formatCurrency(inputs.costPerBot)],
    ["Projection Horizon", `${inputs.projectionYears} yr`],
  ];

  doc.setFontSize(9);
  params.forEach(([label, value]) => {
    doc.setTextColor(148, 163, 184);
    doc.text(label, 20, y);
    doc.setTextColor(241, 245, 249);
    doc.text(value, 130, y);
    y += 6;
  });
  y += 6;

  // Year-by-Year Table
  doc.setFontSize(11);
  doc.setTextColor(241, 245, 249);
  doc.text("Year-by-Year Projection", 20, y);
  y += 6;
  doc.line(20, y, 190, y);
  y += 6;

  const cols = ["Year", "Humans", "Bots", "Human Cost", "Bot Cost", "Total Cost", "vs Baseline"];
  const colX = [20, 45, 68, 91, 120, 148, 172];

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  cols.forEach((col, i) => doc.text(col, colX[i], y));
  y += 5;

  projection.forEach((row, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(idx === projection.length - 1 ? 34 : 241, idx === projection.length - 1 ? 211 : 245, idx === projection.length - 1 ? 238 : 249);
    doc.setFontSize(7.5);
    const rowData = [
      row.year,
      String(row.humans),
      String(row.bots),
      formatCurrency(row.humanCost),
      formatCurrency(row.botCost),
      formatCurrency(row.totalCost),
      `${row.delta < 0 ? "−" : "+"}${formatCurrency(Math.abs(row.delta))}`,
    ];
    rowData.forEach((val, i) => doc.text(val, colX[i], y));
    y += 5;
  });

  doc.save("BenchBuilder-Analysis.pdf");
}

// ─── IMAGE EXPORT ────────────────────────────────────────────────────────────
export async function exportToImage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Could not find the results panel to capture.");
    return;
  }
  const canvas = await html2canvas(element, {
    backgroundColor: "#0f172a",
    scale: 2,
    useCORS: true,
  });
  const link = document.createElement("a");
  link.download = "BenchBuilder-Analysis.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}