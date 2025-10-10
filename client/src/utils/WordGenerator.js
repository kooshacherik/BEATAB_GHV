// client/src/utils/WordGenerator.js
// This utility is designed to interface with a local Python Flask server for word generation.

/**
 * Fetches a random word (or a "reply" as your backend calls it) from the local Python Flask server.
 * It determines the endpoint based on the language.
 *
 * @param {string} lang - The desired language ('EN' for English, 'FA' for Farsi).
 * @returns {Promise<object>} An object containing the word (or reply) from the backend.
 *                            Returns a fallback object if the API call fails.
 */
export async function fetchRandomWord(lang) {
  // console.log(lang); // Kept for debugging as in your original
  // console.log('fetchRandomWord called'); // More descriptive log

  try {
    // const startTime__ = performance.now(); // Uncomment if you want to log performance

    let url = null;
    if (lang === "EN") {
      url = 'http://localhost:5000/get-reply';
    } else if (lang === "FA") { // Added 'else if' for clarity
      url = 'http://localhost:5000/get-reply-fa';
    } else {
      console.warn(`Unsupported language "${lang}" for word generation. Defaulting to English endpoint.`);
      url = 'http://localhost:5000/get-reply';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: null // Your original `handleSend` sent `null` as body
    });

    if (!response.ok) {
      const errorData = await response.text(); // Get raw error response
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    const data = await response.json();
    // const endTime__ = performance.now(); // Uncomment if you want to log performance
    // console.log(`Execution time for word generation: ${(endTime__ - startTime__)} milliseconds`); // Uncomment if you want to log performance

    // Assuming your Python backend returns a structure that contains the word directly
    // If it returns an object like { "word": "example" } or { "reply": "example" }
    // you might need to adjust `return data;` to `return { word: data.word };` or similar.
    // For now, returning the raw data object received.
    return data;

  } catch (err) {
    console.error('Error fetching random word from backend:', err);

    // Fallback words if the API call fails
    if (lang === 'EN') {
      const fallbackWords = ['Hello', 'World', 'Code', 'Music', 'Beat', 'Flow'];
      return { word: fallbackWords[Math.floor(Math.random() * fallbackWords.length)] };
    } else if (lang === 'FA') {
      const fallbackWords = ['سلام', 'دنیا', 'کد', 'موسیقی', 'ضربان', 'جریان'];
      return { word: fallbackWords[Math.floor(Math.random() * fallbackWords.length)] };
    }
    return { word: 'Error' }; // Generic fallback
  } finally {
    // Your original comments about setIsLoading, setUserInput, setAttachedVoices, etc.,
    // suggest these were state updates within a React component, not part of a utility.
    // So, they are not included here.
  }
}