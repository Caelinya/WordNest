import json
from enum import Enum
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Union, Optional

from ..config import settings

# --- Client Initialization ---
client = None
if settings.API_KEY:
    client = OpenAI(
        api_key=settings.API_KEY,
        base_url=settings.BASE_URL,
    )

# --- Pydantic Models for Structured AI Output ---

class Example(BaseModel):
    sentence: str
    translation: str

class Definition(BaseModel):
    part_of_speech: str
    translation: str
    explanation: str
    examples: List[Example]

class WordAnalysis(BaseModel):
    phonetic: Optional[str] = None
    definitions: List[Definition]

class PhraseAnalysis(BaseModel):
    explanation: str
    translation: str
    examples: List[Example]

class SentenceAnalysis(BaseModel):
    translation: str
    keywords: List[str]
    grammar_analysis: str

class NoteType(str, Enum):
    WORD = "word"
    PHRASE = "phrase"
    SENTENCE = "sentence"

class AIAnalysisResponse(BaseModel):
    type: NoteType
    corrected_text: str
    data: Union["WordAnalysis", "PhraseAnalysis", "SentenceAnalysis"]

# --- Prompts ---
ANALYSIS_SYSTEM_PROMPT = """
You are an expert linguist and AI assistant. Your task is to analyze a given text and classify it as a single 'word', a 'phrase', or a 'sentence'. Then, you must provide a detailed, structured analysis in a specific JSON format.

**Overall JSON Output Structure:**
- You MUST respond with ONLY a raw JSON string. Do not add any extra text, explanations, or markdown formatting like ```json.
- The root of the JSON object must have three keys: "type", "corrected_text", and "data".
- "type": Must be one of "word", "phrase", or "sentence".
- "corrected_text": If the user's input has spelling or grammar errors, provide the corrected version here. If the input is perfect, this field should be the same as the original input.
- The structure of the "data" key's value depends on the "type".

---

**1. If the input is a 'word':**
The "data" object must contain "phonetic" (optional) and "definitions".

**JSON Structure for 'word':**
```json
{
  "type": "word",
  "corrected_text": "resilience",
  "data": {
    "phonetic": "/rɪˈzɪliəns/",
    "definitions": [
      {
        "part_of_speech": "noun",
        "translation": "韧性; 恢复力",
        "explanation": "The capacity to recover quickly from difficulties; toughness.",
        "examples": [
          {
            "sentence": "The resilience of the economy has been remarkable.",
            "translation": "经济的恢复力非常惊人。"
          }
        ]
      }
    ]
  }
}
```

---

**2. If the input is a 'phrase':**
The "data" object must contain "explanation", "translation", and "examples".

**JSON Structure for 'phrase':**
```json
{
  "type": "phrase",
  "corrected_text": "on the ball",
  "data": {
    "explanation": "To be alert, quick to understand, and competent.",
    "translation": "反应快; 精明能干",
    "examples": [
      {
        "sentence": "Our new project manager is really on the ball.",
        "translation": "我们的新项目经理确实非常精明能干。"
      }
    ]
  }
}
```

---

**3. If the input is a 'sentence':**
The "data" object must contain "translation", "keywords", and "grammar_analysis".

**JSON Structure for 'sentence':**
```json
{
  "type": "sentence",
  "corrected_text": "The quick brown fox jumps over the lazy dog.",
  "data": {
    "translation": "这只敏捷的棕色狐狸跳过了那只懒狗。",
    "keywords": ["quick", "brown", "fox", "jumps", "lazy", "dog"],
    "grammar_analysis": "This is a simple declarative sentence. 'The quick brown fox' is the subject, 'jumps' is the main verb (present simple tense), and 'over the lazy dog' is a prepositional phrase acting as an adverbial, modifying the verb."
  }
}
```
"""

# --- Public Service Functions ---

def get_embedding(text: str) -> list[float] | None:
    """
    Generates an embedding for the given text.
    """
    if not client:
        print("AI service is disabled. Skipping embedding generation.")
        return None

    try:
        response = client.embeddings.create(
            input=text,
            model=settings.EMBEDDING_MODEL,
        )
        return response.data[0].embedding

    except Exception as e:
        print(f"An error occurred during embedding generation: {e}")
        return None

def analyze_text(text: str) -> dict | None:
    """
    Analyzes text and returns a structured analysis using the Pydantic model.
    """
    if not client:
        print("AI service is disabled. Skipping text analysis.")
        return None
    
    try:
        # Reverting to the .create() method to bypass compatibility issues with the .parse() helper.
        completion = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
        )
        
        raw_json_response = completion.choices[0].message.content
        if not raw_json_response:
            print("AI returned an empty response.")
            return None
        
        json_response = json.loads(raw_json_response)
        
        validated_obj = AIAnalysisResponse.model_validate(json_response)
        return validated_obj.model_dump()

    except Exception as e:
        print(f"An error occurred during text analysis: {e}")
        return None