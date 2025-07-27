from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List
from models.base import get_db
from services.map_service import MapService
from services.user_service import UserService
from schemas.route_schemas import RouteRequest, RouteResponse, RouteHistoryResponse

router = APIRouter(prefix="/maps", tags=["maps"])


@router.post("/calculate-route", response_model=RouteResponse)
async def calculate_route(
    req: Request,
    request: RouteRequest,
    db: Session = Depends(get_db)
):
    """Calculate optimal route with charging point bonuses for a specific user."""
    try:
        user_id = req.headers.get("x-user-id")
        # print("------------- found user id :: ", user_id)
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        result = await MapService.calculate_optimal_route(db, user_id, request)
        return result
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route calculation failed: {str(e)}")


