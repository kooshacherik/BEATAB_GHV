// client/src/utils/timeFormatter.js
/**
 * Formats a time in seconds into a "MM:SS" string.
 * @param {number} seconds - The time in seconds.
 * @returns {string} The formatted time string.
 */
export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};