import pytest
import os
from pydantic import ValidationError, BaseModel

from app.services import translation_service, ai_service
# Import the new, correct Pydantic model
from app.services.translation_service import AIResponse

# To run integration tests, set the environment variable RUN_INTEGRATION_TESTS to "true"
RUN_INTEGRATION_TESTS = os.getenv('RUN_INTEGRATION_TESTS', 'false').lower() == 'true'

requires_integration = pytest.mark.skipif(
    not RUN_INTEGRATION_TESTS, reason="Skipping integration tests"
)

def _run_translation_test(text_input: str, expected_type: str):
    """Helper function to run an integration test for a given text and expected type."""
    assert ai_service.client is not None, "AI service client is not initialized. Check your .env file."
    
    print(f"\n--- Making REAL API call for a '{expected_type}': '{text_input}' ---")

    try:
        result = translation_service.translate_text(text_input)

        assert result is not None, "The translation service returned None. The API call or parsing likely failed."
        
        print("\n--- Successfully Received Response ---")
        print(result)
        print("------------------------------------\n")

        # The core validation: does the response fit our Pydantic model?
        # This will raise a ValidationError if the structure is wrong.
        validated_obj = AIResponse.model_validate(result)

        # Further, more specific assertions
        assert validated_obj.type == expected_type, f"AI classified the text as '{validated_obj.type}' but we expected '{expected_type}'."
        # After validation, `data` is a Pydantic model instance, not a dict.
        # We check if it's an instance of any Pydantic model.
        assert isinstance(validated_obj.data, BaseModel)

    except ValidationError as e:
        print("\n--- Pydantic Validation Error ---")
        print(e)
        print("----------------------------------\n")
        pytest.fail("Pydantic validation failed. The AI response format does not match our AIResponse model.")
    
    except Exception as e:
        print(f"\n--- An Unexpected Error Occurred ---")
        print(e)
        print("-------------------------------------\n")
        pytest.fail(f"An unexpected error occurred during the API call: {e}")

@pytest.mark.integration
@requires_integration
def test_integration_word():
    """Integration test for a 'word' type input."""
    _run_translation_test("resilience", "word")

@pytest.mark.integration
@requires_integration
def test_integration_phrase():
    """Integration test for a 'phrase' type input."""
    _run_translation_test("on the ball", "phrase")

@pytest.mark.integration
@requires_integration
def test_integration_sentence():
    """Integration test for a 'sentence' type input."""
    _run_translation_test("The future is not set, there is no fate but what we make for ourselves.", "sentence")
