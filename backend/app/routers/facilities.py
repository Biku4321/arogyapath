"""
Facilities API router.
"""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.facility_service import FacilityWithDistance, find_nearest_facilities

router = APIRouter(prefix="/api/facilities", tags=["facilities"])


@router.get("/nearby", response_model=list[FacilityWithDistance])
def get_nearby_facilities(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    specialty: str | None = Query(None, description="Preferred specialty to filter by"),
    limit: int = Query(5, ge=1, le=20),
) -> list[FacilityWithDistance]:
    return find_nearest_facilities(user_lat=lat, user_lng=lng, specialty=specialty, limit=limit)
