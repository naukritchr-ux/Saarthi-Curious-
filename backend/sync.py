from sqlalchemy import create_engine, inspect
from database import engine, Base  # Import your live engine and Base
import models  # Ensure your models are actively imported so Base knows them

def check_missing_columns():
    inspector = inspect(engine)
    has_mismatches = False

    print("🔍 Scanning Supabase vs models.py...\n")

    # Iterate through every table defined in your local Python code
    for table_name, table_obj in Base.metadata.tables.items():
        
        # Check if the entire table is missing first
        if not inspector.has_table(table_name):
            print(f"❌ Table Missing entirely: '{table_name}'")
            has_mismatches = True
            continue

        # Fetch columns that actually exist inside Supabase
        db_columns = {col["name"] for col in inspector.get_columns(table_name)}
        
        # Track missing columns for this specific table
        missing_in_db = []
        
        for model_column in table_obj.columns:
            if model_column.name not in db_columns:
                missing_in_db.append(model_column.name)

        if missing_in_db:
            print(f"⚠️  Table '{table_name}' is missing columns in Supabase:")
            for missing_col in missing_in_db:
                print(f"    ↳ Missing: {missing_col}")
            has_mismatches = True

    if not has_mismatches:
        print("✅ Success! Your Supabase database perfectly matches models.py.")

if __name__ == "__main__":
    check_missing_columns()
