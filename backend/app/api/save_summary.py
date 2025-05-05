from fastapi import APIRouter, HTTPException, Request, Depends, Query
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Summary

router = APIRouter()

# Define the request body
class SaveSummaryRequest(BaseModel):
    email: str
    title: str
    summary: str
    url: str | None = None

@router.post("/save-summary")
def save_summary(payload: SaveSummaryRequest, db: Session = Depends(get_db)):
    try:
        # Create new summary record
        new_summary = Summary(
            user_email=payload.email,
            title=payload.title,
            summary_text=payload.summary,
            url=payload.url,
            original_text=""  # We don't have the original text in this endpoint
        )
        
        # Add to database and commit
        db.add(new_summary)
        db.commit()
        db.refresh(new_summary)
        
        return {"message": "Summary saved successfully", "id": new_summary.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save summary: {str(e)}")

@router.get("/summarized-articles")
def get_summaries(email: str = Query(...), db: Session = Depends(get_db)):
    try:
        # Query summaries for the user
        summaries = db.query(Summary).filter(Summary.user_email == email).all()
        
        # Format response
        result = []
        for summary in summaries:
            result.append({
                "id": summary.id,
                "title": summary.title or "Untitled",
                "summary": summary.summary_text,
                "url": summary.url,
                "timestamp": summary.created_at.isoformat()
            })
        
        return {"summaries": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve summaries: {str(e)}")
