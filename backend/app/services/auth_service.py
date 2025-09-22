from fastapi import Request
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
        response = RedirectResponse(
            url="https://doc-chat-rag-app-bosg.vercel.app/chat")
        # response.set_cookie(
        #     key="session",
        #     value="YOUR_SESSION_VALUE",
        #     secure=True,
        #     httponly=True,
        #     samesite="none",
        #     path="/"
        # )
        return response

        # return RedirectResponse(url="https://doc-chat-rag-app-bosg.vercel.app/chat")

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
