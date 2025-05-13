from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.dashboard import router as dashboard_router
from app.auth import router as auth_router
from app.summarize import router as summarize_router
from app.api import save_summary
from app.db import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize database tables
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.include_router(auth_router, prefix="/api/auth")
app.include_router(summarize_router)  # This already has /api/summarize prefix
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(save_summary.router, prefix="/api")  # This already has /save-summary in the router

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}
