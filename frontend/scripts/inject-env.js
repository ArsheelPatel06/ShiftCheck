#!/usr/bin/env node

/**
 * Build script to inject environment variables into service worker
 * This script replaces placeholder values with actual environment variables
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const serviceWorkerPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

// Read the service worker file
let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

// Replace placeholder values with actual environment variables
const replacements = {
    'YOUR_FIREBASE_API_KEY': process.env.REACT_APP_FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
    'YOUR_PROJECT_ID': process.env.REACT_APP_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    'YOUR_MESSAGING_SENDER_ID': process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
    'YOUR_FIREBASE_APP_ID': process.env.REACT_APP_FIREBASE_APP_ID || 'YOUR_FIREBASE_APP_ID'
};

// Perform replacements
Object.entries(replacements).forEach(([placeholder, value]) => {
    serviceWorkerContent = serviceWorkerContent.replace(new RegExp(placeholder, 'g'), value);
});

// Write the updated service worker
fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);

console.log('✅ Environment variables injected into service worker');
console.log('🔒 Service worker is now secure and production-ready');
