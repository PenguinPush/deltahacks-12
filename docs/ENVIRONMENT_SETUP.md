# Environment Variables Setup Guide

This guide covers all required environment variables for running NodeLink with Supabase authentication and MongoDB data storage.

## Table of Contents

- [Quick Start](#quick-start)
- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [Getting Your API Keys](#getting-your-api-keys)
- [Security Best Practices](#security-best-practices)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Backend Setup

Create `backend/.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Frontend Setup

Create `frontend/.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Backend Environment Variables

### Required Variables

#### `MONGODB_URI`
**Description:** Connection string for your MongoDB Atlas cluster or local MongoDB instance.

**Format:**
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Example:**
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/nodelink?retryWrites=true&w=majority
```

**Usage:** Used by the Flask backend to connect to MongoDB for storing nodes, edges, and user data.

---

#### `SUPABASE_URL`
**Description:** Your Supabase project URL.

**Format:**
```
https://<project-ref>.supabase.co
```

**Example:**
```
SUPABASE_URL=https://loxhjltxydpwqnfpwdaa.supabase.co
```

**Usage:** Used by the backend to communicate with Supabase Auth API for user authentication.

---

#### `SUPABASE_ANON_KEY`
**Description:** Supabase anonymous (public) key for client-side authentication.

**Format:** Long JWT token string

**Example:**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:** Used by the backend to initialize the Supabase client. This key is safe to use in client-side code.

---

#### `SUPABASE_SERVICE_KEY`
**Description:** Supabase service role key with admin privileges.

**Format:** Long JWT token string

**Example:**
```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:** Used by the backend for administrative operations like user management. This key bypasses Row Level Security (RLS).

**Warning:** This key should NEVER be exposed to the client. Keep it server-side only.

---

### Optional Variables

#### `FLASK_ENV`
**Description:** Flask environment mode.

**Options:** `development`, `production`

**Default:** `development`

**Example:**
```
FLASK_ENV=development
```

---

#### `PORT`
**Description:** Port number for the Flask backend server.

**Default:** `5000`

**Example:**
```
PORT=5000
```

---

## Frontend Environment Variables

### Required Variables

#### `VITE_SUPABASE_URL`
**Description:** Your Supabase project URL (same as backend `SUPABASE_URL`).

**Format:**
```
https://<project-ref>.supabase.co
```

**Example:**
```
VITE_SUPABASE_URL=https://loxhjltxydpwqnfpwdaa.supabase.co
```

**Usage:** Used by the frontend Supabase client for authentication.

---

#### `VITE_SUPABASE_ANON_KEY`
**Description:** Supabase anonymous key (same as backend `SUPABASE_ANON_KEY`).

**Format:** Long JWT token string

**Example:**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:** Used by the frontend Supabase client for authentication operations.

---

#### `VITE_API_BASE_URL`
**Description:** Base URL for the backend API.

**Development:**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Production:**
```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

**Usage:** Used by the frontend to make API calls to the Flask backend.

---

### Optional Variables

#### `VITE_API_TIMEOUT`
**Description:** Timeout for API requests in milliseconds.

**Default:** `30000` (30 seconds)

**Example:**
```
VITE_API_TIMEOUT=60000
```

---

## Getting Your API Keys

### MongoDB Atlas

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "Shared" (Free tier)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Create Database User**
   - Navigate to "Database Access"
   - Click "Add New Database User"
   - Choose authentication method (Username/Password recommended)
   - Set username and password
   - Assign appropriate role (e.g., "Atlas Admin" for development)
   - Click "Add User"

4. **Whitelist IP Address**
   - Navigate to "Network Access"
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Navigate to "Database" > "Connect"
   - Choose "Connect your application"
   - Select "Python" and version "3.6 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with your database name (e.g., `nodelink`)

**Example Connection String:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/nodelink?retryWrites=true&w=majority
```

---

### Supabase

1. **Create Account**
   - Go to [Supabase](https://supabase.com)
   - Sign up for a free account

2. **Create Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name (e.g., "NodeLink")
   - Enter a strong database password
   - Select your region
   - Click "Create new project"
   - Wait for project to initialize (2-3 minutes)

3. **Get API Keys**
   - Navigate to "Settings" > "API"
   - Copy the following values:
     - **Project URL**: Your `SUPABASE_URL` / `VITE_SUPABASE_URL`
     - **anon public key**: Your `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
     - **service_role key**: Your `SUPABASE_SERVICE_KEY` (backend only)

4. **Configure Authentication** (Optional)
   - Navigate to "Authentication" > "Providers"
   - Enable desired authentication methods:
     - Email/Password (enabled by default)
     - OAuth providers (Google, GitHub, etc.)
   - Configure email templates under "Email Templates"
   - Set up redirect URLs under "URL Configuration"

5. **Database Setup**
   - Supabase automatically creates a PostgreSQL database
   - For NodeLink, we only use Supabase for authentication
   - User data is stored in Supabase's `auth.users` table
   - Node/edge data is stored in MongoDB

---

## Security Best Practices

### Environment Files

#### DO:
- Use `.env` files for local development
- Add `.env` and `.env.local` to `.gitignore`
- Use different keys for development and production
- Store production secrets in secure secret managers (AWS Secrets Manager, Azure Key Vault, etc.)
- Use environment-specific `.env` files (`.env.development`, `.env.production`)
- Rotate keys periodically
- Use strong, unique database passwords

#### DON'T:
- Commit `.env` files to version control
- Share environment variables via email or chat
- Use production keys in development
- Expose service role keys to the client
- Hardcode secrets in source code
- Use weak or default passwords

---

### Key Security Notes

#### Supabase Service Key
- **CRITICAL:** The `SUPABASE_SERVICE_KEY` has full admin access
- NEVER expose this key to the frontend
- NEVER commit it to version control
- Only use it in server-side code
- Store it securely in production (secret manager)

#### MongoDB Connection String
- Contains database credentials
- Keep it server-side only
- Use IP whitelisting in production
- Enable MongoDB Atlas monitoring
- Use strong passwords with special characters

#### Frontend Keys
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe to expose
- They are embedded in the client-side bundle
- Supabase Row Level Security (RLS) policies protect your data
- The anon key has limited permissions

---

### .gitignore Setup

Ensure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.*.local

# Backend
backend/.env
backend/.env.*

# Frontend
frontend/.env
frontend/.env.local
frontend/.env.*.local
```

---

## Production Deployment

### Backend Deployment

#### Environment Variables
Set the following environment variables in your hosting platform:

```env
MONGODB_URI=<production_mongodb_uri>
SUPABASE_URL=<production_supabase_url>
SUPABASE_ANON_KEY=<production_anon_key>
SUPABASE_SERVICE_KEY=<production_service_key>
FLASK_ENV=production
PORT=5000
```

#### Hosting Options
- **Heroku:** Set Config Vars in dashboard
- **AWS Elastic Beanstalk:** Use environment properties
- **Google Cloud Run:** Use environment variables or Secret Manager
- **Azure App Service:** Use Application Settings
- **DigitalOcean App Platform:** Use environment variables

#### Security Checklist
- [ ] Use production Supabase project (separate from development)
- [ ] Use production MongoDB cluster with backups enabled
- [ ] Enable IP whitelisting for MongoDB
- [ ] Use strong, unique passwords for all services
- [ ] Enable HTTPS/SSL for backend API
- [ ] Set CORS policies appropriately
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Use secret management service (not plain environment variables)

---

### Frontend Deployment

#### Environment Variables
Set the following environment variables in your build process:

```env
VITE_SUPABASE_URL=<production_supabase_url>
VITE_SUPABASE_ANON_KEY=<production_anon_key>
VITE_API_BASE_URL=<production_backend_url>
```

#### Hosting Options
- **Vercel:** Set Environment Variables in project settings
- **Netlify:** Set Environment Variables in site settings
- **AWS S3 + CloudFront:** Use build-time environment variables
- **GitHub Pages:** Use GitHub Actions with secrets
- **Firebase Hosting:** Use `.env.production` file (not committed)

#### Build Process
```bash
# Set environment variables
export VITE_SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_ANON_KEY=your-anon-key
export VITE_API_BASE_URL=https://api.yourdomain.com/api

# Build
npm run build

# Deploy dist/ directory to hosting platform
```

#### Security Checklist
- [ ] Use production Supabase project
- [ ] Use HTTPS for API base URL
- [ ] Configure CORS on backend to allow only your frontend domain
- [ ] Enable CSP (Content Security Policy) headers
- [ ] Set up monitoring and error tracking
- [ ] Use CDN for static assets

---

## Troubleshooting

### Backend Issues

#### "Connection to MongoDB failed"
- Check `MONGODB_URI` format
- Verify database user credentials
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

#### "Supabase client initialization failed"
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check Supabase project status
- Ensure keys are not expired

#### "Invalid JWT token"
- Check token expiration
- Verify `SUPABASE_SERVICE_KEY` is correct
- Ensure Supabase project is active

---

### Frontend Issues

#### "Failed to fetch from API"
- Verify `VITE_API_BASE_URL` is correct
- Check backend server is running
- Verify CORS is configured on backend
- Check browser console for errors

#### "Supabase authentication failed"
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project status
- Verify authentication provider is enabled in Supabase
- Clear browser cache and localStorage

#### "Environment variables not loading"
- Ensure `.env.local` file exists in `frontend/` directory
- Verify variable names start with `VITE_`
- Restart Vite dev server after changing `.env.local`
- Check for typos in variable names

---

### MongoDB Issues

#### "Database not found"
- MongoDB automatically creates databases on first write
- Ensure connection string includes database name
- Check database name spelling

#### "Collection not found"
- Collections are created automatically on first insert
- Verify collection names in code match MongoDB
- Check MongoDB Atlas dashboard

---

### Common Mistakes

1. **Using wrong variable prefix**
   - Backend: No prefix (e.g., `MONGODB_URI`)
   - Frontend: `VITE_` prefix (e.g., `VITE_API_BASE_URL`)

2. **Forgetting to restart server**
   - Backend: Restart Flask server after changing `.env`
   - Frontend: Restart Vite dev server after changing `.env.local`

3. **Mixing development and production keys**
   - Always use environment-specific keys
   - Never use production keys in development

4. **Committing secrets**
   - Check `.gitignore` includes all `.env` files
   - Use `git status` to verify `.env` files are ignored
   - If accidentally committed, rotate all keys immediately

---

## Support

For additional help:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Supabase: https://supabase.com/docs
- Flask: https://flask.palletsprojects.com/
- Vite: https://vitejs.dev/guide/env-and-mode.html
