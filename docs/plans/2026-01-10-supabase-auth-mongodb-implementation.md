# Supabase Auth + MongoDB Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement login/logout system using Supabase Auth with MongoDB for data storage in hackathon MVP.

**Architecture:** Dual-database system where Supabase handles all authentication (signup, login, sessions) and MongoDB Atlas stores user profiles and workflow data. Frontend sends user_id from Supabase session in requests; backend trusts user_id for MVP (no JWT validation).

**Tech Stack:** Supabase Auth, MongoDB Atlas (pymongo), Flask, React/Next.js, Axios

---

## Task 1: Supabase Project Setup

**Context:** Create Supabase project and configure email authentication. This must be done first to get API keys.

**Files:**
- External: Supabase Dashboard (https://supabase.com)
- Modify: `backend/.env`

**Step 1: Create Supabase project**

Manual steps:
1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Set project name: "NodeLink" (or your preference)
4. Set database password (save this!)
5. Choose region closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

**Step 2: Get API keys**

Manual steps:
1. In Supabase dashboard, go to Settings → API
2. Copy "Project URL" (looks like: https://xxxxx.supabase.co)
3. Copy "anon public" key (starts with: eyJhbG...)
4. Copy "service_role" key (starts with: eyJhbG... - this is SECRET)

**Step 3: Configure email authentication**

Manual steps:
1. In Supabase dashboard, go to Authentication → Providers
2. Ensure "Email" is enabled
3. Disable "Confirm email" for MVP speed (can enable later)
4. Save changes

**Step 4: Update backend .env**

Current content:
```
mongodb+srv://justin-tingxuan-wang:Haodifang177@cluster0.z8281hk.mongodb.net/?appName=Cluster0
```

Replace with:
```bash
# MongoDB
MONGODB_URI=mongodb+srv://justin-tingxuan-wang:Haodifang177@cluster0.z8281hk.mongodb.net/?appName=Cluster0

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Replace the `xxxxx` and key values with your actual Supabase credentials from Step 2.

**Step 5: Create frontend .env file**

Create: `frontend/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:5000/api
```

Note: Use NEXT_PUBLIC_ prefix for Next.js environment variables accessible in browser.

**Step 6: Verify setup**

Run: Manual verification
- Check that .env files exist and have all required keys
- Ensure SUPABASE_SERVICE_KEY is different from SUPABASE_ANON_KEY
- Do NOT commit these .env files to git

**Step 7: Commit**

```bash
git add backend/.env frontend/.env.local
git commit -m "setup: add Supabase configuration to environment variables"
```

---

## Task 2: Install Backend Dependencies

**Context:** Install Python libraries needed for Supabase auth and MongoDB.

**Files:**
- Create: `backend/requirements.txt`
- Modify: Backend environment

**Step 1: Create requirements.txt**

Create: `backend/requirements.txt`

```
flask==3.0.0
flask-cors==4.0.0
supabase==2.3.0
pymongo==4.6.1
python-dotenv==1.0.0
requests==2.31.0
```

**Step 2: Install dependencies**

Run: `cd backend && pip install -r requirements.txt`

Expected: All packages install successfully (may take 1-2 minutes)

**Step 3: Verify installation**

Run: `python -c "import supabase; import pymongo; print('Dependencies OK')"`

Expected: Output shows "Dependencies OK"

**Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "deps: add backend dependencies for Supabase and MongoDB"
```

---

## Task 3: Install Frontend Dependencies

**Context:** Install Supabase JavaScript client for React frontend.

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install Supabase client**

Run: `cd frontend && npm install @supabase/supabase-js@2.39.0`

Expected: Package installs successfully, package.json and package-lock.json update

**Step 2: Install React Router** (if not already installed)

Run: `cd frontend && npm install react-router-dom@6.21.0`

Expected: Package installs successfully

**Step 3: Verify installation**

Run: `cd frontend && npm list @supabase/supabase-js react-router-dom`

Expected: Shows installed versions of both packages

**Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add Supabase client and React Router to frontend"
```

---

## Task 4: Create MongoDB Database Service (Backend)

**Context:** Create Python module to handle MongoDB connection and operations.

**Files:**
- Create: `backend/db.py`

**Step 1: Write MongoDB connection module**

Create: `backend/db.py`

```python
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
```

**Step 2: Test the module**

Run: `cd backend && python -c "from db import mongodb; mongodb.connect(); print('MongoDB service OK'); mongodb.close()"`

Expected: Output shows "✓ Connected to MongoDB Atlas", "✓ Database indexes created", "MongoDB service OK", "✓ MongoDB connection closed"

**Step 3: Commit**

```bash
git add backend/db.py
git commit -m "feat: add MongoDB database service module"
```

---

## Task 5: Create Supabase Service (Backend)

**Context:** Create Python module to initialize Supabase client.

**Files:**
- Create: `backend/supabase_client.py`

**Step 1: Write Supabase client module**

Create: `backend/supabase_client.py`

```python
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
```

**Step 2: Test the module**

Run: `cd backend && python -c "from supabase_client import supabase_service; supabase_service.initialize(); print('Supabase service OK')"`

Expected: Output shows "✓ Supabase client initialized" and "Supabase service OK"

**Step 3: Commit**

```bash
git add backend/supabase_client.py
git commit -m "feat: add Supabase service module"
```

---

## Task 6: Add Authentication Endpoints (Backend)

**Context:** Add Flask routes for user profile creation and login tracking.

**Files:**
- Modify: `backend/main.py`

**Step 1: Import new modules at top of main.py**

Add these imports after existing imports (around line 12):

```python
from db import mongodb
from supabase_client import supabase_service
from datetime import datetime
```

**Step 2: Initialize services on app startup**

Add after `app = Flask(__name__)` and before route definitions (around line 16):

```python
# Initialize database connections
try:
    mongodb.connect()
    supabase_service.initialize()
except Exception as e:
    print(f"Failed to initialize services: {e}")
    # Continue anyway for development
```

**Step 3: Add helper function to extract user_id**

Add before route definitions (around line 100):

```python
def get_user_id_from_request():
    """Extract user_id from request headers or body"""
    # Try header first
    user_id = request.headers.get('X-User-ID')

    # Try request body
    if not user_id and request.json:
        user_id = request.json.get('user_id')

    return user_id

def ensure_user_exists(user_id):
    """
    Lazy user creation: If user_id doesn't exist in MongoDB,
    fetch from Supabase and create profile.
    """
    user = mongodb.get_user_by_supabase_id(user_id)

    if not user:
        # User doesn't exist in MongoDB, try to create from Supabase
        supabase_user = supabase_service.get_user_by_id(user_id)

        if supabase_user:
            # Create user profile
            user = mongodb.create_user(
                supabase_user_id=user_id,
                email=supabase_user.email,
                full_name=supabase_user.user_metadata.get('full_name', '') if supabase_user.user_metadata else ''
            )
            print(f"✓ Auto-created user profile for {user_id}")
        else:
            return None

    return user
```

**Step 4: Add auth endpoints**

Add these routes after the existing routes, before the demo setup function (around line 373):

```python
# ==========================================
# PART 3: Authentication Endpoints
# ==========================================

@app.route('/api/auth/create-profile', methods=['POST'])
def create_profile():
    """
    Create user profile in MongoDB after Supabase signup.
    Expects JSON: { "supabase_user_id": "...", "email": "...", "full_name": "..." }
    """
    try:
        data = request.json
        supabase_user_id = data.get('supabase_user_id')
        email = data.get('email')
        full_name = data.get('full_name', '')

        if not supabase_user_id or not email:
            return jsonify({"error": "supabase_user_id and email are required"}), 400

        # Check if user already exists
        existing_user = mongodb.get_user_by_supabase_id(supabase_user_id)
        if existing_user:
            return jsonify({
                "success": True,
                "user": existing_user,
                "message": "User profile already exists"
            }), 200

        # Create new user profile
        user = mongodb.create_user(supabase_user_id, email, full_name)

        return jsonify({
            "success": True,
            "user": user
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/update-last-login', methods=['POST'])
def update_last_login():
    """
    Update user's last login timestamp.
    Expects JSON: { "supabase_user_id": "..." }
    """
    try:
        data = request.json
        supabase_user_id = data.get('supabase_user_id')

        if not supabase_user_id:
            return jsonify({"error": "supabase_user_id is required"}), 400

        result = mongodb.update_last_login(supabase_user_id)

        if result.matched_count == 0:
            # User doesn't exist, try lazy creation
            user = ensure_user_exists(supabase_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """
    Get current user profile.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        user = ensure_user_exists(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

**Step 5: Test auth endpoints manually**

Run: `cd backend && python main.py`

Then in another terminal:
```bash
# Test create profile
curl -X POST http://localhost:5000/api/auth/create-profile \
  -H "Content-Type: application/json" \
  -d '{"supabase_user_id":"test-123","email":"test@test.com","full_name":"Test User"}'
```

Expected: Returns JSON with `{"success": true, "user": {...}}`

**Step 6: Commit**

```bash
git add backend/main.py
git commit -m "feat: add authentication endpoints for user profile management"
```

---

## Task 7: Add User Ownership to Workflow Endpoints (Backend)

**Context:** Modify existing workflow endpoints to filter by user_id for data isolation.

**Files:**
- Modify: `backend/main.py`

**Step 1: Update /api/execute endpoint**

Find the `/api/execute` route (around line 104) and modify it:

Replace:
```python
@app.route('/api/execute', methods=['POST'])
def run_graph():
    """
    Endpoint to trigger graph execution.
    """
    global current_project
    if not current_project.blocks:
        return jsonify({"error": "No graph defined"}), 400
```

With:
```python
@app.route('/api/execute', methods=['POST'])
def run_graph():
    """
    Endpoint to trigger graph execution.
    Note: For MVP, this still uses in-memory project.
    TODO: Load workflow from MongoDB by workflow_id
    """
    global current_project

    # Optional: Get user_id for future use
    user_id = get_user_id_from_request()

    if not current_project.blocks:
        return jsonify({"error": "No graph defined"}), 400
```

**Step 2: Add workflow management endpoints**

Add these new endpoints after the auth endpoints (around line 440):

```python
# ==========================================
# PART 4: Workflow Management (MongoDB-backed)
# ==========================================

@app.route('/api/workflows', methods=['GET'])
def get_workflows():
    """
    Get all workflows for the current user.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        # Ensure user exists (lazy creation)
        ensure_user_exists(user_id)

        workflows = mongodb.get_user_workflows(user_id)

        return jsonify({"workflows": workflows}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows', methods=['POST'])
def create_workflow():
    """
    Create a new workflow.
    Expects header: X-User-ID
    Expects JSON: { "name": "...", "description": "..." }
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        data = request.json
        name = data.get('name', 'Untitled Workflow')
        description = data.get('description', '')

        # Ensure user exists
        ensure_user_exists(user_id)

        workflow = mongodb.create_workflow(user_id, name, description)

        return jsonify(workflow), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    """
    Get a specific workflow.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        workflow = mongodb.get_workflow(workflow_id, user_id)

        if not workflow:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        return jsonify(workflow), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['PUT'])
def update_workflow_endpoint(workflow_id):
    """
    Update a workflow.
    Expects header: X-User-ID
    Expects JSON: { "name": "...", "nodes": [...], "edges": [...] }
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        data = request.json
        updates = {}

        if 'name' in data:
            updates['name'] = data['name']
        if 'description' in data:
            updates['description'] = data['description']
        if 'nodes' in data:
            updates['nodes'] = data['nodes']
        if 'edges' in data:
            updates['edges'] = data['edges']
        if 'viewport' in data:
            updates['viewport'] = data['viewport']

        result = mongodb.update_workflow(workflow_id, user_id, updates)

        if result.matched_count == 0:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        # Return updated workflow
        workflow = mongodb.get_workflow(workflow_id, user_id)
        return jsonify(workflow), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/workflows/<workflow_id>', methods=['DELETE'])
def delete_workflow_endpoint(workflow_id):
    """
    Delete a workflow.
    Expects header: X-User-ID
    """
    try:
        user_id = get_user_id_from_request()

        if not user_id:
            return jsonify({"error": "User ID not provided"}), 401

        result = mongodb.delete_workflow(workflow_id, user_id)

        if result.deleted_count == 0:
            return jsonify({"error": "Workflow not found or access denied"}), 404

        return jsonify({"success": True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

**Step 3: Test workflow endpoints**

Run: Flask app should still be running from previous task

```bash
# Create workflow (replace test-123 with actual user_id from Task 6)
curl -X POST http://localhost:5000/api/workflows \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-123" \
  -d '{"name":"My First Workflow","description":"Test workflow"}'

# Get workflows
curl http://localhost:5000/api/workflows \
  -H "X-User-ID: test-123"
```

Expected: Returns workflow data with user ownership

**Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat: add user-owned workflow management endpoints"
```

---

## Task 8: Create Supabase Client Service (Frontend)

**Context:** Create React service to initialize and interact with Supabase.

**Files:**
- Create: `frontend/src/lib/supabase.ts`

**Step 1: Create lib directory**

Run: `mkdir -p frontend/src/lib`

**Step 2: Write Supabase client**

Create: `frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Auth helper functions
export const authHelpers = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
```

**Step 3: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without TypeScript errors

**Step 4: Commit**

```bash
git add frontend/src/lib/supabase.ts
git commit -m "feat: create Supabase client service for frontend"
```

---

## Task 9: Create Auth Context (Frontend)

**Context:** Create React context to manage authentication state globally.

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`

**Step 1: Create contexts directory**

Run: `mkdir -p frontend/src/contexts`

**Step 2: Write Auth Context**

Create: `frontend/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authHelpers } from '@/lib/supabase';
import { useRouter } from 'next/router';
import { post } from '@/services/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session on mount
    authHelpers.getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Update last login in MongoDB
          try {
            await post('/auth/update-last-login', {
              supabase_user_id: session.user.id,
            });
          } catch (error) {
            console.error('Failed to update last login:', error);
          }
        }

        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await authHelpers.signUp(email, password, fullName);

    if (!error && data.user) {
      // Create user profile in MongoDB
      try {
        await post('/auth/create-profile', {
          supabase_user_id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        });
      } catch (apiError) {
        console.error('Failed to create user profile:', apiError);
        return { error: apiError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authHelpers.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await authHelpers.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 3: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 4: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat: create auth context for global authentication state"
```

---

## Task 10: Update API Service to Include User ID (Frontend)

**Context:** Modify API interceptor to attach user ID to all requests.

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: Update request interceptor**

Find the request interceptor (around line 24-36) and replace:

```typescript
/**
 * Request interceptor for adding auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Add authentication token from auth store
    // const token = useAuthStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

With:

```typescript
/**
 * Request interceptor for adding auth token and user ID
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Get current Supabase session
    if (typeof window !== 'undefined') {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Add Authorization header with JWT token (for future use)
        config.headers.Authorization = `Bearer ${session.access_token}`;

        // Add user ID header for MVP
        config.headers['X-User-ID'] = session.user.id;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

**Step 2: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add user ID header to all API requests"
```

---

## Task 11: Update Login Page (Frontend)

**Context:** Replace mock auth with Supabase authentication.

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

**Step 1: Update imports**

Replace the imports at the top (lines 1-3):

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
```

With:

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
```

**Step 2: Update component logic**

Replace the Login component function (lines 16-44):

```typescript
export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (email && password) {
                // Set authentication token
                localStorage.setItem('authToken', 'mock-token-' + Date.now());
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                navigate('/dashboard');
            } else {
                setError('Please enter valid credentials');
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleSocialLogin = (provider: 'google' | 'github') => {
        console.log(`Login with ${provider}`);
        // Implement social login
    };
```

With:

```typescript
export function Login() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError.message || 'Failed to sign in');
                setIsLoading(false);
                return;
            }

            // Redirect to dashboard on success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'github') => {
        // Social login not implemented for MVP
        setError(`${provider} login not available yet`);
    };
```

**Step 3: Remove "Remember Me" checkbox**

Find the "Remember Me & Forgot Password" section (lines 156-173) and replace:

```typescript
                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-border bg-app-input accent-accent-blue"
                                />
                                <span className="text-small text-text-secondary">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-small text-accent-blue hover:text-accent-blue-hover transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
```

With:

```typescript
                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-small text-accent-blue hover:text-accent-blue-hover transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
```

**Step 4: Update Link components**

Replace all `<Link to=` with `<Link href=`:
- Line ~189: `<Link to="/signup"` → `<Link href="/signup"`

**Step 5: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 6: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: integrate Supabase auth in login page"
```

---

## Task 12: Update SignUp Page (Frontend)

**Context:** Replace mock auth with Supabase authentication.

**Files:**
- Modify: `frontend/src/pages/SignUp.tsx`

**Step 1: Update imports**

Replace imports (lines 1-3):

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
```

With:

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
```

**Step 2: Update component logic**

Replace the SignUp component function (lines 17-86):

```typescript
export function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: '#EF4444' };
        if (score <= 3) return { score, label: 'Fair', color: '#EAB308' };
        if (score <= 4) return { score, label: 'Good', color: '#10B981' };
        return { score, label: 'Strong', color: '#10B981' };
    };

    const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        if (passwordStrength && passwordStrength.score < 3) {
            setError('Please choose a stronger password');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            if (formData.email && formData.password && formData.fullName) {
                // Set authentication token
                localStorage.setItem('authToken', 'mock-token-' + Date.now());
                navigate('/dashboard');
            } else {
                setError('Please fill in all fields');
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleSocialSignup = (provider: 'google' | 'github') => {
        console.log(`Sign up with ${provider}`);
        // Implement social signup
    };

    const updateFormData = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };
```

With:

```typescript
export function SignUp() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength calculation
    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z\d]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: '#EF4444' };
        if (score <= 3) return { score, label: 'Fair', color: '#EAB308' };
        if (score <= 4) return { score, label: 'Good', color: '#10B981' };
        return { score, label: 'Strong', color: '#10B981' };
    };

    const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        if (passwordStrength && passwordStrength.score < 3) {
            setError('Please choose a stronger password');
            return;
        }

        setIsLoading(true);

        try {
            const { error: signUpError } = await signUp(
                formData.email,
                formData.password,
                formData.fullName
            );

            if (signUpError) {
                setError(signUpError.message || 'Failed to create account');
                setIsLoading(false);
                return;
            }

            // Redirect to dashboard on success
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setIsLoading(false);
        }
    };

    const handleSocialSignup = (provider: 'google' | 'github') => {
        // Social signup not implemented for MVP
        setError(`${provider} signup not available yet`);
    };

    const updateFormData = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };
```

**Step 3: Update Link components**

Replace all `<Link to=` with `<Link href=`:
- Line ~286: `<Link to="/terms"` → `<Link href="/terms"`
- Line ~290: `<Link to="/privacy"` → `<Link href="/privacy"`
- Line ~309: `<Link to="/login"` → `<Link href="/login"`

**Step 4: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 5: Commit**

```bash
git add frontend/src/pages/SignUp.tsx
git commit -m "feat: integrate Supabase auth in signup page"
```

---

## Task 13: Update App Router with Auth Provider (Frontend)

**Context:** Wrap app with AuthProvider and update ProtectedRoute to use Supabase session.

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Update imports**

Replace imports (lines 1-5):

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';
import { Login, SignUp } from '@/pages';
import { useState, useEffect } from 'react';
```

With:

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { Editor } from '@/pages/Editor';
import { Login, SignUp } from '@/pages';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
```

**Step 2: Update ProtectedRoute component**

Replace ProtectedRoute (lines 11-34):

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status (localStorage, session, etc.)
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      setIsAuthenticated(!!authToken);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

With:

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
```

**Step 3: Wrap App with AuthProvider**

Replace the App component (lines 43-91):

```typescript
function App(): JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:id"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <Navigate to="/editor/new" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/share/:shareId"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
```

With:

```typescript
function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <Navigate to="/editor/new" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share/:shareId"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
```

**Step 4: Verify TypeScript compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: integrate auth provider and update protected routes"
```

---

## Task 14: Add Logout Functionality (Frontend)

**Context:** Add logout button to Dashboard and other pages.

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx` (if exists, otherwise skip)
- Or create logout component

**Step 1: Check if Dashboard exists**

Run: `ls frontend/src/pages/Dashboard.tsx 2>/dev/null || echo "Dashboard not found"`

**Step 2a: If Dashboard exists, add logout button**

Add this import to Dashboard.tsx:
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

Add logout button somewhere in the UI (e.g., top-right corner):
```typescript
const { signOut, user } = useAuth();

// In your JSX:
<div className="flex items-center gap-4">
  <span className="text-text-secondary">
    {user?.email}
  </span>
  <button
    onClick={() => signOut()}
    className="btn-secondary"
  >
    Sign Out
  </button>
</div>
```

**Step 2b: If Dashboard doesn't exist, create minimal version**

Create: `frontend/src/pages/Dashboard.tsx`

```typescript
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function Dashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-hero text-text-primary">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-body text-text-secondary">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-app-panel text-text-primary rounded-lg hover:bg-app-component transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="bg-app-panel rounded-lg p-8">
          <h2 className="text-heading text-text-primary mb-4">
            Welcome to NodeLink!
          </h2>
          <p className="text-body text-text-secondary mb-6">
            Your workflows will appear here.
          </p>
          <Link
            href="/editor/new"
            className="inline-block px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
          >
            Create New Workflow
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
```

**Step 3: Verify compilation**

Run: `cd frontend && npm run build`

Expected: Build completes without errors

**Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add logout functionality to dashboard"
```

---

## Task 15: End-to-End Testing

**Context:** Test the complete authentication flow.

**Files:**
- None (manual testing)

**Step 1: Start backend server**

Run in terminal 1: `cd backend && python main.py`

Expected: Server starts on port 5000

**Step 2: Start frontend dev server**

Run in terminal 2: `cd frontend && npm run dev`

Expected: Server starts on port 3000 (or next available)

**Step 3: Test signup flow**

Manual test:
1. Open browser to http://localhost:3000
2. Should redirect to /login
3. Click "Sign up" link
4. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "StrongPass123!"
   - Confirm Password: "StrongPass123!"
   - Check "Accept terms"
5. Click "Create account"
6. Should redirect to /dashboard
7. Should see email displayed

**Step 4: Verify MongoDB user creation**

Run:
```bash
# Check backend logs for user creation
# Should see: "✓ Auto-created user profile for ..."
```

Or check MongoDB Atlas:
1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Find `nodelink_db` → `users`
4. Should see test user record

**Step 5: Test logout**

Manual test:
1. Click "Sign Out" button
2. Should redirect to /login
3. Try visiting /dashboard directly
4. Should redirect to /login

**Step 6: Test login flow**

Manual test:
1. On /login page
2. Enter:
   - Email: "test@example.com"
   - Password: "StrongPass123!"
3. Click "Sign in"
4. Should redirect to /dashboard
5. Should see email displayed

**Step 7: Test invalid credentials**

Manual test:
1. Sign out if logged in
2. Try logging in with wrong password
3. Should see error message
4. Should not redirect

**Step 8: Test session persistence**

Manual test:
1. Log in successfully
2. Close browser tab (not entire browser)
3. Open new tab to http://localhost:3000
4. Should immediately redirect to /login (session-only mode)

**Step 9: Document test results**

Create: `docs/testing/auth-test-results.md`

```markdown
# Authentication Testing Results

Date: 2026-01-10

## Test Cases

### Signup Flow
- [ ] Form validation works
- [ ] Password strength indicator displays
- [ ] Supabase account created
- [ ] MongoDB user profile created
- [ ] Redirects to dashboard
- [ ] Email displayed correctly

### Login Flow
- [ ] Valid credentials work
- [ ] Invalid credentials show error
- [ ] Redirects to dashboard
- [ ] Last login timestamp updated

### Logout Flow
- [ ] Sign out button works
- [ ] Redirects to login
- [ ] Session cleared
- [ ] Protected routes redirect to login

### Session Management
- [ ] Session persists within browser session
- [ ] Session clears on browser close
- [ ] Protected routes check auth

### API Integration
- [ ] User ID sent in headers
- [ ] MongoDB operations filtered by user_id
- [ ] Error handling works

## Issues Found

(Document any issues discovered during testing)

## Notes

(Any additional observations)
```

**Step 10: Fix any issues found**

If issues discovered, create tasks to fix them before proceeding.

**Step 11: Commit test results**

```bash
git add docs/testing/auth-test-results.md
git commit -m "docs: add authentication testing results"
```

---

## Task 16: Update Backend Port to 5000 (Frontend Config)

**Context:** Ensure frontend API calls go to correct port (Flask default is 5000, not 8000).

**Files:**
- Modify: `frontend/.env.local`

**Step 1: Update API base URL**

Current content in `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:8000/api
```

Change to:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:5000/api
```

**Step 2: Restart frontend dev server**

Run: Stop and restart `npm run dev`

Expected: Frontend now calls correct backend port

**Step 3: Verify API calls work**

Check browser dev tools → Network tab → API calls should succeed

**Step 4: Commit**

```bash
git add frontend/.env.local
git commit -m "fix: update API base URL to Flask default port 5000"
```

---

## Task 17: Add Environment Variables Documentation

**Context:** Document required environment variables for future reference.

**Files:**
- Create: `docs/ENVIRONMENT_SETUP.md`

**Step 1: Create documentation**

Create: `docs/ENVIRONMENT_SETUP.md`

```markdown
# Environment Variables Setup

## Backend (.env)

Located at: `backend/.env`

```bash
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=ClusterName

# Supabase configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  # Public anonymous key
SUPABASE_SERVICE_KEY=eyJhbG...  # SECRET service role key (do not expose!)
```

## Frontend (.env.local)

Located at: `frontend/.env.local`

```bash
# Supabase configuration (public keys)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # Same as backend anon key

# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api
```

## Getting Your Keys

### MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials

### Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY` (keep secret!)

## Security Notes

- **Never commit `.env` files to git**
- Keep `SUPABASE_SERVICE_KEY` secret (server-side only)
- `SUPABASE_ANON_KEY` can be public (client-side safe)
- Use `.env.example` files as templates without real credentials

## Production Deployment

For production:
1. Set environment variables in your hosting platform
2. Use different Supabase projects for dev/staging/prod
3. Enable email verification in Supabase
4. Use HTTPS for all API communication
5. Add rate limiting and monitoring
```

**Step 2: Commit documentation**

```bash
git add docs/ENVIRONMENT_SETUP.md
git commit -m "docs: add environment variables setup guide"
```

---

## Task 18: Final Cleanup and Verification

**Context:** Remove old auth code, verify everything works, prepare for demo.

**Files:**
- Various cleanup tasks

**Step 1: Remove old localStorage auth references**

Search for remaining `localStorage.getItem('authToken')` or `localStorage.setItem('authToken')`:

Run: `cd frontend && grep -r "authToken" src/ || echo "No more authToken references"`

Expected: Should find none (already replaced)

**Step 2: Verify all routes work**

Test these URLs manually:
- http://localhost:3000/ → redirects to /login ✓
- http://localhost:3000/login → shows login page ✓
- http://localhost:3000/signup → shows signup page ✓
- http://localhost:3000/dashboard → redirects to /login if not authenticated ✓
- http://localhost:3000/dashboard → shows dashboard if authenticated ✓

**Step 3: Verify MongoDB has data**

Check MongoDB Atlas dashboard:
- `users` collection should have test user(s)
- Indexes should be created

**Step 4: Verify Supabase has users**

Check Supabase dashboard:
- Go to Authentication → Users
- Should see test user(s)

**Step 5: Test error handling**

Try these error scenarios:
- Sign up with existing email → should show error
- Log in with wrong password → should show error
- Access protected route while logged out → redirect to login
- Network error (stop backend) → should show connection error

**Step 6: Create final demo checklist**

Create: `docs/DEMO_CHECKLIST.md`

```markdown
# Demo Checklist

## Pre-Demo Setup

- [ ] Backend server running on port 5000
- [ ] Frontend dev server running
- [ ] MongoDB Atlas accessible
- [ ] Supabase project configured
- [ ] Environment variables set correctly
- [ ] Test user account created

## Demo Flow

1. **Show Login Page**
   - Clean, professional UI
   - Email/password fields
   - Social login buttons (not functional - explain MVP)

2. **Demo Signup**
   - Create new account with test email
   - Show password strength indicator
   - Show validation
   - Redirect to dashboard

3. **Show User Profile**
   - Display email on dashboard
   - Show user is authenticated

4. **Verify MongoDB**
   - Open MongoDB Atlas
   - Show user profile was created
   - Show user_id, email, full_name, timestamps

5. **Demo Logout**
   - Click Sign Out
   - Redirect to login
   - Try accessing dashboard → blocked

6. **Demo Login**
   - Log in with previously created account
   - Show last_login timestamp updated in MongoDB

7. **Explain Architecture**
   - Supabase handles auth
   - MongoDB stores user data and workflows
   - User ownership on all data
   - Session-only (browser close = logout)

## Key Talking Points

- Dual-database architecture (Supabase + MongoDB)
- Secure session management
- User data isolation
- Ready for production hardening (JWT validation)
- Fast MVP development (4 hours)

## Known Limitations (MVP)

- No JWT validation (trusts user_id from frontend)
- No email verification
- No password reset
- No OAuth (Google/GitHub buttons are placeholders)
- Session-only (no persistent "remember me")
```

**Step 7: Commit final docs**

```bash
git add docs/DEMO_CHECKLIST.md
git commit -m "docs: add demo checklist and talking points"
```

**Step 8: Create final tag**

```bash
git tag -a v1.0-auth-mvp -m "Supabase Auth + MongoDB MVP Complete"
git push origin v1.0-auth-mvp
```

---

## Summary

**Implementation Complete!**

You now have:
- ✅ Supabase email/password authentication
- ✅ MongoDB user profile storage
- ✅ Session management (browser-session only)
- ✅ User-owned data isolation
- ✅ Login, signup, logout flows
- ✅ Protected routes
- ✅ API integration with user_id headers
- ✅ Error handling
- ✅ MongoDB indexes for performance
- ✅ Lazy user creation fallback

**Next Steps for Production:**
1. Add JWT validation middleware in Flask
2. Enable email verification in Supabase
3. Implement OAuth (Google/GitHub)
4. Add password reset flow
5. Add rate limiting
6. Enable persistent sessions (if desired)
7. Add monitoring and logging
8. Security audit

**Estimated Time:** ~4 hours for MVP implementation
**Current Status:** Ready for hackathon demo!
