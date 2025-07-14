const express = require('express');
const { Vehicle, Order, User, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// ダッシュボード統計情報の取得
router.get('/dashboard', auth, async (req, res) => {
  try {
    const where = {};
    if (["PA", "店頭PA", "店長"].includes(req.user.role)) {
      where.locationId = req.user.locationId;
    } else if (req.user.role === 'customer') {
      where.customerId = req.user.id;
    }

    // 車両総数
    const totalVehicles = await Vehicle.count({ where });

    // 注文総数
    const totalOrders = await Order.count({ where });

    // 最近の注文（最新5件）
    const recentOrders = await Order.findAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'typeNumber', 'licensePlate', 'frameNumber', 'parts22']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'displayName']
        }
      ],
      order: [['orderDate', 'DESC']],
      limit: 5
    });

    // 月別注文数（過去6ヶ月）
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await Order.findAll({
      where: {
        ...where,
        orderDate: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('orderDate')), 'month'],
        [sequelize.fn('count', '*'), 'count']
      ],
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('orderDate'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('orderDate')), 'ASC']]
    });

    res.json({
      totalVehicles,
      totalOrders,
      recentOrders,
      monthlyOrders: monthlyOrders.map(item => ({
        month: item.getDataValue('month'),
        count: parseInt(item.getDataValue('count'))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: '統計情報の取得に失敗しました。' });
  }
});

module.exports = router; 