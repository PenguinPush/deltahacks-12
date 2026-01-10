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
        self.executions = None
        self.schemas = None  # NEW: For storing API/node schemas

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
            self.executions = self.db['executions']
            self.schemas = self.db['schemas']  # NEW collection

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
        self.users.create_index([("supabase_user_id", ASCENDING)], unique=True)
        self.users.create_index([("email", ASCENDING)])

        # Workflows collection indexes
        self.workflows.create_index([("user_id", ASCENDING)])
        self.workflows.create_index([("created_at", ASCENDING)])

        # Executions collection indexes
        self.executions.create_index([("workflow_id", ASCENDING)])
        self.executions.create_index([("user_id", ASCENDING)])
        self.executions.create_index([("executed_at", ASCENDING)])

        # Schemas collection indexes (NEW)
        self.schemas.create_index([("schema_type", ASCENDING)])
        self.schemas.create_index([("name", ASCENDING)])
        self.schemas.create_index([("user_id", ASCENDING)])

        print("✓ Database indexes created")

    def create_user(self, supabase_user_id, email, full_name=''):
        """Create a new user profile"""
        user_doc = {
            'supabase_user_id': supabase_user_id,
            'email': email,
            'full_name': full_name,
            'created_at': datetime.utcnow(),
            'last_login': datetime.utcnow(),
        }
        result = self.users.insert_one(user_doc)
        return str(result.inserted_id)

    def get_user_by_supabase_id(self, supabase_user_id):
        """Get user by Supabase user ID"""
        return self.users.find_one({'supabase_user_id': supabase_user_id})

    def update_last_login(self, supabase_user_id):
        """Update user's last login timestamp"""
        self.users.update_one(
            {'supabase_user_id': supabase_user_id},
            {'$set': {'last_login': datetime.utcnow()}}
        )

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
            'updated_at': datetime.utcnow(),
        }
        result = self.workflows.insert_one(workflow_doc)
        workflow_doc['_id'] = str(result.inserted_id)
        return workflow_doc

    def get_workflow(self, workflow_id, user_id):
        """Get a specific workflow by ID (with ownership check)"""
        from bson import ObjectId
        return self.workflows.find_one({
            '_id': ObjectId(workflow_id),
            'user_id': user_id
        })

    def update_workflow(self, workflow_id, user_id, updates):
        """Update a workflow"""
        from bson import ObjectId
        updates['updated_at'] = datetime.utcnow()
        result = self.workflows.update_one(
            {'_id': ObjectId(workflow_id), 'user_id': user_id},
            {'$set': updates}
        )
        return result.modified_count > 0

    def delete_workflow(self, workflow_id, user_id):
        """Delete a workflow"""
        from bson import ObjectId
        result = self.workflows.delete_one({
            '_id': ObjectId(workflow_id),
            'user_id': user_id
        })
        return result.deleted_count > 0

    def get_user_workflows(self, user_id):
        """Get all workflows for a user"""
        workflows = list(self.workflows.find({'user_id': user_id}).sort('updated_at', -1))
        # Convert ObjectId to string
        for workflow in workflows:
            workflow['_id'] = str(workflow['_id'])
        return workflows

    # NEW: Schema management methods
    def create_schema(self, schema_type, name, config, user_id=None, is_global=False):
        """
        Create an API/node schema

        Args:
            schema_type: 'api', 'node_template', 'integration'
            name: Schema name
            config: Schema configuration (API endpoint, auth, params, etc.)
            user_id: Owner (None for global schemas)
            is_global: Whether schema is available to all users
        """
        schema_doc = {
            'schema_type': schema_type,
            'name': name,
            'config': config,
            'user_id': user_id,
            'is_global': is_global,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }
        result = self.schemas.insert_one(schema_doc)
        schema_doc['_id'] = str(result.inserted_id)
        return schema_doc

    def get_schemas(self, schema_type=None, user_id=None):
        """
        Get schemas (global + user-specific)

        Args:
            schema_type: Filter by type
            user_id: Get global schemas + user's private schemas
        """
        query = {}

        if schema_type:
            query['schema_type'] = schema_type

        if user_id:
            # Get global schemas OR user's private schemas
            query['$or'] = [
                {'is_global': True},
                {'user_id': user_id}
            ]
        else:
            # Get only global schemas
            query['is_global'] = True

        schemas = list(self.schemas.find(query).sort('name', ASCENDING))

        # Convert ObjectId to string
        for schema in schemas:
            schema['_id'] = str(schema['_id'])

        return schemas

    def update_schema(self, schema_id, user_id, updates):
        """Update a schema (must be owner or admin)"""
        from bson import ObjectId
        updates['updated_at'] = datetime.utcnow()

        result = self.schemas.update_one(
            {'_id': ObjectId(schema_id), 'user_id': user_id},
            {'$set': updates}
        )
        return result.modified_count > 0

    def delete_schema(self, schema_id, user_id):
        """Delete a schema"""
        from bson import ObjectId
        result = self.schemas.delete_one({
            '_id': ObjectId(schema_id),
            'user_id': user_id
        })
        return result.deleted_count > 0

# Global MongoDB instance
mongodb = MongoDB()
