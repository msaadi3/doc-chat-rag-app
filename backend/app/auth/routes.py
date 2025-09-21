from fastapi import Request, APIRouter
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# Configure OAuth
oauth = OAuth()

CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'

oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
    authorize_params={"access_type": "offline",
                      "prompt": "consent"}
)


@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for(
        "callback")  # must match Google console
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    # user_info = await oauth.google.parse_id_token(request, token)

    # if not user_info:  # fallback if no id_token
    user_info = await oauth.google.userinfo(token=token)
    print("User info:", user_info)
    request.session["user"] = dict(user_info)
    return RedirectResponse(url="http://localhost:3000/chat")


@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="http://localhost:3000/auth")


@router.get("/me")
async def get_me(request: Request):
    user = request.session.get("user")
    if not user:
        return {"user not found": None}
    return {"user": user}
