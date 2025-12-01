# TSV Terminal - Engagement System Guide

## Overview
The TSV Archive Terminal has been transformed from a simple link hub into an addictive, immersive "Time Patrol Supercomputer" with multiple dopamine loops and gamification mechanics.

---

## 🚀 Phase 1: Foundation Features (IMPLEMENTED)

### 1. **Dressing Room as Landing Page**
The homepage is now a gateway directly to the Dressing Room with large character avatar selection.

**Features:**
- **Large Character Portraits** with animations
- **Live Stats** showing outfit likes per character
- **Character Ranking** display
- **Quick Access** to other terminals
- **Secret Character Unlock** visual indicator

**User Flow:**
1. User lands on homepage
2. Sees all 7 characters with animated portraits
3. Clicks character → goes directly to their Dressing Room
4. Can access other features via quick buttons

**Technical Implementation:**
- File: `/app/frontend/src/pages/Home.jsx`
- Uses CharacterAnimations component for live portraits
- Integrates with engagement tracking system

---

### 2. **Comprehensive Likes System**

**Features:**
- **Per-Character Tracking**: Each character has their own like counter
- **Total Likes**: Aggregate counter for unlock system
- **Live Rankings**: Characters ranked by total outfit likes
- **Persistent Storage**: Uses localStorage for data persistence
- **Visual Feedback**: Like button changes state with animations

**How It Works:**
1. User generates an outfit in Dressing Room
2. Clicks "♥ LIKE OUTFIT" button
3. Like count increments for that character
4. Total likes increment (tracks toward secret unlock)
5. Character ranking updates automatically

**Display Locations:**
- Homepage: Shows likes per character
- Dressing Room: Shows likes + rank
- Like button: Prominent on generated images

**Technical Details:**
```javascript
// Utility functions
addLike(characterId)          // Add like for character
getLikes(characterId)         // Get character's likes
getTotalLikes()               // Get total across all
getCharacterRank(characterId) // Get character's rank
getCharacterRanking()         // Get full leaderboard
```

**Files:**
- `/app/frontend/src/utils/engagement.js` - Core tracking
- `/app/frontend/src/pages/Home.jsx` - Display likes
- `/app/frontend/src/pages/DressingRoom.jsx` - Like button

---

### 3. **Idle Terminal Messages**

**Features:**
- **Character-Specific Messages**: Each girl has unique idle messages
- **45-Second Trigger**: Messages appear after user is AFK
- **Auto-Hide**: Messages disappear after 8 seconds
- **Activity Detection**: Resets on mouse/keyboard/scroll

**Example Messages:**
- **Victoria Black**: "Subject VICTORIA_BLACK appears to be waiting for new orders…"
- **Binary**: "Subject BINARY is running seduction subroutines in background…"
- **Wargirl**: "Subject WARGIRL power level: MAXIMUM. SSJ3 mode detected."
- **Vanessa**: "Subject VANESSA detected applying lipstick. Flirt mode: ACTIVE."
- **Harmony**: "Subject HARMONY is humming softly. Audio feed available on request."
- **Evil Victoria**: "⚠️ CLASSIFIED: EVIL_VICTORIA dark energy levels rising…"
- **Veronica**: "Subject VERONICA is working on new engineering schematics."

**Why It's Addictive:**
- Makes the site feel "alive"
- Creates personality for each character
- Pulls users back from alt-tabbing
- Increases perceived interactivity

**Technical Implementation:**
- File: `/app/frontend/src/components/IdleTerminalMessages.jsx`
- Uses event listeners for activity detection
- Random message selection from character pool
- Framer Motion for smooth animations

---

### 4. **Secret Unlock System**

**Unlock Conditions (ANY ONE triggers unlock):**
1. **10+ Outfit Likes** across all characters
2. **15+ Minutes** of total time spent on site
3. **50+ Hotspot Clicks** in character rooms

**What Unlocks:**
- **Evil Victoria** becomes available in Dressing Room
- Dramatic unlock notification with glitch effects
- "🔓 CLASSIFIED ACCESS GRANTED" banner on homepage
- Special "FORBIDDEN PROTOCOLS" button text

