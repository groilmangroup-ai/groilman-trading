"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;
if (firebaseConfig) {
    try {
        const serviceAccount = JSON.parse(firebaseConfig);
        // Fix for environment variable parsing where \n becomes literal string '\\n'
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        if (!firebase_admin_1.default.apps.length) {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin initialized ✅');
        }
    }
    catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
    }
}
else {
    console.warn('FIREBASE_SERVICE_ACCOUNT not found in .env. Firebase features will be disabled.');
}
exports.db = firebase_admin_1.default.apps.length ? firebase_admin_1.default.firestore() : null;
exports.auth = firebase_admin_1.default.apps.length ? firebase_admin_1.default.auth() : null;
//# sourceMappingURL=firebase.service.js.map