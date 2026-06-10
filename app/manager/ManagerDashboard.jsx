
import { useState, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";

const COLORS = {
  new: "#5DCAA5",
  contacted: "#378ADD",
  qualified: "#7F77DD",
  overdue: "#E24B4A",
};

const statusData = [
  { name: "New", value: 32, color: COLORS.new },
  { name: "Contacted", value: 27, color: COLORS.contacted },
  { name: "Qualified", value: 22, color: COLORS.qualified },
];

const repData = [
  { rep: "Sara Tan", New: 10, Contacted: 12, Qualified: 6 },
  { rep: "Marcus Choi", New: 8, Contacted: 10, Qualified: 6 },
  { rep: "Raj Pinto", New: 14, Contacted: 5, Qualified: 3 },
];

const followUpData = [
  { day: "Mon", Sent: 5, Overdue: 1 },
  { day: "Tue", Sent: 9, Overdue: 2 },
  { day: "Wed", Sent: 8, Overdue: 1 },
  { day: "Thu", Sent: 11, Overdue: 3 },
  { day: "Fri", Sent: 4, Overdue: 2 },
];

const metrics = [
  { label: "Team leads", value: "74", sub: "↑ 9 this week" },
  { label: "Follow-ups due", value: "12", sub: "4 overdue" },
  { label: "Emails sent", value: "37", sub: "This week" },
  { label: "Qualified", value: "22", sub: "↑ 3 this week" },
];

const CHART_LABELS = ["Lead status", "Rep activity", "Follow-ups"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid rgba(0,0,0,0.12)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
    }}>
      {label && <p style={{ margin: "0 0 4px", fontWeight: 500, color: "#333" }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "2px 0", color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function ManagerDashboard() {
  const [chartIndex, setChartIndex] = useState(0);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setChartIndex((i) => Math.min(i + 1, 2));
      else setChartIndex((i) => Math.max(i - 1, 0));
    }
    touchStartX.current = null;
  };

  return (
    <div style={{ maxWidth: 390, margin: "0 auto", fontFamily: "system-ui, sans-serif", background: "#f5f5f7", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "#1a1acc", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 600, fontSize: 14, flexShrink: 0,
        }}>RS</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Team A — Manager</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Roshan Selva</div>
        </div>
        <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>Boothflow</div>
      </div>

      <div style={{ padding: "16px 14px" }}>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{
              background: "#fff", borderRadius: 12,
              border: "0.5px solid rgba(0,0,0,0.08)", padding: "12px 14px",
            }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#111", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart carousel */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 14px", overflow: "hidden" }}>

          {/* Tab indicators */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {CHART_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setChartIndex(i)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: chartIndex === i ? "#1a1acc" : "rgba(0,0,0,0.05)",
                  color: chartIndex === i ? "#fff" : "#888",
                  transition: "all 0.2s",
                }}
              >{label}</button>
            ))}
          </div>

          {/* Swipe area */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ minHeight: 260 }}
          >
            {/* Pie chart */}
            {chartIndex === 0 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Lead status breakdown · 74 total</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {statusData.map((s) => (
                    <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block" }} />
                      {s.name} {s.value}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar chart */}
            {chartIndex === 1 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Leads by rep and status</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["New", COLORS.new], ["Contacted", COLORS.contacted], ["Qualified", COLORS.qualified]].map(([name, color]) => (
                    <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                      {name}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={repData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="rep" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="New" stackId="a" fill={COLORS.new} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Contacted" stackId="a" fill={COLORS.contacted} />
                    <Bar dataKey="Qualified" stackId="a" fill={COLORS.qualified} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Line chart */}
            {chartIndex === 2 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Follow-ups this week</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["Sent", COLORS.contacted], ["Overdue", COLORS.overdue]].map(([name, color]) => (
                    <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                      {name}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={followUpData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Sent" stroke={COLORS.contacted} strokeWidth={2.5}
                      dot={{ r: 4, fill: COLORS.contacted }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Overdue" stroke={COLORS.overdue} strokeWidth={2.5}
                      strokeDasharray="5 3" dot={{ r: 4, fill: COLORS.overdue }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} onClick={() => setChartIndex(i)} style={{
                width: chartIndex === i ? 20 : 6,
                height: 6, borderRadius: 3, cursor: "pointer",
                background: chartIndex === i ? "#1a1acc" : "rgba(0,0,0,0.15)",
                transition: "all 0.25s",
              }} />
            ))}
          </div>
        </div>

        {/* Team breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 14px", marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Team breakdown</div>
          {[
            { initials: "ST", name: "Sara Tan", sub: "28 leads · 7 qualified", pct: "25%", color: "#5DCAA5" },
            { initials: "MC", name: "Marcus Choi", sub: "24 leads · 6 qualified", pct: "25%", color: "#378ADD" },
            { initials: "RP", name: "Raj Pinto", sub: "22 leads · 5 qualified", pct: "23%", color: "#7F77DD" },
          ].map((rep) => (
            <div key={rep.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: rep.color + "22", color: rep.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>{rep.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{rep.name}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{rep.sub}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: rep.color }}>{rep.pct}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 14px", marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Recent activity</div>
          {[
            { dot: COLORS.new, text: "Apex Corp → Contacted", sub: "Sara Tan · 2m ago" },
            { dot: COLORS.contacted, text: "Follow-up sent to Redfin", sub: "Marcus Choi · 8m ago" },
            { dot: COLORS.qualified, text: "Note added to Blog Labs", sub: "Raj Pinto · 23m ago" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 12 : 0, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: "#222" }}>{item.text}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom nav */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "#fff", borderTop: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex", padding: "10px 0 16px",
      }}>
        {["Dashboard", "Leads", "Emails", "Export"].map((tab, i) => (
          <button key={tab} style={{
            flex: 1, border: "none", background: "none", cursor: "pointer",
            fontSize: 12, color: i === 0 ? "#1a1acc" : "#999", fontWeight: i === 0 ? 600 : 400, padding: "4px 0",
          }}>{tab}</button>
        ))}
      </div>
    </div>
  );
}
