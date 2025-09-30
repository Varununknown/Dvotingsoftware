# 🚀 Quick Deployment Guide for E-Voting System

## **Option 1: Free Hosting (Recommended)**

### **1. MongoDB Atlas Setup (Database)**
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (M0 Sandbox - FREE)
4. Create a database user:
   - Username: `evoting`
   - Password: Generate a secure password
5. Network Access: Add `0.0.0.0/0` (Allow access from anywhere)
6. Copy your connection string

### **2. Deploy Backend to Render (FREE)**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     MONGO_URI=your_mongodb_atlas_connection_string
     NODE_ENV=production
     PORT=5000
     SESSION_SECRET=your_random_secret_key
     JWT_SECRET=your_random_jwt_secret
     FRONTEND_URL=https://your-frontend-url.vercel.app
     ```

### **3. Deploy Frontend to Vercel (FREE)**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure:
   - **Root Directory**: Leave empty (it's the main folder)
   - **Build Command**: `npm run build`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com/api
     ```

### **4. Update CORS Settings**
After both are deployed, update your backend environment on Render:
```
FRONTEND_URL=https://your-actual-frontend-url.vercel.app
```

---

## **Option 2: Local Testing Before Deployment**

### **Test Locally First:**
```bash
# 1. Set up backend .env
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas connection

# 2. Install and start backend
npm install
npm run dev

# 3. Install and start frontend (new terminal)
cd ..
npm install
npm run dev
```

---

## **Deployment Checklist**

✅ MongoDB Atlas cluster created and configured  
✅ Backend deployed to Render with environment variables  
✅ Frontend deployed to Vercel with API URL  
✅ CORS configuration updated  
✅ Test voting functionality  
✅ Test admin panel  
✅ Verify vote persistence  

---

## **Security Notes**

- ✅ Use strong, unique secrets for SESSION_SECRET and JWT_SECRET
- ✅ MongoDB Atlas has built-in security features
- ✅ Both Render and Vercel provide HTTPS by default
- ✅ Environment variables are encrypted on hosting platforms

---

## **Troubleshooting**

### **Common Issues:**
1. **CORS Error**: Update FRONTEND_URL in backend environment
2. **Database Connection**: Check MongoDB Atlas connection string
3. **API Not Found**: Verify VITE_API_URL in frontend environment

### **Free Tier Limitations:**
- Render: May sleep after 15 minutes of inactivity
- MongoDB Atlas: 512MB storage limit (plenty for voting system)
- Vercel: Unlimited for personal projects

---

## **Cost: $0/month** 🎉

All services used are completely FREE for your project size!