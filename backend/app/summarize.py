# app/summarize.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Summary as DBSummary
import logging
import re
import nltk
import os

# Configure logging
logger = logging.getLogger(__name__)

# Skip downloading and just use the data that should already be downloaded
try:
    from nltk.tokenize import sent_tokenize
    from nltk.corpus import stopwords
    STOP_WORDS = set(stopwords.words('english'))
    logger.info("NLTK resources loaded successfully")
except Exception as e:
    logger.warning(f"NLTK import error: {e}")
    # Fallback to empty stopwords if import fails
    STOP_WORDS = set()
    # Define a simple sentence tokenizer as fallback
    def sent_tokenize(text):
        return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
    logger.warning("Using fallback tokenizer and empty stopwords")

# Import remaining modules
from collections import Counter
from typing import List, Dict, Tuple, Optional
import numpy as np
try:
    import networkx as nx
except ImportError:
    logger.warning("NetworkX not available, will use simpler summarization")
    nx = None

# Create a simple fallback summarizer
def simple_summarize(text, num_sentences=3):
    """Simple summarization by returning the first few sentences"""
    sentences = sent_tokenize(text)
    return ' '.join(sentences[:num_sentences])

# Create a more advanced summarizer
def extract_summarize(text, num_sentences=3):
    """
    Extractive summarization by finding the most important sentences
    based on word frequency analysis
    """
    try:
        # Clean and tokenize the text
        clean_text = re.sub(r'\s+', ' ', text).strip()
        sentences = sent_tokenize(clean_text)
        
        # If text is too short, just return it
        if len(sentences) <= num_sentences:
            return ' '.join(sentences)
        
        # Tokenize words and remove stopwords
        words = [word.lower() for sentence in sentences 
                for word in re.findall(r'\w+', sentence) 
                if word.lower() not in STOP_WORDS and len(word) > 2]
        
        # Count word frequencies
        word_freq = Counter(words)
        
        # Score sentences based on word frequencies
        sentence_scores = []
        for sentence in sentences:
            score = 0
            for word in re.findall(r'\w+', sentence.lower()):
                if word in word_freq:
                    score += word_freq[word]
            # Normalize by sentence length to avoid bias towards longer sentences
            sentence_scores.append(score / (len(re.findall(r'\w+', sentence)) + 1))
        
        # Get indices of top sentences
        top_indices = np.argsort(sentence_scores)[-num_sentences:]
        # Sort indices to maintain original order
        top_indices = sorted(top_indices)
        
        # Construct summary from top sentences
        summary = ' '.join([sentences[i] for i in top_indices])
        return summary
    
    except Exception as e:
        logger.error(f"Advanced summarization failed: {e}")
        # Fall back to simple summarization
        return simple_summarize(text, num_sentences)

# Add these imports at the top with other imports
from transformers import pipeline

# Add this with other try/except blocks
try:
    from transformers import pipeline
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn", max_length=150, min_length=40)
    TRANSFORMERS_AVAILABLE = True
    logger.info("Hugging Face transformers loaded successfully")
except Exception as e:
    logger.warning(f"Transformers import error: {e}")
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Using fallback summarization methods")

def huggingface_summarize(text):
    """
    Use Hugging Face's pre-trained summarization model
    """
    if not TRANSFORMERS_AVAILABLE:
        logger.warning("Transformers not available, falling back to extractive summarization")
        return extract_summarize(text)
    
    try:
        # Truncate very long texts to avoid model limits
        if len(text) > 1024:
            logger.info(f"Truncating long text from {len(text)} chars to 1024")
            text = text[:1024]
        
        # Generate summary
        result = summarizer(text, max_length=150, min_length=40, do_sample=False)
        summary = result[0]['summary_text']
        logger.info(f"Hugging Face generated summary: {summary[:100]}...")
        return summary
            
    except Exception as e:
        logger.error(f"Hugging Face summarization failed: {e}")
        # Fall back to our extractive summarization
        return extract_summarize(text)

# Router setup
router = APIRouter(prefix="/api/summarize", tags=["summarize"])

# Request/response models
class SummarizeRequest(BaseModel):
    content: str = Field(..., description="Full article text or URL")
    user_email: str | None = Field(None, description="(Optional) user email for attribution")

class SummarizeResponse(BaseModel):
    summary: str

@router.post("/", response_model=SummarizeResponse)
def summarize_article(
    req: SummarizeRequest,
    db: Session = Depends(get_db)
):
    try:
        text = req.content.strip()
        if not text:
            raise HTTPException(status_code=422, detail="No content provided")

        email = req.user_email or "anonymous"
        logger.info(f"Summarizing ({len(text)} chars) for user: {email}")

        # Try Hugging Face summarization first
        try:
            summary = huggingface_summarize(text)
            logger.info("Used Hugging Face summarization")
        except Exception as e:
            logger.error(f"Hugging Face summarization failed: {e}")
            # Fall back to extractive summarization
            try:
                summary = extract_summarize(text)
                logger.info("Used extractive summarization")
            except Exception as e2:
                logger.error(f"Extractive summarization failed: {e2}")
                # Last resort: simple summarization
                summary = simple_summarize(text)
                logger.info("Used simple summarization")
        
        logger.info(f"Generated summary: {summary[:100]}...")
        
        # Save to database
        try:
            record = DBSummary(
                user_email=email,
                original_text=text,
                summary_text=summary,
                title="Summarized Article"
            )
            db.add(record)
            db.commit()
            logger.info("Summary saved to database")
        except Exception as e:
            logger.error(f"Database error: {e}")
            db.rollback()
        
        return SummarizeResponse(summary=summary)
    
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return SummarizeResponse(
            summary="I couldn't generate a proper summary due to a technical issue. "
                   "Please try again with a different text or contact support if the issue persists."
        )

# Add a health check endpoint
@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify the router is working"""
    return {"status": "ok", "message": "Summarize test endpoint is working"}
