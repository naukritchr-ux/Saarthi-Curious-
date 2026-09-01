from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://postgres:Mousume%40050703@db.uwncapxjclbvokpwtkdo.supabase.co:5432/postgres?sslmode=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("CONNECTED SUCCESSFULLY")
except Exception as e:
    print("ERROR:")
    print(e)