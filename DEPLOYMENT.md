# E-Voting System Deployment Guide

This guide outlines the steps required to deploy the E-Voting System to a production environment. The system consists of a React frontend and an Express.js backend with MongoDB.

## Prerequisites

- Node.js 16.x or higher
- MongoDB Atlas account (or other MongoDB hosting solution)
- A hosting platform (Heroku, Vercel, Netlify, AWS, etc.)
- Git

## Backend Deployment

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster if you haven't already
2. Set up a database user with appropriate permissions
3. Configure network access:
   - For testing: Allow access from anywhere (0.0.0.0/0)
   - For production: Whitelist only your application server IP addresses
4. Get your connection string from MongoDB Atlas

### 2. Set Up Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret
```

### 3. Deploy to a Hosting Platform

#### Option 1: Heroku

1. Install the Heroku CLI: `npm install -g heroku`
2. Create a new Heroku app: `heroku create your-app-name`
3. Set environment variables:
   ```
   heroku config:set MONGO_URI=mongodb+srv://...
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set SESSION_SECRET=your_secure_session_secret
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   ```
4. Deploy: `git push heroku main`

#### Option 2: AWS EC2

1. Launch an EC2 instance
2. Connect to your instance via SSH
3. Clone your repository
4. Install dependencies: `npm install --production`
5. Set up PM2 for process management:
   ```
   npm install -g pm2
   pm2 start server.js --name "e-voting-api" -- --env production
   pm2 save
   pm2 startup
   ```

## Frontend Deployment

### 1. Build the Frontend

1. Update the `.env` file in the frontend directory:
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   ```
2. Build for production:
   ```
   npm run build
   ```

### 2. Deploy Frontend

#### Option 1: Vercel/Netlify

1. Connect your GitHub repository to Vercel/Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: `VITE_API_URL=https://your-backend-domain.com/api`

#### Option 2: Static Hosting

1. Upload the contents of the `dist` directory to your static hosting service
2. Configure your web server to serve the `index.html` file for all routes

## Testing the Deployment

1. Navigate to your frontend URL
2. Test voter registration functionality
3. Test admin login and election creation
4. Verify that MongoDB connection is working through the backend health check endpoint:
   ```
   curl https://your-backend-domain.com/health
   ```

## Troubleshooting

- **MongoDB Connection Issues**:
  - Verify network access settings in MongoDB Atlas
  - Check connection string format and credentials
  - Ensure IP whitelisting is properly configured

- **CORS Issues**:
  - Verify the `FRONTEND_URL` environment variable is set correctly
  - Check CORS configuration in `server.js`

- **General Connectivity Problems**:
  - Check firewall settings
  - Verify environment variables
  - Check application logs
  
## Maintenance

- Set up monitoring for your application
- Implement regular database backups
- Update dependencies regularly
- Monitor for security vulnerabilities

## Security Considerations

- Keep all secrets out of version control
- Implement rate limiting for sensitive endpoints
- Use HTTPS for all communications
- Regularly rotate JWT secrets and session keys
- Implement proper input validation and sanitization

For more information, refer to the project documentation.