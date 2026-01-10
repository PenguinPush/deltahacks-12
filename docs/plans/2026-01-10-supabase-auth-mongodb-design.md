# Supabase Auth + MongoDB Integration Design

**Date:** 2026-01-10
**Purpose:** Implement login/logout system using Supabase Auth with MongoDB for data storage
**Target:** Hackathon MVP

## Architecture Overview

### Dual-Database Architecture

**Supabase Responsibilities:**
- User authentication (signup, login, logout)
- Session management (session-only, expires on browser close)
- JWT token generation and validation
- Password security and email verification
- Account recovery flows

**MongoDB (Atlas) Responsibilities:**
- User profiles: `{ supabase_user_id, email, full_name, created_at, last_login }`
- Workflow graphs: All node/edge data with `user_id` ownership
- Execution history and results
- User preferences and settings

### Trust Model (MVP)

The frontend validates authentication with Supabase and includes the user ID in API requests. The backend trusts this user ID without JWT validation. This is acceptable for the hackathon MVP but should be hardened before production (add JWT validation middleware later).

### Data Flow

1. User signs up → Supabase creates auth account → Backend creates MongoDB profile
2. User logs in → Supabase returns session → Frontend stores session
3. User creates workflow → Frontend sends request with user_id → Backend saves to MongoDB with ownership
4. User refreshes page → Supabase session restored → User stays logged in (until browser closes)

## Frontend Integration

### Supabase Client Setup

Install the Supabase JavaScript client in the React frontend. Initialize it with your Supabase project URL and anonymous key (public key). The client will be configured as a singleton service that all components can access.

### Authentication State Management

Replace the current localStorage mock token system with Supabase's session management. The frontend will use Supabase's `onAuthStateChange` listener to automatically detect when users log in or out. This replaces the current manual token checking in `ProtectedRoute`.

### Login Flow (frontend/src/pages/Login.tsx)

- User submits email/password
- Call `supabase.auth.signInWithPassword()`
- On success, Supabase automatically stores session
- Navigate to dashboard
- Session persists only until browser closes (session-only mode)

### Signup Flow (frontend/src/pages/SignUp.tsx)

- User submits full_name, email, password
- Call `supabase.auth.signUp()` first
- Extract user_id and email from Supabase response
- Immediately call backend `/api/auth/create-profile` endpoint
- Backend creates MongoDB user document with profile data
- Navigate to dashboard

### Logout Flow

- Call `supabase.auth.signOut()`
- Supabase clears session automatically
- User redirected to login page

### API Integration (frontend/src/services/api.ts)

Uncomment and update the request interceptor to fetch the Supabase session token and attach it to every API request header as `Authorization: Bearer <token>`. While the backend won't validate it for MVP, having this in place makes future security hardening trivial.

## Backend Integration

### Supabase Admin Client Setup

The Flask backend needs the Supabase Python client library (`supabase-py`). Initialize it with your Supabase URL and service role key (this is the secret admin key, not the public anonymous key). This allows the backend to query user data from Supabase if needed.

### New Authentication Endpoints

**`POST /api/auth/create-profile`:**
- Receives: `{ supabase_user_id, email, full_name }`
- Creates user document in MongoDB `users` collection
- Fields: `supabase_user_id` (primary identifier), `email`, `full_name`, `created_at`, `last_login`
- Returns: `{ success: true, user: {...} }` or error
- Called immediately after Supabase signup

**`POST /api/auth/update-last-login`:**
- Receives: `{ supabase_user_id }`
- Updates `last_login` timestamp in MongoDB
- Called after successful login
- Optional but useful for tracking active users

### MongoDB Connection

Replace the in-memory storage dictionaries (`graphs`, `blocks`, `connections`) with MongoDB collections. Connect using `pymongo` and create collections: `users`, `workflows`, `blocks`, `connections`.

### User Ownership Middleware

Add a simple helper function that extracts `user_id` from request headers or body. All workflow-related endpoints (`/api/execute`, `/api/block/*`, `/api/graph`) should filter queries by this `user_id` to ensure users only access their own data.

## MongoDB Data Models

### Users Collection (`users`)

```javascript
{
  _id: ObjectId,
  supabase_user_id: String (indexed, unique),
  email: String,
  full_name: String,
  created_at: DateTime,
  last_login: DateTime
}
```

### Workflows Collection (`workflows`)

