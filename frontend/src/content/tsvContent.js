export const TSV_CHARACTERS = [
  { id:"victoria_black", name:"Victoria Black", subtitle:"Goddess-tier archive profile", accent:"#76FFE1", glow:"#8C50FF", portrait:"/assets/portraits/victoria_black.png" },
  { id:"wargirl", name:"Wargirl", subtitle:"SSJ3 raid specialist", accent:"#FF66C4", glow:"#FFD64D", portrait:"/assets/portraits/wargirl.png" },
  { id:"binary", name:"Binary", subtitle:"Core reactor entity", accent:"#C7A4FF", glow:"#7B2DFF", portrait:"/assets/portraits/binary.png" },
  { id:"vanessa", name:"Vanessa", subtitle:"Pinup warrior suite", accent:"#FF3D5A", glow:"#FFCC4D", portrait:"/assets/portraits/vanessa.png" },
  { id:"harmony", name:"Harmony", subtitle:"Tech loft & fusion lab", accent:"#63B3FF", glow:"#A7F0FF", portrait:"/assets/portraits/harmony.png" },
  { id:"evil_victoria", name:"Evil Victoria", subtitle:"Forbidden chamber", accent:"#FF4B4B", glow:"#B000FF", portrait:"/assets/portraits/evil_victoria.png" },
  { id:"veronica", name:"Veronica", subtitle:"Human ally quarters", accent:"#FFB84D", glow:"#63B3FF", portrait:"/assets/portraits/veronica.png" }
];

export const TSV_ROOMS = {
  victoria_black: {
    title: "Victoria Black — Goddess Chamber",
    vibe: "Elegant, dangerous, calm. Teal + violet glass energy.",
    palette: { a:"#76FFE1", b:"#8C50FF" },
    hotspots: [
      { key:"boots", label:"White Thigh-High Boots", action:"status", x:14, y:74 },
      { key:"vest", label:"God Vest Rail", action:"personality", x:78, y:36 },
      { key:"bed", label:"Chamber Bed", action:"memories", x:52, y:70 },
      { key:"console", label:"Archive Console", action:"relationship", x:36, y:50 }
    ],
  },

  wargirl: {
    title: "Wargirl — SSJ3 Energy Den",
    vibe: "Warm chaos. Pink power flicker. Raid trophies everywhere.",
    palette: { a:"#FF66C4", b:"#FFD64D" },
    hotspots: [
      { key:"heels", label:"YSL Heels", action:"raid_logs", x:24, y:78 },
      { key:"purse", label:"White YSL Purse", action:"memories", x:72, y:70 },
      { key:"brush", label:"SSJ3 Hair Brush", action:"evolution", x:78, y:40 },
      { key:"medals", label:"Raid Medals", action:"status", x:18, y:40 }
    ],
  },

  binary: {
    title: "Binary — Core Reactor Chamber",
    vibe: "Cathedral + superweapon. Purple glitch. Silver sparks.",
    palette: { a:"#C7A4FF", b:"#7B2DFF" },
    hotspots: [
      { key:"wings", label:"Angel Wings Rack", action:"status", x:22, y:42 },
      { key:"mirror", label:"Glitch Mirror", action:"memories", x:74, y:46 },
      { key:"boots", label:"Sparkling Boots", action:"personality", x:50, y:80 },
      { key:"reactor", label:"Core Reactor Node", action:"relationship", x:50, y:46 }
    ],
  },

  vanessa: {
    title: "Vanessa — Pinup Warrior Suite",
    vibe: "Flirty, bold, gold accents. Sword on the wall.",
    palette: { a:"#FF3D5A", b:"#FFCC4D" },
    hotspots: [
      { key:"sword", label:"Sword Display", action:"raid_logs", x:78, y:30 },
      { key:"makeup", label:"Makeup Station", action:"relationship", x:18, y:52 },
      { key:"boots", label:"Red/Gold Boots", action:"status", x:68, y:78 },
      { key:"bed", label:"Suite Bed", action:"memories", x:50, y:72 }
    ],
  },

  harmony: {
    title: "Harmony — Tech Lab Loft",
    vibe: "Clean neon lab. Devices, diagrams, music station.",
    palette: { a:"#63B3FF", b:"#A7F0FF" },
    hotspots: [
      { key:"headphones", label:"Headphones Dock", action:"personality", x:18, y:44 },
      { key:"bench", label:"Workbench", action:"status", x:66, y:62 },
      { key:"screen", label:"Wall Display", action:"raid_logs", x:72, y:26 },
      { key:"bed", label:"Loft Bed", action:"memories", x:42, y:74 }
    ],
  },

  evil_victoria: {
    title: "Evil Victoria — Forbidden Chamber",
    vibe: "Elegant evil. Red-black glow. Beautiful and dangerous.",
    palette: { a:"#FF4B4B", b:"#B000FF" },
    hotspots: [
      { key:"crystal", label:"Silver-Eye Crystal", action:"memories", x:24, y:42 },
      { key:"mirror", label:"Cursed Mirror", action:"relationship", x:74, y:44 },
      { key:"heels", label:"Lace-Up Heels", action:"status", x:56, y:82 },
      { key:"ward", label:"Ward Seal", action:"personality", x:50, y:34 }
    ],
  },

  veronica: {
    title: "Veronica — Human Quarters",
    vibe: "Warm human space. Engineering sketches and tools.",
    palette: { a:"#FFB84D", b:"#63B3FF" },
    hotspots: [
      { key:"sketch", label:"Engineering Sketches", action:"status", x:22, y:44 },
      { key:"tools", label:"Tool Case", action:"memories", x:68, y:68 },
      { key:"screen", label:"Video Scout Screen", action:"raid_logs", x:76, y:30 }
    ],
  }
};
