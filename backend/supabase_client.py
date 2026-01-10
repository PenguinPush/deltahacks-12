import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseService:
    """Supabase client service"""

    def __init__(self):
        self.client: Client = None

    def initialize(self):
        """Initialize Supabase client"""
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")

        self.client = create_client(url, key)
        print("✓ Supabase client initialized")

    def get_user_by_id(self, user_id):
        """Get user from Supabase by ID (for lazy profile creation)"""
        try:
            response = self.client.auth.admin.get_user_by_id(user_id)
            return response.user if response else None
        except Exception as e:
            print(f"Error getting user from Supabase: {e}")
            return None

# Global Supabase instance
supabase_service = SupabaseService()
