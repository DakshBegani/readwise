# backend/app/dashboard.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.db import get_db
from app.models import Summary
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class MetricsResponse(BaseModel):
    total_summaries: int
    average_length: float
    last_summary: str

class SummaryItemResponse(BaseModel):
    id: int
    summary_text: str
    original_text: str
    created_at: str

class SummariesResponse(BaseModel):
    summaries: List[SummaryItemResponse]

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(email: str = Query(...)):
    print(f"Getting metrics for email: {email}")
    db = next(get_db())
    q = db.query(Summary).filter(Summary.user_email == email)
    total = q.count()
    print(f"Found {total} summaries")
    
    avg = db.query(func.avg(func.length(Summary.summary_text))).filter(Summary.user_email == email).scalar() or 0
    last = q.order_by(Summary.created_at.desc()).first()
    
    return MetricsResponse(
        total_summaries=total,
        average_length=float(avg),
        last_summary=(last.summary_text if last else "")
    )

@router.get("/summaries", response_model=SummariesResponse)
def get_summaries(email: str = Query(...)):
    print(f"Getting summaries for email: {email}")
    db = next(get_db())
    summaries = db.query(Summary).filter(Summary.user_email == email).order_by(Summary.created_at.desc()).all()
    print(f"Found {len(summaries)} summaries")
    
    result = SummariesResponse(
        summaries=[
            SummaryItemResponse(
                id=s.id,
                summary_text=s.summary_text,
                original_text=s.original_text,
                created_at=s.created_at.isoformat()
            ) for s in summaries
        ]
    )
    return result

class HeatmapPoint(BaseModel):
    date: str
    count: int

@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap(db: Session = Depends(get_db)):
    user_email = "user@example.com"  # Replace with session-authenticated user
    rows = (
        db.query(
            cast(Summary.created_at, Date).label("date"),
            func.count(Summary.id).label("count")
        )
        .filter(Summary.user_email == user_email)
        .group_by("date")
        .all()
    )
    return [HeatmapPoint(date=str(r.date), count=r.count) for r in rows]
