from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    status: str
    message: str
    user: Optional[UserProfileResponse] = None
    access_token: Optional[str] = None
