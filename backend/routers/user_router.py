from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from models.base import get_db
from services.user_service import UserService
from schemas.auth_schemas import UserProfileResponse
from schemas.route_schemas import RouteHistoryResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    try:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfileResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user profile: {str(e)}")



@router.get("/{user_id}/routes", response_model=List[RouteHistoryResponse])
async def get_user_routes(user_id: int, db: Session = Depends(get_db)):
    try:
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        routes = UserService.get_user_route_history(db, user_id)
        return routes
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user routes: {str(e)}")
