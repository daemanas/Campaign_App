# Amplify — Campaign Reach (React Native + JavaScript)

Native mobile project source (not a website), built with React Native CLI, JavaScript/JSX, Node.js/Express and MongoDB/Mongoose.

## Start backend
1. Install Node.js 20+ and MongoDB or create a MongoDB Atlas database.
2. `cd backend`
3. Copy `.env.example` to `.env`, then set `MONGODB_URI` and a long random `JWT_SECRET`.
4. `npm install`
5. `npm run dev`

API health check: `http://localhost:5000/api/v1/health`.

## Start Android app
Install Android Studio, Android SDK and JDK 17, and follow https://reactnative.dev/docs/set-up-your-environment.
1. `cd mobile && npm install`
2. Ensure Metro is running: `npm start`
3. In another terminal: `npm run android`

Android emulator API address is `http://10.0.2.2:5000/api/v1`. For a physical phone, edit `mobile/src/config.js` and use your computer's LAN IP. Phone and computer must share Wi-Fi.

## Implemented flows
- Register/login, hashed passwords, JWT sessions, profile
- Home and Explore, category/search filtering, campaign details
- Five-step campaign creation and submit-for-review
- Save/unsave campaigns, user campaign status
- Contribution records, progress, estimated reach
- Activity notifications and contribution summary
- MongoDB persistence for users, campaigns, contributions, notifications
- Five navigation tabs: Home, Explore, Create, Activity, Profile

## Honest integration status
Checkout is DEMO mode only; it creates a contribution record but does not charge money. Real payments need server-side provider integration and verified webhooks. Real ad distribution is not implemented; funding alone does not start promotion. A trusted moderation/admin workflow is needed to approve campaigns. Add email verification, password reset, privacy/legal review, storage uploads, audit logs, monitoring, production HTTPS and backups before launch. This source is not an APK; build an APK/AAB in a configured Android environment.
