export const TSV_CHARACTERS = [
  { id:"victoria_black", name:"Victoria Black", subtitle:"Goddess-tier archive profile", accent:"#76FFE1", glow:"#8C50FF", portrait:"/assets/portraits/victoria_black.png" },
  { id:"victoria_black_goddess", name:"Victoria Black Goddess", subtitle:"Divine elegance supreme", accent:"#FFD700", glow:"#FF69B4", portrait:"/assets/portraits/victoria_black.png" },
  { id:"community_oc", name:"Community OC", subtitle:"Upload your own character", accent:"#00FF88", glow:"#00CCFF", portrait: null, requiresUpload: true },
  { id:"wargirl", name:"Wargirl", subtitle:"SSJ3 raid specialist", accent:"#FF66C4", glow:"#FFD64D", portrait:"/assets/portraits/wargirl.png" },
  { id:"binary", name:"Binary", subtitle:"Core reactor entity", accent:"#C7A4FF", glow:"#7B2DFF", portrait:"/assets/portraits/binary.png" },
  { id:"vanessa", name:"Vanessa", subtitle:"Pinup warrior suite", accent:"#FF3D5A", glow:"#FFCC4D", portrait:"/assets/portraits/vanessa.png" },
  { id:"harmony", name:"Harmony", subtitle:"Tech loft & fusion lab", accent:"#63B3FF", glow:"#A7F0FF", portrait:"/assets/portraits/harmony.png" },
  { id:"evil_victoria", name:"Evil Victoria", subtitle:"Forbidden chamber", accent:"#FF4B4B", glow:"#B000FF", portrait:"/assets/portraits/evil_victoria.png" },
  { id:"veronica", name:"Veronica", subtitle:"Human ally quarters", accent:"#FFB84D", glow:"#63B3FF", portrait:"/assets/portraits/veronica.png" },
  { id:"gameroom", name:"Game Room", subtitle:"Arcade & party zone", accent:"#FFD700", glow:"#FF6B00", portrait:"/assets/portraits/gameroom.png", isSpecial: true }
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
  },

  gameroom: {
    title: "GAME ROOM — Arcade Paradise",
    vibe: "Large, bright arcade zone. Neon lights, game cabinets, party vibes!",
    palette: { a:"#FFD700", b:"#FF6B00" },
    hotspots: [
      { key:"arcade", label:"Arcade Cabinet", action:"games", x:25, y:50 },
      { key:"console", label:"Gaming Console", action:"games", x:50, y:55 },
      { key:"snacks", label:"Snack Bar", action:"status", x:75, y:45 },
      { key:"scoreboard", label:"High Score Board", action:"raid_logs", x:50, y:25 }
    ],
  }
};

