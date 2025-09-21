from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.auth.routes import router as auth_routers
from app.rag.routes import router as rag_routers
from starlette.middleware.sessions import SessionMiddleware

# Initialize logging
logging.basicConfig(level=logging.ERROR, filename='logs.txt')

# Initialize FastAPI app
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# we need this to save temporary code & state in session
# app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

# Session middleware stores session data server-side (signed cookie)
# For cross-site cookies in dev, you may need same_site="none" and https_only=False (dev)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="session",       # optional
    same_site="lax",               # set "lax" or "strict" in non-cross-site cases
    https_only=False,               # set True in production (HTTPS)
)

# Include routers
app.include_router(auth_routers)
app.include_router(rag_routers)
