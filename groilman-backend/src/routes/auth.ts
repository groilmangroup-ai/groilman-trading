import { Router, Request, Response } from 'express';
import { db, auth as adminAuth } from '../services/firebase.service';

const router = Router();

router.post('/verify-token', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'No token provided' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ error: 'Firebase not initialized' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    res.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      photoURL: decodedToken.picture,
      displayName: decodedToken.name,
      ...userData
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/create-user', async (req: Request, res: Response) => {
  const { idToken, ...additionalData } = req.body;
  
  if (!idToken || !db || !adminAuth) {
    return res.status(400).json({ error: 'Missing token or Firebase not initialized' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    await db.collection('users').doc(decodedToken.uid).set({
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      createdAt: new Date(),
      ...additionalData
    }, { merge: true });

    res.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;