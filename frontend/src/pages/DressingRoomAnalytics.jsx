import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Stat Card Component
const StatCard = ({ title, value, icon, color = "#00ffff" }) => (
  <div className="tsv-glass" style={{ 
    padding: 16, 
    borderRadius: 12,
    border: `1px solid ${color}30`,
    background: `linear-gradient(135deg, ${color}10, transparent)`
  }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: "bold", color }}>{value}</div>
    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{title}</div>
  </div>
);

// Top Items List Component
const TopItemsList = ({ title, items, color = "#00ffff", icon = "📊" }) => (
  <div className="tsv-glass" style={{ 
    padding: 14, 
    borderRadius: 12,
    border: `1px solid ${color}30`
  }}>
    <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12, color }}>
      {icon} {title}
    </div>
    {items && items.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "6px 10px",
            background: i === 0 ? `${color}20` : "rgba(255,255,255,.05)",
            borderRadius: 6,
            fontSize: 11
          }}>
            <span style={{ opacity: 0.9 }}>
              {i === 0 && "🥇 "}
              {i === 1 && "🥈 "}
              {i === 2 && "🥉 "}
              {item.item}
            </span>
            <span style={{ 
              color, 
              fontWeight: "bold",
              background: `${color}30`,
              padding: "2px 8px",
              borderRadius: 4
            }}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ fontSize: 11, opacity: 0.5, textAlign: "center", padding: 20 }}>
        No data yet
      </div>
    )}
  </div>
);

export default function DressingRoomAnalytics() {
  const nav = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dressing-room/analytics?days=${days}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="tsv-glass" style={{ padding: 40, textAlign: "center" }}>
        <div className="tsv-title" style={{ fontSize: 16 }}>LOADING ANALYTICS...</div>
        <div style={{ marginTop: 12, opacity: 0.6 }}>Fetching usage data</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tsv-glass" style={{ padding: 40, textAlign: "center" }}>
        <div className="tsv-title" style={{ fontSize: 16, color: "#ff6666" }}>ERROR</div>
        <div style={{ marginTop: 12, opacity: 0.6 }}>{error}</div>
        <button className="tsv-btn" onClick={fetchAnalytics} style={{ marginTop: 16 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="tsv-glass tsv-glow" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="tsv-title" style={{ fontSize: 16 }}>📊 DRESSING ROOM ANALYTICS</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
              Usage tracking and insights
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                background: "rgba(0,0,0,.4)",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: 6,
                padding: "6px 10px",
                color: "white",
                fontSize: 11
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            <button 
              className="tsv-btn" 
              onClick={() => nav("/dressing-room")}
              style={{ fontSize: 10, padding: "6px 12px" }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
        gap: 12,
        marginBottom: 16 
      }}>
        <StatCard 
          title="Total Generations" 
          value={analytics?.total_generations || 0} 
          icon="🎨" 
          color="#00ffff"
        />
        <StatCard 
          title="Unique Sessions" 
          value={analytics?.unique_sessions || 0} 
          icon="👥" 
          color="#ff69b4"
        />
        <StatCard 
          title="Pairs Created" 
          value={analytics?.pairs_usage?.total || 0} 
          icon="💕" 
          color="#ff1493"
        />
        <StatCard 
          title="Characters Used" 
          value={Object.keys(analytics?.characters_used || {}).length} 
          icon="🎭" 
          color="#ffd700"
        />
      </div>

      {/* Character Breakdown */}
      <div className="tsv-glass" style={{ padding: 14, borderRadius: 12, marginBottom: 16 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>
          🎭 CHARACTER USAGE
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {analytics?.characters_used && Object.entries(analytics.characters_used)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => (
              <div key={name} style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,.08)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.15)"
              }}>
                <div style={{ fontSize: 12, fontWeight: "bold" }}>{name}</div>
                <div style={{ fontSize: 18, color: "#00ffff", marginTop: 4 }}>{count}</div>
              </div>
            ))}
          {(!analytics?.characters_used || Object.keys(analytics.characters_used).length === 0) && (
            <div style={{ fontSize: 11, opacity: 0.5, padding: 20 }}>No character data yet</div>
          )}
        </div>
      </div>

      {/* Top Items Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: 12,
        marginBottom: 16 
      }}>
        <TopItemsList 
          title="TOP PRESETS" 
          items={analytics?.top_presets} 
          color="#ffd700"
          icon="⭐"
        />
        <TopItemsList 
          title="TOP BACKGROUNDS" 
          items={analytics?.top_backgrounds} 
          color="#00bfff"
          icon="🏠"
        />
        <TopItemsList 
          title="TOP POSITIONS" 
          items={analytics?.top_positions} 
          color="#ff69b4"
          icon="🎯"
        />
        <TopItemsList 
          title="TOP GESTURES" 
          items={analytics?.top_gestures} 
          color="#ffa500"
          icon="🤟"
        />
        <TopItemsList 
          title="TOP TOPS" 
          items={analytics?.top_tops} 
          color="#9370db"
          icon="👚"
        />
        <TopItemsList 
          title="TOP BOTTOMS" 
          items={analytics?.top_bottoms} 
          color="#20b2aa"
          icon="👖"
        />
      </div>

      {/* Pairs Usage */}
      {analytics?.pairs_usage?.total > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: 12,
          marginBottom: 16 
        }}>
          <TopItemsList 
            title="TOP PAIRS - MATURE" 
            items={analytics?.top_pairs_mature} 
            color="#ff1493"
            icon="💋"
          />
          <TopItemsList 
            title="TOP PAIRS - FUN" 
            items={analytics?.top_pairs_fun} 
            color="#32cd32"
            icon="🎉"
          />
        </div>
      )}

      {/* Daily Breakdown */}
      <div className="tsv-glass" style={{ padding: 14, borderRadius: 12, marginBottom: 16 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>
          📅 DAILY ACTIVITY
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {analytics?.daily_breakdown?.map((day, i) => (
            <div key={i} style={{
              padding: "8px 12px",
              background: `rgba(0,255,255,${Math.min(day.count / 10, 0.5)})`,
              borderRadius: 6,
              border: "1px solid rgba(0,255,255,.3)",
              minWidth: 80,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{day.date}</div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#00ffff" }}>{day.count}</div>
            </div>
          ))}
          {(!analytics?.daily_breakdown || analytics.daily_breakdown.length === 0) && (
            <div style={{ fontSize: 11, opacity: 0.5, padding: 20 }}>No daily data yet</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="tsv-glass" style={{ padding: 14, borderRadius: 12 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 12 }}>
          🕐 RECENT ACTIVITY
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {analytics?.recent_activity?.map((event, i) => (
            <div key={i} style={{
              padding: "10px 12px",
              background: i % 2 === 0 ? "rgba(255,255,255,.03)" : "transparent",
              borderRadius: 6,
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: "bold" }}>
                  {event.character}
                  {event.has_pair && <span style={{ color: "#ff69b4", marginLeft: 6 }}>💕 Pairs</span>}
                </div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
                  {event.outfit}
                </div>
              </div>
              <div style={{ fontSize: 9, opacity: 0.5, whiteSpace: "nowrap" }}>
                {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {(!analytics?.recent_activity || analytics.recent_activity.length === 0) && (
            <div style={{ fontSize: 11, opacity: 0.5, textAlign: "center", padding: 40 }}>
              No recent activity yet. Generate some outfits to see data here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
