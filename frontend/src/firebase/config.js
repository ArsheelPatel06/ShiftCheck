import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Direct Firebase configuration - Replace with your actual Firebase project values
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!firebaseConfig[field] ||
            firebaseConfig[field].includes('Replace') ||
            firebaseConfig[field].includes('your-') ||
            firebaseConfig[field].includes('Test123')) {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        console.error('⚠️ Firebase Configuration Incomplete!');
        console.error('Missing or placeholder values for:', missingFields);
        console.error('Please update frontend/src/firebase/config.js with your actual Firebase values');
        console.error('Get them from: https://console.firebase.google.com/ > Project Settings > General > Your apps');

        // Show user-friendly error

        // Create a visible error message for the user
        if (typeof document !== 'undefined') {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #fee;
                border-bottom: 2px solid #f87171;
                padding: 16px;
                text-align: center;
                z-index: 9999;
                font-family: monospace;
                color: #dc2626;
                font-size: 14px;
            `;
            errorDiv.innerHTML = `
                <strong>🔥 Firebase Configuration Required!</strong><br>
                Update <code>frontend/src/firebase/config.js</code> with your Firebase project values.<br>
                <small>Missing: ${missingFields.join(', ')}</small>
            `;

            // Add to page when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.insertBefore(errorDiv, document.body.firstChild);
                });
            } else {
                document.body.insertBefore(errorDiv, document.body.firstChild);
            }
        }

        throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
    }

    console.log('✅ Firebase configuration validated successfully');
};

// Validate configuration before initializing
try {
    validateFirebaseConfig();
} catch (error) {
    console.error('Firebase validation failed:', error.message);
    // Don't throw here to prevent app crash, just log the error
}

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
        console.log('📊 Firebase Analytics initialized');
    } catch (error) {
        console.warn('Analytics initialization failed:', error);
    }
}
export { analytics };

// Configure auth settings
auth.useDeviceLanguage();

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
    try {
        validateFirebaseConfig();
        return true;
    } catch {
        return false;
    }
};

// Export configuration for debugging (without sensitive data)
export const getFirebaseInfo = () => ({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    configured: isFirebaseConfigured()
});

export default app;