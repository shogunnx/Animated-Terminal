import { useState, useEffect } from "react";

export default function RelationshipPanel({ characterId, accent = "#76FFE1", glow = "#8C50FF" }) {
  const [relationship, setRelationship] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWriteMemory, setShowWriteMemory] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [memoryTag, setMemoryTag] = useState("moment");
  const [submitting, setSubmitting] = useState(false);
  const [nexusId, setNexusId] = useState(null);

  const userId = "guest"; // Default user ID

  // Fetch Nexus UUID for the character
  useEffect(() => {
    const fetchNexusId = async () => {
      try {
        const response = await fetch("/api/nexus/api/characters");
        if (response.ok) {
          const characters = await response.json();
          const character = characters.find(c => 
            c.displayName.toLowerCase().replace(/\s+/g, "_") === characterId ||
            c.displayName.toLowerCase() === characterId.replace(/_/g, " ")
          );
          if (character) {
            setNexusId(character.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Nexus ID:", err);
      }
    };
    fetchNexusId();
  }, [characterId]);

  useEffect(() => {
    if (nexusId) {
      fetchRelationshipData();
      fetchMemories();
    }
  }, [nexusId]);

  const fetchRelationshipData = async () => {
    if (!nexusId) return;
    
    try {
      const response = await fetch(`/api/girlsmind/api/relationship/${nexusId}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRelationship(data);
      } else {
        console.log("Relationship data not available, status:", response.status);
        // Show empty state, no error
        setRelationship(null);
      }
    } catch (err) {
      console.error("Failed to fetch relationship:", err);
      setRelationship(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemories = async () => {
    if (!nexusId) return;
    
    try {
      const response = await fetch(`/api/girlsmind/api/memories/${nexusId}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || data || []);
      } else {
        console.log("Memories not available, status:", response.status);
        setMemories([]);
      }
    } catch (err) {
      console.error("Failed to fetch memories:", err);
      setMemories([]);
    }
  };

  const handleWriteMemory = async () => {
    if (!memoryText.trim() || !nexusId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/girlsmind/api/store_exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: nexusId,
          userId,
          text: memoryText,
          tag: memoryTag,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setMemoryText("");
        setShowWriteMemory(false);
        setError(null);
        // Refresh memories
        await fetchMemories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save memory");
      }
    } catch (err) {
      setError("Failed to save memory: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tsv-glass tsv-glow" style={{ padding: 16, borderColor: accent }}>
        <div className="tsv-title" style={{ fontSize: 12, color: accent }}>
          LOADING RELATIONSHIP DATA...
        </div>
      </div>
    );
  }

  if (error === "girlsmind_not_configured") {
    return (
      <div className="tsv-glass tsv-glow" style={{ padding: 16, borderColor: accent }}>
        <div className="tsv-title" style={{ fontSize: 12, color: accent, marginBottom: 12 }}>
          ⚡ RELATIONSHIP SYSTEM
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}>
            The GirlsMind relationship tracking system is not currently configured.
          </p>
          <p style={{ marginBottom: 8 }}>
            This feature allows you to:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
            <li>Track affinity, trust, and mood</li>
            <li>View relationship milestones</li>
            <li>Store and review shared memories</li>
            <li>Build deeper connections over time</li>
          </ul>
          <p style={{ fontSize: 10, opacity: 0.5, marginTop: 12 }}>
            To enable this feature, configure GIRLSMIND_BASE_URL and GIRLSMIND_API_KEY in your backend environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Relationship Snapshot */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 16, borderColor: accent, position: "relative" }}>
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 2, 
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          boxShadow: `0 0 10px ${accent}`
        }} />

        <div className="tsv-title" style={{ fontSize: 12, color: accent, marginBottom: 12 }}>
          ⚡ RELATIONSHIP SNAPSHOT
        </div>

        {relationship ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Affinity
              </div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: accent }}>
                {relationship.affinity || "??"}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Trust
              </div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: accent }}>
                {relationship.trust || "??"}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Mood
              </div>
              <div style={{ fontSize: 14, fontWeight: "bold", color: glow }}>
                {relationship.mood || "Unknown"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Last Seen
              </div>
              <div style={{ fontSize: 11 }}>
                {relationship.lastInteraction 
                  ? new Date(relationship.lastInteraction).toLocaleDateString() 
                  : "Never"}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            No relationship data available. Start chatting to build your connection!
          </div>
        )}

        {relationship?.milestones && relationship.milestones.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${accent}40` }}>
            <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Milestones
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {relationship.milestones.map((milestone, idx) => (
                <span
                  key={idx}
                  className="tsv-pill"
                  style={{
                    fontSize: 10,
                    padding: "4px 8px",
                    background: `linear-gradient(135deg, ${accent}20, ${glow}10)`,
                    borderColor: accent,
                  }}
                >
                  {milestone}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Memories */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 16, borderColor: glow, position: "relative" }}>
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 2, 
          background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
          boxShadow: `0 0 10px ${glow}`
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="tsv-title" style={{ fontSize: 12, color: glow }}>
            💭 SHARED MEMORIES
          </div>
          <button
            className="tsv-btn"
            onClick={() => setShowWriteMemory(!showWriteMemory)}
            style={{ fontSize: 10, padding: "6px 12px" }}
          >
            {showWriteMemory ? "Cancel" : "+ Write Memory"}
          </button>
        </div>

        {showWriteMemory && (
          <div style={{ marginBottom: 14, padding: 12, background: `${glow}10`, borderRadius: 4, border: `1px solid ${glow}30` }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, opacity: 0.7, display: "block", marginBottom: 4 }}>
                Memory Tag
              </label>
              <select
                value={memoryTag}
                onChange={(e) => setMemoryTag(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#0a0a12",
                  border: `1px solid ${accent}40`,
                  color: "var(--text)",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <option value="moment">Moment</option>
                <option value="date">Date</option>
                <option value="training">Training</option>
                <option value="gift">Gift</option>
                <option value="argument">Argument</option>
                <option value="victory">Victory</option>
                <option value="confession">Confession</option>
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, opacity: 0.7, display: "block", marginBottom: 4 }}>
                Memory Description
              </label>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="Describe this memorable moment..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "8px",
                  background: "#0a0a12",
                  border: `1px solid ${accent}40`,
                  color: "var(--text)",
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              className="tsv-btn"
              onClick={handleWriteMemory}
              disabled={!memoryText.trim() || submitting}
              style={{ fontSize: 11, width: "100%" }}
            >
              {submitting ? "Saving..." : "Save Memory"}
            </button>

            {error && (
              <div style={{ marginTop: 8, fontSize: 10, color: "#ff4444" }}>
                {error}
              </div>
            )}
          </div>
        )}

        {memories.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memories.slice(0, 10).map((memory, idx) => (
              <div
                key={idx}
                style={{
                  padding: 10,
                  background: `${accent}08`,
                  borderLeft: `2px solid ${accent}`,
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                {memory.tag && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      background: `${accent}30`,
                      borderRadius: 2,
                      marginRight: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {memory.tag}
                  </span>
                )}
                {memory.text || memory.description || memory}
                {memory.timestamp && (
                  <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>
                    {new Date(memory.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.7, textAlign: "center", padding: "20px 0" }}>
            No memories yet. Create your first memory together!
          </div>
        )}
      </div>
    </div>
  );
}
