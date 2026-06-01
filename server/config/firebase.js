const admin = require('firebase-admin');

let firebaseApp;

const initFirebase = () => {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return;
  }
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
    };

    if (!serviceAccount.project_id || !serviceAccount.private_key) {
      console.warn(
        '⚠️  Firebase Admin SDK not configured - Auth will use JWT only',
      );
      return;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.warn(`⚠️  Firebase Admin SDK init warning: ${error.message}`);
  }
};

const verifyFirebaseToken = async (idToken) => {
  if (!admin.apps.length) return null;
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    return null;
  }
};

module.exports = { initFirebase, verifyFirebaseToken, admin };
