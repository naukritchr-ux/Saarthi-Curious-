from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from supabase import create_client, Client
import os

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

# ----------------------------
# SQLAlchemy
# ----------------------------

# Auto-use port 6543 (Transaction Pooler) if pooler.supabase.com:5432 to avoid EMAXCONNSESSION max clients (15) limit
if DATABASE_URL and "pooler.supabase.com:5432" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
  
# ----------------------------
# Supabase Storage Client
# ----------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

# ----------------------------
# Database Dependency
# ----------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()