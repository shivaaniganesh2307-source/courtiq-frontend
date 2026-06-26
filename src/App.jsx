import { useState, useEffect, createContext, useContext } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { authApi, matchApi, sessionApi, statsApi } from "./services/api";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const G = {
  court:   "#1a3a2a",
  courtMid:"#24503a",
  courtLt: "#2d6147",
  amber:   "#e8a030",
  amberLt: "#f0b84a",
  cream:   "#f5f0e8",
  white:   "#ffffff",
  ink:     "#0f1f17",
  muted:   "#6b8c7a",
  border:  "#2d4a3a",
  red:     "#c0392b",
  redLt:   "#e74c3c",
  win:     "#27ae60",
  lose:    "#e74c3c",
  card:    "#1f4433",
  cardLt:  "#265440",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.court};color:${G.cream};font-family:'DM Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${G.court}}::-webkit-scrollbar-thumb{background:${G.courtLt};border-radius:3px}
  input,select,textarea{font-family:'DM Sans',sans-serif}
`;

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Pill({ children, color = G.amber, bg }) {
  return (
    <span style={{ background: bg || color + "22", color, fontSize: 11, fontWeight: 600,
      padding: "2px 10px", borderRadius: 20, fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12,
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 12, color: G.muted, fontWeight: 500, letterSpacing: "0.06em",
        textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 36, fontFamily: "'Bebas Neue', sans-serif",
        color: accent || G.amber, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: G.muted }}>{sub}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", type = "button", disabled, style = {} }) {
  const styles = {
    primary: { background: G.amber, color: G.ink, border: "none" },
    ghost: { background: "transparent", color: G.cream, border: `1px solid ${G.border}` },
    danger: { background: "transparent", color: G.red, border: `1px solid ${G.red}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...styles[variant], padding: "10px 20px", borderRadius: 8, cursor: disabled ? "not-allowed" :  "pointer",
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
      opacity: disabled ? 0.5 : 1, transition: "opacity 0.15s", ...style
    }}>{children}</button>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, color: G.muted, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <input {...props} style={{ background: G.courtMid, border: `1px solid ${G.border}`,
        borderRadius: 8, padding: "10px 14px", color: G.cream, fontSize: 14,
        outline: "none", ...props.style }} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, color: G.muted, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <select {...props} style={{ background: G.courtMid, border: `1px solid ${G.border}`,
        borderRadius: 8, padding: "10px 14px", color: G.cream, fontSize: 14,
        outline: "none", ...props.style }}>
        {children}
      </select>
    </div>
  );
}

function LoadingBlock({ label = "Loading..." }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: G.muted, fontSize: 14 }}>
      {label}
    </div>
  );
}

