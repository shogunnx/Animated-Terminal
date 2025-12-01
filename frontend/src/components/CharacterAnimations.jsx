import { useMemo } from 'react';
import '../styles/character-animations.css';

/**
 * CharacterAnimations Component
 * 
 * Wraps character portraits with character-specific animations including:
 * - Unique visual effects (glows, glitches, particles, etc.)
 * - Facial expressions (natural blinks and smiles)
 * - Idle animations that loop naturally
 * 
 * Props:
 * - characterId: string - The character's unique ID
 * - children: ReactNode - The character portrait/image to animate
 * - intensity: 'subtle' | 'medium' | 'bold' - Animation intensity (default: 'medium')
 */
export default function CharacterAnimations({ 
  characterId, 
  children, 
  intensity = 'medium' 
}) {
  // Generate character-specific animation elements
  const animationEffects = useMemo(() => {
    switch(characterId) {
      case 'victoria_black':
        return (
          <div className="char-effects">
            <div className="char-glow" />
            <div className="char-particles" />
            <div className="char-aura" />
          </div>
        );
      
      case 'binary':
        return (
          <div className="char-effects">
            <div className="char-glitch" />
            <div className="char-corruption" />
            <div className="char-spark" />
            <div className="char-spark" />
            <div className="char-spark" />
          </div>
        );
      
      case 'wargirl':
        return (
          <div className="char-effects">
            <div className="char-power-aura" />
            <div className="char-hair-glow" />
            <div className="char-burst" />
            <div className="char-burst" />
            <div className="char-burst" />
          </div>
        );
      
      case 'vanessa':
        return (
          <div className="char-effects">
            <div className="char-glow" />
            <div className="char-shimmer" />
            <div className="char-sparkle" />
            <div className="char-sparkle" />
            <div className="char-sparkle" />
            <div className="char-sparkle" />
          </div>
        );
      
      case 'harmony':
        return (
          <div className="char-effects">
            <div className="char-circuit" />
            <div className="char-scan" />
            <div className="char-data" />
            <div className="char-data" />
            <div className="char-data" />
            <div className="char-data" />
            <div className="char-data" />
          </div>
        );
      
      case 'evil_victoria':
        return (
          <div className="char-effects">
            <div className="char-dark-glow" />
            <div className="char-curse" />
            <div className="char-tendril" />
            <div className="char-tendril" />
            <div className="char-tendril" />
          </div>
        );
      
      case 'veronica':
        return (
          <div className="char-effects">
            <div className="char-warm-glow" />
            <div className="char-soft-pulse" />
            <div className="char-gentle-sparkle" />
            <div className="char-gentle-sparkle" />
            <div className="char-gentle-sparkle" />
          </div>
        );
      
      default:
        return null;
    }
  }, [characterId]);

  // Don't apply animations to special cards like gameroom
  if (characterId === 'gameroom' || !characterId) {
    return children;
  }

  return (
    <div 
      className={`char-animated char-${characterId} char-intensity-${intensity}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {/* Original character portrait */}
      {children}
      
      {/* Facial expression overlays */}
      <div className="char-face-overlay">
        <div className="char-blink" />
        <div className="char-smile" />
      </div>
      
      {/* Character-specific effects */}
      {animationEffects}
    </div>
  );
}

/**
 * Hook to get animation configuration for a character
 * Useful for checking if animations should be applied
 */
export function useCharacterAnimations(characterId) {
  return useMemo(() => ({
    hasAnimations: !['gameroom'].includes(characterId),
    characterId,
  }), [characterId]);
}