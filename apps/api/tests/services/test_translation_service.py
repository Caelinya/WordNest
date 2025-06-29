import pytest
from unittest.mock import MagicMock
from pydantic import BaseModel

# Adjust the import path based on the project structure
from app.services import translation_service
from app.services.translation_service import KnowledgeObject, Definition, Example

# A mock successful response from the AI, mimicking the structure
MOCK_KNOWLEDGE_OBJECT = KnowledgeObject(
    word="bank",
    phonetic="/bæŋk/",
    definitions=[
        Definition(
            part_of_speech="noun",
            translation="银行",
            explanation="A financial establishment.",
            examples=[
                Example(
                    sentence="I need to go to the bank.",
                    translation="我需要去银行。"
                )
            ],
        )
    ],
)

def test_translate_text_success(monkeypatch):
    """
    Test the translate_text function with a mocked successful API call.
    """
    # 1. Create a mock completion object that the client would return
    mock_completion = MagicMock()
    # The .parse() method returns the object in `choices[0].message.parsed`
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.parsed = MOCK_KNOWLEDGE_OBJECT

    # 2. Mock the 'parse' method of the openai client
    mock_parse = MagicMock(return_value=mock_completion)
    
    # We assume the client exists for this test
    mock_client = MagicMock()
    mock_client.beta.chat.completions.parse = mock_parse
    
    # 3. Use monkeypatch to replace the actual client with our mock
    monkeypatch.setattr(translation_service, "client", mock_client)

    # 4. Call the function we want to test
    result = translation_service.translate_text("bank")

    # 5. Assert the results
    assert result is not None
    assert isinstance(result, dict)
    assert result["word"] == "bank"
    assert result["definitions"][0]["translation"] == "银行"
    
    # Ensure the real client's 'parse' method was called once
    mock_parse.assert_called_once()


def test_translate_text_api_error(monkeypatch):
    """
    Test that the function returns None when the API call raises an exception.
    """
    # 1. Configure the mock to raise an exception when called
    mock_parse = MagicMock(side_effect=Exception("API limit reached"))
    
    mock_client = MagicMock()
    mock_client.beta.chat.completions.parse = mock_parse
    
    # 2. Patch the client
    monkeypatch.setattr(translation_service, "client", mock_client)

    # 3. Call the function and assert it returns None
    result = translation_service.translate_text("test")
    assert result is None


def test_translate_text_client_not_configured(monkeypatch):
    """
    Test that the function returns None if the client is not configured (e.g., no API key).
    """
    # 1. Patch the client to be None
    monkeypatch.setattr(translation_service, "client", None)
    
    # 2. Call the function and assert it returns None
    result = translation_service.translate_text("test")
    assert result is None