**Unlock Notification:**
- Full-screen dramatic animation
- Warning text about danger
- Glitch pulse effects
- Sound-like visual feedback

**Tracking:**
- `tsv_total_likes` - Total likes across characters
- `tsv_time_spent` - Milliseconds on site
- `tsv_hotspot_clicks` - Room hotspot interactions
- `tsv_secret_unlocked` - Unlock flag

**Technical Files:**
- `/app/frontend/src/components/UnlockTracker.jsx`
- `/app/frontend/src/utils/engagement.js`
- `/app/frontend/src/components/RoomScene.jsx` (hotspot tracking)

---

## 🎨 Phase 3: Audio/Visual Polish (IMPLEMENTED)

### 1. **Cursor Tick Sound**

**Feature:**
- Subtle mechanical "tick" sound on every keystroke
- Only plays when typing in input/textarea fields
- Uses Web Audio API for zero-latency sound
- Volume: 0.01 (very subtle, not annoying)

**Technical Implementation:**
- File: `/app/frontend/src/components/TerminalPolish.jsx`
- Creates oscillator at 800Hz for 20ms
- Throttled to prevent sound spam
- No external audio files needed

---

### 2. **Glitch Effects**

**Triggers:**
- Automatically activates on Evil Victoria pages
- Automatically activates on Binary pages
- Random intervals between 5-15 seconds
- Lasts 200ms per glitch

**Visual Effect:**
- Full-screen scanline overlay
- Mix-blend-mode for corruption effect
- Rapid position shifts
- Color inversion flashes

**Why It Works:**
- Reinforces character themes (Binary = digital, Evil Victoria = corrupted)
- Creates tension and atmosphere
- Never distracting (very brief)
- Perfectly timed randomness

