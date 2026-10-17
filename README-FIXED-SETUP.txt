AMPLIFY CAMPAIGN REACH — FIXED PROJECT
======================================

Mobile app:
  cd mobile
  npm install
  npm start -- --reset-cache

In a second terminal:
  cd mobile
  npm run android

Requirements:
- Node.js 20 or newer
- Android Studio with Android SDK installed
- Java JDK 17 (recommended)
- Android emulator running, or USB debugging enabled on a connected Android device

Backend:
  cd backend
  copy .env.example .env
  npm install
  npm run dev

Edit backend/.env and set MONGODB_URI and a long random JWT_SECRET.
The supplied .env file was intentionally excluded so private credentials are not redistributed.
For Android Emulator, mobile/src/config.js uses http://10.0.2.2:5000/api/v1.
For a physical phone, replace 10.0.2.2 with your development computer's LAN IP address.

Important:
- The Android scaffold is merged into mobile/android and the component name aligned.
- An APK was not built in this environment; verify the Android build on your computer.
- Checkout/contributions remain demo mode unless a real payment provider is integrated.
