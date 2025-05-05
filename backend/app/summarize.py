# app/summarize.py
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Summary as DBSummary
import logging
import re
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from nltk.cluster.util import cosine_distance
import numpy as np
from collections import Counter
from typing import List, Dict, Tuple, Optional
import networkx as nx

# Configure logging
logger = logging.getLogger(__name__)

# Ensure NLTK resources are downloaded
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    logger.warning(f"NLTK download error (non-critical): {e}")

# Initialize stopwords
STOP_WORDS = set(stopwords.words('english'))

# Router setup
router = APIRouter(prefix="/api/summarize", tags=["summarize"])

# Request/response models
class SummarizeRequest(BaseModel):
    content: str = Field(..., description="Full article text or URL")
    user_email: str | None = Field(None, description="(Optional) user email for attribution")

class SummarizeResponse(BaseModel):
    summary: str

def preprocess_text(text: str) -> str:
    """Clean and normalize text."""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove special characters (keeping punctuation)
    text = re.sub(r'[^\w\s.,!?;:\'"-]', '', text)
    return text

def sentence_similarity(sent1: str, sent2: str) -> float:
    """Calculate similarity between two sentences using word vectors."""
    # Convert to lowercase and tokenize
    words1 = [w.lower() for w in re.findall(r'\w+', sent1) if w.lower() not in STOP_WORDS]
    words2 = [w.lower() for w in re.findall(r'\w+', sent2) if w.lower() not in STOP_WORDS]
    
    # If either sentence has no meaningful words, return 0
    if not words1 or not words2:
        return 0.0
    
    # Create word frequency vectors
    all_words = list(set(words1 + words2))
    vector1 = [1 if word in words1 else 0 for word in all_words]
    vector2 = [1 if word in words2 else 0 for word in all_words]
    
    # Calculate cosine similarity
    return 1 - cosine_distance(vector1, vector2)

def build_similarity_matrix(sentences: List[str]) -> np.ndarray:
    """Build a similarity matrix for all sentences."""
    # Create an empty similarity matrix
    similarity_matrix = np.zeros((len(sentences), len(sentences)))
    
    # Fill the similarity matrix
    for i in range(len(sentences)):
        for j in range(len(sentences)):
            if i == j:
                continue
            similarity_matrix[i][j] = sentence_similarity(sentences[i], sentences[j])
            
    return similarity_matrix

def textrank_summarize(text: str, num_sentences: int = 5) -> str:
    """Generate summary using TextRank algorithm."""
    # Preprocess and split into sentences
    clean_text = preprocess_text(text)
    sentences = sent_tokenize(clean_text)
    
    # If text is short, return it as is
    if len(sentences) <= num_sentences:
        return clean_text
    
    # Build similarity matrix
    similarity_matrix = build_similarity_matrix(sentences)
    
    # Create graph and apply PageRank
    nx_graph = nx.from_numpy_array(similarity_matrix)
    scores = nx.pagerank(nx_graph)
    
    # Sort sentences by score and select top ones
    ranked_sentences = sorted(((scores[i], i) for i in range(len(sentences))), reverse=True)
    top_sentence_indices = [ranked_sentences[i][1] for i in range(min(num_sentences, len(ranked_sentences)))]
    top_sentence_indices.sort()  # Sort by original position
    
    # Combine sentences
    summary = ' '.join([sentences[i] for i in top_sentence_indices])
    return summary

def frequency_summarize(text: str, num_sentences: int = 5) -> str:
    """Generate summary using word frequency approach."""
    # Preprocess and split into sentences
    clean_text = preprocess_text(text)
    sentences = sent_tokenize(clean_text)
    
    # If text is short, return it as is
    if len(sentences) <= num_sentences:
        return clean_text
    
    # Calculate word frequencies
    word_frequencies = Counter()
    for sentence in sentences:
        for word in re.findall(r'\w+', sentence.lower()):
            if word not in STOP_WORDS:
                word_frequencies[word] += 1
    
    # If no meaningful words found, return first few sentences
    if not word_frequencies:
        return ' '.join(sentences[:num_sentences])
    
    # Normalize frequencies
    max_frequency = max(word_frequencies.values())
    for word in word_frequencies:
        word_frequencies[word] = word_frequencies[word] / max_frequency
    
    # Score sentences
    sentence_scores = {}
    for i, sentence in enumerate(sentences):
        for word in re.findall(r'\w+', sentence.lower()):
            if word in word_frequencies:
                if i not in sentence_scores:
                    sentence_scores[i] = 0
                sentence_scores[i] += word_frequencies[word]
    
    # Get top sentences
    top_sentence_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
    top_sentence_indices.sort()  # Sort by original position
    
    # Combine sentences
    summary = ' '.join([sentences[i] for i in top_sentence_indices])
    return summary

def hybrid_summarize(text: str) -> str:
    """Generate summary using a hybrid approach."""
    # Determine appropriate summary length based on input length
    word_count = len(text.split())
    if word_count < 100:
        num_sentences = 2
    elif word_count < 500:
        num_sentences = 3
    elif word_count < 1000:
        num_sentences = 5
    else:
        num_sentences = 7
    
    # Try TextRank first (graph-based)
    try:
        summary = textrank_summarize(text, num_sentences)
        # If summary is too short, fall back to frequency-based
        if len(summary.split()) < 10 and word_count > 50:
            logger.info("TextRank summary too short, using frequency-based approach")
            summary = frequency_summarize(text, num_sentences)
    except Exception as e:
        logger.warning(f"TextRank summarization failed: {e}, using frequency-based approach")
        summary = frequency_summarize(text, num_sentences)
    
    # If still too short, use first few sentences
    if len(summary.split()) < 10 and word_count > 50:
        sentences = sent_tokenize(preprocess_text(text))
        summary = ' '.join(sentences[:3])
        logger.info("Generated summary too short, using first few sentences")
    
    return summary

@router.post("/", response_model=SummarizeResponse)
def summarize_article(
    req: SummarizeRequest,
    db: Session = Depends(get_db)
):
    text = req.content.strip()
    if not text:
        raise HTTPException(status_code=422, detail="No content provided")

    email = req.user_email or "anonymous"
    logger.info(f"Summarizing ({len(text)} chars) for user: {email}")

    try:
        # For debugging
        logger.info(f"Input text: {text[:100]}...")
        
        # Generate summary using our hybrid approach
        summary = hybrid_summarize(text)
        logger.info(f"Generated summary: {summary[:100]}...")
        
        # Persist to database
        try:
            record = DBSummary(
                user_email=email,
                original_text=text,
                summary_text=summary,
                title="Summarized Article"  # Add a default title
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            logger.info(f"Saved summary to database with ID: {record.id}")
        except Exception as e:
            logger.error(f"DB save failed: {e}")
            db.rollback()
            # Continue even if DB save fails
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        # Fallback to simple approach if everything else fails
        sentences = sent_tokenize(text)
        summary = ' '.join(sentences[:3])
        logger.info(f"Used fallback summarization: {summary[:100]}...")

    # Return the summary regardless of whether it was saved to DB
    return SummarizeResponse(summary=summary)
