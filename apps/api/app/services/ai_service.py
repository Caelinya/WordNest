import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

# --- Configuration ---
API_KEY = os.getenv("API_KEY")
BASE_URL = os.getenv("BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")

client = None
if not API_KEY:
    print("Warning: API_KEY is not set. AI services will be disabled.")
else:
    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

def call_ai(system_prompt: str, user_prompt: str | None = None) -> dict | None:
    """
    A generic function to call the AI model with a system prompt and an optional user prompt.
    Returns the parsed JSON response as a dictionary.
    """
    if not client:
        print("AI service is disabled. Skipping call.")
        return None

    messages = [{"role": "system", "content": system_prompt}]
    if user_prompt:
        messages.append({"role": "user", "content": user_prompt})

    try:
        completion = client.chat.completions.create(
            model="gemini-2.0-flash", # Consider making the model configurable
            messages=messages,
            response_format={"type": "json_object"},
        )
        
        raw_json_response = completion.choices[0].message.content
        if not raw_json_response:
            print("AI returned an empty response.")
            return None
        
        return json.loads(raw_json_response)

    except Exception as e:
        print(f"An error occurred during the AI call: {e}")
        return None