// NINTENDO-STYLE GAMES LIST - FULLY PLAYABLE!
export const TSV_GAMES = [
  { 
    id: "tetris", 
    name: "Tetris Blocks", 
    type: "Puzzle", 
    description: "Stack falling blocks to clear lines! Classic addictive gameplay!", 
    difficulty: "Medium", 
    icon: "🟦",
    implemented: true
  },
  { 
    id: "snake", 
    name: "Snake Feast", 
    type: "Arcade", 
    description: "Eat, grow, don't crash! The original mobile addiction!", 
    difficulty: "Easy", 
    icon: "🐍",
    implemented: true
  },
  { 
    id: "breakout", 
    name: "Breakout Blitz", 
    type: "Arcade", 
    description: "Paddle, ball, bricks! Smash everything in sight!", 
    difficulty: "Easy", 
    icon: "🧱",
    implemented: true
  },
  { 
    id: "runner", 
    name: "Endless Runner", 
    type: "Action", 
    description: "Jump over obstacles and run forever! How far can you go?", 
    difficulty: "Medium", 
    icon: "🏃",
    implemented: true
  },
  { 
    id: "microgames", 
    name: "Micro Madness", 
    type: "Party", 
    description: "WarioWare-style rapid micro challenges! 5 seconds each!", 
    difficulty: "Hard", 
    icon: "⚡",
    implemented: true
  },
  { 
    id: "rhythm", 
    name: "Rhythm Tapper", 
    type: "Rhythm", 
    description: "Hit the beats! Perfect timing = high scores!", 
    difficulty: "Medium", 
    icon: "🎵",
    implemented: true
  },
  { 
    id: "pong", 
    name: "Neon Pong", 
    type: "Classic", 
    description: "The original arcade classic! Beat the AI paddle!", 
    difficulty: "Easy", 
    icon: "🏓",
    implemented: true
  },
  { 
    id: "space_invaders", 
    name: "Space Invaders", 
    type: "Shooter", 
    description: "Defend Earth from alien invasion! Classic arcade action!", 
    difficulty: "Medium", 
    icon: "👾",
    implemented: true
  },
  { 
    id: "flappy", 
    name: "Flappy Flyer", 
    type: "Casual", 
    description: "Tap to flap! Navigate through pipes in this addictive challenge!", 
    difficulty: "Hard", 
    icon: "🐦",
    implemented: true
  },
  { 
    id: "match3", 
    name: "Gem Crusher", 
    type: "Puzzle", 
    description: "Match 3 gems to clear the board! Chain combos for huge scores!", 
    difficulty: "Easy", 
    icon: "💎",
    implemented: true
  },
  { 
    id: "solitaire", 
    name: "Solitaire Classic", 
    type: "Card", 
    description: "The timeless card game! Stack 'em and clear the board!", 
    difficulty: "Medium", 
    icon: "🃏",
    implemented: true
  },
  { 
    id: "minesweeper", 
    name: "Mine Hunter", 
    type: "Puzzle", 
    description: "Flag the mines, clear the grid! One wrong click and boom!", 
    difficulty: "Medium", 
    icon: "💣",
    implemented: true
  },
  { 
    id: "pacman", 
    name: "Pac-Dash", 
    type: "Maze", 
    description: "Eat dots, avoid ghosts! The legendary maze chase!", 
    difficulty: "Medium", 
    icon: "👻",
    implemented: true
  },
  { 
    id: "platformer", 
    name: "Jump Quest", 
    type: "Platformer", 
    description: "Run, jump, collect coins! Classic side-scrolling adventure!", 
    difficulty: "Hard", 
    icon: "🎮",
    implemented: true
  },
  { 
    id: "bubble_shooter", 
    name: "Bubble Pop", 
    type: "Puzzle", 
    description: "Shoot bubbles to match colors! Clear the screen!", 
    difficulty: "Easy", 
    icon: "🫧",
    implemented: true
  },
  { 
    id: "tower_defense", 
    name: "Tower Guard", 
    type: "Strategy", 
    description: "Build towers, stop enemies! Defend your base at all costs!", 
    difficulty: "Hard", 
    icon: "🏰",
    implemented: true
  },
  { 
    id: "word_search", 
    name: "Word Hunter", 
    type: "Puzzle", 
    description: "Find hidden words in the grid! Race against time!", 
    difficulty: "Easy", 
    icon: "📝",
    implemented: true
  },
  { 
    id: "memory", 
    name: "Memory Match", 
    type: "Brain", 
    description: "Flip cards and match pairs! Test your memory skills!", 
    difficulty: "Easy", 
    icon: "🧠",
    implemented: true
  },
  { 
    id: "racing", 
    name: "Turbo Racer", 
    type: "Racing", 
    description: "Speed through tracks! Dodge traffic and set records!", 
    difficulty: "Medium", 
    icon: "🏎️",
    implemented: true
  },
  { 
    id: "bowling", 
    name: "Strike King", 
    type: "Sports", 
    description: "Roll for strikes! Perfect your aim and score big!", 
    difficulty: "Easy", 
    icon: "🎳",
    implemented: true
  },
  { 
    id: "asteroids", 
    name: "Asteroid Blaster", 
    type: "Shooter", 
    description: "Blast space rocks! Classic vector graphics action!", 
    difficulty: "Medium", 
    icon: "☄️",
    implemented: true
  },
  { 
    id: "chess", 
    name: "Chess Master", 
    type: "Strategy", 
    description: "The ultimate strategy game! Checkmate the AI!", 
    difficulty: "Hard", 
    icon: "♟️",
    implemented: true
  },
  { 
    id: "pool", 
    name: "8-Ball Pool", 
    type: "Sports", 
    description: "Sink all your balls, then the 8-ball to win!", 
    difficulty: "Medium", 
    icon: "🎱",
    implemented: true
  },
  { 
    id: "pinball", 
    name: "Pinball Wizard", 
    type: "Arcade", 
    description: "Classic pinball action! Bumpers, ramps, and high scores!", 
    difficulty: "Medium", 
    icon: "🕹️",
    implemented: true
  },
  { 
    id: "sudoku", 
    name: "Sudoku Solver", 
    type: "Puzzle", 
    description: "Fill the grid with numbers! Logic puzzle perfection!", 
    difficulty: "Hard", 
    icon: "🔢",
    implemented: true
  },
  { 
    id: "blackjack", 
    name: "Blackjack 21", 
    type: "Card", 
    description: "Hit or stand? Get closer to 21 than the dealer!", 
    difficulty: "Easy", 
    icon: "🂡",
    implemented: true
  },
];

