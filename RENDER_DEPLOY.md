# 🚀 RENDER DEPLOYMENT STEPS

## 1. Go to Render
Visit: https://render.com and sign up with GitHub

## 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub account
- Select your repository: `voting`

## 3. Configure Backend Settings
**Root Directory**: `backend`
**Environment**: `Node`
**Build Command**: `npm install`
**Start Command**: `npm start`

## 4. Environment Variables (CRITICAL!)
Add these exact variables in Render dashboard:

```
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/evoting?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
SESSION_SECRET=super_secure_random_string_32_chars_min
JWT_SECRET=another_super_secure_random_string
FRONTEND_URL=https://your-app-name.vercel.app
```

## 5. Get Your Backend URL
After deployment, you'll get a URL like:
`https://your-backend-name.onrender.com`

**Save this URL - you'll need it for frontend!**

## 6. Test Backend
Visit: `https://your-backend-name.onrender.com/health`
Should show: `{"status": "OK", "database": "connected"}`