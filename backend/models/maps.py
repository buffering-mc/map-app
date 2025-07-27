from sqlalchemy import Column, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base


class Maps(Base):
    __tablename__ = "maps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    selected_route = Column(Integer, ForeignKey("route_history.id"),nullable=False)
    other_routes = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("Users", back_populates="maps")
    route_history = relationship("RouteHistory", back_populates="maps")
    
