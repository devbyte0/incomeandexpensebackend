const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Transaction title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['income', 'expense']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String,
    size: Number
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    nextDueDate: Date
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, amount: -1 });
transactionSchema.index({ user: 1, tags: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to validate category belongs to user
transactionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('category')) {
    const Category = mongoose.model('Category');
    const category = await Category.findOne({
      _id: this.category,
      user: this.user
    });
    
    if (!category) {
      const error = new Error('Category not found or does not belong to user');
      error.statusCode = 400;
      return next(error);
    }
    
    // Ensure transaction type matches category type
    if (this.type !== category.type) {
      const error = new Error('Transaction type must match category type');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    status: 'completed'
  };
  
  if (startDate && endDate) {
    matchStage.date = { $gte: startDate, $lte: endDate };
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        average: { $avg: '$amount' }
      }
    }
  ]);
  
  const result = {
    income: { total: 0, count: 0, average: 0 },
    expense: { total: 0, count: 0, average: 0 }
  };
  
  summary.forEach(item => {
    result[item._id] = {
      total: item.total,
      count: item.count,
      average: item.average
    };
  });
  
  result.net = result.income.total - result.expense.total;
  
  return result;
};

module.exports = mongoose.model('Transaction', transactionSchema);
