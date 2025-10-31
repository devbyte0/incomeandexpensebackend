const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY','BDT']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      weeklyReport: {
        type: Boolean,
        default: true
      }
    },
    budgetAlerts: {
      type: Boolean,
      default: true
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  otpCode: String,
  otpExpires: Date,
  emailChangeOTP: String,
  emailChangeOTPExpires: Date,
  pendingEmail: String,
  emailChangeToken: String,
  emailChangeTokenExpires: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Generate OTP for 2FA
userSchema.methods.generateOTP = function() {
  const crypto = require('crypto');
  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  this.otpCode = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Verify OTP for 2FA
userSchema.methods.verifyOTP = function(code) {
  if (!this.otpCode || !this.otpExpires) {
    return false;
  }
  
  if (this.otpExpires < Date.now()) {
    return false;
  }
  
  return this.otpCode === code;
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otpCode = undefined;
  this.otpExpires = undefined;
};

// Generate OTP for email change
userSchema.methods.generateEmailChangeOTP = function() {
  const crypto = require('crypto');
  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  this.emailChangeOTP = otp;
  this.emailChangeOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Verify OTP for email change
userSchema.methods.verifyEmailChangeOTP = function(code) {
  if (!this.emailChangeOTP || !this.emailChangeOTPExpires) {
    return false;
  }
  
  if (this.emailChangeOTPExpires < Date.now()) {
    return false;
  }
  
  return this.emailChangeOTP === code;
};

// Clear email change OTP
userSchema.methods.clearEmailChangeOTP = function() {
  this.emailChangeOTP = undefined;
  this.emailChangeOTPExpires = undefined;
};

// Get user profile (without sensitive data)
userSchema.methods.getProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.otpCode;
  delete userObject.otpExpires;
  delete userObject.twoFactorSecret;
  delete userObject.emailChangeOTP;
  delete userObject.emailChangeOTPExpires;
  delete userObject.emailChangeToken;
  delete userObject.emailChangeTokenExpires;
  delete userObject.pendingEmail;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
