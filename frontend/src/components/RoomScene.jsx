import { useMemo, useState } from "react";
import { nexusChat } from "../lib/api.js";
import { addHotspotClick } from "../utils/engagement.js";

function Backdrop({ a, b, title, isGameRoom }) {
  // Special bright game room
  if (isGameRoom) {
    return (
      <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" style={{ display:"block" }}>
        <defs>
          <linearGradient id="brightWall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff6b00" stopOpacity=".4"/>
            <stop offset="0.5" stopColor="#ffd700" stopOpacity=".3"/>
            <stop offset="1" stopColor="#ff6b00" stopOpacity=".2"/>
          </linearGradient>
          <linearGradient id="brightFloor" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a3050" />
            <stop offset="1" stopColor="#2a2040" />
          </linearGradient>
          <radialGradient id="neonGlow" cx=".5" cy=".5">
            <stop offset="0" stopColor="#ffd700" stopOpacity=".6"/>
            <stop offset="1" stopColor="transparent"/>
          </radialGradient>
        </defs>

        {/* Bright ceiling with lights */}
        <polygon points="0,0 1200,0 900,200 300,200" fill="#3a3a4a" />
        <rect x="0" y="0" width="1200" height="200" fill="url(#brightWall)" opacity=".8"/>
        
        {/* Ceiling lights */}
        <g>
          <ellipse cx="300" cy="80" rx="40" ry="15" fill="#ffd700" opacity=".7">
            <animate attributeName="opacity" values=".7;.9;.7" dur="2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="600" cy="80" rx="40" ry="15" fill="#ff6b00" opacity=".7">
            <animate attributeName="opacity" values=".7;.9;.7" dur="2.3s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="900" cy="80" rx="40" ry="15" fill="#ffd700" opacity=".7">
            <animate attributeName="opacity" values=".7;.9;.7" dur="2.5s" repeatCount="indefinite"/>
          </ellipse>
        </g>

        {/* Left wall - bright */}
        <polygon points="0,0 300,200 300,500 0,700" fill="#3a3050" />
        <polygon points="0,0 300,200 300,500 0,700" fill="url(#brightWall)" opacity=".5"/>
        
        {/* Right wall - bright */}
        <polygon points="1200,0 900,200 900,500 1200,700" fill="#3a3050" />
        <polygon points="1200,0 900,200 900,500 1200,700" fill="url(#brightWall)" opacity=".5"/>

        {/* Floor - colorful tiles */}
        <polygon points="300,500 900,500 1200,700 0,700" fill="url(#brightFloor)" />
        {/* Floor tile pattern */}
        <g opacity=".3">
          {Array.from({length: 8}).map((_, i) => 
            Array.from({length: 6}).map((_, j) => (
              <rect 
                key={`${i}-${j}`}
                x={150 + i * 100} 
                y={520 + j * 30} 
                width="90" 
                height="25" 
                fill={((i + j) % 2 === 0) ? "#ffd700" : "#ff6b00"} 
                opacity=".2"
                stroke="#000" 
                strokeWidth=".5"
              />
            ))
          )}
        </g>

        {/* ARCADE CABINETS - LEFT */}
        <g>
          {/* First cabinet */}
          <rect x="80" y="280" width="140" height="200" fill="#2a2a3a" stroke="#ffd700" strokeWidth="3"/>
          <rect x="90" y="290" width="120" height="90" fill="#00ff88" opacity=".3"/>
          <text x="150" y="340" textAnchor="middle" fill="#ffd700" style={{fontSize:"16px", fontWeight:"bold"}}>GAME 1</text>
          <rect x="110" y="390" width="80" height="60" fill="#1a1a2a"/>
          <circle cx="130" cy="420" r="15" fill="#ff6b00" opacity=".7"/>
          <circle cx="170" cy="420" r="15" fill="#ffd700" opacity=".7"/>
          
          {/* Screen glow */}
          <rect x="90" y="290" width="120" height="90" fill="url(#neonGlow)">
            <animate attributeName="opacity" values=".5;.8;.5" dur="1.5s" repeatCount="indefinite"/>
          </rect>
        </g>

        {/* ARCADE CABINETS - RIGHT */}
        <g>
          {/* Second cabinet */}
          <rect x="980" y="280" width="140" height="200" fill="#2a2a3a" stroke="#ff6b00" strokeWidth="3"/>
          <rect x="990" y="290" width="120" height="90" fill="#ff00ff" opacity=".3"/>
          <text x="1050" y="340" textAnchor="middle" fill="#ff6b00" style={{fontSize:"16px", fontWeight:"bold"}}>GAME 2</text>
          <rect x="1010" y="390" width="80" height="60" fill="#1a1a2a"/>
          <circle cx="1030" cy="420" r="15" fill="#ffd700" opacity=".7"/>
          <circle cx="1070" cy="420" r="15" fill="#ff6b00" opacity=".7"/>
          
          {/* Screen glow */}
          <rect x="990" y="290" width="120" height="90" fill="url(#neonGlow)">
            <animate attributeName="opacity" values=".5;.8;.5" dur="1.8s" repeatCount="indefinite"/>
          </rect>
        </g>

        {/* LARGE SCREEN - BACK WALL */}
        <g>
          <rect x="400" y="210" width="400" height="220" fill="#1a1a2a" stroke="#ffd700" strokeWidth="4"/>
          <rect x="415" y="225" width="370" height="190" fill="#2a2050"/>
          <rect x="415" y="225" width="370" height="190" fill="url(#neonGlow)" opacity=".6"/>
          
          <text x="600" y="280" textAnchor="middle" fill="#ffd700" style={{fontSize:"24px", fontWeight:"bold", letterSpacing:".2em"}}>
            {title?.toUpperCase() || "GAME ROOM"}
          </text>
          <text x="600" y="320" textAnchor="middle" fill="#ff6b00" style={{fontSize:"16px"}}>
            ARCADE PARADISE
          </text>
          
          {/* High score display */}
          <rect x="450" y="340" width="300" height="60" fill="#000" opacity=".5"/>
          <text x="600" y="365" textAnchor="middle" fill="#00ff88" style={{fontSize:"14px"}}>
            HIGH SCORES
          </text>
          <text x="600" y="385" textAnchor="middle" fill="#ffd700" style={{fontSize:"12px", fontFamily:"monospace"}}>
            1ST: 999,999 | 2ND: 888,888 | 3RD: 777,777
          </text>
        </g>

        {/* GAMING CONSOLE SETUP - CENTER */}
        <g>
          {/* TV Stand */}
          <rect x="480" y="450" width="240" height="40" fill="#4a3f38"/>
          <rect x="480" y="450" width="240" height="40" fill="url(#woodTexture)" opacity=".5"/>
          
          {/* Consoles */}
          <rect x="500" y="460" width="80" height="20" rx="3" fill="#2a2a3a" stroke="#ffd700" strokeWidth="1"/>
          <circle cx="510" cy="470" r="2" fill="#00ff88">
            <animate attributeName="opacity" values=".5;1;.5" dur="1s" repeatCount="indefinite"/>
          </circle>
          
          <rect x="620" y="460" width="80" height="20" rx="3" fill="#2a2a3a" stroke="#ff6b00" strokeWidth="1"/>
          <circle cx="630" cy="470" r="2" fill="#ff6b00">
            <animate attributeName="opacity" values=".5;1;.5" dur="1.2s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* SNACK BAR - RIGHT SIDE */}
        <g>
          <rect x="820" y="350" width="100" height="120" fill="#3a2f28"/>
          <rect x="820" y="350" width="100" height="120" fill="url(#woodTexture)" opacity=".4"/>
          <rect x="830" y="360" width="80" height="30" fill="#ffd700" opacity=".2"/>
          <text x="870" y="380" textAnchor="middle" fill="#ffd700" style={{fontSize:"10px"}}>SNACKS</text>
          
          {/* Snack items */}
          <rect x="835" y="395" width="20" height="30" fill="#ff6b00" opacity=".5"/>
          <rect x="860" y="395" width="20" height="30" fill="#ffd700" opacity=".5"/>
          <rect x="885" y="395" width="20" height="30" fill="#00ff88" opacity=".5"/>
        </g>

        {/* PARTY LIGHTS EVERYWHERE */}
        <g opacity=".4">
          <circle cx="200" cy="150" r="30" fill="#ff6b00">
            <animate attributeName="opacity" values=".3;.8;.3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="1000" cy="150" r="30" fill="#ffd700">
            <animate attributeName="opacity" values=".3;.8;.3" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="600" cy="500" r="50" fill="#00ff88">
            <animate attributeName="opacity" values=".2;.6;.2" dur="3s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* NEON SIGN */}
        <g>
          <text x="280" y="260" fill="#ffd700" style={{fontSize:"18px", fontWeight:"bold", letterSpacing:".1em"}}>
            ★ PLAY ★
          </text>
          <text x="920" y="260" fill="#ff6b00" style={{fontSize:"18px", fontWeight:"bold", letterSpacing:".1em"}}>
            ★ WIN ★
          </text>
        </g>
      </svg>
    );
  }

  // Normal bedroom backdrop
  return (
    <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" style={{ display:"block" }}>
      <defs>
        {/* ANIME-STYLE GRADIENTS */}
        <linearGradient id="leftWall" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1a1a28" />
          <stop offset="0.4" stopColor="#2a2a3e" />
          <stop offset="1" stopColor={b} stopOpacity=".4"/>
        </linearGradient>
        <linearGradient id="rightWall" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#1a1a28" />
          <stop offset="0.4" stopColor="#2a2a3e" />
          <stop offset="1" stopColor={a} stopOpacity=".4"/>
        </linearGradient>
        <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a2838" />
          <stop offset="0.5" stopColor="#1a1828" />
          <stop offset="1" stopColor="#0a0818" />
        </linearGradient>
        <linearGradient id="ceiling" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor="#1e1e2e" />
          <stop offset="1" stopColor="#12121d" />
        </linearGradient>
        <radialGradient id="ambientLight" cx=".5" cy=".3">
          <stop offset="0" stopColor={a} stopOpacity=".25"/>
          <stop offset="0.6" stopColor={b} stopOpacity=".12"/>
          <stop offset="1" stopColor="transparent"/>
        </radialGradient>
        
        {/* ANIME FURNITURE SHADING */}
        <linearGradient id="woodGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a3f38" />
          <stop offset="0.3" stopColor="#3a2f28" />
          <stop offset="0.7" stopColor="#2a1f18" />
          <stop offset="1" stopColor="#1a0f08" />
        </linearGradient>
        <linearGradient id="woodHighlight" x1="0" x2="1">
          <stop offset="0" stopColor="#5a4a42" />
          <stop offset="0.5" stopColor="#4a3a32" />
          <stop offset="1" stopColor="#3a2a22" />
        </linearGradient>
        <linearGradient id="bedSheets" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={a} stopOpacity=".6"/>
          <stop offset="0.3" stopColor={a} stopOpacity=".45"/>
          <stop offset="0.7" stopColor={a} stopOpacity=".3"/>
          <stop offset="1" stopColor="#1a1a28" />
        </linearGradient>
        <linearGradient id="pillowShade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={a} stopOpacity=".5"/>
          <stop offset="0.5" stopColor={a} stopOpacity=".7"/>
          <stop offset="1" stopColor={a} stopOpacity=".4"/>
        </linearGradient>
        <linearGradient id="metalShine" x1="0" x2="1">
          <stop offset="0" stopColor="#666" />
          <stop offset="0.4" stopColor="#888" />
          <stop offset="0.5" stopColor="#aaa" />
          <stop offset="0.6" stopColor="#888" />
          <stop offset="1" stopColor="#555" />
        </linearGradient>
        <radialGradient id="lampGlow" cx=".5" cy=".3">
          <stop offset="0" stopColor={a} stopOpacity=".9"/>
          <stop offset="0.4" stopColor={a} stopOpacity=".5"/>
          <stop offset="1" stopColor="transparent"/>
        </radialGradient>
        
        {/* TEXTURE PATTERNS */}
        <pattern id="woodTexture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#3a2f28" opacity=".3"/>
          <line x1="0" y1="5" x2="20" y2="5" stroke="#2a1f18" strokeWidth=".5" opacity=".4"/>
          <line x1="0" y1="12" x2="20" y2="12" stroke="#2a1f18" strokeWidth=".5" opacity=".4"/>
          <line x1="0" y1="18" x2="20" y2="18" stroke="#2a1f18" strokeWidth=".5" opacity=".4"/>
        </pattern>
        <pattern id="fabricTexture" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={a} opacity=".05"/>
          <circle cx="2" cy="2" r=".5" fill={a} opacity=".08"/>
          <circle cx="7" cy="5" r=".5" fill={a} opacity=".08"/>
          <circle cx="4" cy="8" r=".5" fill={a} opacity=".08"/>
        </pattern>
      </defs>

      {/* CEILING WITH SOFT SHADING */}
      <polygon points="0,0 1200,0 900,200 300,200" fill="url(#ceiling)" />
      <polygon points="0,0 1200,0 900,200 300,200" fill="#000" opacity=".1"/>
      
      {/* LEFT WALL - ANIME SHADING */}
      <polygon points="0,0 300,200 300,500 0,700" fill="url(#leftWall)" />
      <polygon points="0,0 300,200 300,500 0,700" fill={b} opacity=".08"/>
      <line x1="0" y1="0" x2="300" y2="200" stroke="#000" strokeOpacity=".2" strokeWidth="1"/>
      
      {/* RIGHT WALL - ANIME SHADING */}
      <polygon points="1200,0 900,200 900,500 1200,700" fill="url(#rightWall)" />
      <polygon points="1200,0 900,200 900,500 1200,700" fill={a} opacity=".08"/>
      <line x1="1200" y1="0" x2="900" y2="200" stroke="#000" strokeOpacity=".2" strokeWidth="1"/>

      {/* FLOOR - REALISTIC WOOD */}
      <polygon points="300,500 900,500 1200,700 0,700" fill="url(#floor)" />
      <polygon points="300,500 900,500 1200,700 0,700" fill="url(#woodTexture)" opacity=".6"/>
      {/* Floor planks */}
      <g stroke="#000" strokeOpacity=".15" strokeWidth=".5">
        <line x1="300" y1="520" x2="900" y2="520" />
        <line x1="250" y1="560" x2="950" y2="560" />
        <line x1="200" y1="600" x2="1000" y2="600" />
        <line x1="150" y1="640" x2="1050" y2="640" />
      </g>

      {/* AMBIENT LIGHTING */}
      <ellipse cx="600" cy="300" rx="450" ry="200" fill="url(#ambientLight)" />

      {/* ======= LEFT SIDE - VANITY & CLOSET ======= */}
      
      {/* ANIME-STYLE VANITY DRESSER */}
      <g>
        {/* Main body with wood texture */}
        <polygon points="75,315 285,285 285,425 75,455" fill="url(#woodGradient)"/>
        <polygon points="75,315 285,285 285,425 75,455" fill="url(#woodTexture)" opacity=".4"/>
        {/* Side panel */}
        <polygon points="285,285 325,305 325,445 285,425" fill="url(#woodHighlight)"/>
        {/* Top surface */}
        <polygon points="75,315 285,285 325,305 115,335" fill="url(#woodHighlight)"/>
        <polygon points="75,315 285,285 325,305 115,335" fill={a} opacity=".15"/>
        
        {/* Drawers with anime cel-shading */}
        <g>
          <rect x="90" y="330" width="180" height="38" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="90" y="330" width="180" height="38" fill={a} opacity=".08"/>
          <line x1="90" y1="332" x2="270" y2="332" stroke="#5a4a42" opacity=".6" strokeWidth="1"/>
          <ellipse cx="180" cy="349" rx="8" ry="4" fill="url(#metalShine)"/>
        </g>
        <g>
          <rect x="90" y="378" width="180" height="38" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="90" y="378" width="180" height="38" fill={a} opacity=".08"/>
          <line x1="90" y1="380" x2="270" y2="380" stroke="#5a4a42" opacity=".6" strokeWidth="1"/>
          <ellipse cx="180" cy="397" rx="8" ry="4" fill="url(#metalShine)"/>
        </g>
        
        {/* Mirror with frame */}
        <g>
          <rect x="85" y="275" width="190" height="8" fill="url(#woodGradient)" stroke="#2a1f18"/>
          <rect x="110" y="205" width="140" height="68" rx="4" fill="#1a1a28" stroke="#3a3a48" strokeWidth="2"/>
          <rect x="115" y="210" width="130" height="58" rx="2" fill={a} fillOpacity=".15"/>
          {/* Mirror reflection effect */}
          <rect x="115" y="210" width="130" height="58" fill="url(#ambientLight)" opacity=".3"/>
          <line x1="115" y1="210" x2="180" y2="240" stroke="#fff" opacity=".15" strokeWidth="1"/>
          <circle cx="180" cy="240" r="15" fill={a} opacity=".08"/>
        </g>
        
        {/* Decorative items on vanity */}
        <ellipse cx="100" cy="300" rx="8" ry="6" fill={a} opacity=".4"/>
        <rect x="250" y="295" width="12" height="18" rx="2" fill={a} opacity=".35"/>
      </g>

      {/* ANIME-STYLE WARDROBE */}
      <g>
        {/* Main body */}
        <polygon points="15,175 155,155 155,485 15,525" fill="url(#woodGradient)"/>
        <polygon points="15,175 155,155 155,485 15,525" fill="url(#woodTexture)" opacity=".5"/>
        {/* Top */}
        <polygon points="15,175 155,155 165,160 25,180" fill="url(#woodHighlight)"/>
        
        {/* Left door with panels */}
        <g>
          <rect x="22" y="190" width="60" height="280" rx="3" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="22" y="190" width="60" height="280" fill={a} opacity=".05"/>
          <rect x="28" y="200" width="48" height="80" fill="#2a1f18" opacity=".3" stroke={a} strokeOpacity=".2"/>
          <rect x="28" y="290" width="48" height="160" fill="#2a1f18" opacity=".3" stroke={a} strokeOpacity=".2"/>
          <line x1="22" y1="192" x2="82" y2="192" stroke="#5a4a42" opacity=".5"/>
          {/* Handle */}
          <ellipse cx="70" cy="330" rx="3" ry="10" fill="url(#metalShine)"/>
        </g>
        
        {/* Right door */}
        <g>
          <rect x="88" y="185" width="60" height="280" rx="3" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="88" y="185" width="60" height="280" fill={a} opacity=".05"/>
          <rect x="94" y="195" width="48" height="80" fill="#2a1f18" opacity=".3" stroke={a} strokeOpacity=".2"/>
          <rect x="94" y="285" width="48" height="160" fill="#2a1f18" opacity=".3" stroke={a} strokeOpacity=".2"/>
          <line x1="88" y1="187" x2="148" y2="187" stroke="#5a4a42" opacity=".5"/>
          {/* Handle */}
          <ellipse cx="98" cy="325" rx="3" ry="10" fill="url(#metalShine)"/>
        </g>
      </g>

      {/* ======= RIGHT SIDE - DRESSER & SHELVES ======= */}
      
      {/* ANIME-STYLE TALL DRESSER */}
      <g>
        {/* Main body */}
        <polygon points="915,285 1125,315 1125,455 915,425" fill="url(#woodGradient)"/>
        <polygon points="915,285 1125,315 1125,455 915,425" fill="url(#woodTexture)" opacity=".4"/>
        {/* Side panel */}
        <polygon points="875,305 915,285 915,425 875,445" fill="url(#woodHighlight)"/>
        {/* Top */}
        <polygon points="875,305 915,285 1125,315 1085,335" fill="url(#woodHighlight)"/>
        <polygon points="875,305 915,285 1125,315 1085,335" fill={b} opacity=".15"/>
        
        {/* Three drawers with cel-shading */}
        <g>
          <rect x="930" y="300" width="180" height="36" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="930" y="300" width="180" height="36" fill={b} opacity=".08"/>
          <line x1="930" y1="302" x2="1110" y2="302" stroke="#5a4a42" opacity=".6" strokeWidth="1"/>
          <ellipse cx="1020" cy="318" rx="8" ry="4" fill="url(#metalShine)"/>
        </g>
        <g>
          <rect x="930" y="346" width="180" height="36" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="930" y="346" width="180" height="36" fill={b} opacity=".08"/>
          <line x1="930" y1="348" x2="1110" y2="348" stroke="#5a4a42" opacity=".6" strokeWidth="1"/>
          <ellipse cx="1020" cy="364" rx="8" ry="4" fill="url(#metalShine)"/>
        </g>
        <g>
          <rect x="930" y="392" width="180" height="36" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1.5"/>
          <rect x="930" y="392" width="180" height="36" fill={b} opacity=".08"/>
          <line x1="930" y1="394" x2="1110" y2="394" stroke="#5a4a42" opacity=".6" strokeWidth="1"/>
          <ellipse cx="1020" cy="410" rx="8" ry="4" fill="url(#metalShine)"/>
        </g>
      </g>

      {/* ANIME-STYLE BOOKSHELF */}
      <g>
        {/* Main frame */}
        <polygon points="1045,155 1185,175 1185,490 1045,530" fill="url(#woodGradient)"/>
        <polygon points="1045,155 1185,175 1185,490 1045,530" fill="url(#woodTexture)" opacity=".5"/>
        
        {/* Shelves with depth */}
        <g>
          <polygon points="1050,230 1180,240 1180,248 1050,238" fill="url(#woodHighlight)"/>
          <rect x="1050" y="238" width="130" height="3" fill="#2a1f18"/>
        </g>
        <g>
          <polygon points="1050,310 1180,320 1180,328 1050,318" fill="url(#woodHighlight)"/>
          <rect x="1050" y="318" width="130" height="3" fill="#2a1f18"/>
        </g>
        <g>
          <polygon points="1050,395 1180,405 1180,413 1050,403" fill="url(#woodHighlight)"/>
          <rect x="1050" y="403" width="130" height="3" fill="#2a1f18"/>
        </g>
        
        {/* Books and items */}
        <g>
          <rect x="1065" y="168" width="22" height="58" fill={b} opacity=".6" stroke="#000" strokeWidth=".5"/>
          <rect x="1090" y="170" width="28" height="56" fill={b} opacity=".5" stroke="#000" strokeWidth=".5"/>
          <rect x="1122" y="172" width="24" height="54" fill={b} opacity=".55" stroke="#000" strokeWidth=".5"/>
          <rect x="1150" y="174" width="20" height="52" fill={b} opacity=".65" stroke="#000" strokeWidth=".5"/>
        </g>
        <g>
          <circle cx="1080" cy="260" r="12" fill={b} opacity=".4" stroke="#000" strokeWidth=".5"/>
          <ellipse cx="1130" cy="265" rx="15" ry="12" fill={b} opacity=".35" stroke="#000" strokeWidth=".5"/>
          <rect x="1155" y="252" width="18" height="24" fill={b} opacity=".45" stroke="#000" strokeWidth=".5"/>
        </g>
      </g>

      {/* ======= CENTER - ANIME-STYLE BED ======= */}
      <g>
        {/* Headboard with detail */}
        <g>
          <polygon points="380,385 820,385 840,405 360,405" fill="url(#woodGradient)"/>
          <polygon points="380,385 820,385 840,405 360,405" fill="url(#woodTexture)" opacity=".6"/>
          <rect x="385" y="388" width="430" height="14" fill="#5a4a42" opacity=".4"/>
          <line x1="385" y1="390" x2="815" y2="390" stroke="#6a5a52" opacity=".6" strokeWidth="1"/>
          {/* Decorative carving */}
          <ellipse cx="600" cy="395" rx="40" ry="6" fill={a} opacity=".2"/>
        </g>
        
        {/* Bed frame base */}
        <polygon points="360,420 840,420 880,490 320,490" fill="url(#woodGradient)"/>
        <polygon points="360,420 840,420 880,490 320,490" fill="url(#woodTexture)" opacity=".5"/>
        <line x1="360" y1="422" x2="840" y2="422" stroke="#5a4a42" opacity=".5"/>
        
        {/* Mattress with depth and shadow */}
        <polygon points="370,430 830,430 870,500 330,500" fill="url(#bedSheets)"/>
        <polygon points="370,430 830,430 870,500 330,500" fill="url(#fabricTexture)" opacity=".7"/>
        
        {/* Top surface with soft shading */}
        <ellipse cx="600" cy="440" rx="230" ry="45" fill={a} fillOpacity=".35"/>
        <ellipse cx="600" cy="438" rx="230" ry="40" fill="url(#pillowShade)"/>
        <ellipse cx="600" cy="438" rx="230" ry="40" fill="url(#fabricTexture)" opacity=".5"/>
        
        {/* Pillows with anime cel-shading */}
        <g>
          {/* Left pillow */}
          <ellipse cx="520" cy="420" rx="70" ry="30" fill={a} fillOpacity=".6"/>
          <ellipse cx="520" cy="420" rx="70" ry="30" fill="url(#pillowShade)"/>
          <ellipse cx="520" cy="418" rx="65" ry="25" fill={a} fillOpacity=".5"/>
          <ellipse cx="515" cy="415" rx="30" ry="12" fill="#fff" opacity=".15"/>
          <path d="M 470 420 Q 520 425 570 420" stroke={a} strokeOpacity=".2" fill="none"/>
        </g>
        <g>
          {/* Right pillow */}
          <ellipse cx="680" cy="420" rx="70" ry="30" fill={a} fillOpacity=".6"/>
          <ellipse cx="680" cy="420" rx="70" ry="30" fill="url(#pillowShade)"/>
          <ellipse cx="680" cy="418" rx="65" ry="25" fill={a} fillOpacity=".5"/>
          <ellipse cx="675" cy="415" rx="30" ry="12" fill="#fff" opacity=".15"/>
          <path d="M 630 420 Q 680 425 730 420" stroke={a} strokeOpacity=".2" fill="none"/>
        </g>
        
        {/* Sheets wrinkles and folds */}
        <path d="M 380 455 Q 450 460 520 455 Q 600 462 680 455 Q 750 460 820 455" 
          stroke={a} strokeOpacity=".2" strokeWidth="1.5" fill="none"/>
        <path d="M 390 475 Q 500 480 600 478 Q 700 480 810 475" 
          stroke={a} strokeOpacity=".15" strokeWidth="1" fill="none"/>
        <path d="M 400 490 Q 600 495 800 490" 
          stroke={a} strokeOpacity=".1" strokeWidth="1" fill="none"/>
        
        {/* Shadow under pillows */}
        <ellipse cx="520" cy="430" rx="60" ry="8" fill="#000" opacity=".2"/>
        <ellipse cx="680" cy="430" rx="60" ry="8" fill="#000" opacity=".2"/>
        
        {/* Blanket edge detail */}
        <path d="M 370 485 L 375 490 L 370 495" stroke={a} strokeOpacity=".3" strokeWidth="1" fill="none"/>
        <path d="M 420 495 L 425 500 L 420 505" stroke={a} strokeOpacity=".25" strokeWidth="1" fill="none"/>
        
        {/* Bedposts with ornate tops */}
        <g>
          <rect x="355" y="375" width="18" height="70" rx="2" fill="url(#woodGradient)"/>
          <line x1="358" y1="377" x2="358" y2="443" stroke="#5a4a42" opacity=".6"/>
          <polygon points="355,370 373,370 369,365 359,365" fill="url(#woodHighlight)"/>
          <ellipse cx="364" cy="368" rx="8" ry="4" fill={a} opacity=".4"/>
        </g>
        <g>
          <rect x="827" y="375" width="18" height="70" rx="2" fill="url(#woodGradient)"/>
          <line x1="830" y1="377" x2="830" y2="443" stroke="#5a4a42" opacity=".6"/>
          <polygon points="827,370 845,370 841,365 831,365" fill="url(#woodHighlight)"/>
          <ellipse cx="836" cy="368" rx="8" ry="4" fill={a} opacity=".4"/>
        </g>
      </g>

      {/* ANIME-STYLE NIGHTSTAND - LEFT */}
      <g>
        {/* Main body */}
        <polygon points="315,455 385,450 385,525 315,535" fill="url(#woodGradient)"/>
        <polygon points="315,455 385,450 385,525 315,535" fill="url(#woodTexture)" opacity=".4"/>
        {/* Top surface */}
        <polygon points="315,455 385,450 395,455 325,460" fill="url(#woodHighlight)"/>
        <polygon points="315,455 385,450 395,455 325,460" fill={a} opacity=".1"/>
        
        {/* Drawer */}
        <rect x="325" y="475" width="50" height="35" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1"/>
        <rect x="325" y="475" width="50" height="35" fill={a} opacity=".05"/>
        <line x1="325" y1="477" x2="375" y2="477" stroke="#5a4a42" opacity=".5"/>
        <ellipse cx="350" cy="492" rx="6" ry="3" fill="url(#metalShine)"/>
        
        {/* Anime-style lamp */}
        <g>
          {/* Lamp base */}
          <ellipse cx="350" cy="450" rx="12" ry="4" fill="url(#woodGradient)"/>
          <rect x="348" y="438" width="4" height="12" fill="#4a3f38"/>
          
          {/* Lampshade */}
          <polygon points="335,425 365,425 370,438 330,438" fill={a} fillOpacity=".5" stroke={a} strokeOpacity=".6"/>
          <polygon points="335,425 365,425 370,438 330,438" fill="url(#fabricTexture)" opacity=".6"/>
          <ellipse cx="350" cy="425" rx="15" ry="5" fill={a} fillOpacity=".3"/>
          
          {/* Light glow */}
          <ellipse cx="350" cy="432" rx="25" ry="15" fill="url(#lampGlow)">
            <animate attributeName="opacity" values=".8;.6;.8" dur="2.5s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="350" cy="430" r="3" fill={a} opacity=".9">
            <animate attributeName="opacity" values=".9;.6;.9" dur="2.5s" repeatCount="indefinite"/>
          </circle>
        </g>
        
        {/* Book on nightstand */}
        <rect x="330" y="455" width="15" height="18" fill={a} opacity=".3" stroke="#000" strokeWidth=".5"/>
      </g>

      {/* ANIME-STYLE NIGHTSTAND - RIGHT */}
      <g>
        {/* Main body */}
        <polygon points="815,450 885,455 885,535 815,525" fill="url(#woodGradient)"/>
        <polygon points="815,450 885,455 885,535 815,525" fill="url(#woodTexture)" opacity=".4"/>
        {/* Top surface */}
        <polygon points="805,455 815,450 885,455 875,460" fill="url(#woodHighlight)"/>
        <polygon points="805,455 815,450 885,455 875,460" fill={b} opacity=".1"/>
        
        {/* Drawer */}
        <rect x="825" y="470" width="50" height="35" fill="#3a2f28" stroke="#2a1f18" strokeWidth="1"/>
        <rect x="825" y="470" width="50" height="35" fill={b} opacity=".05"/>
        <line x1="825" y1="472" x2="875" y2="472" stroke="#5a4a42" opacity=".5"/>
        <ellipse cx="850" cy="487" rx="6" ry="3" fill="url(#metalShine)"/>
        
        {/* Decorative item */}
        <circle cx="855" cy="458" r="8" fill={b} opacity=".35" stroke="#000" strokeWidth=".5"/>
      </g>

      {/* ANIME-STYLE BACK WALL DISPLAY */}
      <g>
        {/* Frame with wood texture */}
        <rect x="445" y="215" width="310" height="170" rx="4" fill="url(#woodGradient)" stroke="#2a1f18" strokeWidth="2"/>
        <rect x="445" y="215" width="310" height="170" fill="url(#woodTexture)" opacity=".3"/>
        
        {/* Screen/glass */}
        <rect x="460" y="230" width="280" height="140" rx="2" fill="#1a1a28" stroke="#3a3a48" strokeWidth="1.5"/>
        <rect x="460" y="230" width="280" height="140" fill={a} fillOpacity=".12"/>
        <rect x="460" y="230" width="280" height="140" fill="url(#ambientLight)" opacity=".2"/>
        
        {/* Reflection effect */}
        <ellipse cx="520" cy="260" rx="40" ry="20" fill="#fff" opacity=".08"/>
        <line x1="465" y1="235" x2="550" y2="280" stroke="#fff" opacity=".1" strokeWidth="1.5"/>
        
        {/* Title display */}
        <text x="600" y="285" textAnchor="middle" fill={a} opacity=".85" 
          style={{ fontFamily:"ui-monospace, Menlo, monospace", fontSize: "13px", letterSpacing:".2em", fontWeight:"500" }}>
          {title?.toUpperCase()}
        </text>
        
        {/* Decorative lines */}
        <line x1="500" y1="305" x2="700" y2="305" stroke={a} opacity=".3" strokeWidth="1"/>
        <rect x="590" y="320" width="20" height="2" fill={a} opacity=".4"/>
        
        {/* Soft scanlines */}
        <g opacity=".15">
          {Array.from({length: 20}).map((_, i) => (
            <line key={i} x1="465" y1={235 + i * 7} x2="735" y2={235 + i * 7} stroke={a} strokeWidth=".5" strokeOpacity=".4"/>
          ))}
        </g>
        
        {/* Status indicators */}
        <circle cx="475" cy="245" r="3" fill={a} opacity=".8">
          <animate attributeName="opacity" values=".8;.4;.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="488" cy="245" r="3" fill={a} opacity=".5"/>
        <circle cx="501" cy="245" r="3" fill={a} opacity=".5"/>
      </g>

      {/* ANIME-STYLE RUG WITH PATTERN */}
      <g>
        {/* Main rug body */}
        <ellipse cx="600" cy="600" rx="210" ry="65" fill={a} fillOpacity=".2"/>
        <ellipse cx="600" cy="598" rx="205" ry="62" fill={a} fillOpacity=".25"/>
        <ellipse cx="600" cy="598" rx="205" ry="62" fill="url(#fabricTexture)" opacity=".8"/>
        
        {/* Rug border pattern */}
        <ellipse cx="600" cy="598" rx="200" ry="58" fill="none" stroke={a} strokeWidth="2" strokeOpacity=".4"/>
        <ellipse cx="600" cy="598" rx="190" ry="52" fill="none" stroke={a} strokeWidth="1" strokeOpacity=".3"/>
        
        {/* Decorative pattern */}
        <g opacity=".3">
          <circle cx="550" cy="595" r="8" fill="none" stroke={a} strokeWidth="1"/>
          <circle cx="600" cy="595" r="10" fill="none" stroke={a} strokeWidth="1"/>
          <circle cx="650" cy="595" r="8" fill="none" stroke={a} strokeWidth="1"/>
        </g>
        
        {/* Shadow underneath */}
        <ellipse cx="600" cy="605" rx="200" ry="60" fill="#000" opacity=".15"/>
        
        {/* Fringe effect */}
        <g opacity=".35">
          {Array.from({length: 25}).map((_, i) => {
            const x = 395 + i * 17;
            const y = 598 + Math.sin(i * 0.5) * 60;
            return <line key={i} x1={x} y1={y} x2={x} y2={y + 8} stroke={a} strokeWidth="1.5"/>;
          })}
        </g>
      </g>

      {/* HORIZON LINE (subtle) */}
      <line x1="300" y1="200" x2="900" y2="200" stroke="#000" strokeWidth="1" opacity=".2"/>
      <line x1="300" y1="500" x2="900" y2="500" stroke="#000" strokeWidth="1" opacity=".2"/>
    </svg>
  );
}

