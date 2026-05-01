import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ExportButtons from "./components/ExportButtons";

const defaultInputs = {
  currentHeadcount: 200,
  avgSalary: 95000,
  attritionRate: 12,
  backfillRate: 80,
  growthRate: 5,
  startingBotRatio: 0.25,
  targetBotRatio: 2.0,
  rampYears: 4,
  costPerBot: 2500,
  spanOfControl: 8,
  projectionYears: 5,
};

function formatCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n) {
  return Math.round(n).toLocaleString();
}

function SliderInput({ label, name, value, min, max, step, onChange, format, hint }) {
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
        <label style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8" }}>{label}</label>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>{format(value)}</span>
      </div>
      {hint && <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.4rem" }}>{hint}</div>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(name, parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#22d3ee", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#475569", marginTop: "0.15rem" }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function computeProjection(inputs) {
  const {
    currentHeadcount, avgSalary, attritionRate, backfillRate,
    growthRate, startingBotRatio, targetBotRatio, rampYears,
    costPerBot, spanOfControl, projectionYears,
  } = inputs;

  const rows = [];
  let humans = currentHeadcount;

  for (let year = 0; year <= projectionYears; year++) {
    const t = year === 0 ? 0 : Math.min(year / rampYears, 1);
    const botRatio = startingBotRatio + (targetBotRatio - startingBotRatio) * t;

    if (year > 0) {
      const attrited = humans * (attritionRate / 100);
      const backfilled = attrited * (backfillRate / 100);
      const grown = humans * (growthRate / 100);
      humans = humans - attrited + backfilled + grown;
    }

    const bots = humans * botRatio;
    const managers = humans / spanOfControl;
    const humanCost = humans * avgSalary;
    const botCost = bots * costPerBot;
    const totalCost = humanCost + botCost;
    const baselineCost = (year === 0 ? currentHeadcount : rows[0].humans) *
      Math.pow(1 + growthRate / 100, year) * avgSalary;
    const delta = totalCost - baselineCost;
    const deltaPercent = ((delta / baselineCost) * 100).toFixed(1);

    rows.push({
      year: year === 0 ? "Now" : `Yr ${year}`,
      humans: Math.round(humans),
      bots: Math.round(bots),
      managers: Math.round(managers),
      botRatio: botRatio.toFixed(2),
      humanCost,
      botCost,
      totalCost,
      baselineCost,
      delta,
      deltaPercent,
    });
  }
  return rows;
}

const CHART_COLORS = { humanCost: "#38bdf8", botCost: "#a78bfa", totalCost: "#22d3ee", baselineCost: "#f87171" };

export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [activeTab, setActiveTab] = useState("inputs");

  const handleChange = (name, value) => setInputs(prev => ({ ...prev, [name]: value }));

  const projection = useMemo(() => computeProjection(inputs), [inputs]);

  const chartData = projection.map(r => ({
    year: r.year,
    "Human Cost": Math.round(r.humanCost),
    "Bot Cost": Math.round(r.botCost),
    "Total Cost": Math.round(r.totalCost),
    "All-Human Baseline": Math.round(r.baselineCost),
  }));

  const savings = projection[projection.length - 1].delta;
  const savingsPct = projection[projection.length - 1].deltaPercent;
  const finalBotRatio = parseFloat(projection[projection.length - 1].botRatio);

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #0c1a2e 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f1f5f9",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #1e293b; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #22d3ee; cursor: pointer; border: 2px solid #0f172a; box-shadow: 0 0 8px rgba(34,211,238,0.5); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #22d3ee44; border-radius: 2px; }
        table { border-collapse: collapse; width: 100%; }
        th { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; padding: 0.6rem 0.8rem; text-align: right; border-bottom: 1px solid #1e293b; }
        th:first-child { text-align: left; }
        td { font-family: 'DM Mono', monospace; font-size: 0.78rem; padding: 0.65rem 0.8rem; text-align: right; border-bottom: 1px solid #0f172a; color: #cbd5e1; transition: background 0.15s; }
        td:first-child { text-align: left; font-weight: 700; color: #f1f5f9; }
        tr:hover td { background: rgba(34,211,238,0.04); }
        tr.highlight td { background: rgba(34,211,238,0.08); }
        .tab { background: none; border: none; cursor: pointer; padding: 0.5rem 1.2rem; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #475569; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab.active { color: #22d3ee; border-bottom-color: #22d3ee; }
        .tab:hover { color: #94a3b8; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            BENCH<span style={{ color: "#22d3ee" }}>BUILDER</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "0.2rem" }}>AI / Human Workforce Calculator</div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "Final Bot Ratio", value: `${finalBotRatio}x`, color: "#a78bfa" },
            { label: `Yr ${inputs.projectionYears} vs Baseline`, value: `${savings < 0 ? "" : "+"}${savingsPct}%`, color: savings < 0 ? "#4ade80" : "#f87171" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0, minHeight: "calc(100vh - 80px)" }}>

        {/* Left Panel — Inputs */}
        <div style={{ borderRight: "1px solid #1e293b", padding: "1.5rem", overflowY: "auto", background: "rgba(15,23,42,0.6)" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#22d3ee", marginBottom: "1.2rem", fontWeight: 700 }}>Parameters</div>

          <div style={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.8rem", paddingBottom: "0.4rem", borderBottom: "1px solid #1e293b" }}>Workforce</div>
          <SliderInput label="Current Headcount" name="currentHeadcount" value={inputs.currentHeadcount} min={10} max={2000} step={10} onChange={handleChange} format={v => formatNumber(v)} />
          <SliderInput label="Avg Annual Salary" name="avgSalary" value={inputs.avgSalary} min={30000} max={300000} step={5000} onChange={handleChange} format={v => formatCurrency(v)} />
          <SliderInput label="Attrition Rate" name="attritionRate" value={inputs.attritionRate} min={0} max={40} step={0.5} onChange={handleChange} format={v => `${v}%`} hint="Annual voluntary + involuntary turnover" />
          <SliderInput label="Backfill Rate" name="backfillRate" value={inputs.backfillRate} min={0} max={100} step={5} onChange={handleChange} format={v => `${v}%`} hint="% of attrited roles replaced by humans" />
          <SliderInput label="Annual Growth Rate" name="growthRate" value={inputs.growthRate} min={-10} max={30} step={0.5} onChange={handleChange} format={v => `${v > 0 ? "+" : ""}${v}%`} />
          <SliderInput label="Span of Control" name="spanOfControl" value={inputs.spanOfControl} min={3} max={20} step={1} onChange={handleChange} format={v => `1:${v}`} hint="Direct reports per manager" />

          <div style={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", margin: "1rem 0 0.8rem", paddingBottom: "0.4rem", borderBottom: "1px solid #1e293b" }}>AI Agents</div>
          <SliderInput label="Starting Bot Ratio" name="startingBotRatio" value={inputs.startingBotRatio} min={0} max={2} step={0.05} onChange={handleChange} format={v => `${v.toFixed(2)}x`} hint="Bots per human today" />
          <SliderInput label="Target Bot Ratio" name="targetBotRatio" value={inputs.targetBotRatio} min={0} max={10} step={0.25} onChange={handleChange} format={v => `${v.toFixed(2)}x`} hint="Bots per human at full ramp" />
          <SliderInput label="Ramp Period" name="rampYears" value={inputs.rampYears} min={1} max={10} step={1} onChange={handleChange} format={v => `${v} yr`} hint="Years to reach target bot ratio" />
          <SliderInput label="Cost Per Bot / Year" name="costPerBot" value={inputs.costPerBot} min={500} max={10000} step={250} onChange={handleChange} format={v => formatCurrency(v)} hint="Fully-loaded autonomous agent cost" />

          <div style={{ fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", margin: "1rem 0 0.8rem", paddingBottom: "0.4rem", borderBottom: "1px solid #1e293b" }}>Projection</div>
          <SliderInput label="Projection Horizon" name="projectionYears" value={inputs.projectionYears} min={1} max={10} step={1} onChange={handleChange} format={v => `${v} yr`} />
        </div>

        {/* Right Panel — Outputs */}
        <div id="results-panel" style={{ padding: "1.5rem", overflowY: "auto" }}>
        <ExportButtons inputs={inputs} projection={projection} />
          {/* KPI Strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Humans (final yr)", value: formatNumber(projection[projection.length - 1].humans), color: "#38bdf8" },
              { label: "Bots (final yr)", value: formatNumber(projection[projection.length - 1].bots), color: "#a78bfa" },
              { label: "Total Cost (final yr)", value: formatCurrency(projection[projection.length - 1].totalCost), color: "#22d3ee" },
              { label: "vs All-Human Baseline", value: `${savings < 0 ? "" : "+"}${formatCurrency(Math.abs(savings))}`, color: savings < 0 ? "#4ade80" : "#f87171", sub: savings < 0 ? "savings" : "premium" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #1e293b", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>{k.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.25rem", fontWeight: 700, color: k.color }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: "0.65rem", color: k.color, opacity: 0.7, marginTop: "0.2rem" }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid #1e293b", marginBottom: "1.2rem" }}>
            <button className={`tab ${activeTab === "chart" ? "active" : ""}`} onClick={() => setActiveTab("chart")}>Cost Trends</button>
            <button className={`tab ${activeTab === "table" ? "active" : ""}`} onClick={() => setActiveTab("table")}>Year-by-Year Table</button>
          </div>

          {activeTab === "chart" && (
            <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid #1e293b", borderRadius: "8px", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.72rem", color: "#22d3ee", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", fontWeight: 700 }}>Workforce Cost Over Time</div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" tick={{ fill: "#475569", fontSize: 11, fontFamily: "DM Mono" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                  <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fill: "#475569", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #22d3ee44", borderRadius: "6px", fontFamily: "DM Mono", fontSize: "0.75rem" }}
                    labelStyle={{ color: "#22d3ee", fontWeight: 700 }}
                    formatter={(value) => [formatCurrency(value)]}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.72rem", fontFamily: "DM Mono", paddingTop: "1rem" }} />
                  <Line type="monotone" dataKey="Human Cost" stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 3 }} />
                  <Line type="monotone" dataKey="Bot Cost" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} />
                  <Line type="monotone" dataKey="Total Cost" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: "#22d3ee", r: 4 }} />
                  <Line type="monotone" dataKey="All-Human Baseline" stroke="#f87171" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: "1rem", fontSize: "0.72rem", color: "#475569", borderTop: "1px solid #1e293b", paddingTop: "0.8rem" }}>
                Red dashed line = all-human baseline (what you'd spend with no bots, same growth). When Total Cost dips below it, bots are paying off.
              </div>
            </div>
          )}

          {activeTab === "table" && (
            <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid #1e293b", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Year</th>
                      <th>Humans</th>
                      <th>Bots</th>
                      <th>Bot:Human</th>
                      <th>Managers</th>
                      <th>Human Cost</th>
                      <th>Bot Cost</th>
                      <th>Total Cost</th>
                      <th>vs Baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map((row, i) => (
                      <tr key={i} className={i === projection.length - 1 ? "highlight" : ""}>
                        <td>{row.year}</td>
                        <td>{formatNumber(row.humans)}</td>
                        <td style={{ color: "#a78bfa" }}>{formatNumber(row.bots)}</td>
                        <td style={{ color: "#a78bfa" }}>{row.botRatio}x</td>
                        <td>{formatNumber(row.managers)}</td>
                        <td style={{ color: "#38bdf8" }}>{formatCurrency(row.humanCost)}</td>
                        <td style={{ color: "#a78bfa" }}>{formatCurrency(row.botCost)}</td>
                        <td style={{ color: "#22d3ee", fontWeight: 700 }}>{formatCurrency(row.totalCost)}</td>
                        <td style={{ color: row.delta < 0 ? "#4ade80" : "#f87171" }}>
                          {row.delta < 0 ? "−" : "+"}{formatCurrency(Math.abs(row.delta))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "0.8rem 1rem", fontSize: "0.7rem", color: "#475569", borderTop: "1px solid #1e293b" }}>
                vs Baseline = difference from an all-human workforce at same growth rate. Green = savings. Red = bots cost more than replacing with humans at this ratio.
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#22d3ee" }}>Want a guided workforce analysis?</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>BenchBuilder helps mid-size companies model AI/human tradeoffs with expert I-O psychology insight.</div>
            </div>
            <button style={{ background: "#22d3ee", color: "#020617", border: "none", borderRadius: "6px", padding: "0.6rem 1.2rem", fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "1rem" }}>
              Book a Consult →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
