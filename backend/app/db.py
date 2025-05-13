from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Get database URL from environment variable or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./summarizer.db")

# Create SQLAlchemy engine
try:
    engine = create_engine(DATABASE_URL)
    logger.info(f"Connected to database: {DATABASE_URL}")
except Exception as e:
    logger.error(f"Error connecting to database: {e}")
    logger.info("Falling back to SQLite database")
    DATABASE_URL = "sqlite:///./summarizer.db"
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
