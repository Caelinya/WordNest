import unittest
import os
import numpy as np
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.services import ai_service

def cosine_similarity(v1, v2):
    """Calculate the cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    return dot_product / (norm_v1 * norm_v2)

# To run integration tests, set the environment variable RUN_INTEGRATION_TESTS to "true"
# You also need a valid API_KEY in your .env file.
RUN_INTEGRATION_TESTS = os.getenv('RUN_INTEGRATION_TESTS', 'false').lower() == 'true'

@unittest.skipIf(not RUN_INTEGRATION_TESTS, "Skipping integration tests")
class TestAIServiceIntegration(unittest.TestCase):

    def test_embedding_semantic_similarity(self):
        """
        Tests that semantically similar words have a high cosine similarity.
        This is an integration test and requires a live API key.
        """
        # Ensure the AI service client is available
        self.assertIsNotNone(ai_service.client, "AI service client is not initialized. Check your API_KEY.")

        # Words that should be semantically similar
        word1 = "difficult"
        word2 = "hard"

        # Get embeddings from the actual AI service
        embedding1 = ai_service.get_embedding(word1)
        embedding2 = ai_service.get_embedding(word2)

        # Assert that we received valid embeddings
        self.assertIsNotNone(embedding1)
        self.assertIsNotNone(embedding2)
        self.assertIsInstance(embedding1, list)
        self.assertIsInstance(embedding2, list)
        self.assertGreater(len(embedding1), 0)
        self.assertGreater(len(embedding2), 0)
        self.assertEqual(len(embedding1), len(embedding2))  # Both should have same dimensions

        # Calculate cosine similarity
        similarity = cosine_similarity(embedding1, embedding2)
        print(f"Cosine similarity between '{word1}' and '{word2}': {similarity}")

        # Assert that the similarity is high (e.g., > 0.7)
        # This threshold might need adjustment depending on the model's performance
        self.assertGreater(similarity, 0.7, f"Expected high similarity between '{word1}' and '{word2}', but got {similarity}")

    def test_embedding_semantic_dissimilarity(self):
        """
        Tests that semantically dissimilar words have a low cosine similarity.
        """
        self.assertIsNotNone(ai_service.client, "AI service client is not initialized.")

        # Words that should be semantically dissimilar
        word1 = "apple"
        word2 = "car"

        embedding1 = ai_service.get_embedding(word1)
        embedding2 = ai_service.get_embedding(word2)

        self.assertIsNotNone(embedding1)
        self.assertIsNotNone(embedding2)

        similarity = cosine_similarity(embedding1, embedding2)
        print(f"Cosine similarity between '{word1}' and '{word2}': {similarity}")

        # Assert that the similarity is low (e.g., < 0.5)
        self.assertLess(similarity, 0.5, f"Expected low similarity between '{word1}' and '{word2}', but got {similarity}")

if __name__ == '__main__':
    # This allows running the test file directly
    # Make sure to set RUN_INTEGRATION_TESTS=true in your environment
    unittest.main()