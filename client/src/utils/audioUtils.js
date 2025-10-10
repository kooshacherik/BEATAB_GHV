// client/src/utils/audioUtils.js
/**
 * Generates a formatted label for a beat from its URL.
 * Extracts artist and song name from the URL structure.
 * @param {string} url - The URL of the audio file.
 * @param {number} [index] - Optional index for fallback label generation.
 * @returns {string} A formatted string like "Artist Name - Song Name".
 */
export const getBeatLabelFromUrl = (url, index) => {
  try {
    const parts = url.split("/");
    const filename = parts.pop();
    const artistFolder = parts.pop(); // artist folder
    const base = filename.replace(/\.[^/.]+$/, ""); // Remove extension

    const formattedArtist = artistFolder
      ? artistFolder
        .replace(/[_-]+/g, " ") // Replace hyphens/underscores with spaces
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word
      : `Artist ${index !== undefined ? index + 1 : ''}`;

    const formattedSong = base
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return `${formattedArtist} - ${formattedSong}`;
  } catch (error) {
    console.warn(`Error parsing beat label from URL "${url}": ${error.message}`);
    return `Beat ${index !== undefined ? index + 1 : ''}`;
  }
};