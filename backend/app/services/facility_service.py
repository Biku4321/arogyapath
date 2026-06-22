"""
Facility lookup service.

Loads a mock JSON dataset of health facilities (designed to mirror what
would, in production, come from the Open Government Data platform or state
health directories) and finds the nearest facilities matching a requested
specialty.
"""
from __future__ import annotations

import json
from pathlib import Path

from geopy.distance import geodesic
from pydantic import BaseModel

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "facilities.json"


class Facility(BaseModel):
    id: str
    name: str
    type: str
    specialties: list[str]
    lat: float
    lng: float
    phone: str
    address: str


class FacilityWithDistance(Facility):
    distance_km: float


def _load_facilities() -> list[Facility]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Facility(**item) for item in raw]


_FACILITIES_CACHE: list[Facility] | None = None


def _all_facilities() -> list[Facility]:
    global _FACILITIES_CACHE
    if _FACILITIES_CACHE is None:
        _FACILITIES_CACHE = _load_facilities()
    return _FACILITIES_CACHE


def find_nearest_facilities(
    user_lat: float,
    user_lng: float,
    specialty: str | None = None,
    limit: int = 5,
) -> list[FacilityWithDistance]:
    """
    Return facilities sorted by distance from the user's location.
    If `specialty` is given, prefer facilities offering that specialty;
    if none match, fall back to General Physician / any facility so the
    user always gets a usable result.
    """
    facilities = _all_facilities()

    def matches_specialty(fac: Facility) -> bool:
        if not specialty:
            return True
        return any(specialty.lower() in s.lower() or s.lower() in specialty.lower() for s in fac.specialties)

    candidates = [f for f in facilities if matches_specialty(f)]
    if not candidates:
        # Fallback: anything with General Physician, else everything
        candidates = [f for f in facilities if any("general physician" in s.lower() for s in f.specialties)]
    if not candidates:
        candidates = facilities

    results: list[FacilityWithDistance] = []
    for fac in candidates:
        distance = geodesic((user_lat, user_lng), (fac.lat, fac.lng)).kilometers
        results.append(FacilityWithDistance(**fac.model_dump(), distance_km=round(distance, 2)))

    results.sort(key=lambda f: f.distance_km)
    return results[:limit]
