from sqlalchemy.orm import Session
from models import Users, RouteHistory
from typing import List, Optional


class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[Users]:
        return db.query(Users).filter(Users.id == user_id).first()
    
    @staticmethod
    def get_user_route_history(db: Session, user_id: int) -> List[RouteHistory]:
        return db.query(RouteHistory).filter(RouteHistory.user_id == user_id).order_by(RouteHistory.created_at.desc()).all()
    
