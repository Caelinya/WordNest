import json
from openai import OpenAI
from ..config import settings

client = None
if not settings.API_KEY:
    print("Warning: API_KEY is not set. AI services will be disabled.")
else:
    client = OpenAI(
        api_key=settings.API_KEY,
        base_url=settings.BASE_URL,
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
            model=settings.AI_MODEL,
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

def get_embedding(text: str) -> list[float] | None:
    """
    Generates an embedding for the given text using the specified AI model.
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