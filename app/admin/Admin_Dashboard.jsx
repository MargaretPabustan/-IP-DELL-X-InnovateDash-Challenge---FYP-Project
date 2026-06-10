import { useState, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";

const COLORS = {
  new: "#5DCAA5",
  contacted: "#378ADD",
  qualified: "#7F77DD",
  overdue: "#E24B4A",
  amber: "#EF9F27",
};

const pipelineData = [
  { name: "New", value: 98, color: COLORS.new },
  { name: "Contacted", value: 65, color: COLORS.contacted },
  { name: "Qualified", value: 24, color: COLORS.qualified },
];

const teamBarData = [
  { team: "Team A", New: 32, Contacted: 27, Qualified: 15 },
  { team: "Team B", New: 41, Contacted: 24, Qualified: 6 },
  { team: "Team C", New: 25, Contacted: 14, Qualified: 3 },
];

const weeklyActivityData = [
  { day: "Mon", FollowUps: 12, Overdue: 2 },
  { day: "Tue", FollowUps: 18, Overdue: 4 },
  { day: "Wed", FollowUps: 15, Overdue: 3 },
  { day: "Thu", FollowUps: 22, Overdue: 7 },
  { day: "Fri", FollowUps: 9, Overdue: 2 },
];

const adminMetrics = [
  { label: "Total users", value: "24", sub: "↑ 3 this month" },
  { label: "Active leads", value: "187", sub: "↑ 12% WoW" },
  { label: "Conversion rate", value: "34%", sub: "↑ 4pts" },
  { label: "Follow-ups due", value: "41", sub: "7 overdue" },
];

const liveActivity = [
  { dot: COLORS.new, text: "Lead updated", sub: "Sara Tan → Contacted · Team A · 2m" },
  { dot: COLORS.contacted, text: "Email sent", sub: "Follow-up · J. Patel · Team B · 8m" },
  { dot: COLORS.qualified, text: "User created", sub: "Rep · Marcus Choi · 1h" },
  { dot: COLORS.amber, text: "Lead converted", sub: "Apex Corp · Team A · 2h" },
];

const CHART_LABELS = ["Pipeline", "By team", "Follow-ups"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)",
      borderRadius: 8, padding: "8px 12px", fontSize: 12,
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

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.07 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export default function AdminDashboard() {
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

      {/* Header — Admin uses a deeper indigo-to-purple gradient feel via solid color */}
      <div style={{ background: "#2d1a8c", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 600, fontSize: 14, flexShrink: 0,
        }}>JL</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Team A — Admin</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Jessica Lim</div>
        </div>
        <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>Boothflow</div>
      </div>

      <div style={{ padding: "16px 14px" }}>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {adminMetrics.map((m) => (
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
                  background: chartIndex === i ? "#2d1a8c" : "rgba(0,0,0,0.05)",
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
            {/* Pie — pipeline by status */}
            {chartIndex === 0 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Pipeline by stage · 187 total</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {pipelineData.map((s) => (
                    <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block" }} />
                      {s.name} {s.value}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                    >
                      {pipelineData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bar — leads by team */}
            {chartIndex === 1 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Leads by team and status</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["New", COLORS.new], ["Contacted", COLORS.contacted], ["Qualified", COLORS.qualified]].map(([name, color]) => (
                    <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                      {name}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={teamBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="team" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="New" stackId="a" fill={COLORS.new} />
                    <Bar dataKey="Contacted" stackId="a" fill={COLORS.contacted} />
                    <Bar dataKey="Qualified" stackId="a" fill={COLORS.qualified} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Line — weekly follow-ups */}
            {chartIndex === 2 && (
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>System-wide follow-ups this week</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {[["Follow-ups", COLORS.contacted], ["Overdue", COLORS.overdue]].map(([name, color]) => (
                    <span key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                      {name}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyActivityData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="FollowUps" stroke={COLORS.contacted} strokeWidth={2.5}
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
                background: chartIndex === i ? "#2d1a8c" : "rgba(0,0,0,0.15)",
                transition: "all 0.25s",
              }} />
            ))}
          </div>
        </div>

        {/* Teams overview */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 14px", marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Teams</div>
          {[
            { name: "Team A — West", manager: "Jamie Lee · 8 reps", leads: 74, max: 100, status: "Active", statusColor: "#5DCAA5", bar: COLORS.new },
            { name: "Team B — East", manager: "Rita Patel · 6 reps", leads: 59, max: 100, status: "Active", statusColor: "#5DCAA5", bar: COLORS.contacted },
            { name: "Team C — Enterprise", manager: "Unassigned · 3 reps", leads: 22, max: 100, status: "Inactive", statusColor: "#E24B4A", bar: COLORS.amber },
          ].map((team) => (
            <div key={team.name} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{team.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{team.manager}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                  background: team.statusColor + "20", color: team.statusColor,
                }}>{team.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ fontSize: 11, color: "#aaa" }}>Leads</div>
                <div style={{ fontSize: 11, color: "#888" }}>{team.leads} / {team.max}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.07)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{ width: `${(team.leads / team.max) * 100}%`, height: "100%", background: team.bar, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Live activity */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", padding: "16px 14px", marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Live activity</div>
          {liveActivity.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < liveActivity.length - 1 ? 12 : 0, alignItems: "flex-start" }}>
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
        {["Dashboard", "Users", "Teams", "Activity", "Roles"].map((tab, i) => (
          <button key={tab} style={{
            flex: 1, border: "none", background: "none", cursor: "pointer",
            fontSize: 11, color: i === 0 ? "#2d1a8c" : "#999", fontWeight: i === 0 ? 600 : 400, padding: "4px 0",
          }}>{tab}</button>
        ))}
      </div>
    </div>
  );
}
