const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyAccessToken } = require('../middlewares/authMiddlewares'); 

// Store FCM token
router.post('/store-token', verifyAccessToken, async (req, res) => {
  try {
    // console.log('📱 FCM store-token route hit!');
    // console.log('📱 Request body:', req.body);
    // console.log('📱 User from token:', req.user);
    
    const { fcmToken, deviceInfo } = req.body;
    const userId = req.user.userId; // Note: your middleware uses 'userId', not 'id'

    // Store in Firestore
    const db = admin.firestore();
    const tokenRef = db.collection('fcm_tokens').doc();
    
    await tokenRef.set({
      userId: userId,
      fcmToken: fcmToken,
      deviceInfo: deviceInfo,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });

    // Also store by userId for your PushNotificationService (new)
    await db.collection('fcmTokens').doc(userId).set({
      fcmToken: fcmToken,
      active: true,
      deviceInfo: deviceInfo,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // console.log(`✅ FCM token stored for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'FCM token stored successfully',
      tokenId: tokenRef.id 
    });

  } catch (error) {
    // console.error('❌ Error storing FCM token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to store FCM token',
      error: error.message 
    });
  }
});



module.exports = router;