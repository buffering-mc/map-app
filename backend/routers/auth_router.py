from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.base import get_db
from services.auth_service import AuthService
from schemas.auth_schemas import UserSignupRequest, UserLoginRequest, AuthResponse, UserProfileResponse

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignupRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        existing_user = AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = AuthService.create_user(db, user_data)
        
        user_profile = UserProfileResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            created_at=new_user.created_at
        )
        
        return AuthResponse(
            status="success",
            message="User registered successfully",
            user=user_profile
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user login."""
    try:
        user = AuthService.authenticate_user(db, login_data)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_profile = UserProfileResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at
        )
        
        return AuthResponse(
            status="success",
            message="Login successful",
            user=user_profile
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

