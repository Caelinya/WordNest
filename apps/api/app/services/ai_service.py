import json
import backoff
from enum import Enum
from openai import OpenAI, APIError, RateLimitError, APITimeoutError, APIConnectionError
from pydantic import BaseModel
from typing import List, Union, Optional

from ..config import settings, logger

# --- Configuration Validation ---
def validate_ai_config() -> bool:
    """
    Validates AI service configuration.
    Returns True if configuration is valid, False otherwise.
    """
    errors = []
    
    if not settings.API_KEY:
        errors.append("API_KEY is required")
    
    if not settings.AI_MODEL:
        errors.append("AI_MODEL is required")
        
    if not settings.EMBEDDING_MODEL:
        errors.append("EMBEDDING_MODEL is required")
    
    if errors:
        logger.error(f"AI service configuration validation failed: {', '.join(errors)}")
        return False
    
    logger.info("AI service configuration validation passed")
    return True

# --- Client Initialization ---
client = None
if validate_ai_config():
    try:
        client = OpenAI(
            api_key=settings.API_KEY,
            base_url=settings.BASE_URL,
            timeout=300.0,
        )
        logger.info("AI service client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AI service client: {e}")
else:
    logger.warning("AI service client not initialized due to configuration issues")

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

@backoff.on_exception(backoff.expo, (RateLimitError, APITimeoutError, APIConnectionError), max_tries=3)
def get_embedding(text: str) -> list[float] | None:
    """
    Generates an embedding for the given text with retry logic.
    """
    if not client:
        logger.info("AI service is disabled. Skipping embedding generation.")
        return None

    try:
        response = client.embeddings.create(
            input=text,
            model=settings.EMBEDDING_MODEL,
        )
        return response.data[0].embedding
    except APIError as e:
        logger.error(f"OpenAI APIError during embedding generation: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during embedding generation: {e}")
        return None

@backoff.on_exception(backoff.expo, (RateLimitError, APITimeoutError, APIConnectionError), max_tries=3)
def call_ai(system_prompt: str, user_prompt: str, model: str | None = None) -> dict | None:
    """
    Generic AI call function with custom system and user prompts.
    Returns raw JSON response without validation for maximum flexibility.
    """
    if not client:
        logger.info("AI service is disabled. Skipping AI call.")
        return None

    # Use specified model or fall back to default
    ai_model = model or settings.AI_MODEL

    try:
        completion = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        raw_json_response = completion.choices[0].message.content
        if not raw_json_response:
            logger.warning("AI returned an empty response.")
            return None

        return json.loads(raw_json_response)

    except APIError as e:
        logger.error(f"OpenAI APIError during AI call: {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from AI response: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during AI call: {e}")
        return None

@backoff.on_exception(backoff.expo, (RateLimitError, APITimeoutError, APIConnectionError), max_tries=3)
def analyze_text(text: str) -> dict | None:
    """
    Analyzes text with retry logic and returns a structured analysis.
    """
    if not client:
        logger.info("AI service is disabled. Skipping text analysis.")
        return None

    try:
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
            logger.warning("AI returned an empty response.")
            return None

        json_response = json.loads(raw_json_response)

        validated_obj = AIAnalysisResponse.model_validate(json_response)
        return validated_obj.model_dump()

    except APIError as e:
        logger.error(f"OpenAI APIError during text analysis: {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from AI response: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during text analysis: {e}")
        return None

# --- Essay Analysis Service ---

