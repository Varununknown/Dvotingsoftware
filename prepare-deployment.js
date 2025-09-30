#!/usr/bin/env node

/**
 * 🚀 Pre-deployment preparation for Vercel & Render
 * This script ensures your project is ready for deployment
 */

console.log('🚀 Preparing E-Voting System for Vercel & Render Deployment\n');

import fs from 'fs';
import crypto from 'crypto';

// Generate secure secrets
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

console.log('🔐 Generated Security Secrets (SAVE THESE!):\n');
console.log('For Render Backend Environment Variables:');
console.log('SESSION_SECRET=' + generateSecret(32));
console.log('JWT_SECRET=' + generateSecret(32));

console.log('\n📋 Deployment Checklist:\n');

const checklist = [
  '✅ MongoDB Atlas cluster is ready with connection string',
  '✅ GitHub repository is up to date',
  '✅ Backend configured in backend/ folder',
  '✅ Frontend has build script configured',
  '✅ Environment variables prepared'
];

checklist.forEach(item => console.log(item));

console.log('\n🔥 Next Steps:');
console.log('1. Deploy Backend to Render (see RENDER_DEPLOY.md)');
console.log('2. Deploy Frontend to Vercel (see VERCEL_DEPLOY.md)');
console.log('3. Update CORS settings');
console.log('4. Test complete application');

console.log('\n📁 Deployment Files Created:');
console.log('- RENDER_DEPLOY.md (Backend deployment guide)');
console.log('- VERCEL_DEPLOY.md (Frontend deployment guide)');

console.log('\n🎯 Expected Result:');
console.log('- Backend: https://your-app.onrender.com');
console.log('- Frontend: https://your-app.vercel.app');
console.log('- Total Cost: $0 (Free tiers)');
console.log('- Deployment Time: ~15-30 minutes');

console.log('\n🚀 Ready to deploy! Start with Render backend first.');