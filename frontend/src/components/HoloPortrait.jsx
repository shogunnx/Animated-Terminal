export default function HoloPortrait({ name="UNKNOWN", accent="#76FFE1", glow="#8C50FF" }) {
  return (
    <svg viewBox="0 0 420 520" width="100%" height="100%" style={{ display:"block" }}>
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={glow} stopOpacity=".12"/>
          <stop offset="0.5" stopColor={accent} stopOpacity=".08"/>
          <stop offset="1" stopColor={glow} stopOpacity=".12"/>
        </linearGradient>
        <radialGradient id="halo" cx=".5" cy=".3" r=".6">
          <stop offset="0" stopColor={accent} stopOpacity=".4"/>
          <stop offset="0.5" stopColor={accent} stopOpacity=".2"/>
          <stop offset="1" stopColor="transparent"/>
        </radialGradient>
        <radialGradient id="core" cx=".5" cy=".4" r=".3">
          <stop offset="0" stopColor={accent} stopOpacity=".6"/>
          <stop offset="1" stopColor="transparent"/>
        </radialGradient>
      </defs>

      <rect width="420" height="520" fill="url(#bg)"/>
      
      {/* ENERGY HALO */}
      <ellipse cx="210" cy="160" rx="180" ry="140" fill="url(#halo)">
        <animate attributeName="opacity" values=".8;.5;.8" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="210" cy="220" rx="120" ry="90" fill="url(#core)"/>

      {/* HOLOGRAPHIC FIGURE - MORE GEOMETRIC/RETRO */}
      <g opacity=".85">
        {/* HEAD - HEXAGON */}
        <polygon 
          points="210,100 240,120 240,160 210,180 180,160 180,120" 
          fill={accent} 
          fillOpacity=".20"
          stroke={accent}
          strokeWidth="2"
          strokeOpacity=".4"
        />
        
        {/* TORSO - RECTANGLE */}
        <rect 
          x="170" 
          y="180" 
          width="80" 
          height="110" 
          fill={accent} 
          fillOpacity=".16"
          stroke={accent}
          strokeWidth="2"
          strokeOpacity=".4"
        />
        
        {/* LEGS - TRAPEZOID */}
        <polygon 
          points="170,290 250,290 260,390 160,390" 
          fill={accent} 
          fillOpacity=".14"
          stroke={accent}
          strokeWidth="2"
          strokeOpacity=".4"
        />
        
        {/* ARMS */}
        <rect x="140" y="190" width="20" height="80" fill={accent} fillOpacity=".14" stroke={accent} strokeWidth="1" strokeOpacity=".3"/>
        <rect x="260" y="190" width="20" height="80" fill={accent} fillOpacity=".14" stroke={accent} strokeWidth="1" strokeOpacity=".3"/>
        
        {/* GRID OVERLAY */}
        <line x1="180" y1="140" x2="240" y2="140" stroke={accent} strokeOpacity=".3"/>
        <line x1="210" y1="100" x2="210" y2="390" stroke={accent} strokeOpacity=".3"/>
        <line x1="170" y1="235" x2="250" y2="235" stroke={accent} strokeOpacity=".3"/>
        <line x1="170" y1="290" x2="250" y2="290" stroke={accent} strokeOpacity=".4" strokeWidth="2"/>
      </g>

      {/* SCANLINES - RETRO CRT EFFECT */}
      <g opacity=".25">
        {Array.from({ length: 52 }).map((_, i) => (
          <line key={i} x1="20" y1={10 + i * 10} x2="400" y2={10 + i * 10} stroke={accent} strokeWidth="1" strokeOpacity=".3" />
        ))}
      </g>

      {/* DATA READOUT BOX */}
      <g>
        <rect x="30" y="430" width="360" height="60" fill="#0a0a12" opacity=".85" 
          stroke={accent} strokeWidth="2" strokeOpacity=".5"/>
        <text x="210" y="465" textAnchor="middle" fill={accent} opacity=".95"
          style={{ fontFamily:"ui-monospace, Menlo, monospace", letterSpacing: "0.15em", fontSize: 16, fontWeight:"bold" }}>
          {name.toUpperCase()}
        </text>
        
        {/* STATUS LIGHTS */}
        <circle cx="50" cy="450" r="4" fill={accent} opacity=".8">
          <animate attributeName="opacity" values=".8;.3;.8" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="65" cy="450" r="4" fill={accent} opacity=".5"/>
        <circle cx="80" cy="450" r="4" fill={accent} opacity=".5"/>
        
        <text x="100" y="455" fill={accent} opacity=".6" style={{ fontFamily:"monospace", fontSize: 9 }}>
          ACTIVE
        </text>
      </g>

      {/* CORNER TECH BRACKETS */}
      <path d="M0 0 L40 0 L40 2 L2 2 L2 40 L0 40 Z" fill={accent} opacity=".4"/>
      <path d="M420 0 L380 0 L380 2 L418 2 L418 40 L420 40 Z" fill={accent} opacity=".4"/>
      <path d="M0 520 L40 520 L40 518 L2 518 L2 480 L0 480 Z" fill={accent} opacity=".4"/>
      <path d="M420 520 L380 520 L380 518 L418 518 L418 480 L420 480 Z" fill={accent} opacity=".4"/>
    </svg>
  );
}