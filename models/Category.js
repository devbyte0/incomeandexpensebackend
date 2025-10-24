const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: ['income', 'expense']
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ user: 1, type: 1 });
categorySchema.index({ user: 1, name: 1 }, { unique: true });

// Ensure user can't have duplicate category names
categorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      user: this.user,
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingCategory) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
