const express = require('express');
const router = express.Router();
const { Location } = require('../models');
const auth = require('../middleware/auth').auth;
const authorize = require('../middleware/authorize');

// 拠点一覧の取得
router.get('/', auth, async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(locations);
  } catch (error) {
    console.error('GET /api/locations error:', error);
    res.status(500).json({ message: '拠点情報の取得に失敗しました。' });
  }
});

// 拠点の作成（管理者のみ）
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, name, address, phone, email } = req.body;
    const existingLocation = await Location.findByPk(id);
    if (existingLocation) {
      return res.status(400).json({ message: 'この拠点IDは既に使用されています。' });
    }
    const location = await Location.create({
      id,
      name,
      address,
      phone,
      email: email ?? null
    });
    res.status(201).json(location);
  } catch (error) {
    console.error('POST /api/locations error:', error);
    res.status(500).json({ message: '拠点の作成に失敗しました。' });
  }
});

// 拠点の更新（管理者のみ）
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ message: '拠点が見つかりません。' });
    }
    const { name, address, phone, email, isActive } = req.body;
    await location.update({
      name,
      address,
      phone,
      email: email ?? null,
      isActive
    });
    res.json(location);
  } catch (error) {
    console.error('PUT /api/locations/:id error:', error);
    res.status(500).json({ message: '拠点の更新に失敗しました。' });
  }
});

// 拠点の削除（管理者のみ）
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({ message: '拠点が見つかりません。' });
    }
    await location.update({ isActive: false });
    res.json({ message: '拠点が削除されました。' });
  } catch (error) {
    console.error('DELETE /api/locations/:id error:', error);
    res.status(500).json({ message: '拠点の削除に失敗しました。' });
  }
});

// 拠点ごとのLINE WORKSテスト通知
router.post('/:id/test-notification', auth, authorize('admin'), async (req, res) => {
  try {
    const locationId = req.params.id;
    const { sendTestNotification } = require('../utils/lineworks');
    const result = await sendTestNotification(locationId);
    if (result && result.status === 200) {
      res.json({ message: 'テスト通知を送信しました。', details: result.data });
    } else {
      res.status(500).json({ message: '通知の送信に失敗しました。環境変数の設定を確認してください。', details: result?.data });
    }
  } catch (error) {
    console.error('POST /api/locations/:id/test-notification error:', error);
    res.status(500).json({ message: 'テスト通知の送信に失敗しました。' });
  }
});

module.exports = router; 