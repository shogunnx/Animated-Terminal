const box = { marginBottom: 14, padding: 12, borderRadius: 10, border: "1px solid rgba(255,215,0,.35)", background: "rgba(255,215,0,.05)" };
const field = { width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,.4)", color: "#e8f6ff", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, padding: "7px 9px", fontSize: 11, fontFamily: "inherit" };

export const REFERENCE_CATEGORIES = ["gamingAccessories", "powerRangers", "mechaCosplay", "animeLooks", "costumes", "dragonball", "iconicHair"];

export function ReferenceControls({ value, onChange, autoNames }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div style={box} data-testid="reference-controls">
      <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
        <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} data-testid="use-references-checkbox" />
        🔎 Use real references
      </label>
      <div style={{ fontSize: 10, opacity: .7, marginTop: 4 }}>
        Looks up official pictures of your props and cosplay on fan wikis, then copies their real design.
      </div>
      {value.enabled && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <select style={field} value={value.engine} onChange={(e) => set({ engine: e.target.value })} data-testid="reference-engine-select">
            <option value="nano-banana-pro">Nano Banana Pro (best prop accuracy, ~$0.15/image)</option>
            <option value="kontext-max">FLUX Kontext Max (~$0.08/image)</option>
          </select>
          <div style={{ fontSize: 10 }} data-testid="reference-auto-names">
            Looking up: {autoNames.length ? autoNames.join(", ") : <span style={{ opacity: .6 }}>pick a prop or cosplay item, or add names below</span>}
          </div>
          <input style={field} value={value.extra} maxLength={200} onChange={(e) => set({ extra: e.target.value })}
            placeholder="Also look up (comma separated), e.g. Zeo Gold Ranger" data-testid="reference-extra-input" />
          <div style={{ fontSize: 9, opacity: .6 }}>Up to 3 references per generation.</div>
        </div>
      )}
    </div>
  );
}

export function ReferencesUsed({ refs }) {
  if (!refs?.length) return null;
  return (
    <div style={{ marginTop: 10 }} data-testid="references-used">
      <div style={{ fontSize: 10, opacity: .75, marginBottom: 6 }}>References used</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {refs.map((r, i) => (
          <a key={r.page_url} href={r.page_url} target="_blank" rel="noopener noreferrer" data-testid={`reference-used-${i}`}
            style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 10, color: "#ffd76a", textDecoration: "none", border: "1px solid rgba(255,215,0,.3)", borderRadius: 8, padding: 4 }}>
            <img src={r.image_url} alt={`Reference: ${r.title}`} style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 4, background: "#fff" }} />
            {r.title}
          </a>
        ))}
      </div>
    </div>
  );
}
