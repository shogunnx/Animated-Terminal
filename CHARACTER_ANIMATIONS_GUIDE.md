# Character Animations System

## Overview
The TSV Archive Terminal now features a comprehensive character animation system that brings each character to life with unique visual effects and natural facial expressions.

## Features Implemented

### 1. **Facial Expressions**
All character portraits now feature natural, idle animations:
- **Natural Blinks**: Characters blink every ~6 seconds with realistic eyelid movement
- **Smiles**: Occasional subtle smiles appear every ~12 seconds, adding personality and warmth

### 2. **Character-Specific Animations**

#### **Victoria Black** (Goddess-tier)
- **Elegant Glow Pulse**: Teal-violet aura that breathes with her presence
- **Floating Particles**: Cyan sparkles that rise gracefully upward
- **Power Aura**: Radiating rings that expand outward, showing her divine energy

#### **Binary** (Core Reactor Entity)
- **Glitch Shimmer**: Purple digital corruption that sweeps across the image
- **Pixel Corruption**: Occasional digital artifacts and scan lines
- **Electrical Sparks**: Purple lightning bolts that crackle at random positions

#### **Wargirl** (SSJ3 Warrior)
- **Power-Up Aura**: Pink and gold energy field that pulses with intensity
- **Energy Burst Particles**: Explosive energy dots that shoot outward
- **Hair Glow**: Golden aura around her signature SSJ3 hair

#### **Vanessa** (Pinup Warrior)
- **Flirty Sparkles**: Gold and red sparkles that twinkle at various positions
- **Red-Gold Shimmer**: Elegant wave of shimmer that flows across the portrait
- **Playful Glow**: Soft, inviting aura that pulses gently

#### **Harmony** (Tech Analyst)
- **Data Stream Particles**: Blue vertical streams of data flowing downward
- **Circuit Lines**: Animated tech grid that flows across the image
- **Holographic Scan**: Blue scan line that sweeps from top to bottom

#### **Evil Victoria** (Forbidden Chamber)
- **Dark Pulse**: Ominous red-purple glow that breathes with malevolent energy
- **Shadow Tendrils**: Dark wisps that rise from the bottom like smoke
- **Cursed Shimmer**: Diagonal waves of red and purple energy

#### **Veronica** (Human Ally)
- **Warm Glow**: Friendly orange-blue aura that radiates comfort
- **Gentle Sparkles**: Soft, small sparkles that appear occasionally
- **Soft Pulse Rings**: Calm expanding rings showing her supportive nature

## Technical Implementation

### Files Created/Modified
1. **`/app/frontend/src/styles/character-animations.css`** - All animation styles
2. **`/app/frontend/src/components/CharacterAnimations.jsx`** - Animation wrapper component
3. **`/app/frontend/src/components/CharacterCard.jsx`** - Updated to use animations
4. **`/app/frontend/src/pages/Profile.jsx`** - Updated to use animations
5. **`/app/frontend/src/main.jsx`** - Added CSS import

### Performance Optimizations
- **Mobile-Friendly**: Complex particle effects are disabled on mobile devices
- **Reduced Motion**: All animations respect the `prefers-reduced-motion` accessibility setting
- **GPU Acceleration**: Animations use transform and opacity for smooth 60fps performance
- **Layered Approach**: Multiple lightweight animations instead of heavy effects

### Animation Timing
- **Blinks**: 6-second intervals (natural human rate)
- **Smiles**: 12-second intervals (occasional, not constant)
- **Character Effects**: 2-8 second loops (varies by effect type)
- **Particles**: Staggered delays for natural randomness

## Usage

### In React Components
```jsx
import CharacterAnimations from "../components/CharacterAnimations.jsx";

<CharacterAnimations characterId={character.id} intensity="medium">
  <img src={character.portrait} alt={character.name} />
</CharacterAnimations>
```

### Intensity Levels
- **subtle**: Minimal effects, very understated
- **medium**: Default, balanced visibility
- **bold**: Maximum effect strength (currently not implemented but prepared)

## Where Animations Appear
1. **Character Gallery** (`/characters`) - All character cards
2. **Profile Pages** (`/characters/:id`) - Individual character portraits
3. **Not in Room Scenes** - Rooms use custom animated backdrops instead

## Accessibility
- Animations automatically disable for users with `prefers-reduced-motion: reduce`
- All animations are purely decorative and don't convey critical information
- No seizure-inducing flashing or strobing effects

## Browser Compatibility
- ✅ Chrome/Edge (Chromium-based)
- ✅ Firefox
- ✅ Safari (including iOS)
- ✅ Mobile browsers (with reduced complexity)

## Future Enhancements
Potential additions if requested:
- More intense particle systems for "bold" intensity
- Interactive animations that respond to hover/click
- Character-specific animation variants for different moods
- Parallax depth effects
- Real-time AI-driven facial expression changes
