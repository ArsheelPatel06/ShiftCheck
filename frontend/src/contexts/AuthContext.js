import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    addDoc,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import toast from 'react-hot-toast';
import analyticsService from '../services/analyticsService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    // Sign up function with enhanced user profile creation
    const signup = async (email, password, userData) => {
        try {
            setLoading(true);

            // Create user account
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: userData.name
            });

            // Create comprehensive user document in Firestore
            const userDocData = {
                uid: user.uid,
                email: user.email,
                name: userData.name,
                role: userData.role || 'staff',
                department: userData.department || '',
                skills: userData.skills || [],
                phoneNumber: userData.phoneNumber || '',
                isActive: true,
                profileComplete: false,
                preferences: {
                    preferredShifts: [],
                    maxHoursPerWeek: 40,
                    availableDays: [],
                    notifications: {
                        email: true,
                        push: true,
                        sms: false
                    }
                },
                workloadMetrics: {
                    totalShiftsCompleted: 0,
                    totalHoursWorked: 0,
                    averageRating: 0,
                    lastShiftDate: null
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, 'users', user.uid), userDocData);
            console.log('User document created successfully in Firestore');

            // Verify the document was created
            const verifyDoc = await getDoc(doc(db, 'users', user.uid));
            if (!verifyDoc.exists()) {
                throw new Error('Failed to create user document in Firestore');
            }
            console.log('User document verified in Firestore');

            // Handle admin request if user selected admin role
            if (userData.adminRequest) {
                const adminRequestData = {
                    userId: user.uid,
                    name: userData.name,
                    email: user.email,
                    phone: userData.phoneNumber || '',
                    currentRole: 'staff',
                    reason: userData.adminRequest.reason,
                    department: userData.department,
                    experience: '',
                    additionalInfo: 'Requested during signup',
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    requestedAt: new Date().toISOString()
                };

                await addDoc(collection(db, 'adminRequests'), adminRequestData);
            }

            // Create user activity log
            await setDoc(doc(db, 'user_activities', user.uid), {
                userId: user.uid,
                activities: [{
                    type: 'account_created',
                    timestamp: serverTimestamp(),
                    details: {
                        email: user.email,
                        role: userData.role,
                        hasAdminRequest: !!userData.adminRequest
                    }
                }]
            });

            // Track signup in analytics
            analyticsService.logEvent('user_signup', {
                user_role: userData.role,
                department: userData.department,
                timestamp: new Date().toISOString()
            });

            toast.success('Account created successfully! Welcome to ShiftCheck!');
            return user;
        } catch (error) {
            console.error('Signup error:', error);

            // Handle specific Firebase errors
            let errorMessage = 'Failed to create account';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                default:
                    errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Enhanced login function
    const login = async (email, password) => {
        try {
            setLoading(true);
            const { user } = await signInWithEmailAndPassword(auth, email, password);

            // Update last login timestamp (skip if quota exceeded)
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLoginAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } catch (updateError) {
                // Ignore Firebase quota errors during login
                console.warn('Could not update login timestamp:', updateError.message);
            }

            // Log login activity (skip if quota exceeded)
            try {
                const activityRef = doc(db, 'user_activities', user.uid);
                const activityDoc = await getDoc(activityRef);

                if (activityDoc.exists()) {
                    const currentActivities = activityDoc.data().activities || [];
                    currentActivities.unshift({
                        type: 'login',
                        timestamp: serverTimestamp(),
                        details: {
                            ip: 'client-side', // You can enhance this with actual IP detection
                            userAgent: navigator.userAgent
                        }
                    });

                    // Keep only last 50 activities
                    const limitedActivities = currentActivities.slice(0, 50);

                    await updateDoc(activityRef, {
                        activities: limitedActivities
                    });
                }
            } catch (activityError) {
                // Ignore Firebase quota errors during activity logging
                console.warn('Could not log user activity:', activityError.message);
            }

            // Get user data for analytics (skip if quota exceeded)
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();

                // Track login in analytics
                analyticsService.logUserLogin(userData.role, userData.department);
            } catch (userDataError) {
                // Ignore Firebase quota errors during user data fetch
                console.warn('Could not fetch user data for analytics:', userDataError.message);
            }

            toast.success(`Welcome back, ${user.displayName || 'User'}!`);
            return user;
        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = 'Login failed';
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                default:
                    errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign out function
    const logout = async () => {
        try {
            // Skip Firebase operations if quota is exceeded
            console.log('Logging out user...');

            // Always clear local state first
            setUserProfile(null);
            setCurrentUser(null);

            // Try to sign out from Firebase Auth (this should work even with quota issues)
            try {
                await signOut(auth);
                console.log('Firebase Auth signout successful');
            } catch (authError) {
                console.warn('Firebase Auth signout failed:', authError.message);
                // Continue with logout even if auth fails
            }

            // Skip Firebase Firestore operations to avoid quota errors
            console.log('Skipping Firestore operations due to quota concerns');

            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Ensure local state is cleared even if everything fails
            setUserProfile(null);
            setCurrentUser(null);
            toast.success('Logged out successfully');
        }
    };

    // Password reset function
    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Password reset email sent! Check your inbox.');
        } catch (error) {
            console.error('Password reset error:', error);

            let errorMessage = 'Failed to send reset email';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                default:
                    errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        }
    };

    // Update password function
    const changePassword = async (currentPassword, newPassword) => {
        try {
            if (!currentUser) throw new Error('No user logged in');

            // Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, newPassword);

            toast.success('Password updated successfully');
        } catch (error) {
            console.error('Password change error:', error);

            let errorMessage = 'Failed to update password';
            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = 'Current password is incorrect';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'New password should be at least 6 characters';
                    break;
                default:
                    errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        }
    };

    // Update user profile
    const updateUserProfile = async (updates) => {
        try {
            if (!currentUser) throw new Error('No user logged in');

            // Update Firestore document
            await updateDoc(doc(db, 'users', currentUser.uid), {
                ...updates,
                updatedAt: serverTimestamp()
            });

            // Update local state
            setUserProfile(prev => ({ ...prev, ...updates }));

            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
            throw error;
        }
    };

    // Get user data from Firestore
    const getUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() };
            }
            console.warn('User document does not exist for UID:', uid);
            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);

            // Handle specific Firebase errors
            if (error.code === 'permission-denied') {
                console.error('Permission denied: User may not have access to their own profile');
                toast.error('Permission denied: Unable to load user profile');
            } else if (error.code === 'unavailable') {
                console.error('Firebase service unavailable');
                toast.error('Service temporarily unavailable');
            }

            return null;
        }
    };

    // Check if user has admin privileges
    const isAdmin = () => {
        return userProfile?.role === 'admin';
    };

    // Check if user profile is complete
    const isProfileComplete = () => {
        return userProfile?.profileComplete === true;
    };

    // Get users by department (for admins)
    const getUsersByDepartment = async (department) => {
        try {
            if (!isAdmin()) throw new Error('Unauthorized');

            const q = query(
                collection(db, 'users'),
                where('department', '==', department),
                where('isActive', '==', true)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching users by department:', error);
            throw error;
        }
    };

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            if (user) {
                console.log('Fetching user data for UID:', user.uid);
                // Get additional user data from Firestore
                const userData = await getUserData(user.uid);
                console.log('User data from Firestore:', userData);
                if (userData) {
                    setCurrentUser(user);
                    setUserProfile(userData);
                    console.log('User profile set:', userData);
                } else {
                    // Handle case where Firestore document doesn't exist
                    console.warn('User authenticated but no Firestore document found');
                    console.log('This usually means the user was created in Firebase Auth but not in Firestore');
                    console.log('User needs to complete profile setup or be created by an admin');

                    // Try to create a basic user profile as fallback
                    try {
                        console.log('Attempting to create fallback user profile...');
                        const fallbackUserData = {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || 'User',
                            role: 'staff',
                            department: '',
                            skills: [],
                            phoneNumber: '',
                            isActive: true,
                            profileComplete: false,
                            preferences: {
                                preferredShifts: [],
                                maxHoursPerWeek: 40,
                                availableDays: [],
                                notifications: {
                                    email: true,
                                    push: true,
                                    sms: false
                                }
                            },
                            workloadMetrics: {
                                totalShiftsCompleted: 0,
                                totalHoursWorked: 0,
                                averageRating: 0,
                                lastShiftDate: null
                            },
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        };

                        await setDoc(doc(db, 'users', user.uid), fallbackUserData);
                        console.log('Fallback user profile created successfully');

                        setCurrentUser(user);
                        setUserProfile(fallbackUserData);
                    } catch (fallbackError) {
                        console.error('Failed to create fallback user profile:', fallbackError);
                        setCurrentUser(user);
                        setUserProfile(null);
                    }
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        // User state
        currentUser,
        userProfile,
        loading,

        // Authentication methods
        signup,
        login,
        logout,
        resetPassword,
        changePassword,

        // Profile methods
        updateUserProfile,
        getUserData,

        // Utility methods
        isAdmin,
        isProfileComplete,
        getUsersByDepartment
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};