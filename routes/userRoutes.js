const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const { registerUser, loginUser, getMe, getProfile, updateProfile, getProfileStats, forgotPassword, resetPassword, deleteAccount } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/profile/stats', protect, getProfileStats);
router.post( '/forgot-password', forgotPassword );
router.post( '/reset-password/:token', resetPassword );
router.delete('/account', protect, deleteAccount);

module.exports = router;