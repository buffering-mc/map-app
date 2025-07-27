from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base


class RouteHistory(Base):
    __tablename__ = "route_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    distance = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    polyline_data = Column(Text, nullable=True)
    optimization_criteria = Column(String, default="fastest")
    bonus_type = Column(String, nullable=True)
    bonus_value = Column(Integer, default=0)
    max_round_trips = Column(Integer, default=0)
    num_nodes = Column(Integer, default=0)
    total_distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("Users", back_populates="route_history")
    maps = relationship("Maps", back_populates="route_history")
