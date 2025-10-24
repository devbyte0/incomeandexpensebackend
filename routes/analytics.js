const express = require('express');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Get summary
    const summary = await Transaction.getUserSummary(req.user._id, startDate, endDate);

    // Get transactions by category
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          categoryName: '$category.name',
          categoryIcon: '$category.icon',
          categoryColor: '$category.color',
          categoryType: '$category.type',
          total: 1,
          count: 1
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: new Date(now.getFullYear(), 0, 1) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top categories
    const topCategories = categoryBreakdown.slice(0, 5);

    res.json({
      success: true,
      data: {
        summary,
        categoryBreakdown,
        monthlyTrends,
        topCategories,
        period: {
          startDate,
          endDate,
          type: period
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get spending trends
// @route   GET /api/analytics/trends
// @access  Private
router.get('/trends', protect, async (req, res) => {
  try {
    const { period = '6months', type = 'expense' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        endDate = now;
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = now;
    }

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: type,
          date: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends,
        period: {
          startDate,
          endDate,
          type: period
        }
      }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get category analysis
// @route   GET /api/analytics/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const { period = 'month', type } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    const matchStage = {
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    if (type && ['income', 'expense'].includes(type)) {
      matchStage.type = type;
    }

    const categoryAnalysis = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
          min: { $min: '$amount' },
          max: { $max: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          categoryId: '$_id',
          categoryName: '$category.name',
          categoryIcon: '$category.icon',
          categoryColor: '$category.color',
          categoryType: '$category.type',
          total: 1,
          count: 1,
          average: 1,
          min: 1,
          max: 1,
          percentage: 1
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Calculate percentages
    const totalAmount = categoryAnalysis.reduce((sum, cat) => sum + cat.total, 0);
    categoryAnalysis.forEach(cat => {
      cat.percentage = totalAmount > 0 ? (cat.total / totalAmount * 100).toFixed(2) : 0;
    });

    res.json({
      success: true,
      data: {
        categoryAnalysis,
        totalAmount,
        period: {
          startDate,
          endDate,
          type: period
        }
      }
    });
  } catch (error) {
    console.error('Get category analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get monthly comparison
// @route   GET /api/analytics/comparison
// @access  Private
router.get('/comparison', protect, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month data
    const currentMonthData = await Transaction.getUserSummary(
      req.user._id, 
      currentMonth, 
      now
    );

    // Last month data
    const lastMonthData = await Transaction.getUserSummary(
      req.user._id, 
      lastMonth, 
      lastMonthEnd
    );

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };

    const comparison = {
      income: {
        current: currentMonthData.income.total,
        previous: lastMonthData.income.total,
        change: calculateChange(currentMonthData.income.total, lastMonthData.income.total),
        changeType: currentMonthData.income.total > lastMonthData.income.total ? 'increase' : 'decrease'
      },
      expense: {
        current: currentMonthData.expense.total,
        previous: lastMonthData.expense.total,
        change: calculateChange(currentMonthData.expense.total, lastMonthData.expense.total),
        changeType: currentMonthData.expense.total > lastMonthData.expense.total ? 'increase' : 'decrease'
      },
      net: {
        current: currentMonthData.net,
        previous: lastMonthData.net,
        change: calculateChange(currentMonthData.net, lastMonthData.net),
        changeType: currentMonthData.net > lastMonthData.net ? 'increase' : 'decrease'
      }
    };

    res.json({
      success: true,
      data: {
        comparison,
        periods: {
          current: { start: currentMonth, end: now },
          previous: { start: lastMonth, end: lastMonthEnd }
        }
      }
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