**Technical:**
- CSS keyframe animation `glitchFlash`
- Conditional rendering based on route
- Pointer-events: none (doesn't block UI)

---

### 3. **Terminal Warnings**

**Warning Triggers:**
- **5 Outfits Generated**: Warning about elevated heart rate
- **10 Outfits Generated**: Critical warning about thermal levels

**Visual Design:**
- Bottom-center notification
- Orange (warning) or Red (critical) borders
- Animated icons (⚠️ or 🚨)
- Pulsing glow effect
- Auto-disappears after 8-10 seconds

**Message Examples:**
1. "WARNING: Elevated heart rate detected in multiple subjects. Recommend cooldown period."
2. "CRITICAL: System thermal levels approaching maximum. Mandatory break required."

**Purpose:**
- Adds personality to the interface
- Makes generation feel "dangerous" and exciting
- Encourages breaks (ironically makes users want to continue)
- Creates meme-worthy moments

**Technical:**
- Listens for `tsv_outfit_generated` event
- Tracks generation count in state
- Framer Motion for slide-up animation

---

### 4. **Cursor Blink**

**Feature:**
- Adds blinking underscore cursor to input fields
- Terminal-style caret color (#76FFE1)
- Step-end animation for authentic terminal feel

**Implementation:**
- File: `/app/frontend/src/components/CursorBlink.jsx`
- Injects CSS dynamically
- Applies to all input/textarea elements
- No performance impact

---

## 🎮 Gamification Mechanics

### Current Dopamine Loops

1. **Generation Loop**
   - Select items → Generate → See result → Like → Generate more

2. **Collection Loop**
   - Try different characters → Track likes → Compare rankings → Maximize favorites

3. **Unlock Loop**
   - Engage with site → Track progress → Unlock secret → Access new content

4. **Social Proof Loop**
   - See like counts → Want to beat high scores → Generate more → Increase likes

---

## 📊 Data Tracking

### LocalStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `tsv_likes_{characterId}` | Integer | Likes per character |
| `tsv_total_likes` | Integer | Total likes (for unlock) |
| `tsv_time_spent` | Integer | Milliseconds on site |
| `tsv_hotspot_clicks` | Integer | Room interactions |
| `tsv_secret_unlocked` | Boolean | Secret content access |
| `tsv_saved_outfits` | JSON Array | Saved outfit data |

### Events

| Event | Trigger | Purpose |
|-------|---------|---------|
| `tsv_outfit_generated` | After successful generation | Terminal warnings |
| `tsv_progress_update` | Like/hotspot click | Unlock tracking |

---

## 🚀 Future Enhancements (Phase 2 - Not Yet Implemented)

### 1. **Data Fragments System**
- Earn fragments by winning arcade games
- Spend fragments to unlock new clothing items
- Creates progression loop between Game Room and Dressing Room

### 2. **Leaderboard**
- Top 10 users by activity
- Anonymous usernames (User_4473)
- Weekly reset
- Competitive element

### 3. **Konami Code Easter Egg**
- ↑ ↑ ↓ ↓ ← → ← → B A anywhere on site
- Instantly unlocks Evil Victoria + special outfit set
- Creates viral discovery moment

---

## 📈 Expected Results

### Engagement Metrics (Predicted)

**Before:**
- Average session: 3-5 minutes
- Pages per session: 2-3
- Return rate: 20%

**After:**
- Average session: 15-25 minutes (5× increase)
- Pages per session: 8-12 (4× increase)
- Return rate: 60%+ (3× increase)

### Viral Potential

**Shareable Moments:**
1. Unlocking Evil Victoria (screenshot + share)
2. Terminal warnings after marathon sessions
3. Discovering idle messages
4. Glitch effects on Binary/Evil Victoria

**Social Proof:**
- Visible like counts encourage competition
- Rankings create status hierarchy
- Secret unlocks create FOMO

---

## 🛠️ Technical Architecture

### Component Structure
```
App
├── TerminalPolish (global audio/visual)
├── CursorBlink (global cursor)
└── Shell
    ├── Home
    │   ├── IdleTerminalMessages
    │   ├── UnlockTracker
    │   └── CharacterAnimations
    ├── DressingRoom
    │   └── Like Button + Engagement Tracking
    └── Room
        └── Hotspot Click Tracking
```

### Utility Functions
```
engagement.js
├── addLike()
├── getLikes()
├── getTotalLikes()
├── addHotspotClick()
├── getHotspotClicks()
├── isSecretUnlocked()
├── getCharacterRanking()
└── getCharacterRank()
```

---

## 💡 Best Practices

### For Developers

1. **Event-Driven Architecture**: Use custom events for cross-component communication
2. **LocalStorage**: Perfect for client-side gamification (no backend needed)
3. **Subtle Effects**: Audio/visual polish should enhance, not distract
4. **Progressive Disclosure**: Hide advanced features until earned

### For Users

1. **Natural Discovery**: Features reveal themselves through normal use
2. **No Pressure**: Optional engagement, no forced mechanics
3. **Instant Feedback**: Every action has visible result
4. **Meaningful Progress**: Unlocks feel earned, not random

---

## 🎯 Success Indicators

**Implemented Features Working When:**
1. Homepage shows character portraits with like counts
2. Idle messages appear after 45s of no activity
3. Like button increments counter and shows animation
4. Secret unlocks after meeting any threshold
5. Glitch effects appear on Binary/Evil Victoria pages
6. Terminal warnings show after 5/10 generations
7. Cursor tick plays on keyboard input

---

## 📝 Testing Checklist

- [ ] Generate 5+ outfits, verify warning appears
- [ ] Wait 45s idle, verify terminal message appears
- [ ] Like 10 outfits total, verify secret unlocks
- [ ] Visit Binary/Evil Victoria, verify glitch effects
- [ ] Click 50 hotspots, verify unlock triggers
- [ ] Spend 15+ minutes, verify time tracking works
- [ ] Type in input, verify cursor tick sound
- [ ] Check rankings update correctly

---

## 🎉 Conclusion

This engagement system transforms TSV Terminal from a portfolio site into an addictive interactive experience. By combining multiple dopamine loops (likes, unlocks, secrets) with premium polish (audio, glitches, warnings), users are incentivized to spend more time and return frequently.

**The secret sauce:** Make every interaction feel alive, meaningful, and slightly forbidden.
