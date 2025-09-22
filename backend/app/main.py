from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import logging
from app.core.config import settings
from app.api.auth import router as auth_routers
from app.api.rag import router as rag_routers
from app.api.files import router as files_routers

# Initialize logging
logging.basicConfig(level=logging.ERROR, filename='logs.txt')

# Initialize FastAPI app
app = FastAPI()


# app.add_middleware(
#     SessionMiddleware,
#     secret_key=settings.session_secret,
#     session_cookie="session",       # cookie name
#     same_site="none",               # set "lax" or "strict" in non-cross-site cases
#     https_only=(settings.environment == "production"),
# )
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="session",
    max_age=86400,  # 24 hours in seconds
    same_site="none",  # Required for cross-site requests
    https_only=True,   # Must be True in production for same_site="none"
    domain=None,       # Let browser handle domain
    path="/",          # Ensure cookie is available for all paths
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_headers=["Access-Control-Allow-Headers", 'Content-Type',
                   'Authorization', 'Access-Control-Allow-Origin'],
)

# Include routers
app.include_router(auth_routers)
app.include_router(rag_routers)
app.include_router(files_routers)
