require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

try {
  admin.initializeApp({
      credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
      }),
  });
  console.log("App Name:", admin.app().name);
  console.log("Project ID:", admin.app().options.projectId);
} catch (e) {
  console.error("Init Error:", e.message);
}