```javascript
{
  _id: ObjectId,
  user_id: String (indexed - references supabase_user_id),
  name: String,
  description: String,
  created_at: DateTime,
  updated_at: DateTime,
  nodes: Array,      // Reactflow nodes
  edges: Array,      // Reactflow edges
  viewport: Object   // Canvas position/zoom
}
```

### Migration from In-Memory Storage

Replace Python dictionaries with MongoDB operations:

- `graphs[graph_id]` → `workflows.find_one({ _id, user_id })`
- `blocks[block_id]` → Embedded in workflow nodes array
- `connections` → Embedded in workflow edges array

### Indexing Strategy

Create indexes on:
- `users.supabase_user_id` (unique) - fast user lookups
- `workflows.user_id` - fast filtering by owner
- `workflows.created_at` - sorting by date

### Data Isolation

Every query for workflows must include `user_id` filter to prevent users from accessing each other's data. This is your primary security mechanism for the MVP.

## Error Handling & Edge Cases

### Signup Edge Cases

**Duplicate Email:** Supabase prevents duplicate signups automatically. If a user tries to sign up with an existing email, Supabase returns an error. The frontend should catch this and show "Email already registered" message.

**MongoDB Profile Creation Fails:** If Supabase signup succeeds but the backend `/api/auth/create-profile` call fails, the user exists in Supabase but not in MongoDB. Solution: Use lazy creation fallback - if any API endpoint receives a user_id that doesn't exist in MongoDB, auto-create a minimal profile by querying Supabase for email.

**Network Failures:** If the frontend loses connection during signup between Supabase and backend calls, retry the profile creation on next login attempt.

### Login Edge Cases

**Invalid Credentials:** Supabase handles this - returns clear error message. Display to user.

**Session Expired:** When a session expires, Supabase's `onAuthStateChange` fires with `SIGNED_OUT` event. Automatically redirect to login page.

**Browser Closed:** Session-only mode means all sessions clear on browser close. Users must re-login every time.

### Backend Edge Cases

**User Not Found:** If a request comes in with a user_id that doesn't exist in MongoDB, return 404 with "User profile not found - please log out and log in again" message.

**MongoDB Connection Loss:** Wrap all MongoDB operations in try-catch. Return 503 Service Unavailable if database is down.

**Empty Workflows:** New users have no workflows. Return empty array `[]` instead of error.

## Implementation Steps & Dependencies

### Required Dependencies

**Frontend:**
- `@supabase/supabase-js` - Supabase JavaScript client
- Keep existing: `axios`, `react-router-dom`

**Backend:**
- `supabase` - Supabase Python client (supabase-py)
- `pymongo` - MongoDB driver
- `python-dotenv` - Environment variables

### Environment Variables

Add to `.env`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  (public key for frontend)
SUPABASE_SERVICE_KEY=eyJhbG...  (secret key for backend)
MONGODB_URI=mongodb+srv://...  (already exists)
```

### Implementation Order

1. **Supabase Setup** (15 min): Create Supabase project, get API keys, configure email auth
2. **Backend - MongoDB Connection** (20 min): Replace in-memory storage with MongoDB collections
3. **Backend - Auth Endpoints** (30 min): Add `/api/auth/create-profile` and update-last-login
4. **Frontend - Supabase Client** (15 min): Install library, create auth service singleton
5. **Frontend - Signup Flow** (30 min): Update SignUp.tsx to call Supabase + backend
6. **Frontend - Login Flow** (20 min): Update Login.tsx to use Supabase
7. **Frontend - Auth State** (30 min): Replace localStorage with Supabase session management
8. **Frontend - Logout** (10 min): Add signOut calls throughout app
9. **Backend - User Ownership** (30 min): Add user_id filtering to all workflow endpoints
10. **Testing** (30 min): Signup, login, create workflow, logout, verify isolation

**Total estimated time: ~4 hours** for a working MVP.

## Security Notes for Production

This design prioritizes speed for the hackathon MVP. Before production deployment:

1. Add JWT validation middleware in Flask backend
2. Validate Supabase tokens on every protected endpoint
3. Add rate limiting on auth endpoints
4. Enable email verification in Supabase
5. Add CSRF protection
6. Implement proper error logging and monitoring
7. Add input validation and sanitization
8. Enable Supabase RLS (Row Level Security) policies
9. Use HTTPS for all API communication
10. Add password strength requirements in Supabase settings