export default function RoomScene({ room, characterId, onTalk }) {
  const [selected, setSelected] = useState(null);
  const [payload, setPayload] = useState("");

  const a = room?.palette?.a || "#76FFE1";
  const b = room?.palette?.b || "#8C50FF";
  const isGameRoom = characterId === "gameroom";

  const promptForAction = useMemo(() => ({
    games: (label) => `LIST_GAMES`, // Special action for game room
    memories: (label) => `Return a SHORT in-universe MEMORY TRACE about: ${label}.`,
    personality: (label) => `Return a SHORT in-universe PERSONALITY FILE snippet about: ${label}.`,
    status: (label) => `Return a SHORT SYSTEM STATUS readout tied to: ${label}.`,
    raid_logs: (label) => `Return a SHORT RAID LOG excerpt tied to: ${label}.`,
    evolution: (label) => `Return a SHORT EVOLUTION DATABASE excerpt tied to: ${label}.`,
    relationship: (label) => `Return a SHORT RELATIONSHIP SNAPSHOT tied to: ${label}.`,
  }), []);

  const clickHotspot = async (h) => {
    setSelected(h);
    
    // Track hotspot click for unlock system
    addHotspotClick();
    
    // Special handling for game room
    if (h.action === "games") {
      setPayload(`[GAME ZONE]\nHOTSPOT: ${h.label}\n\nClick "Select Games" below to choose from our Nintendo-style arcade collection!`);
      return;
    }

    setPayload("SYNCING WITH NEXUS…");

    try {
      const prompt = (promptForAction[h.action] || ((x) => `Scan object: ${x}.`))(h.label);
      const res = await nexusChat(characterId, prompt);
      const reply = res?.reply || res?.message || res?.output || res?.text || JSON.stringify(res, null, 2);
      setPayload(`[ROOM: ${room.title}]\nHOTSPOT: ${h.label}\nACTION: ${h.action}\n\n${reply}`);
    } catch (e) {
      setPayload(`NEXUS LINK FAILED.\n\n${String(e.message || e)}\n\nTip: verify your Nexus has POST /api/chat/{characterId} or adjust nexusChat() in src/lib/api.js`);
    }
  };

  return (
    <div className="tsv-glass tsv-glow" style={{ position:"relative", overflow:"hidden", minHeight: 520 }}>
      <div className="tsv-scanlines tsv-noise" style={{ position:"absolute", inset:0 }}>
        <Backdrop a={a} b={b} title={room.title} isGameRoom={isGameRoom} />
      </div>

      <div className="tsv-float" style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background: `radial-gradient(900px 500px at 50% 10%, ${a}18, transparent 60%),
                     radial-gradient(700px 420px at 70% 30%, ${b}14, transparent 55%)`,
        opacity: .95
      }} />

      <div style={{ position:"absolute", inset:0 }}>
        {(room.hotspots || []).map((h) => (
          <button
            key={h.key}
            onClick={() => clickHotspot(h)}
            className="tsv-pill tsv-pulse"
            style={{
              position:"absolute",
              left:`${h.x}%`, top:`${h.y}%`,
              transform:"translate(-50%,-50%)",
              borderColor:`${a}55`,
              boxShadow:`0 0 18px ${a}22`,
              background:`linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))`,
              cursor:"pointer",
            }}
            title={h.label}
          >
            <span style={{ width:8, height:8, borderRadius:999, background:a, boxShadow:`0 0 14px ${a}` }} />
            <span className="tsv-title" style={{ fontSize:12, opacity:.92 }}>{h.label}</span>
          </button>
        ))}
      </div>

      <div style={{ position:"absolute", left:14, right:14, bottom:14, display:"grid", gridTemplateColumns:"1.2fr .8fr", gap: 12 }}>
        <div className="tsv-glass" style={{ padding: 12, borderRadius: 16, position:"relative" }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.75, marginBottom: 8 }}>
            {selected ? `READOUT — ${selected.label}` : "ROOM READOUT"}
          </div>
          <pre style={{ margin:0, whiteSpace:"pre-wrap", fontSize: 12, opacity:.88, lineHeight: 1.35 }}>
            {payload || room.vibe}
          </pre>
        </div>

        <div className="tsv-glass" style={{ padding: 12, borderRadius: 16 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.75, marginBottom: 8 }}>CONTROLS</div>
          {isGameRoom ? (
            <>
              <button className="tsv-btn" style={{ width:"100%", marginBottom: 10 }} onClick={() => window.location.href = '/gameroom'}>
                🎮 Select Games
              </button>
              <div style={{ fontSize: 12, opacity:.72 }}>
                Click hotspots to explore, or select games to play!
              </div>
            </>
          ) : (
            <>
              <button className="tsv-btn" style={{ width:"100%", marginBottom: 10 }} onClick={onTalk}>
                Talk to Her
              </button>
              <div style={{ fontSize: 12, opacity:.72 }}>
                Click glowing items to pull Nexus readouts into the room.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
