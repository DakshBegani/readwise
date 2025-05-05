from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import logging

from app.db import get_db
from app.models import User

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

GOOGLE_CLIENT_ID = "447382312160-djdufraeovgi97a6j2m36nelai4vhd7d.apps.googleusercontent.com"

@router.post("/google-login")
async def google_login(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        token = data.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")

        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)
            
            # Check if user exists
            user = db.query(User).filter(User.email == idinfo["email"]).first()

            if not user:
                # Create new user
                user = User(
                    email=idinfo["email"],
                    name=idinfo.get("name", ""),
                    picture=idinfo.get("picture", "")
                )
                db.add(user)
                try:
                    db.commit()
                    db.refresh(user)
                    logger.info(f"Created new user: {user.email}")
                except Exception as e:
                    db.rollback()
                    logger.error(f"Failed to create user: {e}")
                    raise HTTPException(status_code=500, detail="Database error")
            else:
                logger.info(f"User logged in: {user.email}")

            return {"message": "Login successful", "email": user.email, "name": user.name}

        except ValueError as e:
            logger.error(f"Invalid token: {e}")
            raise HTTPException(status_code=401, detail="Invalid Google token")
            
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")