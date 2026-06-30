from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

def _build_engine_url(url: str) -> str:
    """
    Strip the ?pgbouncer=true query param that Supabase recommends for ORMs
    but psycopg2 does not understand. NullPool handles the correct behaviour instead.
    """
    return url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

# For SQLite, we need to allow access from multiple threads
connect_args = {}
pool_kwargs: dict = {}

raw_url = settings.DATABASE_URL

if raw_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Postgres via Supabase pooler: always use NullPool
    pool_kwargs["poolclass"] = NullPool

engine_url = _build_engine_url(raw_url)

engine = create_engine(
    engine_url,
    connect_args=connect_args,
    **pool_kwargs
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
