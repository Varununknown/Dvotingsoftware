#!/usr/bin/env node

/**
 * Pre-deployment checklist for E-Voting System
 * Run this before deploying to ensure everything is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 E-Voting System Deployment Readiness Check\n');

// Check if required files exist
const requiredFiles = [
  { path: 'package.json', name: 'Frontend package.json' },
  { path: 'backend/package.json', name: 'Backend package.json' },
  { path: 'backend/server.js', name: 'Backend server file' },
  { path: 'src/main.tsx', name: 'Frontend entry point' },
  { path: 'backend/.env.example', name: 'Environment example' }
];

let allGood = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.name}`);
  } else {
    console.log(`❌ Missing: ${file.name}`);
    allGood = false;
  }
});

// Check package.json scripts
console.log('\n🔧 Checking build scripts...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log('✅ Frontend build script');
  } else {
    console.log('❌ Missing frontend build script');
    allGood = false;
  }
  
  if (backendPkg.scripts && backendPkg.scripts.start) {
    console.log('✅ Backend start script');
  } else {
    console.log('❌ Missing backend start script');
    allGood = false;
  }
} catch (error) {
  console.log('❌ Error reading package.json files');
  allGood = false;
}

// Check environment configuration
console.log('\n🔐 Environment configuration...');
if (fs.existsSync('backend/.env.example')) {
  console.log('✅ Environment example file exists');
  console.log('ℹ️  Remember to set up your actual .env with real values');
} else {
  console.log('❌ No environment example file');
  allGood = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Your project is ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Set up MongoDB Atlas');
  console.log('2. Deploy backend to Render');
  console.log('3. Deploy frontend to Vercel');
  console.log('4. Test everything works');
  console.log('\nSee QUICK_DEPLOYMENT.md for detailed instructions.');
} else {
  console.log('⚠️  Please fix the issues above before deploying.');
}
console.log('='.repeat(50));