"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_service_1 = require("../services/firebase.service");
const router = (0, express_1.Router)();
router.post('/verify-token', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: 'No token provided' });
    }
    if (!firebase_service_1.db || !firebase_service_1.auth) {
        return res.status(500).json({ error: 'Firebase not initialized' });
    }
    try {
        const decodedToken = await firebase_service_1.auth.verifyIdToken(idToken);
        const userDoc = await firebase_service_1.db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        res.json({
            uid: decodedToken.uid,
            email: decodedToken.email,
            photoURL: decodedToken.picture,
            displayName: decodedToken.name,
            ...userData
        });
    }
    catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
router.post('/create-user', async (req, res) => {
    const { idToken, ...additionalData } = req.body;
    if (!idToken || !firebase_service_1.db || !firebase_service_1.auth) {
        return res.status(400).json({ error: 'Missing token or Firebase not initialized' });
    }
    try {
        const decodedToken = await firebase_service_1.auth.verifyIdToken(idToken);
        await firebase_service_1.db.collection('users').doc(decodedToken.uid).set({
            email: decodedToken.email,
            displayName: decodedToken.name,
            photoURL: decodedToken.picture,
            createdAt: new Date(),
            ...additionalData
        }, { merge: true });
        res.json({ success: true, uid: decodedToken.uid });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map