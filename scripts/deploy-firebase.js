#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase deployment process...\n');

// Check if Firebase CLI is installed
try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is installed');
} catch (error) {
    console.error('❌ Firebase CLI is not installed. Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
}

// Check if user is logged in
try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is authenticated');
} catch (error) {
    console.error('❌ Please login to Firebase first:');
    console.error('firebase login');
    process.exit(1);
}

// Build the React app
console.log('\n📦 Building React application...');
try {
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    console.log('✅ React app built successfully');
} catch (error) {
    console.error('❌ Failed to build React app');
    process.exit(1);
}

// Check if build directory exists
const buildDir = path.join(__dirname, '..', 'frontend', 'build');
if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Please run npm run build first.');
    process.exit(1);
}

// Deploy to Firebase
console.log('\n🌐 Deploying to Firebase Hosting...');
try {
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    console.log('✅ Deployment completed successfully!');
} catch (error) {
    console.error('❌ Deployment failed');
    process.exit(1);
}

console.log('\n🎉 Healthcare Shift Manager is now live!');
console.log('📱 Check your Firebase console for the hosting URL');
console.log('🔧 Configure your custom domain in Firebase Hosting settings');
