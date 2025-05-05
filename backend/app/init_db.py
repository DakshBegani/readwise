from app.db import engine, Base
from app.models import Summary

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

if __name__ == "__main__":
    init_db()