from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import nltk
from nltk.corpus import cmudict
from nltk.corpus import words

import numpy as np
import random




app = FastAPI()
# CORS setup
# origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# Download the CMU Pronouncing Dictionary if not already downloaded
nltk.download('cmudict')
nltk.download('words')
english_words = set(words.words())

# Load the dictionary
arpabet = cmudict.dict()
# print('arpbet')
# print(arpabet)
# print('__________________')



# Path to your GloVe file (download from https://nlp.stanford.edu/projects/glove/)
# Example: 'glove.6B.300d.txt'
# glove_path = 'D:\\SUBLIME_PROJECTS\\glove.6B.300d.txt'
glove_path = '.\\glove.6B.300d.txt'

# Load embeddings into a dictionary
embeddings = {}
with open(glove_path, 'r', encoding='utf-8') as f:
    for line in f:
        values = line.strip().split()
        word = values[0]
        if word.lower() in english_words:
            vector = np.array(values[1:], dtype='float32')
            embeddings[word] = vector
del english_words

def read_blocks_from_file(filepath, encoding="utf-8"):
    """
    Reads a file and splits it into blocks.
    Each block is a list of non-empty lines between blank lines.
    Blank lines separate blocks (one or more blank lines allowed).
    """
    blocks = []
    current_block = []

    with open(filepath, "r", encoding=encoding) as f:
        for raw_line in f:
            line = raw_line.strip()  # remove surrounding whitespace, including \n
            if line == "":
                # End of a block (if we have accumulated words)
                if current_block:
                    blocks.append(current_block)
                    current_block = []
                # If there are consecutive blank lines, skip
            else:
                current_block.append(line)

        # Catch any trailing block not followed by a blank line
        if current_block:
            blocks.append(current_block)

    return blocks

blocks = read_blocks_from_file("./big.txt")
# print(blocks)

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

# Function to find most similar words
def find_similar_words(word, top_n=10):
    if word not in embeddings:
        print(f"Word '{word}' not found in embeddings.")
        return []

    # Get the embedding for the input word
    word_vec = embeddings[word]

    # Compute cosine similarity with all other words
    similarities = {}
    for other_word, other_vec in embeddings.items():
        if other_word == word or other_word in word or word in other_word:
            continue
        # Cosine similarity: dot product divided by norms
        sim = np.dot(word_vec, other_vec) / (np.linalg.norm(word_vec) * np.linalg.norm(other_vec))
        # Convert numpy float32 to Python float
        similarities[other_word] = float(sim)

    # Sort by similarity score, descending
    most_similar = sorted(similarities.items(), key=lambda item: item[1], reverse=True)

    # Return top N
    return most_similar[:top_n]



@app.post("/get-reply")
async def get_reply():
    try:
        rand_words ={}
        for H in range (100):
            random_key = random.choice(list(embeddings.keys()))
            if random_key not in rand_words:
                rand_words[random_key]=H

        word_to_analyze = list(rand_words.keys())[-1]
        similars=find_similar_words(word_to_analyze)
        rhymes = find_rhymes(word_to_analyze)

        return {
            "word": random_key,
            "sims": similars,
            "rhymes": rhymes,
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"word": "", "sims": [], "rhymes": []}

@app.post("/get-reply-fa")
async def get_reply_fa():
    try:
        random_gp = random.choice( blocks )


        word_to_analyze = random_gp[-1]
        # similars=find_similar_words(word_to_analyze)
        # rhymes = find_rhymes(word_to_analyze)
        # word_2_send= random.choice(word_to_analyze)
        return {
            "word": word_to_analyze,
            # "sims": similars,
            # "rhymes": rhymes,
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"word": ""}#, "sims": [], "rhymes": []}





#_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====
#_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====
#_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====
#_____=====_____=====_____=====_____=====_____=====_____=====____Audio processing_____=====_____=====_____=====_____=====
#_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====
#_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====_____=====






if __name__ == "__main__":

    uvicorn.run("wordgen:app", host="0.0.0.0", port=5000)
