# SentryPrime v2 - Deployment Guide

## Quick Start Deployment

### Step 1: GitHub Repository Setup

1. **Download the project files** from the sandbox
2. **Extract the zip file** to your local machine
3. **Navigate to the project directory**:
   ```bash
   cd upload/
   ```
4. **Initialize Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SentryPrime v2 monorepo"
   ```
5. **Create GitHub repository**:
   - Go to GitHub.com and create a new repository named `sentryprime-v2`
   - Don't initialize with README (we already have files)
6. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/sentryprime-v2.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Backend Deployment (Railway)

1. **Go to Railway.app** and sign up/login
2. **Create New Project** → **Deploy from GitHub repo**
3. **Select your `sentryprime-v2` repository**
4. **Configure the backend service**:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start:prod`
   - **Port**: `3000`
5. **Add Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
6. **Deploy** - Railway will automatically build and deploy
7. **Copy the Railway URL** (e.g., `https://your-app.railway.app`)

### Step 3: Frontend Deployment (Vercel)

1. **Go to Vercel.com** and sign up/login
2. **Import Project** → **Import Git Repository**
3. **Select your `sentryprime-v2` repository**
4. **Configure the frontend**:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `pnpm install && pnpm build`
   - **Output Directory**: `dist`
5. **Add Environment Variables**:
   - `VITE_API_URL`: `https://your-railway-app.railway.app` (from Step 2)
6. **Deploy** - Vercel will automatically build and deploy

### Step 4: Update Frontend API URL

After Railway deployment, update the frontend to use the production API:

1. **Create environment file** in `apps/frontend/.env.production`:
   ```
   VITE_API_URL=https://your-railway-app.railway.app
   ```
2. **Update the API calls** in `apps/frontend/src/App.jsx`:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
   
   // Update fetch calls to use API_URL
   const response = await fetch(`${API_URL}/scans`)
   ```
3. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

## Project Structure for Deployment

```
sentryprime-v2/
├── apps/
│   ├── backend/              # Deploy to Railway
│   │   ├── src/
│   │   ├── package.json
│   │   └── nest-cli.json
│   └── frontend/             # Deploy to Vercel
│       ├── src/
│       ├── package.json
│       └── vite.config.js
├── packages/
│   └── common/               # Shared types
├── pnpm-workspace.yaml
└── package.json
```

## Environment Variables

### Backend (Railway)
- `NODE_ENV=production`
- `PORT=3000`

### Frontend (Vercel)
- `VITE_API_URL=https://your-railway-app.railway.app`

## Automatic Deployments

Both Railway and Vercel will automatically redeploy when you push changes to GitHub:
- **Railway**: Monitors the `main` branch for backend changes
- **Vercel**: Monitors the `main` branch for frontend changes

## Testing the Deployment

1. **Backend API**: Visit `https://your-railway-app.railway.app/scans`
2. **Frontend**: Visit your Vercel URL
3. **Full Integration**: Create a scan through the frontend interface

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure backend has CORS enabled (already configured)
2. **API Connection**: Verify `VITE_API_URL` environment variable
3. **Build Failures**: Check that all dependencies are in package.json
4. **Port Issues**: Railway automatically assigns ports, use `process.env.PORT`

### Build Commands:

**Backend (Railway)**:
```bash
pnpm install
pnpm build:common
pnpm --filter backend build
```

**Frontend (Vercel)**:
```bash
pnpm install
pnpm build:common
pnpm --filter frontend build
```

## Next Steps

After successful deployment:
1. Set up custom domains (optional)
2. Configure monitoring and logging
3. Set up staging environments
4. Implement CI/CD pipelines for testing

## Support

If you encounter issues:
1. Check Railway and Vercel deployment logs
2. Verify environment variables are set correctly
3. Ensure GitHub repository is properly connected
4. Test API endpoints individually

