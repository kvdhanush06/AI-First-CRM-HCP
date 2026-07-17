from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from backend.config import settings
from backend.database.models import Base

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create all tables if they don't exist. Auto-create database if it does not exist."""
    try:
        # Try to connect and run create_all
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        error_msg = str(e).lower()
        if "does not exist" in error_msg or "invalidcatalognameerror" in error_msg:
            print("Target database does not exist. Attempting to create it...")
            try:
                # Parse the target database URL to find the db name
                url = make_url(settings.DATABASE_URL)
                db_name = url.database
                
                # Construct connection URL for the default 'postgres' database
                postgres_url = url.set(database="postgres")
                
                # Create a temporary engine with AUTOCOMMIT isolation level to execute CREATE DATABASE
                temp_engine = create_async_engine(postgres_url, isolation_level="AUTOCOMMIT")
                async with temp_engine.connect() as conn:
                    result = await conn.execute(
                        text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                        {"dbname": db_name}
                    )
                    exists = result.scalar()
                    if not exists:
                        await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                        print(f"Database '{db_name}' created successfully.")
                await temp_engine.dispose()
                
                # Now try initializing again
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
            except Exception as create_error:
                print(f"Failed to create database automatically: {create_error}")
                raise create_error
        else:
            raise e


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
