import bcrypt
from sqlalchemy.orm import Session
from models import Users
from schemas.auth_schemas import UserSignupRequest, UserLoginRequest
from typing import Optional


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[Users]:
        return db.query(Users).filter(Users.email == email).first()
    
    @staticmethod
    def create_user(db: Session, user_data: UserSignupRequest) -> Users:
        hashed_password = AuthService.hash_password(user_data.password)
        
        db_user = Users(
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, login_data: UserLoginRequest) -> Optional[Users]:
        user = AuthService.get_user_by_email(db, login_data.email)
        
        if not user:
            return None
        
        if not AuthService.verify_password(login_data.password, user.password_hash):
            return None
        
        return user
    
    @staticmethod
    def signup_or_login(db: Session, email: str, password: str, name: str = None) -> tuple[Users, bool]:

        existing_user = AuthService.get_user_by_email(db, email)
        
        if existing_user:
            if AuthService.verify_password(password, existing_user.password_hash):
                return existing_user, False
            else:
                raise ValueError("Invalid password")
        else:
            if not name:
                raise ValueError("Name is required for new user registration")
            
            user_data = UserSignupRequest(email=email, password=password, name=name)
            new_user = AuthService.create_user(db, user_data)
            return new_user, True
