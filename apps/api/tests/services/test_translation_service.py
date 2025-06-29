import pytest
from unittest.mock import MagicMock
import json

# Adjust the import path based on the project structure
from app.services import translation_service
from app.services.translation_service import AIResponse

# --- Mock Data ---

# 1. Mock data for 'word' type
MOCK_WORD_RESPONSE_STR = json.dumps({
    "type": "word",
    "data": {
        "phonetic": "/rɪˈzɪliəns/",
        "definitions": [{
            "part_of_speech": "noun",
            "translation": "韧性; 恢复力",
            "explanation": "The capacity to recover quickly from difficulties; toughness.",
            "examples": [{
                "sentence": "The resilience of the economy has been remarkable.",
                "translation": "经济的恢复力非常惊人。"
            }]
        }]
    }
})
EXPECTED_WORD_DICT = json.loads(MOCK_WORD_RESPONSE_STR)

# 2. Mock data for 'phrase' type
MOCK_PHRASE_RESPONSE_STR = json.dumps({
    "type": "phrase",
    "data": {
        "explanation": "To be alert, quick to understand, and competent.",
        "translation": "反应快; 精明能干",
        "examples": [{
            "sentence": "Our new project manager is really on the ball.",
            "translation": "我们的新项目经理确实非常精明能干。"
        }]
    }
})
EXPECTED_PHRASE_DICT = json.loads(MOCK_PHRASE_RESPONSE_STR)

# 3. Mock data for 'sentence' type
MOCK_SENTENCE_RESPONSE_STR = json.dumps({
    "type": "sentence",
    "data": {
        "translation": "这只敏捷的棕色狐狸跳过了那只懒狗。",
        "keywords": ["quick", "brown", "fox", "jumps", "lazy", "dog"],
        "grammar_analysis": "A simple declarative sentence."
    }
})
EXPECTED_SENTENCE_DICT = json.loads(MOCK_SENTENCE_RESPONSE_STR)


def mock_openai_client(monkeypatch, response_str: str):
    """Helper function to mock the OpenAI client."""
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message = MagicMock()
    mock_completion.choices[0].message.content = response_str

    mock_create = MagicMock(return_value=mock_completion)
    
    mock_client = MagicMock()
    mock_client.chat.completions.create = mock_create
    
    monkeypatch.setattr(translation_service, "client", mock_client)
    return mock_create

def test_translate_word_success(monkeypatch):
    """Test translation for a 'word' type with a mocked successful API call."""
    mock_create = mock_openai_client(monkeypatch, MOCK_WORD_RESPONSE_STR)
    
    result = translation_service.translate_text("resilience")
    
    assert result is not None
    assert result == EXPECTED_WORD_DICT
    mock_create.assert_called_once()

def test_translate_phrase_success(monkeypatch):
    """Test translation for a 'phrase' type."""
    mock_create = mock_openai_client(monkeypatch, MOCK_PHRASE_RESPONSE_STR)

    result = translation_service.translate_text("on the ball")

    assert result is not None
    assert result == EXPECTED_PHRASE_DICT
    mock_create.assert_called_once()

def test_translate_sentence_success(monkeypatch):
    """Test translation for a 'sentence' type."""
    mock_create = mock_openai_client(monkeypatch, MOCK_SENTENCE_RESPONSE_STR)

    result = translation_service.translate_text("The quick brown fox...")

    assert result is not None
    assert result == EXPECTED_SENTENCE_DICT
    mock_create.assert_called_once()

def test_translate_text_api_error(monkeypatch):
    """Test that the function returns None when the API call raises an exception."""
    mock_create = MagicMock(side_effect=Exception("API limit reached"))
    
    mock_client = MagicMock()
    mock_client.chat.completions.create = mock_create
    
    monkeypatch.setattr(translation_service, "client", mock_client)

    result = translation_service.translate_text("test")
    assert result is None

def test_translate_bad_json_response(monkeypatch):
    """Test that the function returns None when the API returns invalid JSON."""
    mock_openai_client(monkeypatch, '{"type": "word", "data": "missing fields"}')
    
    result = translation_service.translate_text("test")
    assert result is None

def test_translate_text_client_not_configured(monkeypatch):
    """Test that the function returns None if the client is not configured."""
    monkeypatch.setattr(translation_service, "client", None)
    
    result = translation_service.translate_text("test")
    assert result is None
