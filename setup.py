"""
setup.py
Run this FIRST to create the database.
"""

import subprocess
import sys

print("=" * 50)
print("  FamilyHub AI Setup")
print("=" * 50)
print("")

print("[1/3] Creating MySQL database...")
try:
    import pymysql
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="Al@040404",
    )
    cursor = connection.cursor()
    cursor.execute(
        "CREATE DATABASE IF NOT EXISTS familyhub "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    connection.commit()
    cursor.close()
    connection.close()
    print("  [OK] Database 'familyhub' created")
except Exception as e:
    print("  [ERROR] " + str(e))
    sys.exit(1)

print("")

print("[2/3] Testing connection...")
try:
    from database import engine
    import sqlalchemy
    with engine.connect() as conn:
        conn.execute(sqlalchemy.text("SELECT 1"))
    print("  [OK] Connection works!")
except Exception as e:
    print("  [ERROR] " + str(e))
    sys.exit(1)

print("")

print("[3/3] Checking imports...")
try:
    import auth
    print("  [OK] auth.py loads correctly")
except Exception as e:
    print("  [ERROR] auth.py failed: " + str(e))
    sys.exit(1)

try:
    import main
    print("  [OK] main.py loads correctly")
except Exception as e:
    print("  [ERROR] main.py failed: " + str(e))
    sys.exit(1)

print("")
print("=" * 50)
print("  SETUP COMPLETE!")
print("")
print("  Now run:")
print("    python main.py")
print("")
print("  Then open:")
print("    http://localhost:8000")
print("=" * 50)