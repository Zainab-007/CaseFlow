from fastapi import APIRouter
from .patients import router as patients_router
from .interviews import router as interviews_router
from .documents import router as documents_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(patients_router)
api_router.include_router(interviews_router)
api_router.include_router(documents_router)

__all__ = ["api_router"]
