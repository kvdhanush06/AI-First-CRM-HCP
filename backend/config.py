from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY: str
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/crm_hcp"

    class Config:
        env_file = (".env", "backend/.env")


settings = Settings()
