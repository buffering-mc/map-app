from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from logging.config import dictConfig
import logging

from models.base import create_tables
from routers import auth_router, map_router, user_router

load_dotenv()

logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        }
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        }
    },
    "root": {
        "handlers": ["default"],
        "level": "INFO"
    },
    "loggers": {
        "uvicorn.error": {"level": "INFO", "handlers": ["default"], "propagate": False},
        "uvicorn.access": {"level": "INFO", "handlers": ["default"], "propagate": False}
    }
}

dictConfig(logging_config)

app = FastAPI(
    title="Map Route API with Authentication",
    description="Backend API for the authenticated map routing application with charging point bonuses",
    version="2.0.0"
)

create_tables()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(map_router.router)
app.include_router(user_router.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Map Route API with Authentication",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/auth/",
            "maps": "/maps/",
            "users": "/users/",
            "health": "/health",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
