/**
 * Engagement Tracking Utilities
 * Tracks likes, time spent, hotspot clicks for unlock system
 */

// Increment like count for a character
export function addLike(characterId) {
  const key = `tsv_likes_${characterId}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  const newCount = current + 1;
  localStorage.setItem(key, newCount.toString());
  
  // Also track total likes
  const totalKey = 'tsv_total_likes';
  const totalCurrent = parseInt(localStorage.getItem(totalKey) || '0');
  localStorage.setItem(totalKey, (totalCurrent + 1).toString());
  
  // Dispatch event for UnlockTracker
  window.dispatchEvent(new Event('tsv_progress_update'));
  
  return newCount;
}

// Get like count for a character
export function getLikes(characterId) {
  const key = `tsv_likes_${characterId}`;
  return parseInt(localStorage.getItem(key) || '0');
}

// Get total likes across all characters
export function getTotalLikes() {
  return parseInt(localStorage.getItem('tsv_total_likes') || '0');
}

// Increment hotspot click count
export function addHotspotClick() {
  const key = 'tsv_hotspot_clicks';
  const current = parseInt(localStorage.getItem(key) || '0');
  const newCount = current + 1;
  localStorage.setItem(key, newCount.toString());
  
  // Dispatch event for UnlockTracker
  window.dispatchEvent(new Event('tsv_progress_update'));
  
  return newCount;
}

// Get hotspot click count
export function getHotspotClicks() {
  return parseInt(localStorage.getItem('tsv_hotspot_clicks') || '0');
}

// Check if secret is unlocked
export function isSecretUnlocked() {
  return localStorage.getItem('tsv_secret_unlocked') === 'true';
}

// Get character rank by likes
export function getCharacterRanking() {
  const characters = ['victoria_black', 'wargirl', 'binary', 'vanessa', 'harmony', 'evil_victoria', 'veronica'];
  const rankings = characters.map(id => ({
    id,
    likes: getLikes(id)
  })).sort((a, b) => b.likes - a.likes);
  
  return rankings;
}

// Get rank for specific character
export function getCharacterRank(characterId) {
  const rankings = getCharacterRanking();
  const index = rankings.findIndex(r => r.id === characterId);
  return index >= 0 ? index + 1 : null;
}
