# Email Verification Setup Guide

This guide will help you set up email verification for the Income & Expense Tracker application.

## Prerequisites

1. A Gmail account
2. Node.js and npm installed
3. MongoDB database running

## Gmail Setup

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password

1. In your Google Account settings, go to Security
2. Under "2-Step Verification", click on "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Enter "Income Expense App" as the device name
5. Click "Generate"
6. Copy the generated 16-character password (you'll need this for the environment variables)

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password

# Frontend URL (for email links)
FRONTEND_URI=http://localhost:3000

# Other existing variables...
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

## Installation

1. Install the new dependencies:

```bash
npm install nodemailer crypto
```

2. Restart your backend server:

```bash
npm run dev
```

## Testing Email Verification

1. Register a new user through the frontend
2. Check your email for the verification link
3. Click the verification link to verify the email
4. The user should now be able to access all features

## Email Templates

The application includes two email templates:

1. **Email Verification**: Sent when a user registers
2. **Password Reset**: Sent when a user requests password reset

Both templates are responsive and include:

- Professional styling
- Clear call-to-action buttons
- Security warnings
- Branding elements

## Troubleshooting

### Common Issues

1. **"Invalid login" error**: Make sure you're using the App Password, not your regular Gmail password
2. **Emails not sending**: Check that 2FA is enabled and App Password is correct
3. **Links not working**: Verify that FRONTEND_URI is set correctly in your environment variables

### Testing Locally

For local development, you can use services like:

- Mailtrap (for testing email sending)
- Ethereal Email (for testing email templates)

## Security Notes

1. Never commit your `.env` file to version control
2. Use App Passwords instead of your main Gmail password
3. Consider using a dedicated email service for production (SendGrid, AWS SES, etc.)
4. Implement rate limiting for email sending endpoints

## Production Deployment

For production deployment:

1. Use a dedicated email service provider
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Implement proper error handling and logging
5. Consider using a queue system for email sending

## API Endpoints

The following new endpoints are available:

- `GET /api/auth/verify-email?token={token}` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Frontend Integration

The frontend includes:

- Email verification page at `/auth/verify-email`
- Updated registration flow with email verification
- Resend verification functionality
- Password reset functionality

## Support

If you encounter any issues:

1. Check the server logs for error messages
2. Verify your environment variables
3. Test with a simple email sending script
4. Check Gmail's security settings
