import nltk
from nltk.corpus import cmudict

# Download the CMU Pronouncing Dictionary if not already downloaded
nltk.download('cmudict')

# Load the dictionary
arpabet = cmudict.dict()

def get_rhyme_part(pronunciation):
    """
    Extract the rhyme part (from the last stressed vowel to the end)
    """
    # Find the position of the last stressed vowel
    for i in range(len(pronunciation)-1, -1, -1):
        # The stress markers are '1' for primary stress, '2' for secondary
        if pronunciation[i][-1] in ('1', '2'):
            return pronunciation[i:]
    # If no stressed vowel, return last part
    return pronunciation[-1:]

def find_rhymes(word, top_n=10):
    """
    Find words that rhyme with the given word
    """
    word = word.lower()
    if word not in arpabet:
        print(f"Phonetic transcription for '{word}' not found.")
        return []

    rhymes = []
    word_pronunciations = arpabet[word]
    # For simplicity, consider only the first pronunciation
    word_rhyme_part = get_rhyme_part(word_pronunciations[0])

    for candidate, pronunciations in arpabet.items():
        if candidate == word:
            continue
        # Check each pronunciation for rhyme
        for pron in pronunciations:
            if get_rhyme_part(pron) == word_rhyme_part:
                rhymes.append(candidate)
                break  # If any pronunciation matches, accept this word

    # Remove duplicates, sort, and take top_n
    unique_rhymes = list(set(rhymes))
    return unique_rhymes[:top_n]

# Example usage
input_word = input("Enter an English word: ").strip()
top_n = int(input("How many rhyming words do you want? "))

rhyming_words = find_rhymes(input_word, top_n)

print(f"\nTop {top_n} words that rhyme with '{input_word}':")
for w in rhyming_words:
    print(w)