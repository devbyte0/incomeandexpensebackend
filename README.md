# Backend API - Income & Expense Tracker

This is the backend API for the Income & Expense Tracker application, built with Express.js, Node.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/income-expense-app
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development

   # Email Configuration (required for email verification and 2FA)
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   FRONTEND_URI=http://localhost:3000

   # Optional: Cloudinary for image uploads
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

   **Note:** To set up email functionality, see [EMAIL_SETUP.md](./EMAIL_SETUP.md)

3. **Start the server**

   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

4. **API will be available at**
   ```
   http://localhost:5000/api
   ```

## 📁 Project Structure

```
BackEnd/
├── models/              # MongoDB models
│   ├── User.js         # User model
│   ├── Category.js     # Category model
│   └── Transaction.js  # Transaction model
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management routes
│   ├── categories.js   # Category management routes
│   ├── transactions.js # Transaction management routes
│   └── analytics.js    # Analytics routes
├── middleware/         # Custom middleware
│   └── auth.js         # Authentication middleware
├── utils/              # Utility functions
│   ├── generateToken.js # JWT token utilities
│   └── emailService.js  # Email service for verification & 2FA
├── server.js           # Main server file
├── package.json        # Dependencies
└── EMAIL_SETUP.md      # Email setup instructions
```

## 🔧 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user
- `PUT /password` - Update password
- `GET /sessions` - Get active sessions
- `POST /sessions/revoke` - Revoke current session
- `GET /verify-email?token={token}` - Verify email with token
- `POST /resend-verification` - Resend verification email
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /verify-otp` - Verify OTP for 2FA login
- `POST /enable-2fa` - Enable two-factor authentication
- `POST /disable-2fa` - Disable two-factor authentication

### Users (`/api/users`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /preferences` - Update user preferences
- `POST /avatar` - Upload avatar
- `DELETE /account` - Delete account

### Categories (`/api/categories`)

- `GET /` - Get user categories
- `GET /:id` - Get single category
- `POST /` - Create category
- `PUT /:id` - Update category
- `DELETE /:id` - Delete category
- `POST /defaults` - Create default categories

### Transactions (`/api/transactions`)

- `GET /` - Get transactions (with pagination and filters)
- `GET /:id` - Get single transaction
- `POST /` - Create transaction
- `PUT /:id` - Update transaction
- `DELETE /:id` - Delete transaction
- `GET /summary` - Get transaction summary
- `GET /recent` - Get recent transactions

### Analytics (`/api/analytics`)

- `GET /dashboard` - Get dashboard analytics
- `GET /trends` - Get spending trends
- `GET /categories` - Get category analysis
- `GET /comparison` - Get monthly comparison

## 🗄️ Database Models

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  phone: String,
  currency: String,
  timezone: String,
  preferences: {
    theme: String,
    notifications: Object,
    budgetAlerts: Boolean
  },
  isEmailVerified: Boolean,
  isActive: Boolean,
  isTwoFactorEnabled: Boolean,
  otpCode: String,
  otpExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model

```javascript
{
  name: String,
  type: String (income/expense),
  icon: String,
  color: String,
  description: String,
  isDefault: Boolean,
  isActive: Boolean,
  user: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model

```javascript
{
  title: String,
  description: String,
  amount: Number,
  type: String (income/expense),
  category: ObjectId (ref: Category),
  user: ObjectId (ref: User),
  date: Date,
  tags: [String],
  location: Object,
  attachments: [Object],
  isRecurring: Boolean,
  recurringPattern: Object,
  status: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Two-Factor Authentication (2FA)**: Email-based OTP verification
- **Email Verification**: Required on signup
- **Password Reset**: Secure token-based reset flow
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 API Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## 🔧 Environment Variables

| Variable                | Description               | Default                                        |
| ----------------------- | ------------------------- | ---------------------------------------------- |
| `PORT`                  | Server port               | `5000`                                         |
| `MONGODB_URI`           | MongoDB connection string | `mongodb://localhost:27017/income-expense-app` |
| `JWT_SECRET`            | JWT secret key            | Required                                       |
| `JWT_EXPIRE`            | JWT expiration time       | `7d`                                           |
| `NODE_ENV`              | Environment               | `development`                                  |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name     | Optional                                       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key        | Optional                                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret     | Optional                                       |

## 🚀 Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name "income-expense-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup for Production

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas or production MongoDB
4. Set up proper CORS origins
5. Configure rate limiting
6. Set up monitoring and logging

## 📝 API Documentation

### Authentication Flow

1. User registers with name, email, and password
2. Server validates input and creates user
3. JWT token is generated and returned
4. Client stores token and includes it in subsequent requests
5. Server validates token on protected routes

### Pagination

Most list endpoints support pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Filtering

Transaction endpoints support filtering:

- `type`: Filter by income/expense
- `category`: Filter by category ID
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Search in title and description

## 🐛 Error Handling

The API includes comprehensive error handling:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## 📈 Performance

- Database indexing for optimal query performance
- Pagination to handle large datasets
- Response caching where appropriate
- Rate limiting to prevent abuse
- Connection pooling for MongoDB

## 🔄 API Versioning

Currently using v1 of the API. Future versions will be handled through:

- URL versioning: `/api/v2/`
- Header versioning: `API-Version: 2`

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## 📞 Support

For backend-specific issues:

1. Check the logs for error details
2. Verify environment variables
3. Ensure MongoDB connection
4. Check API endpoint documentation
# incomeandexpensebackend
