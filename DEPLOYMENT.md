# EventSpark Deployment Guide

This guide covers deploying the EventSpark application with an Express.js backend on Render and a React frontend on Vercel.

## Architecture Overview

- **Backend**: Express.js application deployed on Render
- **Frontend**: React application deployed on Vercel
- **CI/CD**: GitHub Actions for testing, Render and Vercel handle deployments

## Backend Deployment (Render)

### Prerequisites

- Render account
- GitHub repository connected to Render

### Deployment Steps

1. **Create a new Web Service on Render**

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the Web Service**

   - **Name**: `eventspark-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci --only=production`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

3. **Environment Variables**

   - `NODE_ENV`: `production`
   - `PORT`: `8080` (optional, Render will set this automatically)

4. **Auto-Deploy Settings**
   - Enable auto-deploy for the `main` branch
   - Enable auto-deploy for the `dev` branch (if you want separate dev environment)

### Render Configuration

The `render.yaml` file in the Backend directory contains the service configuration:

```yaml
services:
  - type: web
    name: eventspark-backend
    env: node
    buildCommand: npm ci --only=production
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
    healthCheckPath: /api/health
    autoDeploy: true
```

### Backend URL

After deployment, your backend will be available at:

- Production: `https://your-app-name.onrender.com`
- Development: `https://your-dev-app-name.onrender.com`

## Frontend Deployment (Vercel)

### Prerequisites

- Vercel account
- GitHub repository connected to Vercel

### Deployment Steps

1. **Import Project to Vercel**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**

   - **Framework Preset**: `Create React App`
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Environment Variables**

   - `REACT_APP_BACKEND_URL`: Your Render backend URL (e.g., `https://your-app-name.onrender.com`)

4. **Deployment Settings**
   - Enable auto-deploy for the `main` branch
   - Enable auto-deploy for the `dev` branch (if you want separate dev environment)

### Vercel Configuration

The `vercel.json` file in the Frontend directory contains the deployment configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_BACKEND_URL": "@backend_url"
  }
}
```

### Frontend URL

After deployment, your frontend will be available at:

- Production: `https://your-app-name.vercel.app`
- Development: `https://your-dev-app-name.vercel.app`

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes four GitHub Actions workflows:

1. **backend-dev.yml**: Tests backend on dev branch pushes
2. **backend-prod.yml**: Tests backend on main branch pushes
3. **frontend-dev.yml**: Tests frontend on dev branch pushes
4. **frontend-prod.yml**: Tests frontend on main branch pushes

### Workflow Features

- **Testing**: Runs unit tests for both backend and frontend
- **Building**: Builds the applications to ensure they compile correctly
- **Deployment**: Render and Vercel handle deployments automatically based on branch pushes

## Environment Setup

### Development Environment

1. **Backend**: Runs on `http://localhost:8080`
2. **Frontend**: Runs on `http://localhost:3000`
3. **CORS**: Configured to allow localhost connections

### Production Environment

1. **Backend**: HTTPS endpoint on Render
2. **Frontend**: HTTPS endpoint on Vercel
3. **CORS**: Configured to allow Vercel and Render domains

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the Frontend directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8080
```

For production, set this in Vercel's environment variables to your Render backend URL.

### Backend Environment Variables

- `NODE_ENV`: Set to `production` for production deployments
- `PORT`: Server port (optional, defaults to 8080)

## Monitoring and Health Checks

### Backend Health Check

- **Endpoint**: `/api/health`
- **Response**: `"Calculator Backend is running!"`
- **Used by**: Render for health monitoring

### Frontend Health Check

- **Endpoint**: Root path `/`
- **Response**: React application
- **Used by**: Vercel for health monitoring

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure the backend CORS configuration includes your Vercel domain
   - Check that the frontend is using the correct backend URL

2. **Build Failures**

   - Check that all dependencies are properly installed
   - Verify that the build commands are correct in Render/Vercel

3. **Health Check Failures**

   - Ensure the health check endpoint is accessible
   - Check that the application is starting correctly

4. **Environment Variable Issues**
   - Verify that environment variables are set correctly in Vercel
   - Ensure the frontend is using the correct backend URL

### Debugging Steps

1. **Check Render Logs**

   - Go to your Render service dashboard
   - View the logs for any error messages

2. **Check Vercel Logs**

   - Go to your Vercel project dashboard
   - View the function logs for any error messages

3. **Test Locally**
   - Run both applications locally to ensure they work
   - Test the API endpoints manually

## Security Considerations

1. **HTTPS**: Both Render and Vercel provide HTTPS by default
2. **CORS**: Configured to only allow specific domains
3. **Environment Variables**: Sensitive data should be stored as environment variables
4. **Input Validation**: Backend validates all calculator inputs
5. **Security Headers**: Helmet.js provides security headers

## Cost Considerations

### Render Pricing

- **Free Tier**: 750 hours/month for web services
- **Paid Plans**: Starting at $7/month for additional resources

### Vercel Pricing

- **Free Tier**: Unlimited deployments for personal projects
- **Pro Plan**: $20/month for team features and advanced analytics

## Next Steps

1. **Set up monitoring**: Configure logging and monitoring for both services
2. **Add authentication**: Implement user authentication if needed
3. **Database integration**: Add a database for persistent data storage
4. **Custom domain**: Configure custom domains for both services
5. **SSL certificates**: Both services provide SSL certificates automatically
