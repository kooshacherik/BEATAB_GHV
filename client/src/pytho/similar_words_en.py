import numpy as np

# Path to your GloVe file (download from https://nlp.stanford.edu/projects/glove/)
# Example: 'glove.6B.300d.txt'
glove_path = 'D:\\modern-portfolio-main\\public\\glove.6B.300d.txt'

# Load embeddings into a dictionary
embeddings = {}
with open(glove_path, 'r', encoding='utf-8') as f:
    for line in f:
        values = line.strip().split()
        word = values[0]
        vector = np.array(values[1:], dtype='float32')
        embeddings[word] = vector

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
        if other_word == word:
            continue
        # Cosine similarity: dot product divided by norms
        sim = np.dot(word_vec, other_vec) / (np.linalg.norm(word_vec) * np.linalg.norm(other_vec))
        similarities[other_word] = sim

    # Sort by similarity score, descending
    most_similar = sorted(similarities.items(), key=lambda item: item[1], reverse=True)

    # Return top N
    return most_similar[:top_n]

# Example usage
input_word = input("Enter an English word: ").strip()
top_n = int(input("How many similar words do you want? "))

similar_words = find_similar_words(input_word, top_n)

print(f"\nTop {top_n} words similar to '{input_word}':")
for word, score in similar_words:
    print(f"{word} (similarity: {score:.4f})")