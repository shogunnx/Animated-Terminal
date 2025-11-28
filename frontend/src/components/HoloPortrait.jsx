export default function HoloPortrait({ name="UNKNOWN", accent="#76FFE1", glow="#8C50FF" }) {
  return (
    <svg viewBox="0 0 420 520" width="100%" height="100%" style={{ display:"block" }}>
      <defs>
        <linearGradient id="bg" x1="0" x2="1">
          <stop offset="0" stopColor={glow} stopOpacity=".20"/>
          <stop offset="1" stopColor={accent} stopOpacity=".16"/>
        </linearGradient>
        <radialGradient id="halo" cx=".5" cy=".25" r=".75">
          <stop offset="0" stopColor={accent} stopOpacity=".55"/>
          <stop offset="1" stopColor={accent} stopOpacity="0"/>
        </radialGradient>
      </defs>

      <rect width="420" height="520" rx="24" fill="url(#bg)"/>
      <circle cx="210" cy="120" r="160" fill="url(#halo)"/>

      <g opacity=".92">
        <path
          d="M210 84c-34 0-62 28-62 62 0 23 13 43 32 53-28 10-50 36-56 69l-8 44h188l-8-44c-6-33-28-59-56-69 19-10 32-30 32-53 0-34-28-62-62-62z"
          fill={accent} fillOpacity=".24"
        />
        <path
          d="M210 96c-27 0-49 22-49 49 0 27 22 49 49 49 27 0 49-22 49-49 0-27-22-49-49-49z"
          fill={accent} fillOpacity=".18"
        />
        <path
          d="M144 316h132c22 0 40 18 40 40v82H104v-82c0-22 18-40 40-40z"
          fill={accent} fillOpacity=".16"
        />
      </g>

      <g opacity=".18">
        {Array.from({ length: 42 }).map((_, i) => (
          <rect key={i} x="24" y={24 + i * 11} width="372" height="1" fill="#fff" />
        ))}
      </g>

      <g>
        <rect x="40" y="446" width="340" height="48" rx="14" fill="#000" opacity=".28"/>
        <text x="210" y="477" textAnchor="middle" fill="white" opacity=".92"
          style={{ fontFamily:"ui-monospace, Menlo, monospace", letterSpacing: "0.12em", fontSize: 15 }}>
          {name.toUpperCase()}
        </text>
      </g>

      <rect x="10" y="10" width="400" height="500" rx="24" fill="none" stroke={accent} strokeOpacity=".20" />
    </svg>
  );
}
