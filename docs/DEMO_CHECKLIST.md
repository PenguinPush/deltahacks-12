# NodeLink Demo Checklist

This checklist ensures a smooth demonstration of NodeLink with Supabase authentication and MongoDB data storage.

## Table of Contents

- [Pre-Demo Setup](#pre-demo-setup)
- [Demo Flow](#demo-flow)
- [Architecture Talking Points](#architecture-talking-points)
- [Known Limitations (MVP)](#known-limitations-mvp)
- [Troubleshooting During Demo](#troubleshooting-during-demo)

---

## Pre-Demo Setup

### Environment Verification

#### Backend Setup
- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Backend `.env` file exists with all required variables:
  - [ ] `MONGODB_URI` is set correctly
  - [ ] `SUPABASE_URL` is set correctly
  - [ ] `SUPABASE_ANON_KEY` is set correctly
  - [ ] `SUPABASE_SERVICE_KEY` is set correctly
- [ ] Backend dependencies are installed (`pip install -r requirements.txt`)
- [ ] Flask server starts without errors (`python app.py`)
- [ ] Backend is accessible at `http://localhost:5000`
- [ ] Test endpoint `/api/health` returns 200 OK

#### Frontend Setup
- [ ] Frontend `.env.local` file exists with all required variables:
  - [ ] `VITE_SUPABASE_URL` is set correctly
  - [ ] `VITE_SUPABASE_ANON_KEY` is set correctly
  - [ ] `VITE_API_BASE_URL=http://localhost:5000/api`
- [ ] Frontend dependencies are installed (`npm install`)
- [ ] Vite dev server starts without errors (`npm run dev`)
- [ ] Frontend is accessible at `http://localhost:3000`
- [ ] Browser console shows no critical errors

#### Supabase Verification
- [ ] Supabase project is active and accessible
- [ ] Authentication is enabled for Email/Password
- [ ] Test user account exists (or ready to create one during demo)
- [ ] Supabase dashboard is accessible for showing user management

#### MongoDB Verification
- [ ] MongoDB cluster is active in MongoDB Atlas
- [ ] Database `nodelink` (or configured name) is ready
- [ ] Network access allows connections from current IP
- [ ] MongoDB Compass or Atlas dashboard is open for showing data
- [ ] Collections `nodes` and `edges` are visible (may be empty initially)

---

### Browser Preparation
- [ ] Clear browser cache and localStorage
- [ ] Open browser DevTools (F12) in separate window
- [ ] Open network tab to show API calls
- [ ] Open console tab to show clean startup
- [ ] Disable browser extensions that might interfere
- [ ] Have Supabase dashboard open in another tab
- [ ] Have MongoDB Atlas dashboard open in another tab

---

### Demo Data Preparation
- [ ] Decide on demo scenario (e.g., project planning, knowledge graph)
- [ ] Prepare 3-5 nodes to create during demo
- [ ] Prepare 2-3 connections between nodes
- [ ] Have example use case ready to explain

---

### Backup Plan
- [ ] Have screenshots of working app ready
- [ ] Have video recording as backup
- [ ] Know how to quickly reset demo state if needed
- [ ] Have second browser ready in case of issues
- [ ] Keep terminal logs visible for debugging

---

## Demo Flow

### 1. Introduction (2 minutes)

**What to say:**
"NodeLink is a visual knowledge management application that combines Supabase authentication with MongoDB data storage to create a scalable, flexible platform for organizing information."

**What to show:**
- Landing page with clean UI
- Briefly explain the tech stack:
  - React + Vite frontend
  - Flask backend API
  - Supabase for authentication
  - MongoDB for data storage
  - ReactFlow for graph visualization

---

### 2. User Registration (3 minutes)

**Steps:**
1. Click "Sign Up" or navigate to registration page
2. Enter email and password
3. Submit registration form
4. Show successful registration message

**What to explain:**
- "Supabase handles all authentication logic securely"
- "User credentials are never stored in our database"
- "Supabase provides built-in email verification, password reset, and session management"

**What to show in dashboards:**
- Open Supabase dashboard
- Navigate to "Authentication" > "Users"
- Show the newly created user appears instantly
- Point out user metadata (created_at, last_sign_in, etc.)
- Show that Supabase manages the auth.users table automatically

**Browser DevTools:**
- Show Network tab with API calls to Supabase
- Show clean POST request to `/auth/v1/signup`
- Show JWT token being returned (don't expose full token)
- Show localStorage now contains Supabase session

---

### 3. User Login (2 minutes)

**Steps:**
1. Log out if needed (to show login flow)
2. Navigate to login page
3. Enter credentials
4. Show successful login and redirect to main app

**What to explain:**
- "Supabase validates credentials and issues a JWT token"
- "The frontend stores the session securely"
- "Backend verifies this token on every API request"
- "Session persists across browser refreshes"

**What to show in DevTools:**
- POST request to `/auth/v1/token`
- JWT token in response
- Session stored in localStorage under `supabase.auth.token`
- Subsequent API calls include Authorization header

---

### 4. Creating Nodes (5 minutes)

**Steps:**
1. Click "Add Node" or double-click canvas
2. Create first node (e.g., "Project: NodeLink")
3. Add description/metadata
4. Create 2-3 more nodes with different types
5. Position nodes on canvas

**What to explain:**
- "Each node is stored in MongoDB with the user's Supabase user_id"
- "This creates a many-to-one relationship between nodes and users"
- "MongoDB's flexible schema allows different node types"
- "ReactFlow handles the visualization and interaction"

**What to show in MongoDB:**
- Open MongoDB Atlas dashboard
- Navigate to "Database" > "Browse Collections"
- Show `nodes` collection
- Click on a document to show structure:
  ```json
  {
    "_id": "ObjectId(...)",
    "user_id": "uuid-from-supabase",
    "title": "Project: NodeLink",
    "description": "Demo project",
    "type": "project",
    "position": {"x": 100, "y": 200},
    "created_at": "2026-01-10T...",
    "updated_at": "2026-01-10T..."
  }
  ```
- Point out `user_id` matches Supabase user ID

**Backend API Flow:**
- Show terminal with Flask logs
- Point out POST `/api/nodes` requests
- Show JWT token verification in logs
- Show successful MongoDB insert operations

---

### 5. Creating Connections (3 minutes)

**Steps:**
1. Drag from one node's handle to another
2. Create 2-3 connections between nodes
3. Show connections appear as edges
4. Demonstrate edge styling/labels if implemented

**What to explain:**
- "Edges are stored separately in MongoDB"
- "Each edge references source and target node IDs"
- "This creates a graph structure in the database"
- "MongoDB handles these relationships efficiently"

**What to show in MongoDB:**
- Navigate to `edges` collection
- Show edge document structure:
  ```json
  {
    "_id": "ObjectId(...)",
    "user_id": "uuid-from-supabase",
    "source": "node-id-1",
    "target": "node-id-2",
    "label": "depends on",
    "created_at": "2026-01-10T..."
  }
  ```
- Point out relationships between collections

---

### 6. Editing and Updating (3 minutes)

**Steps:**
1. Click on a node to select it
2. Edit node properties (title, description, type)
3. Save changes
4. Move nodes around canvas
5. Show real-time position updates

**What to explain:**
- "Updates are sent to backend via REST API"
- "Backend verifies JWT and user ownership"
- "MongoDB updates are atomic and efficient"
- "Only the node owner can edit their nodes"

**What to show:**
- PUT request in Network tab to `/api/nodes/{id}`
- Authorization header with JWT token
- Request payload with updated fields
- MongoDB document updates in real-time
- Response confirming successful update

---

### 7. Data Persistence (2 minutes)

**Steps:**
1. Refresh the browser page
2. Show that all nodes and edges persist
3. Log out and log back in
4. Show data still loads correctly

**What to explain:**
- "Data is permanently stored in MongoDB"
- "Supabase session handles re-authentication"
- "Backend queries MongoDB based on authenticated user"
- "Users only see their own data (data isolation)"

**What to show:**
- GET request to `/api/nodes` with JWT token
- Backend filters by user_id automatically
- MongoDB query returns only user's nodes
- Frontend reconstructs the graph from API data

---

### 8. User Isolation Demo (3 minutes)

**Steps:**
1. Create second test user in Supabase (optional)
2. Log in as second user
3. Show empty canvas (no nodes from first user)
4. Create a node as second user
5. Show in MongoDB that both users' data exists separately

**What to explain:**
- "Each user's data is completely isolated"
- "Backend enforces this at the API level"
- "MongoDB queries filter by user_id automatically"
- "This ensures privacy and security"

**What to show in MongoDB:**
- Filter collection by different user_id values
- Show documents belong to different users
- Demonstrate that users can't access each other's data

---

### 9. Deleting Nodes (2 minutes)

**Steps:**
1. Select a node
2. Press Delete or click delete button
3. Show node and connected edges disappear
4. Verify deletion in MongoDB

**What to explain:**
- "Deleting a node also deletes connected edges"
- "Backend handles cascade deletion logic"
- "MongoDB operations are transactional"
- "Soft delete vs hard delete options available"

**What to show:**
- DELETE request to `/api/nodes/{id}`
- Backend logs showing deletion logic
- MongoDB document disappears from collection
- Related edges also deleted

---

### 10. Logout and Session Management (2 minutes)

**Steps:**
1. Click logout button
2. Show redirect to landing/login page
3. Show session cleared from localStorage
4. Try to access protected route (should redirect to login)

**What to explain:**
- "Supabase handles session invalidation"
- "Frontend clears all auth state"
- "Backend rejects requests without valid JWT"
- "Protected routes require authentication"

**What to show:**
- Supabase signOut() call in Network tab
- localStorage being cleared
- Attempted API call returns 401 Unauthorized
- Route protection redirects to login

---

## Architecture Talking Points

### Overall Architecture

**Key Points:**
- "Three-tier architecture: Frontend, Backend API, Data Layer"
- "Separation of concerns: Authentication vs. Data Storage"
- "Supabase for auth allows us to focus on features, not auth infrastructure"
- "MongoDB provides flexibility for evolving data models"

**Diagram (verbal):**
```
User Browser
    |
    | (HTTP/HTTPS)
    v
Vite Frontend (React + ReactFlow)
    |
    | (REST API with JWT)
    v
Flask Backend API
    |
    |--- (Supabase Client) ---> Supabase Auth (PostgreSQL)
    |
    |--- (MongoDB Client) ---> MongoDB Atlas (Nodes/Edges)
```

---

### Why Supabase for Authentication?

**Advantages:**
- "Built-in user management, no need to build auth from scratch"
- "Secure JWT-based authentication out of the box"
- "Email verification, password reset, OAuth providers included"
- "Row Level Security (RLS) for PostgreSQL (though we use MongoDB)"
- "Real-time subscriptions available if needed"
- "Free tier suitable for MVP and demos"

**Integration:**
- "Supabase client in frontend handles signup/login/logout"
- "Backend verifies JWT tokens on every API request"
- "User ID from Supabase links to MongoDB documents"
- "Seamless integration without custom auth code"

---

### Why MongoDB for Data Storage?

**Advantages:**
- "Flexible schema perfect for evolving node/edge structures"
- "Different node types can have different fields"
- "Handles nested data and arrays naturally"
- "Horizontal scaling for future growth"
- "Rich query capabilities for complex graphs"
- "MongoDB Atlas provides cloud hosting and management"

**Data Model:**
- "Nodes collection: Stores all node data with user_id"
- "Edges collection: Stores connections with source/target references"
- "User_id field creates relationship with Supabase users"
- "Indexes on user_id for fast queries"
- "Potential for aggregation pipelines for analytics"

---

### Security Model

**Authentication:**
- "Supabase handles credential validation"
- "JWT tokens prove user identity"
- "Tokens expire after session timeout"
- "Refresh tokens allow seamless re-authentication"

**Authorization:**
- "Backend validates JWT on every request"
- "User ID extracted from validated token"
- "All MongoDB queries filter by authenticated user_id"
- "Users cannot access other users' data"

**Data Protection:**
- "HTTPS in production encrypts data in transit"
- "MongoDB Atlas encrypts data at rest"
- "Environment variables protect API keys"
- "Service role keys never exposed to frontend"

---

### Scalability Considerations

**Current MVP:**
- "Single Flask backend instance"
- "MongoDB Atlas shared cluster"
- "Suitable for hundreds of users"
- "Low-cost, easy to maintain"

**Future Scaling:**
- "Backend: Add load balancer + multiple Flask instances"
- "Database: MongoDB Atlas auto-scaling clusters"
- "Auth: Supabase handles millions of users"
- "Frontend: CDN distribution via Vercel/Netlify"
- "Caching: Redis for frequently accessed data"
- "Real-time: Supabase real-time for collaborative editing"

---

### Technology Choices

**Frontend:**
- "React: Component-based, widely adopted"
- "Vite: Fast build tool, better than Create React App"
- "ReactFlow: Specialized for graph/node visualization"
- "Axios: Robust HTTP client with interceptors"
- "Tailwind CSS: Utility-first, rapid styling"

**Backend:**
- "Flask: Lightweight, Python-based"
- "RESTful API: Standard, well-understood"
- "PyMongo: Official MongoDB driver"
- "Supabase Python client: Official SDK"
- "Flask-CORS: Handle cross-origin requests"

**Infrastructure:**
- "Supabase: Managed auth and PostgreSQL"
- "MongoDB Atlas: Managed MongoDB clusters"
- "Vite dev server: Fast hot module replacement"
- "Flask development server: Quick iteration"

---

## Known Limitations (MVP)

### Functional Limitations

#### Node Features
- [ ] **Basic node types only**: Currently supports generic nodes
  - No custom node templates (e.g., person, task, document)
  - No node type validation
  - No custom fields per node type
- [ ] **Limited styling**: Basic colors and shapes
  - No custom icons or images
  - No rich text formatting in node content
  - No theming support
- [ ] **No node grouping**: Cannot create parent-child hierarchies
- [ ] **No nested nodes**: Nodes are flat, no containers

#### Edge Features
- [ ] **Basic connections only**: Simple directed edges
  - No edge types or categories
  - No weighted edges
  - No conditional connections
- [ ] **Limited styling**: Basic lines only
  - No curved or custom path styles
  - No animated edges
  - No edge labels (may be implemented)
- [ ] **No bidirectional edges**: Each direction is separate

#### Graph Features
- [ ] **No layout algorithms**: Manual positioning only
  - No auto-layout (hierarchical, force-directed, etc.)
  - No alignment tools
  - No grid snapping
- [ ] **No minimap**: Cannot see overview of large graphs
- [ ] **No zoom extent**: No fit-to-screen functionality
- [ ] **Limited undo/redo**: May not be implemented
- [ ] **No graph export**: Cannot export to JSON, PNG, SVG
- [ ] **No graph import**: Cannot import from other tools

#### Collaboration
- [ ] **Single-user only**: No real-time collaboration
- [ ] **No sharing**: Cannot share graphs with other users
- [ ] **No permissions**: No read-only or editor roles
- [ ] **No commenting**: Cannot add comments to nodes/edges
- [ ] **No version history**: No ability to see past versions

#### Search and Filtering
- [ ] **No search**: Cannot search nodes by content
- [ ] **No filtering**: Cannot filter by node type, date, etc.
- [ ] **No tags**: No tagging or categorization system
- [ ] **No graph queries**: Cannot find paths between nodes

#### Performance
- [ ] **No pagination**: All nodes loaded at once
  - May slow down with 100+ nodes
  - No lazy loading
  - No virtual scrolling
- [ ] **No caching**: API calls not cached
- [ ] **No optimistic updates**: Wait for server response

---

### Technical Limitations

#### Authentication
- [ ] **Email/password only**: No OAuth providers (Google, GitHub)
- [ ] **No email verification**: Users not required to verify email
- [ ] **No password requirements**: Weak password allowed
- [ ] **No 2FA**: No two-factor authentication
- [ ] **No session management UI**: Cannot see active sessions
- [ ] **No account deletion**: User cannot delete their account

#### API
- [ ] **No rate limiting**: API can be abused
- [ ] **No API versioning**: Breaking changes affect all clients
- [ ] **No batch operations**: Must create nodes one at a time
- [ ] **Limited error handling**: Generic error messages
- [ ] **No request validation**: Weak input validation
- [ ] **No API documentation**: No Swagger/OpenAPI spec

#### Data
- [ ] **No backup system**: Must rely on MongoDB Atlas backups
- [ ] **No data export**: User cannot download their data
- [ ] **No data import**: Cannot bulk import data
- [ ] **No data validation**: Limited schema enforcement
- [ ] **No soft deletes**: Deleted data is gone forever
- [ ] **No audit log**: No tracking of who changed what

#### Deployment
- [ ] **Development setup only**: Not production-ready
- [ ] **No CI/CD**: Manual deployment process
- [ ] **No monitoring**: No error tracking or analytics
- [ ] **No logging**: Basic console logs only
- [ ] **No health checks**: No uptime monitoring
- [ ] **No auto-scaling**: Manual scaling required

#### Security
- [ ] **No HTTPS enforcement**: HTTP allowed in development
- [ ] **Basic CORS**: Not restricted to specific domains
- [ ] **No CSRF protection**: Vulnerable to CSRF attacks
- [ ] **No SQL injection protection**: (N/A for MongoDB, but general concern)
- [ ] **No XSS sanitization**: User input not fully sanitized
- [ ] **Service keys in .env**: Should use secret manager in production

---

### Performance Benchmarks

**Expected Performance (MVP):**
- Handles up to 50 nodes smoothly
- Handles up to 100 edges smoothly
- API response time < 200ms for typical requests
- Page load time < 2 seconds on localhost
- Supports up to 10 concurrent users (development)

**Known Slowdowns:**
- Creating many nodes rapidly (no batching)
- Large graph rendering (100+ nodes)
- No debouncing on position updates
- No request cancellation on rapid actions

---

### Browser Compatibility

**Tested:**
- [ ] Chrome/Edge (Chromium) - Primary target
- [ ] May work on Firefox, Safari (not extensively tested)

**Known Issues:**
- [ ] localStorage required (no fallback)
- [ ] Modern ES6+ features required
- [ ] No IE11 support
- [ ] Mobile/touch may not work properly

---

### Future Improvements (Post-MVP)

**Phase 1 (Essential):**
1. Node type system with templates
2. Search and filter functionality
3. Graph export (JSON, PNG)
4. Auto-layout algorithms
5. Better error handling and validation

**Phase 2 (Enhanced):**
1. Real-time collaboration (Supabase Realtime)
2. Sharing and permissions
3. OAuth provider support
4. Email verification
5. Undo/redo functionality

**Phase 3 (Advanced):**
1. Graph analytics and insights
2. Custom node styling and icons
3. Graph templates and presets
4. API documentation and SDK
5. Mobile app version

---

## Troubleshooting During Demo

### Backend Not Responding

**Symptoms:**
- API calls timeout
- Network errors in browser
- Flask server not running

**Quick Fix:**
1. Check Flask terminal - should show running on port 5000
2. Restart Flask: `Ctrl+C` then `python app.py`
3. Verify `.env` file exists and is correct
4. Check MongoDB connection in logs

---

### Frontend Not Loading

**Symptoms:**
- Blank page
- Vite errors in terminal
- Module not found errors

**Quick Fix:**
1. Check Vite terminal - should show running on port 3000
2. Restart Vite: `Ctrl+C` then `npm run dev`
3. Clear browser cache and localStorage
4. Verify `.env.local` exists and is correct
5. Run `npm install` if dependencies missing

---

### Authentication Failing

**Symptoms:**
- Login/signup not working
- "Invalid credentials" errors
- JWT token errors

**Quick Fix:**
1. Verify Supabase URL and keys in `.env` and `.env.local`
2. Check Supabase project status in dashboard
3. Clear browser localStorage
4. Try creating new user with different email
5. Check browser Network tab for detailed error

---

### Data Not Persisting

**Symptoms:**
- Nodes disappear on refresh
- Empty canvas after reload
- MongoDB not showing documents

**Quick Fix:**
1. Check MongoDB connection in Flask logs
2. Verify `MONGODB_URI` in `.env`
3. Check IP whitelist in MongoDB Atlas
4. Verify database and collection names
5. Check backend logs for MongoDB errors

---

### Nodes Not Rendering

**Symptoms:**
- Blank canvas
- API returns data but nothing shows
- Console errors in browser

**Quick Fix:**
1. Open browser DevTools console
2. Check for JavaScript errors
3. Verify API response has correct structure
4. Try creating new node
5. Refresh page and check localStorage

---

### Session Expired Issues

**Symptoms:**
- User logged out unexpectedly
- "Unauthorized" errors
- JWT token invalid

**Quick Fix:**
1. Log in again
2. Check Supabase session expiration settings
3. Clear localStorage and re-authenticate
4. Verify system clock is correct (affects JWT)

---

### Emergency Reset

If demo breaks and you need to reset quickly:

1. **Frontend Reset:**
   ```bash
   # Clear browser localStorage
   localStorage.clear()

   # Or restart Vite
   Ctrl+C
   npm run dev
   ```

2. **Backend Reset:**
   ```bash
   # Restart Flask
   Ctrl+C
   python app.py
   ```

3. **Database Reset:**
   - Go to MongoDB Atlas
   - Delete all documents in `nodes` and `edges` collections
   - Start with fresh data

4. **Full Reset:**
   - Close all browser tabs
   - Stop backend and frontend servers
   - Clear browser cache and localStorage
   - Restart both servers
   - Open fresh browser window

---

## Post-Demo Notes

### What Went Well
- [ ] All features demonstrated successfully
- [ ] Architecture clearly explained
- [ ] Live coding/debugging handled well
- [ ] Questions answered satisfactorily

### What Could Improve
- [ ] Technical issues encountered:
- [ ] Features that confused audience:
- [ ] Talking points that need clarity:
- [ ] Demo flow improvements:

### Follow-Up Actions
- [ ] Share demo recording/screenshots
- [ ] Provide access to demo instance
- [ ] Send documentation links
- [ ] Schedule follow-up discussion
- [ ] Gather feedback for improvements

---

## Quick Reference

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Backend Health: http://localhost:5000/api/health
- Supabase Dashboard: https://app.supabase.com
- MongoDB Atlas: https://cloud.mongodb.com

### Commands
```bash
# Backend
cd backend
python app.py

# Frontend
cd frontend
npm run dev

# Check logs
# Backend: Watch Flask terminal
# Frontend: Watch Vite terminal + browser console
```

### Test Credentials (if prepared)
```
Email: demo@example.com
Password: demo123456
```

---

## Success Criteria

Demo is successful if:
- [ ] User registration and login work smoothly
- [ ] Nodes can be created, edited, and deleted
- [ ] Edges connect nodes correctly
- [ ] Data persists across page refreshes
- [ ] MongoDB and Supabase dashboards show data correctly
- [ ] Architecture is clearly explained
- [ ] Audience understands the tech stack
- [ ] Questions are answered confidently
- [ ] No critical bugs encountered
- [ ] Demo completes within time limit

---

Good luck with your demo! Remember: Even if something breaks, explaining how you'd fix it shows technical depth.
