const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
  });
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URI || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Income & Expense Tracker',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .title {
              color: #3B82F6;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin: 5px 0 0 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #3B82F6, #1D4ED8);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(135deg, #1D4ED8, #1E40AF);
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #FEF3C7;
              border: 1px solid #F59E0B;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400E;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💰</div>
              <h1 class="title">Income & Expense Tracker</h1>
              <p class="subtitle">Your Personal Finance Assistant</p>
            </div>
            
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Thank you for signing up for our Income & Expense Tracker. To complete your registration and start managing your finances, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3B82F6;">${verificationUrl}</p>
              
              <div class="warning">
                <strong>Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification email.
              </div>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent by Income & Expense Tracker</p>
              <p>© 2024 Income & Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URI || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password - Income & Expense Tracker',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .title {
              color: #3B82F6;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin: 5px 0 0 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #EF4444, #DC2626);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background: linear-gradient(135deg, #DC2626, #B91C1C);
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #FEF3C7;
              border: 1px solid #F59E0B;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400E;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💰</div>
              <h1 class="title">Income & Expense Tracker</h1>
              <p class="subtitle">Your Personal Finance Assistant</p>
            </div>
            
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${name},</p>
              <p>We received a request to reset your password for your Income & Expense Tracker account. Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3B82F6;">${resetUrl}</p>
              
              <div class="warning">
                <strong>Important:</strong> This password reset link will expire in 1 hour. If you don't reset your password within this time, you'll need to request a new reset link.
              </div>
              
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent by Income & Expense Tracker</p>
              <p>© 2024 Income & Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send OTP for 2FA
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code - Income & Expense Tracker',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .title {
              color: #3B82F6;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .otp-container {
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #3B82F6;
              letter-spacing: 8px;
              padding: 20px;
              background: #F0F9FF;
              border: 2px solid #3B82F6;
              border-radius: 10px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #FEF3C7;
              border: 1px solid #F59E0B;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400E;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <h1 class="title">Income & Expense Tracker</h1>
            </div>
            
            <div class="content">
              <h2>Hello, ${name}!</h2>
              <p>Your verification code for two-factor authentication is:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>Important:</strong> This verification code will expire in 10 minutes. If you didn't request this code, please ignore this email.
              </div>
              
              <p>If you didn't attempt to log in to your account, please secure your account immediately.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent by Income & Expense Tracker</p>
              <p>© 2024 Income & Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('OTP email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send OTP for email change
const sendEmailChangeOTPEmail = async (newEmail, otp, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newEmail,
      subject: 'Verify Your New Email Address - Income & Expense Tracker',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Change Verification</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              margin-bottom: 10px;
            }
            .title {
              color: #3B82F6;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .content {
              margin-bottom: 30px;
            }
            .otp-container {
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #3B82F6;
              letter-spacing: 8px;
              padding: 20px;
              background: #F0F9FF;
              border: 2px solid #3B82F6;
              border-radius: 10px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .warning {
              background: #FEF3C7;
              border: 1px solid #F59E0B;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #92400E;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✉️</div>
              <h1 class="title">Income & Expense Tracker</h1>
            </div>
            
            <div class="content">
              <h2>Hello, ${name}!</h2>
              <p>We received a request to change your email address to this email. Please verify this change by entering the verification code below:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>Important:</strong> This verification code will expire in 10 minutes. If you didn't request this email change, please ignore this email and secure your account immediately.
              </div>
              
              <p>Once verified, your email address will be updated to <strong>${newEmail}</strong>.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent by Income & Expense Tracker</p>
              <p>© 2024 Income & Expense Tracker. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email change OTP sending error:', error);
    throw new Error('Failed to send email change OTP');
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendEmailChangeOTPEmail
};
