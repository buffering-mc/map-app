import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.base import Base, engine
from models.users import Users
from models.maps import Maps
from models.route_history import RouteHistory

def init_database():
    Base.metadata.create_all(bind=engine)
    print(f"Tables created: {list(Base.metadata.tables.keys())}")

if __name__ == "__main__":
    init_database()