class AIService:
    """Service class for AI-powered essay analysis"""

    def __init__(self):
        self.client = client

    async def analyze_essay(self, question: str, content: str, essay_type: str) -> dict:
        """
        Analyze an essay and return scores and suggestions

        Args:
            question: The essay question/prompt
            content: The essay content
            essay_type: 'application' or 'continuation'

        Returns:
            Dict containing scores, total_score, max_score, and suggestion_cards
        """
        if not self.client:
            raise Exception("AI service is not available")

        # Determine scoring criteria based on essay type
        if essay_type == "application":
            max_score = 15
            scoring_prompt = self._get_application_essay_prompt()
        else:  # continuation
            max_score = 25
            scoring_prompt = self._get_continuation_essay_prompt()

        # Get the JSON format example based on essay type
        json_example = self._get_json_example(essay_type, max_score)

        # Create the analysis prompt
        analysis_prompt = f"""
        {scoring_prompt}

        Essay Question: {question}

        Essay Content: {content}

        Please analyze this essay and provide:
        1. Detailed scores for each category
        2. Overall assessment
        3. Multiple specific improvement suggestions (aim for 5-8 suggestions across different categories)

        CRITICAL SCORING REMINDERS:
        - This is written by a high school student with above-average English proficiency
        - A grades should be EXTREMELY RARE - only for work that significantly exceeds high school expectations
        - Most competent high school essays should receive B-C grades in most categories
        - Be realistic about what constitutes exceptional vs. typical high school performance
        - Do not inflate scores - maintain academic rigor appropriate for the level

        IMPORTANT: For ALL suggestions, you MUST provide:
        - "original": The exact text from the essay that needs improvement (copy word-for-word)
        - "suggestion": The specific improved replacement text
        - "position": Specific location like "paragraph 1, sentence 2" or "line 3"
        - "explanation": Clear reason for the improvement

        For suggestions, please provide:
        - Multiple vocabulary improvements (2-20 suggestions) - exact word replacements
        - Multiple language/grammar improvements (2-15 suggestions) - exact sentence/phrase replacements
        - Structure/content improvements (1-3 suggestions) - specific, relevant, text additions or replacements

        Every suggestion must be directly applicable by replacing the "original" text with the "suggestion" text.

        {json_example}
        """

        try:
            # Use essay-specific model if configured, otherwise fall back to default
            essay_model = settings.ESSAY_AI_MODEL or settings.AI_MODEL
            result = call_ai(
                system_prompt="You are an expert English essay evaluator specializing in exam scoring.",
                user_prompt=analysis_prompt,
                model=essay_model
            )

            if not result:
                raise Exception("Failed to get AI analysis response")

            return result

        except Exception as e:
            logger.error(f"Essay analysis failed: {e}")
            raise

    def _get_application_essay_prompt(self) -> str:
        """Get scoring prompt for application essays"""
        return """
        You are evaluating an application essay (total: 15 points) written by high school students with above-average English proficiency. 
        
        SCORING GUIDELINES:
        - Expected baseline for competent high school students: 9 points (B-C level across categories)
        - Perfect score (all A grades): 13 points - EXTREMELY RARE, only for exceptional work
        - Grade A should be given sparingly - only when performance significantly exceeds high school expectations
        - Most good high school essays should score in 8-11 point range

        1. Element Completeness (4 points):
           - A (4): ALL required elements complete with exceptional depth and insight beyond typical high school level
           - B (3): Elements complete, content substantial and well-developed for high school level
           - C (2): Elements mostly complete, content adequate for high school level
           - D (1): Missing some important elements, content simple but acceptable
           - E (0): Seriously missing elements, content insufficient

        2. Format Specification (4 points):
           - A (4): Format perfect AND demonstrates sophisticated understanding of genre conventions
           - B (3): Format correct with good layout and organization
           - C (2): Format mostly correct with minor issues typical of high school work
           - D (1): Format errors that don't seriously impede understanding
           - E (0): Format seriously wrong, difficult to follow

        3. Language Expression (4 points):
           - A (4): Language exceptionally fluent with sophisticated vocabulary and varied sentence structures beyond typical high school level
           - B (3): Language fluent and accurate with good vocabulary for high school level
           - C (2): Language generally fluent with occasional errors typical of high school students
           - D (1): Language adequate but with noticeable errors that sometimes affect clarity
           - E (0): Language problems seriously impede understanding

        4. Handwriting Quality (3 points):
           - A (3): Exceptionally neat and professional presentation
           - B (2): Neat and clearly readable
           - C (1): Generally readable with typical high school presentation
           - D (0): Difficult to read or messy presentation
        """

    def _get_continuation_essay_prompt(self) -> str:
        """Get scoring prompt for continuation essays"""
        return """
        You are evaluating a continuation writing essay (total: 25 points) written by high school students with above-average English proficiency.
        
        SCORING GUIDELINES:
        - Expected baseline for competent high school students: 16 points (B-C level across categories)
        - Perfect score (all A grades): 23 points - EXTREMELY RARE, only for exceptional creative writing
        - Grade A should be given sparingly - only when performance significantly exceeds high school expectations
        - Most good high school essays should score in 14-19 point range

        1. Plot Coherence (7 points):
           - A (6-7): Plot develops with exceptional creativity and sophistication, seamlessly consistent with original, shows advanced narrative understanding
           - B (5): Plot develops naturally and is well-integrated with original story, shows good narrative sense
           - C (3-4): Plot development reasonable and generally consistent, typical of competent high school writing
           - D (1-2): Plot development has logical issues but attempts coherence
           - E (0): Plot development seriously disconnected or illogical

        2. Language Expression (6 points):
           - A (6): Language exceptionally vivid and sophisticated, demonstrates advanced vocabulary and literary techniques beyond typical high school level
           - B (5): Language vivid and engaging with good vocabulary range for high school level
           - C (3-4): Language generally appropriate with adequate expression typical of high school students
           - D (1-2): Language adequate but with noticeable limitations in expression
           - E (0): Language expression seriously impedes understanding

        3. Theme Enhancement (6 points):
           - A (6): Theme exceptionally well-developed with profound insights and sophisticated emotional depth beyond typical high school level
           - B (5): Theme clear with good emotional expression and meaningful development
           - C (3-4): Theme reasonably clear with adequate emotional expression typical of high school work
           - D (1-2): Theme somewhat unclear but shows some emotional understanding
           - E (0): Theme unclear or lacks meaningful emotional content

        4. Handwriting Quality (6 points):
           - A (5-6): Exceptionally neat presentation that enhances readability, professional quality
           - B (4): Neat and well-organized presentation
           - C (2-3): Generally neat and readable, typical high school presentation
           - D (1): Adequate readability despite some presentation issues
           - E (0): Poor presentation that impedes readability
        """

    def _get_json_example(self, essay_type: str, max_score: int) -> str:
        """Get JSON format example based on essay type"""
        if essay_type == "application":
            return """
        Return the response in the following JSON format (use the exact category names):
        {
            "scores": {
                "Element Completeness": {"score": 2, "max": 4, "grade": "C", "feedback": "The essay includes most required elements with adequate content for high school level."},
                "Format Specification": {"score": 3, "max": 4, "grade": "B", "feedback": "Format is correct with good organization typical of competent high school work."},
                "Language Expression": {"score": 2, "max": 4, "grade": "C", "feedback": "Language is generally fluent with occasional errors typical of high school students."},
                "Handwriting Quality": {"score": 2, "max": 3, "grade": "B", "feedback": "Neat and clearly readable presentation."}
            },
            "total_score": 9,
            "max_score": 15,
            "suggestion_cards": [
                {
                    "card_id": "vocab_1",
                    "type": "vocabulary",
                    "priority": "high",
                    "data": {
                        "original": "good",
                        "suggestion": "excellent",
                        "position": "paragraph 2, sentence 1",
                        "explanation": "Use more impactful vocabulary to strengthen your argument"
                    }
                },
                {
                    "card_id": "lang_1",
                    "type": "language",
                    "priority": "medium",
                    "data": {
                        "original": "I am writing to apply for the position.",
                        "suggestion": "I am writing to express my strong interest in applying for the position.",
                        "position": "paragraph 1, sentence 1",
                        "explanation": "More formal and enthusiastic opening statement"
                    }
                },
                {
                    "card_id": "struct_1",
                    "type": "structure",
                    "priority": "medium",
                    "data": {
                        "original": "Thank you.",
                        "suggestion": "Thank you for considering my application. I look forward to hearing from you soon.",
                        "position": "paragraph 3, sentence 3",
                        "explanation": "More complete and professional closing"
                    }
                }
            ]
        }
            """
        else:  # continuation
            return """
        Return the response in the following JSON format (use the exact category names):
        {
            "scores": {
                "Plot Coherence": {"score": 4, "max": 7, "grade": "C", "feedback": "Plot development reasonable and generally consistent, typical of competent high school writing."},
                "Language Expression": {"score": 3, "max": 6, "grade": "C", "feedback": "Language generally appropriate with adequate expression typical of high school students."},
                "Theme Enhancement": {"score": 3, "max": 6, "grade": "C", "feedback": "Theme reasonably clear with adequate emotional expression typical of high school work."},
                "Handwriting Quality": {"score": 3, "max": 6, "grade": "C", "feedback": "Generally neat and readable, typical high school presentation."}
            },
            "total_score": 13,
            "max_score": 25,
            "suggestion_cards": [
                {
                    "card_id": "vocab_1",
                    "type": "vocabulary",
                    "priority": "high",
                    "data": {
                        "original": "said",
                        "suggestion": "whispered",
                        "position": "paragraph 2, sentence 3",
                        "explanation": "Use more descriptive dialogue tags to enhance narrative impact"
                    }
                },
                {
                    "card_id": "lang_1",
                    "type": "language",
                    "priority": "medium",
                    "data": {
                        "original": "He walked to the door.",
                        "suggestion": "He cautiously approached the creaking door, his heart pounding with anticipation.",
                        "position": "paragraph 1, sentence 2",
                        "explanation": "Add more descriptive language and emotion to enhance the narrative"
                    }
                },
                {
                    "card_id": "struct_1",
                    "type": "structure",
                    "priority": "medium",
                    "data": {
                        "original": "It was dark.",
                        "suggestion": "The room was shrouded in an eerie darkness that seemed to swallow every ray of light.",
                        "position": "paragraph 1, sentence 1",
                        "explanation": "Expand simple descriptions to create more vivid imagery and atmosphere"
                    }
                },
                {
                    "card_id": "vocab_2",
                    "type": "vocabulary",
                    "priority": "low",
                    "data": {
                        "original": "big",
                        "suggestion": "enormous",
                        "position": "paragraph 3, sentence 1",
                        "explanation": "Use more precise and impactful adjectives"
                    }
                }
            ]
        }
            """