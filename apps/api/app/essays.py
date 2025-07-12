from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from .db import engine
from .auth import get_current_user
from .models import User, Essay, EssayVersion, SuggestionCard
from .schemas import (
    EssayCreate, EssayResponse, EssayVersionCreate, EssayVersionResponse,
    SuggestionCardResponse, EssayAnalysisRequest, EssayAnalysisResponse,
    EssayVersionSummary
)
from .services.ai_service import AIService
from .config import settings

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=EssayResponse)
async def create_essay(
    essay_data: EssayCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new essay"""
    essay = Essay(
        title=essay_data.title,
        question=essay_data.question,
        type=essay_data.type,
        owner_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(essay)
    session.commit()
    session.refresh(essay)
    
    return essay

@router.get("", response_model=List[EssayResponse])
async def get_essays(
    skip: int = 0,
    limit: int = 100,
    essay_type: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's essays with their versions"""
    query = select(Essay).where(Essay.owner_id == current_user.id)

    if essay_type:
        query = query.where(Essay.type == essay_type)

    query = query.offset(skip).limit(limit).order_by(Essay.created_at.desc())

    essays = session.exec(query).all()

    # Build response with versions
    essay_responses = []
    for essay in essays:
        # Get versions for this essay
        versions_query = select(EssayVersion).where(
            EssayVersion.essay_id == essay.id
        ).order_by(EssayVersion.version_number.desc())

        versions = session.exec(versions_query).all()

        # Convert to response format
        version_summaries = [
            EssayVersionSummary(
                id=v.id,
                version_number=v.version_number,
                total_score=v.total_score,
                max_score=v.max_score,
                created_at=v.created_at
            ) for v in versions
        ]

        essay_response = EssayResponse(
            id=essay.id,
            title=essay.title,
            question=essay.question,
            type=essay.type,
            created_at=essay.created_at,
            updated_at=essay.updated_at,
            owner_id=essay.owner_id,
            versions=version_summaries
        )
        essay_responses.append(essay_response)

    return essay_responses

@router.get("/config")
async def get_essay_config(current_user: User = Depends(get_current_user)):
    """Get current essay analysis configuration"""
    return {
        "essay_model": settings.ESSAY_AI_MODEL or settings.AI_MODEL,
        "default_model": settings.AI_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL
    }

@router.get("/{essay_id}", response_model=EssayResponse)
async def get_essay(
    essay_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific essay with its versions"""
    essay = session.get(Essay, essay_id)

    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )

    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this essay"
        )

    # Get versions for this essay
    versions_query = select(EssayVersion).where(
        EssayVersion.essay_id == essay_id
    ).order_by(EssayVersion.version_number.desc())

    versions = session.exec(versions_query).all()

    # Convert to response format
    version_summaries = [
        EssayVersionSummary(
            id=v.id,
            version_number=v.version_number,
            total_score=v.total_score,
            max_score=v.max_score,
            created_at=v.created_at
        ) for v in versions
    ]

    return EssayResponse(
        id=essay.id,
        title=essay.title,
        question=essay.question,
        type=essay.type,
        created_at=essay.created_at,
        updated_at=essay.updated_at,
        owner_id=essay.owner_id,
        versions=version_summaries
    )

@router.post("/{essay_id}/versions", response_model=EssayVersionResponse)
async def create_essay_version(
    essay_id: int,
    version_data: EssayVersionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new version of an essay"""
    essay = session.get(Essay, essay_id)
    
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    
    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this essay"
        )
    
    # Get the next version number
    latest_version = session.exec(
        select(EssayVersion)
        .where(EssayVersion.essay_id == essay_id)
        .order_by(EssayVersion.version_number.desc())
        .limit(1)
    ).first()
    
    next_version_number = (latest_version.version_number + 1) if latest_version else 1
    
    essay_version = EssayVersion(
        essay_id=essay_id,
        version_number=next_version_number,
        content=version_data.content,
        scores=version_data.scores,
        total_score=version_data.total_score,
        max_score=version_data.max_score,
        created_at=datetime.now(timezone.utc)
    )
    
    session.add(essay_version)
    session.commit()
    session.refresh(essay_version)
    
    # Update essay's updated_at timestamp
    essay.updated_at = datetime.now(timezone.utc)
    session.add(essay)
    session.commit()
    
    return essay_version

@router.get("/{essay_id}/versions", response_model=List[EssayVersionResponse])
async def get_essay_versions(
    essay_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all versions of an essay"""
    essay = session.get(Essay, essay_id)
    
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    
    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this essay"
        )
    
    versions = session.exec(
        select(EssayVersion)
        .where(EssayVersion.essay_id == essay_id)
        .order_by(EssayVersion.version_number.desc())
    ).all()
    
    return versions

@router.get("/versions/{version_id}/suggestions", response_model=List[SuggestionCardResponse])
async def get_version_suggestions(
    version_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get suggestion cards for a specific version"""
    version = session.get(EssayVersion, version_id)
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay version not found"
        )
    
    # Check if user owns the essay
    essay = session.get(Essay, version.essay_id)
    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this essay"
        )
    
    suggestions = session.exec(
        select(SuggestionCard)
        .where(SuggestionCard.version_id == version_id)
        .order_by(SuggestionCard.priority.desc())
    ).all()
    
    return suggestions

@router.post("/analyze", response_model=EssayAnalysisResponse)
async def analyze_essay(
    analysis_request: EssayAnalysisRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Analyze an essay and generate scores and suggestions"""
    ai_service = AIService()
    
    try:
        # Get AI analysis
        analysis_result = await ai_service.analyze_essay(
            question=analysis_request.question,
            content=analysis_request.content,
            essay_type=analysis_request.type
        )
        
        return EssayAnalysisResponse(
            scores=analysis_result["scores"],
            total_score=analysis_result["total_score"],
            max_score=analysis_result["max_score"],
            suggestion_cards=analysis_result["suggestion_cards"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@router.put("/suggestions/{suggestion_id}/apply")
async def apply_suggestion(
    suggestion_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Mark a suggestion as applied"""
    suggestion = session.get(SuggestionCard, suggestion_id)
    
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found"
        )
    
    # Check if user owns the essay
    version = session.get(EssayVersion, suggestion.version_id)
    essay = session.get(Essay, version.essay_id)
    
    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this suggestion"
        )
    
    suggestion.applied = True
    suggestion.applied_at = datetime.now(timezone.utc)
    
    session.add(suggestion)
    session.commit()
    
    return {"message": "Suggestion applied successfully"}

@router.delete("/{essay_id}")
async def delete_essay(
    essay_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an essay and all its versions"""
    essay = session.get(Essay, essay_id)
    
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay not found"
        )
    
    if essay.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this essay"
        )
    
    session.delete(essay)
    session.commit()
    
    return {"message": "Essay deleted successfully"}
