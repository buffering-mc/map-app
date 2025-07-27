import os
from pathlib import Path
from dotenv import load_dotenv

class Config:
    def __init__(self):
        load_dotenv()
        self.BACKEND_DIR = Path(__file__).resolve().parent
        
        self.env_files = [
            self.BACKEND_DIR / '.env',
            self.BACKEND_DIR.parent / '.env'
        ]

            
        self.GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        
config = Config()
