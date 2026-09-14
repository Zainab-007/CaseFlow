"""
CaseFlow Backend Application Entry Point.
SIH26047 — AI-Powered Patient Case-Taking System.
Clinical documentation & pre-consultation decision support API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router

app = FastAPI(
    title="CaseFlow Clinical Intake API",
    description=(
        "Backend foundation for CaseFlow (SIH26047). "
        "Provides clinical intake management, doctor OPD queue, timeline aggregation, "
        "and verification endpoints. Operating strictly as documentation support."
    ),
    version="1.0.0-prototype",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local development with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": "CaseFlow Clinical Backend",
        "version": "1.0.0-prototype",
        "mode": "foundation"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
