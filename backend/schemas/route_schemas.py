from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    optimization_criteria: Optional[str]
    mode: Optional[str]


class RouteResponse(BaseModel):
    status: str
    polyline: Optional[str] = None
    distance: Optional[str] = None
    duration: Optional[str] = None
    optimization_used: Optional[str] = None
    route_id: Optional[int] = None
    bonus_type: Optional[str] = None
    bonus_value: Optional[int] = None
    max_round_trips: Optional[int] = None
    num_nodes: Optional[int] = None
    total_distance_km: Optional[float] = None
    message: Optional[str] = None
    other_routes: Optional[List[Dict]] = None


class RouteHistoryResponse(BaseModel):
    id: int
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    distance: Optional[str]
    duration: Optional[str]
    optimization_criteria: str
    bonus_type: Optional[str]
    bonus_value: Optional[int]
    max_round_trips: Optional[int]
    num_nodes: Optional[int]
    total_distance_km: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
