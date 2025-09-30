# 🌟 VERCEL DEPLOYMENT STEPS

## 1. Go to Vercel
Visit: https://vercel.com and sign up with GitHub

## 2. Import Project
- Click "Add New..." → "Project"
- Import your GitHub repository
- Select the `voting` repository

## 3. Configure Frontend Settings
**Framework Preset**: `Vite`
**Root Directory**: `./` (leave empty)
**Build Command**: `npm run build`
**Output Directory**: `dist`

## 4. Environment Variables
Add this variable in Vercel dashboard:

```
VITE_API_URL=https://your-backend-name.onrender.com/api
```

**Replace `your-backend-name` with your actual Render URL!**

## 5. Deploy
Click "Deploy" - Vercel will build and deploy automatically

## 6. Get Your Frontend URL
You'll get a URL like:
`https://your-project-name.vercel.app`

## 7. Update Backend CORS
Go back to Render → Environment Variables
Update `FRONTEND_URL` to your Vercel URL:
```
FRONTEND_URL=https://your-project-name.vercel.app
```

## 8. Test Complete App
Visit your Vercel URL and test:
- ✅ Voter registration
- ✅ Admin login  
- ✅ Create election
- ✅ Vote casting
- ✅ Results display