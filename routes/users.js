const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmailChangeOTPEmail } = require('../utils/emailService');

const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars', public_id: `user_${req.user._id}_${Date.now()}` },
          (error, result) => result ? resolve(result) : reject(error)
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };
    const result = await uploadFromBuffer(req.file.buffer);
    req.user.avatar = result.secure_url;
    await req.user.save();
    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar: req.user.avatar }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading avatar' });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot be more than 20 characters'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'])
    .withMessage('Invalid currency'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone cannot be more than 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['name', 'phone', 'currency', 'timezone'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put('/preferences', [
  protect,
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Invalid theme'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be boolean'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be boolean'),
  body('preferences.notifications.weeklyReport')
    .optional()
    .isBoolean()
    .withMessage('Weekly report preference must be boolean'),
  body('preferences.budgetAlerts')
    .optional()
    .isBoolean()
    .withMessage('Budget alerts preference must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { preferences } = req.body;

    // Merge preferences with existing ones
    const updatedPreferences = {
      ...req.user.preferences,
      ...preferences,
      notifications: {
        ...req.user.preferences.notifications,
        ...preferences.notifications
      }
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: updatedPreferences },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: user.getProfile()
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @desc    Delete user account (hard delete + cascade)
// @route   DELETE /api/users/account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Cascade delete user's data
    const Transaction = require('../models/Transaction');
    const Category = require('../models/Category');

    await Promise.all([
      Transaction.deleteMany({ user: req.user._id }),
      Category.deleteMany({ user: req.user._id })
    ]);

    // Delete the user account
    await User.findByIdAndDelete(req.user._id);

    // Clear cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Request email change
// @route   POST /api/users/request-email-change
// @access  Private
router.post('/request-email-change', [
  protect,
  body('newEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { newEmail } = req.body;
    const user = req.user;

    // Check if new email is same as current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'New email must be different from current email'
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    // Generate OTP for email change
    const otp = user.generateEmailChangeOTP();
    user.pendingEmail = newEmail.toLowerCase();
    await user.save();

    // Send OTP to new email
    try {
      await sendEmailChangeOTPEmail(newEmail, otp, user.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Clear the pending email and OTP if email fails
      user.pendingEmail = undefined;
      user.clearEmailChangeOTP();
      await user.save();
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent to your new email address'
    });
  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Verify and complete email change
// @route   POST /api/users/verify-email-change
// @access  Private
router.post('/verify-email-change', [
  protect,
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { otp } = req.body;

    // Get fresh user data
    const user = await User.findById(req.user._id);
    
    if (!user || !user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: 'No pending email change request found'
      });
    }

    // Verify OTP
    const isOTPValid = user.verifyEmailChangeOTP(otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Update email
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.isEmailVerified = true;
    user.pendingEmail = undefined;
    user.clearEmailChangeOTP();
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully',
      data: {
        oldEmail,
        newEmail: user.email
      }
    });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