function EmptyState({ title, sub, actionLabel, onAction }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12,
      padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, color: G.cream, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: G.muted, marginBottom: actionLabel ? 20 : 0 }}>{sub}</div>
      {actionLabel && <Btn onClick={onAction}>{actionLabel}</Btn>}
    </div>
  );
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const { user, logout } = useAuth();
  const nav = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "matches", icon: "◈", label: "Matches" },
    { id: "log-match", icon: "+", label: "Log Match" },
    { id: "sessions", icon: "◉", label: "Training" },
    { id: "log-session", icon: "+", label: "Log Session" },
  ];
  return (
    <div style={{ width: 220, background: G.ink, borderRight: `1px solid ${G.border}`,
      display: "flex", flexDirection: "column", height: "100vh", position: "fixed",
      top: 0, left: 0, zIndex: 10 }}>
      <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: G.amber, letterSpacing: 2 }}>
          COURTIQ
        </div>
        <div style={{ fontSize: 11, color: G.muted, letterSpacing: "0.1em", marginTop: 2 }}>
          TENNIS ANALYTICS
        </div>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
            borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
            background: page === n.id ? G.courtLt : "transparent",
            color: page === n.id ? G.amber : G.muted,
            fontFamily: "'DM Sans'", fontSize: 14, fontWeight: page === n.id ? 600 : 400,
            transition: "all 0.15s"
          }}>
            <span style={{ fontSize: 16, fontFamily: "monospace" }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${G.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: G.cream }}>
          {user?.full_name || "Player"}
        </div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 2, marginBottom: 12 }}>
          {user?.skill_level || "intermediate"}
        </div>
        <Btn variant="ghost" onClick={logout} style={{ width: "100%", padding: "8px", fontSize: 12 }}>
          Sign out
        </Btn>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const overview = await statsApi.overview();
        const trendData = await statsApi.trends(10);
        if (!cancelled) {
          setStats(overview);
          setTrends(
            (trendData.matches || []).map(m => ({
              date: m.date ? m.date.split("T")[0].slice(5) : "",
              winners: m.winners,
              unforced_errors: m.unforced_errors,
              first_serve_pct: m.first_serve_pct,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load stats");
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: G.ink, border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize: 13, color: p.color, fontFamily: "'DM Mono'" }}>
            {p.name}: {p.value}{p.name.includes("pct") ? "%" : ""}
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <LoadingBlock label="Loading your stats..." />;

  if (error) {
    return <EmptyState title="Couldn't load dashboard" sub={error} actionLabel="Retry" onAction={() => window.location.reload()} />;
  }

  if (!stats || stats.total_matches === 0 || stats.matches === 0) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1, color: G.cream }}>
            PERFORMANCE OVERVIEW
          </div>
        </div>
        <EmptyState
          title="No matches logged yet"
          sub="Log your first match to start seeing your stats, trends, and AI coaching reports here."
          actionLabel="+ Log your first match"
          onAction={() => setPage("log-match")}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1, color: G.cream }}>
          PERFORMANCE OVERVIEW
        </div>
        <div style={{ color: G.muted, fontSize: 14, marginTop: 4 }}>
          Season stats · Last updated today
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Win Rate" value={`${stats.win_rate}%`} sub={`${stats.wins}W · ${stats.losses}L`} accent={G.win} />
        <StatCard label="Matches Played" value={stats.total_matches} sub="This season" />
        <StatCard label="1st Serve %" value={`${stats.overall_first_serve_pct}%`} sub="Season average" />
        <StatCard label="W/UE Ratio" value={stats.overall_winner_error_ratio} sub={`${stats.avg_winners_per_match} W · ${stats.avg_unforced_errors_per_match} UE avg`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "24px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>PERFORMANCE TRENDS</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Winners vs unforced errors</div>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <XAxis dataKey="date" tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="winners" stroke={G.amber} strokeWidth={2} dot={false} name="Winners" />
                <Line type="monotone" dataKey="unforced_errors" stroke={G.redLt} strokeWidth={2} dot={false} name="Unforced errors" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ color: G.muted, fontSize: 13 }}>Not enough matches yet for a trend line.</div>}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "24px" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>BY SURFACE</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Win rate %</div>
          {Object.entries(stats.win_rate_by_surface || {}).map(([surface, rate]) => (
            <div key={surface} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, textTransform: "capitalize" }}>{surface}</span>
                <span style={{ fontSize: 13, fontFamily: "'DM Mono'", color: G.amber }}>{rate}%</span>
              </div>
              <div style={{ height: 6, background: G.courtMid, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${rate}%`, background: G.amber, borderRadius: 3,
                  transition: "width 0.8s ease" }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${G.border}` }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, marginBottom: 12, letterSpacing: 1 }}>TRAINING</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: G.amber }}>{stats.total_training_sessions || 0}</div>
                <div style={{ fontSize: 11, color: G.muted }}>SESSIONS</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: G.amber }}>{stats.total_training_hours || 0}</div>
                <div style={{ fontSize: 11, color: G.muted }}>HOURS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {trends.length > 0 && (
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "24px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>FIRST SERVE % OVER TIME</div>
          <div style={{ fontSize: 12, color: G.muted, marginBottom: 20 }}>Target: 65%+</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trends}>
              <XAxis dataKey="date" tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="first_serve_pct" fill={G.courtLt} radius={[4, 4, 0, 0]} name="1st serve pct" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1 }}>RECENT RESULTS</div>
          <Btn variant="ghost" onClick={() => setPage("matches")} style={{ fontSize: 12, padding: "6px 14px" }}>
            View all →
          </Btn>
        </div>
        {(stats.recent_results || []).map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16,
            padding: "12px 0", borderBottom: `1px solid ${G.border + "66"}` }}>
            <Pill color={m.result === "win" ? G.win : G.lose}>{m.result}</Pill>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>vs {m.opponent || "Unknown"}</div>
              <div style={{ fontSize: 12, color: G.muted }}>{m.date ? m.date.split("T")[0] : ""}</div>
            </div>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 14, color: G.cream }}>{m.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MATCH DETAIL ─────────────────────────────────────────────────────────────
function MatchDetail({ match, onBack, onUpdated }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(match.ai_analysis);
  const [error, setError] = useState("");

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const updated = await matchApi.analyze(match.id);
      setAnalysis(updated.ai_analysis);
      onUpdated?.(updated);
    } catch (e) {
      setError(e.message || "Analysis failed. Make sure your ANTHROPIC_API_KEY is set in backend/.env");
    }
    setAnalyzing(false);
  };

  const renderAnalysis = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{ fontFamily: "'Bebas Neue'", fontSize: 18, color: G.amber,
          letterSpacing: 1, marginTop: i > 0 ? 20 : 0, marginBottom: 8 }}>{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.match(/^\d\./)) {
        return <div key={i} style={{ paddingLeft: 16, fontSize: 14, color: G.cream,
          lineHeight: 1.6, marginBottom: 4 }}>• {line.substring(2)}</div>;
      }
      if (line.startsWith('- ')) {
        return <div key={i} style={{ paddingLeft: 16, fontSize: 14, color: G.cream,
          lineHeight: 1.6, marginBottom: 4 }}>· {line.substring(2)}</div>;
      }
      return line ? <div key={i} style={{ fontSize: 14, color: "#c8e0d0", lineHeight: 1.7, marginBottom: 4 }}>{line}</div> : null;
    });
  };

  const firstServePct = match.first_serve_pct ??
    (match.first_serve_total > 0 ? Math.round((match.first_serve_in / match.first_serve_total) * 100) : 0);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: G.muted,
        cursor: "pointer", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        ← Back to matches
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1 }}>
            VS {(match.opponent_name || "UNKNOWN").toUpperCase()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Pill color={match.result === "win" ? G.win : G.lose}>{match.result}</Pill>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 18, color: G.amber }}>{match.score}</span>
            <span style={{ fontSize: 13, color: G.muted }}>{match.surface} · {match.match_date?.split("T")[0]}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Aces", value: match.aces },
          { label: "Double Faults", value: match.double_faults },
          { label: "1st Serve %", value: `${firstServePct}%` },
          { label: "Winners", value: match.winners },
          { label: "Unforced Errors", value: match.unforced_errors },
          { label: "W/UE Ratio", value: match.unforced_errors > 0 ? (match.winners / match.unforced_errors).toFixed(2) : "—" },
        ].map(s => (
          <div key={s.label} style={{ background: G.card, border: `1px solid ${G.border}`,
            borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase",
              letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: G.amber }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 24, letterSpacing: 1 }}>AI COACHING REPORT</div>
            <div style={{ fontSize: 12, color: G.muted }}>Powered by Claude</div>
          </div>
          {!analysis && !analyzing && (
            <Btn onClick={triggerAnalysis}>Generate Report</Btn>
          )}
        </div>
        {error && <div style={{ fontSize: 13, color: G.redLt, marginBottom: 16 }}>{error}</div>}
        {analysis ? (
          <div>{renderAnalysis(analysis)}</div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: G.muted }}>
            {analyzing ? (
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: G.amber, marginBottom: 8 }}>
                  ANALYZING YOUR MATCH...
                </div>
                <div style={{ fontSize: 13 }}>Claude is reviewing your stats</div>
              </div>
            ) : (
              <div style={{ fontSize: 14 }}>Click "Generate Report" to get AI coaching insights for this match</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATCHES PAGE ─────────────────────────────────────────────────────────────
function Matches({ setPage }) {
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await matchApi.list();
      setMatches(data);
    } catch (e) {
      setError(e.message || "Could not load matches");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (selected) {
    return (
      <MatchDetail
        match={selected}
        onBack={() => { setSelected(null); load(); }}
        onUpdated={(updated) => setSelected(updated)}
      />
    );
  }

  if (loading) return <LoadingBlock label="Loading matches..." />;
  if (error) return <EmptyState title="Couldn't load matches" sub={error} actionLabel="Retry" onAction={load} />;

  const filtered = filter === "all" ? matches : matches.filter(m => m.result === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1 }}>MATCH HISTORY</div>
          <div style={{ color: G.muted, fontSize: 14 }}>{matches.length} matches this season</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "win", "loss"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? G.amber : "transparent",
              color: filter === f ? G.ink : G.muted,
              border: `1px solid ${filter === f ? G.amber : G.border}`,
              borderRadius: 20, padding: "6px 16px", cursor: "pointer",
              fontSize: 12, fontWeight: 600, textTransform: "capitalize",
              fontFamily: "'DM Sans'"
            }}>{f}</button>
          ))}
          <Btn onClick={() => setPage("log-match")} style={{ padding: "6px 16px", fontSize: 12 }}>+ Log Match</Btn>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState title="No matches yet" sub="Log your first match to see it here." actionLabel="+ Log Match" onAction={() => setPage("log-match")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(m => (
            <div key={m.id} onClick={() => setSelected(m)} style={{
              background: G.card, border: `1px solid ${G.border}`, borderRadius: 12,
              padding: "20px 24px", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 20, transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = G.amber}
            onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
              <Pill color={m.result === "win" ? G.win : G.lose}>{m.result}</Pill>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>vs {m.opponent_name || "Unknown"}</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>
                  {m.match_date?.split("T")[0]} · {m.surface}
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono'", fontSize: 16, color: G.amber }}>{m.score}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: G.muted }}>
                <span>{m.aces} aces</span>
                <span>{m.winners}W / {m.unforced_errors}UE</span>
              </div>
              {m.ai_analysis && <Pill color={G.courtLt} bg={G.courtLt + "44"}>analyzed</Pill>}
              <span style={{ color: G.muted, fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOG MATCH PAGE ───────────────────────────────────────────────────────────
function LogMatch({ setPage }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    opponent_name: "", match_date: "", surface: "hard", result: "win",
    score: "", aces: "", double_faults: "", first_serve_in: "",
    first_serve_total: "", winners: "", unforced_errors: "",
    break_points_won: "", break_points_faced: "", notes: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        match_date: form.match_date ? new Date(form.match_date).toISOString() : new Date().toISOString(),
        first_serve_in: Number(form.first_serve_in) || 0,
        first_serve_total: Number(form.first_serve_total) || 0,
        aces: Number(form.aces) || 0,
        double_faults: Number(form.double_faults) || 0,
        winners: Number(form.winners) || 0,
        unforced_errors: Number(form.unforced_errors) || 0,
        break_points_won: Number(form.break_points_won) || 0,
        break_points_faced: Number(form.break_points_faced) || 0,
      };
      await matchApi.create(payload);
      setPage("matches");
    } catch (e) {
      setError(e.message || "Could not save match");
    }
    setSaving(false);
  };

  const steps = ["Match Info", "Serve Stats", "Rally Stats", "Review"];

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1, marginBottom: 8 }}>LOG MATCH</div>
      <div style={{ color: G.muted, fontSize: 14, marginBottom: 32 }}>Record your match and get AI coaching analysis</div>

      <div style={{ display: "flex", gap: 0, marginBottom: 36 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 13, fontWeight: 600, marginBottom: 6,
                background: step > i + 1 ? G.win : step === i + 1 ? G.amber : G.courtMid,
                color: step >= i + 1 ? G.ink : G.muted,
              }}>{step > i + 1 ? "✓" : i + 1}</div>
              <div style={{ fontSize: 11, color: step === i + 1 ? G.amber : G.muted,
                textAlign: "center", whiteSpace: "nowrap" }}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 1, flex: 1, background: step > i + 1 ? G.win : G.border,
                marginBottom: 20, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "28px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>MATCH DETAILS</div>
            <Input label="Opponent Name" value={form.opponent_name} onChange={e => set("opponent_name", e.target.value)} placeholder="e.g. Sarah Kim" />
            <Input label="Match Date" type="date" value={form.match_date} onChange={e => set("match_date", e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Select label="Surface" value={form.surface} onChange={e => set("surface", e.target.value)}>
                <option value="hard">Hard</option>
                <option value="clay">Clay</option>
                <option value="grass">Grass</option>
                <option value="indoor">Indoor</option>
              </Select>
              <Select label="Result" value={form.result} onChange={e => set("result", e.target.value)}>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </Select>
            </div>
            <Input label="Score (e.g. 6-3 4-6 6-2)" value={form.score} onChange={e => set("score", e.target.value)} placeholder="6-3 6-4" />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>SERVE STATS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="1st Serve In" type="number" value={form.first_serve_in} onChange={e => set("first_serve_in", e.target.value)} placeholder="42" />
              <Input label="1st Serve Total" type="number" value={form.first_serve_total} onChange={e => set("first_serve_total", e.target.value)} placeholder="68" />
              <Input label="Aces" type="number" value={form.aces} onChange={e => set("aces", e.target.value)} placeholder="4" />
              <Input label="Double Faults" type="number" value={form.double_faults} onChange={e => set("double_faults", e.target.value)} placeholder="2" />
            </div>
            <div style={{ background: G.courtMid, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: G.muted }}>
              {form.first_serve_in && form.first_serve_total
                ? `First serve: ${Math.round((form.first_serve_in / form.first_serve_total) * 100)}%`
                : "Enter first serve stats to see your percentage"}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>RALLY STATS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="Winners" type="number" value={form.winners} onChange={e => set("winners", e.target.value)} placeholder="18" />
              <Input label="Unforced Errors" type="number" value={form.unforced_errors} onChange={e => set("unforced_errors", e.target.value)} placeholder="12" />
              <Input label="Break Points Won" type="number" value={form.break_points_won} onChange={e => set("break_points_won", e.target.value)} placeholder="3" />
              <Input label="Break Points Faced" type="number" value={form.break_points_faced} onChange={e => set("break_points_faced", e.target.value)} placeholder="5" />
            </div>
            {form.winners && form.unforced_errors && (
              <div style={{ background: G.courtMid, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: G.muted }}>
                Winner/Error ratio: {(form.winners / form.unforced_errors).toFixed(2)} · {form.winners / form.unforced_errors >= 1.5 ? "🟢 Excellent" : form.winners / form.unforced_errors >= 1 ? "🟡 Good" : "🔴 Needs work"}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="How did the match feel? Any tactical observations..."
                style={{ background: G.courtMid, border: `1px solid ${G.border}`, borderRadius: 8,
                  padding: "10px 14px", color: G.cream, fontSize: 14, outline: "none",
                  resize: "vertical", minHeight: 80, fontFamily: "'DM Sans'" }} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1, marginBottom: 20 }}>REVIEW & SAVE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Opponent", form.opponent_name || "—"],
                ["Date", form.match_date || "—"],
                ["Surface", form.surface],
                ["Result", form.result.toUpperCase()],
                ["Score", form.score || "—"],
                ["Aces", form.aces || "0"],
                ["Double Faults", form.double_faults || "0"],
                ["Winners", form.winners || "0"],
                ["Unforced Errors", form.unforced_errors || "0"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 14px", background: G.courtMid, borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: G.muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontFamily: "'DM Mono'", color: G.cream }}>{v}</span>
                </div>
              ))}
            </div>
            {error && <div style={{ marginTop: 14, fontSize: 13, color: G.redLt }}>{error}</div>}
            <div style={{ marginTop: 16, padding: "12px 16px", background: G.courtMid, borderRadius: 8,
              fontSize: 13, color: G.muted }}>
              ✨ AI coaching analysis will be generated automatically after saving
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <Btn variant="ghost" onClick={() => step > 1 ? setStep(s => s - 1) : setPage("matches")}>
            {step > 1 ? "← Back" : "Cancel"}
          </Btn>
          {step < 4
            ? <Btn onClick={() => setStep(s => s + 1)}>Next →</Btn>
            : <Btn onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Match"}</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ─── TRAINING SESSIONS PAGE ───────────────────────────────────────────────────
function Sessions({ setPage }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const focusColors = { serve: G.amber, groundstrokes: "#4ecdc4", fitness: "#e74c3c", return: "#9b59b6", net: "#3498db", match_play: G.win };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sessionApi.list();
      setSessions(data);
    } catch (e) {
      setError(e.message || "Could not load sessions");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingBlock label="Loading training log..." />;
  if (error) return <EmptyState title="Couldn't load sessions" sub={error} actionLabel="Retry" onAction={load} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1 }}>TRAINING LOG</div>
          <div style={{ color: G.muted, fontSize: 14 }}>{sessions.length} sessions logged</div>
        </div>
        <Btn onClick={() => setPage("log-session")}>+ Log Session</Btn>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="No training sessions yet" sub="Log your first session to start tracking your training." actionLabel="+ Log Session" onAction={() => setPage("log-session")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ background: G.card, border: `1px solid ${G.border}`,
              borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Pill color={focusColors[s.focus_area] || G.amber}>{s.focus_area.replace("_", " ")}</Pill>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{s.session_date?.split("T")[0]}</div>
                    <div style={{ fontSize: 12, color: G.muted }}>{s.duration_mins} min · {s.intensity} intensity</div>
                  </div>
                </div>
                {s.performance_rating && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue'", fontSize: 32, color: G.amber, lineHeight: 1 }}>
                      {s.performance_rating}
                    </div>
                    <div style={{ fontSize: 10, color: G.muted }}>/ 10</div>
                  </div>
                )}
              </div>
              {s.ai_tip && (
                <div style={{ background: G.courtMid, borderRadius: 8, padding: "12px 16px",
                  fontSize: 13, color: "#c8e0d0", lineHeight: 1.6, borderLeft: `3px solid ${G.amber}` }}>
                  <div style={{ fontSize: 10, color: G.amber, fontWeight: 600, letterSpacing: "0.08em",
                    marginBottom: 6 }}>COACH TIP</div>
                  {s.ai_tip}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOG SESSION PAGE ─────────────────────────────────────────────────────────
function LogSession({ setPage }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    session_date: "", duration_mins: "", focus_area: "serve",
    intensity: "medium", performance_rating: "", notes: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        session_date: form.session_date ? new Date(form.session_date).toISOString() : new Date().toISOString(),
        duration_mins: Number(form.duration_mins) || 0,
        performance_rating: form.performance_rating ? Number(form.performance_rating) : undefined,
      };
      await sessionApi.create(payload);
      setPage("sessions");
    } catch (e) {
      setError(e.message || "Could not save session");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 42, letterSpacing: 1, marginBottom: 8 }}>LOG SESSION</div>
      <div style={{ color: G.muted, fontSize: 14, marginBottom: 32 }}>Record your training and get an AI coaching tip</div>

      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: "28px",
        display: "flex", flexDirection: "column", gap: 18 }}>
        <Input label="Date" type="date" value={form.session_date} onChange={e => set("session_date", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Duration (minutes)" type="number" value={form.duration_mins} onChange={e => set("duration_mins", e.target.value)} placeholder="90" />
          <Select label="Focus Area" value={form.focus_area} onChange={e => set("focus_area", e.target.value)}>
            <option value="serve">Serve</option>
            <option value="return">Return</option>
            <option value="groundstrokes">Groundstrokes</option>
            <option value="net">Net Play</option>
            <option value="fitness">Fitness</option>
            <option value="match_play">Match Play</option>
          </Select>
        </div>
        <Select label="Intensity" value={form.intensity} onChange={e => set("intensity", e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 12, color: G.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Performance Rating ({form.performance_rating || "—"}/10)
          </label>
          <input type="range" min="1" max="10" value={form.performance_rating || 5}
            onChange={e => set("performance_rating", e.target.value)}
            style={{ accentColor: G.amber }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: G.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Session Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="What drills did you do? How did it feel? Any breakthroughs?"
            style={{ background: G.courtMid, border: `1px solid ${G.border}`, borderRadius: 8,
              padding: "10px 14px", color: G.cream, fontSize: 14, outline: "none",
              resize: "vertical", minHeight: 100, fontFamily: "'DM Sans'" }} />
        </div>

        {error && <div style={{ fontSize: 13, color: G.redLt }}>{error}</div>}

        <div style={{ padding: "12px 16px", background: G.courtMid, borderRadius: 8, fontSize: 13, color: G.muted }}>
          ✨ AI coaching tip generated automatically after saving
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setPage("sessions")}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Save Session"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "",
    skill_level: "intermediate", dominant_hand: "right", play_style: "baseline" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: G.ink, padding: 24 }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage:
        `repeating-linear-gradient(0deg, transparent, transparent 59px, ${G.border}22 59px, ${G.border}22 60px),
         repeating-linear-gradient(90deg, transparent, transparent 59px, ${G.border}22 59px, ${G.border}22 60px)`,
        pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 52, color: G.amber, letterSpacing: 4 }}>
            COURTIQ
          </div>
          <div style={{ fontSize: 13, color: G.muted, letterSpacing: "0.2em", marginTop: 4 }}>
            AI TENNIS ANALYTICS
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: "32px" }}>
          <div style={{ display: "flex", marginBottom: 28, background: G.courtMid, borderRadius: 8, padding: 4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer",
                background: mode === m ? G.amber : "transparent",
                color: mode === m ? G.ink : G.muted,
                fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600, textTransform: "capitalize"
              }}>{m}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <Input label="Full Name" value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Shivaani Ganesh" />
            )}
            <Input label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" />

            {mode === "register" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Select label="Skill Level" value={form.skill_level} onChange={e => set("skill_level", e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="pro">Pro / D1</option>
                  </Select>
                  <Select label="Dominant Hand" value={form.dominant_hand} onChange={e => set("dominant_hand", e.target.value)}>
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                  </Select>
                </div>
                <Select label="Play Style" value={form.play_style} onChange={e => set("play_style", e.target.value)}>
                  <option value="baseline">Baseline</option>
                  <option value="serve-volley">Serve & Volley</option>
                  <option value="all-court">All Court</option>
                </Select>
              </>
            )}

            {error && <div style={{ fontSize: 13, color: G.redLt, padding: "10px 14px",
              background: G.red + "22", borderRadius: 8 }}>{error}</div>}

            <Btn onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "12px" }}>
              {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!user) return <AuthPage />;

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    matches: <Matches setPage={setPage} />,
    "log-match": <LogMatch setPage={setPage} />,
    sessions: <Sessions setPage={setPage} />,
    "log-session": <LogSession setPage={setPage} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ marginLeft: 220, flex: 1, padding: "40px 48px", maxWidth: 1200 }}>
        {pages[page] || pages.dashboard}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem("tennis_user");
    return s ? JSON.parse(s) : null;
  });

  // ── REAL AUTH — calls your FastAPI backend ──────────────────────────────────
  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("tennis_token", data.access_token);
    localStorage.setItem("tennis_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (formData) => {
    const data = await authApi.register(formData);
    localStorage.setItem("tennis_token", data.access_token);
    localStorage.setItem("tennis_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("tennis_token");
    localStorage.removeItem("tennis_user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, register, logout }}>
      <style>{css}</style>
      <AppShell />
    </AuthCtx.Provider>
  );
}
