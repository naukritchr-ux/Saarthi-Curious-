from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://postgres.uwncapxjclbvokpwtkdo:Mousume%40050703@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("CONNECTED SUCCESSFULLY")
except Exception as e:
    print("ERROR:")
    print(e)