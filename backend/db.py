import os
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

class MongoDB:
    """MongoDB connection and operations handler"""

    def __init__(self):
        self.client = None
        self.db = None
        self.users = None
        self.workflows = None

    def connect(self):
        """Establish MongoDB connection"""
        try:
            mongodb_uri = os.getenv('MONGODB_URI')
            if not mongodb_uri:
                raise ValueError("MONGODB_URI not found in environment variables")

            self.client = MongoClient(mongodb_uri)
            # Test connection
            self.client.admin.command('ping')
            print("✓ Connected to MongoDB Atlas")

            # Get database
            self.db = self.client.get_database('nodelink_db')

            # Get collections
            self.users = self.db['users']
            self.workflows = self.db['workflows']

            # Create indexes
            self._create_indexes()

        except ConnectionFailure as e:
            print(f"✗ Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            print(f"✗ Error setting up MongoDB: {e}")
            raise

    def _create_indexes(self):
        """Create database indexes for performance"""
        # Users collection indexes
        self.users.create_index([('supabase_user_id', ASCENDING)], unique=True)
        self.users.create_index([('email', ASCENDING)])

        # Workflows collection indexes
        self.workflows.create_index([('user_id', ASCENDING)])
        self.workflows.create_index([('created_at', ASCENDING)])

        print("✓ Database indexes created")

    def create_user(self, supabase_user_id, email, full_name):
        """Create a new user profile"""
        user_doc = {
            'supabase_user_id': supabase_user_id,
            'email': email,
            'full_name': full_name,
            'created_at': datetime.utcnow(),
            'last_login': datetime.utcnow()
        }

        result = self.users.insert_one(user_doc)
        user_doc['_id'] = str(result.inserted_id)
        return user_doc

    def get_user_by_supabase_id(self, supabase_user_id):
        """Get user by Supabase user ID"""
        user = self.users.find_one({'supabase_user_id': supabase_user_id})
        if user:
            user['_id'] = str(user['_id'])
        return user

    def update_last_login(self, supabase_user_id):
        """Update user's last login timestamp"""
        return self.users.update_one(
            {'supabase_user_id': supabase_user_id},
            {'$set': {'last_login': datetime.utcnow()}}
        )

    def get_user_workflows(self, user_id):
        """Get all workflows for a user"""
        workflows = list(self.workflows.find({'user_id': user_id}))
        for workflow in workflows:
            workflow['_id'] = str(workflow['_id'])
        return workflows

    def create_workflow(self, user_id, name, description='', nodes=None, edges=None):
        """Create a new workflow"""
        workflow_doc = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'nodes': nodes or [],
            'edges': edges or [],
            'viewport': {'x': 0, 'y': 0, 'zoom': 1},
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = self.workflows.insert_one(workflow_doc)
        workflow_doc['_id'] = str(result.inserted_id)
        return workflow_doc

    def get_workflow(self, workflow_id, user_id):
        """Get a specific workflow (with user ownership check)"""
        from bson import ObjectId
        workflow = self.workflows.find_one({
            '_id': ObjectId(workflow_id),
            'user_id': user_id
        })
        if workflow:
            workflow['_id'] = str(workflow['_id'])
        return workflow

    def update_workflow(self, workflow_id, user_id, updates):
        """Update a workflow (with user ownership check)"""
        from bson import ObjectId
        updates['updated_at'] = datetime.utcnow()

        return self.workflows.update_one(
            {'_id': ObjectId(workflow_id), 'user_id': user_id},
            {'$set': updates}
        )

    def delete_workflow(self, workflow_id, user_id):
        """Delete a workflow (with user ownership check)"""
        from bson import ObjectId
        return self.workflows.delete_one({
            '_id': ObjectId(workflow_id),
            'user_id': user_id
        })

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("✓ MongoDB connection closed")

# Global MongoDB instance
mongodb = MongoDB()
