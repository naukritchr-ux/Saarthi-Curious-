"""
Script to add current_module column to user_program_progress table
Run this script to update the database schema
"""
from sqlalchemy import text
from database import engine, SessionLocal

def add_current_module_column():
    """Add current_module column to user_program_progress table"""
    db = SessionLocal()
    try:
        # Check if column already exists
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'user_program_progress' 
            AND column_name = 'current_module'
        """))
        column_exists = result.scalar()
        
        if column_exists:
            print("Column 'current_module' already exists in user_program_progress table")
            return
        
        # Add the column
        print("Adding current_module column to user_program_progress table...")
        db.execute(text("""
            ALTER TABLE user_program_progress 
            ADD COLUMN current_module BIGINT
        """))
        db.commit()
        print("Column added successfully!")
        
    except Exception as e:
        print(f"Error adding column: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_current_module_column()
