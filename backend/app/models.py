from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db import Base

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    original_text = Column(Text)
    summary_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    url = Column(String, nullable=True)
    title = Column(String, nullable=True)