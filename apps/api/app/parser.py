from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from .auth import get_current_user
from .models import User
from .services import parser_service

router = APIRouter()

@router.post("/upload")
async def upload_file_and_extract_items(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Accepts a file upload, extracts text, sends it to an AI for analysis,
    and returns a structured list of learning items (words, phrases, sentences).
    """
    try:
        # Step 1: Extract plain text from the uploaded file
        extracted_text = await parser_service.extract_text_from_file(file)

        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="The uploaded file contains no text.")

        # Step 2: Send the text to the AI to get learning items
        learning_items = parser_service.extract_learning_items_from_text(extracted_text)
        
        # The service returns a dict like {"items": [...]}, which is what we want
        return learning_items

    except HTTPException as e:
        # Re-raise known HTTP exceptions (e.g., unsupported file type)
        raise e
    except Exception as e:
        # Catch any other unexpected errors during parsing or AI call
        raise HTTPException(status_code=500, detail=f"An error occurred during processing: {e}")