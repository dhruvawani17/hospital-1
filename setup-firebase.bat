@echo off
REM Firebase Setup Script for Hospital Booking App (Windows)
REM This script helps configure Firebase Authentication and Firestore rules

echo 🏥 Setting up Firebase for Hospital Booking App...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

echo 🔐 Deploying Firestore security rules...
firebase deploy --only firestore:rules

echo.
echo ✅ Setup Complete!
echo.
echo 📋 Manual steps to complete in Firebase Console:
echo 1. Go to Firebase Console: https://console.firebase.google.com
echo 2. Select your project: hospital-8e8d1
echo 3. Navigate to Authentication ^> Sign-in method
echo 4. Enable 'Anonymous' sign-in provider
echo 5. Navigate to Firestore Database ^> Rules
echo 6. Verify the rules were deployed correctly
echo.
echo 🔄 After enabling Anonymous auth, restart your dev server:
echo npm run dev
pause
