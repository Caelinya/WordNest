import os
from pydantic import BaseModel
from openai import OpenAI
from typing import List
from dotenv import load_dotenv
import json

load_dotenv()

# --- Configuration ---
API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")

if not API_KEY:
    print("Warning: API_KEY is not set. Translation service will be disabled.")
    client = None
else:
    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

# --- Pydantic Models for Structured Output ---

class Example(BaseModel):
    sentence: str
    translation: str

class Definition(BaseModel):
    part_of_speech: str
    translation: str
    explanation: str
    examples: List[Example]

class KnowledgeObject(BaseModel):
    """
    A structured object containing detailed information about a word or phrase.
    This is the expected output format from the AI model.
    """
    word: str
    definitions: List[Definition]

# --- System Prompt ---
SYSTEM_PROMPT = """
You are a professional dictionary compiler. Your task is to analyze a word or phrase and provide a detailed, structured analysis in JSON format.

**Output Requirements:**
- You MUST respond with ONLY a raw JSON string that conforms to the 'KnowledgeObject' schema. Do not add any extra text, explanations, or markdown formatting like ```json.
- For each meaning (definition), provide the part of speech, translation, a brief explanation, and at least one example sentence with its translation.
- If the word has multiple distinct meanings, provide a separate definition object for each.

**Example:**

User input:
"bank"

Your output (raw JSON string):
{"word":"bank","definitions":[{"part_of_speech":"noun","translation":"银行","explanation":"A financial establishment that invests money deposited by customers, pays it out when required, makes loans at interest, and exchanges currency.","examples":[{"sentence":"I need to go to the bank to deposit some money.","translation":"我需要去银行存点钱。"}]},{"part_of_speech":"noun","translation":"河岸","explanation":"The land alongside or sloping down to a river or lake.","examples":[{"sentence":"We sat on the grassy bank of the river.","translation":"我们坐在长满青草的河岸上。"}]}]}
"""

def translate_text(text: str) -> dict | None:
    """
    Analyzes the given text and returns a structured KnowledgeObject.
    Returns the analysis as a dictionary or None if the service is disabled or fails.
    """
    if not client:
        return None

    try:
        # Ask the model to return a JSON string, then parse it manually
        completion = client.chat.completions.create(
            model="gemini-1.5-flash",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            # We explicitly ask for a JSON response, but parse it ourselves
            response_format={"type": "json_object"},
        )
        
        raw_json_response = completion.choices[0].message.content
        if not raw_json_response:
            return None

        # Manually parse the JSON string using our Pydantic model
        knowledge_object = KnowledgeObject.model_validate_json(raw_json_response)
        
        # Convert the Pydantic model back to a dict for storing in the database
        return knowledge_object.model_dump()

    except Exception as e:
        print(f"An error occurred during translation: {e}")
        return None