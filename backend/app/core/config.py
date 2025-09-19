from pydantic import  ConfigDict, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    # database_url: str = Field(..., alias="DATABASE_URL")

    # Google Gemini
    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")

    #chroma 
    chroma_db_api_key: str = Field(..., alias="CHROMA_API_KEY")
    chroma_database: str = Field(..., alias="CHROMA_DATABASE")
    chroma_tenant: str = Field(..., alias="CHROMA_TENANT")   
    
    # Security
    # secret_key: str = Field(..., alias="SECRET_KEY")
    # algorithm: str = Field("HS256", alias="ALGORITHM")
    # access_token_expire_minutes: int = Field(15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    # refresh_token_expire_days: int = Field(30, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS / Cookies
    # cors_origins: List[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    # cors_origins: str = Field(default_factory=str, alias="CORS_ORIGINS")
    # cookie_secure: bool = Field(False, alias="COOKIE_SECURE")
    # cookie_samesite: str = Field("lax", alias="COOKIE_SAMESITE")

settings = Settings()