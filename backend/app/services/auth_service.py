from fastapi import Request, Response
from starlette.responses import RedirectResponse
from fastapi.responses import JSONResponse
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings

# Configure OAuth
oauth = OAuth()

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"

oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
    authorize_params={"access_type": "offline", "prompt": "consent"},
)


class AuthService:
    @staticmethod
    async def login(request: Request) -> RedirectResponse:
        redirect_uri = request.url_for("callback")  # must match Google console
        return await oauth.google.authorize_redirect(request, redirect_uri)

    @staticmethod
    async def callback(request: Request) -> RedirectResponse:
        token = await oauth.google.authorize_access_token(request)

        # Try parsing ID token, fallback to userinfo
        user_info = await oauth.google.userinfo(token=token)

        request.session["user"] = dict(user_info)

        # Redirect response with cookie
        redirect_response = RedirectResponse(
            url="https://doc-chat-rag-app-bosg.vercel.app/chat"
        )

        # redirect_response.set_cookie(
        #     key="session",
        #     value=token["access_token"],
        #     max_age=86400,   # 24 hours
        #     secure=True,     # Required for SameSite=None
        #     httponly=True,   # Protect against JS access
        #     samesite="none",  # Allow cross-site
        #     path="/",
        # )

        return redirect_response

    @staticmethod
    async def logout(request: Request) -> JSONResponse:
        request.session.clear()
        return JSONResponse(content={"message": "You have been logged out"})

    @staticmethod
    async def get_me(request: Request) -> dict:
        user = request.session.get("user")
        if not user:
            return {"user": None}
        return {"user": user}
