const express = require('express');
const { Vehicle, User, Order } = require('../models');
const auth = require('../middleware/auth').auth;
const authorize = require('../middleware/authorize');
const { Op } = require('sequelize');

const router = express.Router();

// 車両一覧の取得
router.get('/', auth, async (req, res) => {
  try {
    let where = {};
    
    if (['PA', '店頭PA', '店長'].includes(req.user.role)) {
      // 従業員の場合、所属拠点の顧客の車両のみを取得
      const customers = await User.findAll({
        where: {
          role: 'customer',
          locationId: req.user.locationId
        },
        attributes: ['id']
      });
      
      where = {
        customerId: {
          [Op.in]: customers.map(c => c.id)
        }
      };
    } else if (req.user.role === 'customer') {
      // 顧客の場合、自分の車両のみを取得
      where.customerId = req.user.id;
    }

    const vehicles = await Vehicle.findAll({
      where,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'displayName', 'locationId', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(vehicles);
  } catch (error) {
    console.error('車両取得エラー:', error);
    res.status(500).json({ message: '車両情報の取得に失敗しました。' });
  }
});

// 車両詳細の取得
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'displayName']
        },
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: User,
              as: 'createdByUser',
              attributes: ['id', 'displayName']
            }
          ],
          order: [['orderDate', 'DESC']]
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ message: '車両が見つかりません。' });
    }

    // 権限チェック
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && vehicle.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この車両情報にアクセスする権限がありません。' });
    }
    if (req.user.role === 'customer' && vehicle.customerId !== req.user.id) {
      return res.status(403).json({ message: 'この車両情報にアクセスする権限がありません。' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: '車両情報の取得に失敗しました。' });
  }
});

// 車両の登録
router.post('/', auth, async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      customerId: req.user.role === 'customer' ? req.user.id : req.body.customerId,
      locationId: ['PA', '店頭PA', '店長'].includes(req.user.role) ? req.user.locationId : req.body.locationId
    };

    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('車両登録エラー:', error);
    res.status(500).json({ message: '車両の登録に失敗しました。', error: error.message });
  }
});

// 車両情報の更新
router.put('/:id', auth, authorize(['admin', 'PA', '店頭PA', '店長']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: '車両が見つかりません。' });
    }

    // 権限チェック
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && vehicle.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この車両情報を更新する権限がありません。' });
    }

    await vehicle.update(req.body);
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: '車両情報の更新に失敗しました。' });
  }
});

// 車両の削除
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: '車両が見つかりません。' });
    }

    await vehicle.destroy();
    res.json({ message: '車両が削除されました。' });
  } catch (error) {
    res.status(500).json({ message: '車両の削除に失敗しました。' });
  }
});

module.exports = router; 