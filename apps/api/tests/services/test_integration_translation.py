import pytest
import os
from pydantic import ValidationError

# Make sure the app path is accessible
from app.services import translation_service
from app.services.translation_service import KnowledgeObject, client as translation_client

# This marker skips the test unless the --run-integration flag is provided
# It also checks if the required API key is available.
requires_api_key = pytest.mark.skipif(
    not os.getenv("API_KEY"), reason="API_KEY environment variable not set"
)

@pytest.mark.integration
@requires_api_key
def test_real_translation_call_and_parsing():
    """
    This is an integration test. It makes a REAL API call.
    It checks if the live API response can be successfully parsed by our Pydantic model.
    """
    assert translation_client is not None, "Translation client is not initialized. Check API_KEY."

    test_word = "bank"
    
    print(f"\n--- Making REAL API call for word: '{test_word}' ---")

    try:
        # We call the service function directly
        result = translation_service.translate_text(test_word)

        # The primary goal is to check if parsing succeeds.
        assert result is not None, "The translation service returned None. Parsing likely failed."
        
        # If parsing succeeded, we can validate the structure.
        # This is a good place to use a debugger or print statement to inspect the output.
        print("\n--- Successfully Parsed Response ---")
        print(result)
        print("----------------------------------\n")

        # Basic validation
        validated_obj = KnowledgeObject.model_validate(result)
        assert validated_obj.word.lower() == test_word.lower()
        assert len(validated_obj.definitions) > 0
        assert "part_of_speech" in validated_obj.definitions[0].model_dump()

    except ValidationError as e:
        # This is the most important part for debugging!
        print("\n--- Pydantic Validation Error ---")
        print(e)
        print("----------------------------------\n")
        pytest.fail("Pydantic validation failed. The AI response format does not match our model.")
    
    except Exception as e:
        print(f"\n--- An Unexpected Error Occurred ---")
        print(e)
        print("-------------------------------------\n")
        pytest.fail(f"An unexpected error occurred during the API call: {e}")
