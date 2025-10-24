const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = { user: req.user._id, isActive: true };
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', [
  protect,
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot be more than 10 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters')
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

    const { name, type, icon, color, description } = req.body;

    const category = await Category.create({
      name,
      type,
      icon: icon || '💰',
      color: color || '#3B82F6',
      description,
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot be more than 10 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters')
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

    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Don't allow updating default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update default categories'
      });
    }

    const allowedUpdates = ['name', 'icon', 'color', 'description'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default categories'
      });
    }

    // Soft delete by setting isActive to false
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create default categories for new user
// @route   POST /api/categories/defaults
// @access  Private
router.post('/defaults', protect, async (req, res) => {
  try {
    // Check if user already has categories
    const existingCategories = await Category.countDocuments({ user: req.user._id });
    
    if (existingCategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has categories'
      });
    }

    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'income', icon: '💼', color: '#10B981', isDefault: true },
      { name: 'Freelance', type: 'income', icon: '💻', color: '#3B82F6', isDefault: true },
      { name: 'Investment', type: 'income', icon: '📈', color: '#8B5CF6', isDefault: true },
      { name: 'Business', type: 'income', icon: '🏢', color: '#F59E0B', isDefault: true },
      { name: 'Other Income', type: 'income', icon: '💰', color: '#6B7280', isDefault: true },
      
      // Expense categories
      { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#EF4444', isDefault: true },
      { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3B82F6', isDefault: true },
      { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#8B5CF6', isDefault: true },
      { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#F59E0B', isDefault: true },
      { name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#10B981', isDefault: true },
      { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#EF4444', isDefault: true },
      { name: 'Education', type: 'expense', icon: '📚', color: '#3B82F6', isDefault: true },
      { name: 'Travel', type: 'expense', icon: '✈️', color: '#8B5CF6', isDefault: true },
      { name: 'Other Expense', type: 'expense', icon: '💸', color: '#6B7280', isDefault: true }
    ];

    const categories = await Category.insertMany(
      defaultCategories.map(cat => ({ ...cat, user: req.user._id }))
    );

    res.status(201).json({
      success: true,
      message: 'Default categories created successfully',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Create default categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
