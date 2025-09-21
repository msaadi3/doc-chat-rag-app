from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    # database_url: str = Field(..., alias="DATABASE_URL")

    # Google Gemini
    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")

    # chroma
    chroma_db_api_key: str = Field(..., alias="CHROMA_API_KEY")
    chroma_database: str = Field(..., alias="CHROMA_DATABASE")
    chroma_tenant: str = Field(..., alias="CHROMA_TENANT")

    # Auth
    google_client_id: str = Field(..., alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(..., alias="GOOGLE_CLIENT_SECRET")
    redirect_uri: str = Field(..., alias="REDIRECT_URI")
    session_secret: str = Field(..., alias="SESSION_SECRET")

    # CORS / Cookies
    cors_origins: str = Field(..., alias="CORS_ORIGINS")
    # cookie_secure: bool = Field(False, alias="COOKIE_SECURE")
    # cookie_samesite: str = Field("lax", alias="COOKIE_SAMESITE")


settings = Settings()