// GIRL COACHING MODES
export const GIRL_COACHES = {
  victoria_black: {
    name: "Victoria Black",
    role: "Goddess Strategist",
    tips: [
      "Plan three moves ahead, not one.",
      "Patience brings perfection.",
      "Every mistake teaches something.",
      "Speed is nothing without control.",
      "You're improving. I see it."
    ],
    successPhrases: ["Excellent.", "Impressive work.", "You're learning.", "Good."],
    failPhrases: ["Try again.", "Focus.", "Don't rush.", "Think first."]
  },
  wargirl: {
    name: "Wargirl",
    role: "SSJ3 Hype Coach",
    tips: [
      "GO GO GO! FASTER!",
      "COMBO THAT! DON'T STOP!",
      "YOU'RE ON FIRE! KEEP GOING!",
      "THAT'S THE SPIRIT!",
      "UNLEASH IT! FULL POWER!"
    ],
    successPhrases: ["YES!! AWESOME!!", "THAT'S MY WARRIOR!!", "INCREDIBLE!!", "YOU'RE UNSTOPPABLE!!"],
    failPhrases: ["Aww no! Again!", "Shake it off!", "You got this!", "Next time!"]
  },
  binary: {
    name: "Binary",
    role: "Rival Roaster",
    tips: [
      "My score is still higher...",
      "Can you even beat level 5?",
      "Interesting... for a human.",
      "I've calculated your odds. Low.",
      "Try not to embarrass yourself."
    ],
    successPhrases: ["...Not bad.", "Hmph. Lucky.", "Calculated.", "Acceptable."],
    failPhrases: ["Predictable failure.", "As expected.", "Pathetic.", "Git gud."]
  },
  vanessa: {
    name: "Vanessa",
    role: "Flirt Queen",
    tips: [
      "Looking good out there~",
      "Ooh, I like it when you combo like that!",
      "Keep going, I'm watching~ ♥",
      "You're making me blush!",
      "Show me what you've got~"
    ],
    successPhrases: ["Amazing! ♥", "You're so good~!", "That's hot!", "Impressive~"],
    failPhrases: ["Aww, it's okay~", "Next time, sweetie!", "Don't give up!", "I believe in you~"]
  },
  harmony: {
    name: "Harmony",
    role: "Tech Analyst",
    tips: [
      "Pattern recognition is key.",
      "Your reaction time: 250ms average.",
      "Optimize your positioning.",
      "That sequence can be improved.",
      "Data shows you peak at night."
    ],
    successPhrases: ["Optimal performance.", "Efficiency increased.", "Well executed.", "Above average."],
    failPhrases: ["Suboptimal.", "Analyzing error...", "Recalculating...", "Try this angle."]
  },
  evil_victoria: {
    name: "Evil Victoria",
    role: "Dark Motivator",
    tips: [
      "Suffering builds character...",
      "Embrace the chaos.",
      "Pain is temporary, glory eternal.",
      "Let the darkness guide you.",
      "Show me your true power."
    ],
    successPhrases: ["Delicious.", "Exquisite.", "More...", "Yes... perfect."],
    failPhrases: ["Disappointing.", "Weak.", "Again.", "Pathetic."]
  },
  veronica: {
    name: "Veronica",
    role: "Friendly Support",
    tips: [
      "You're doing great!",
      "Remember to breathe!",
      "I'm cheering for you!",
      "Take your time, no rush!",
      "You've got this!"
    ],
    successPhrases: ["Amazing job!!", "You did it!!", "So proud!!", "That was awesome!!"],
    failPhrases: ["That's okay!", "You'll get it!", "Keep trying!", "I'm here for you!"]
  }
};