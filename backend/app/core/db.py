import os
from supabase import create_client, Client

supabase_url: str = os.getenv("SUPABASE_URL")
supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    # We allow this to pass on startup, but it will fail when called if missing.
    # It allows local testing of extraction before Supabase is fully configured.
    print("Warning: Supabase credentials not found in environment.")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except:
    supabase = None
