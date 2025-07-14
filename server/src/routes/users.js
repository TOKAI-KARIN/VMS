const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth').auth;
const authorize = require('../middleware/authorize');
const bcrypt = require('bcryptjs');

// ユーザー一覧の取得
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (['PA', '店頭PA', '店長'].includes(req.user.role)) {
      where.locationId = req.user.locationId;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'ユーザー情報の取得に失敗しました。' });
  }
});

// ユーザーの作成
router.post('/', auth, authorize(['admin', 'PA', '店頭PA', '店長']), async (req, res) => {
  try {
    const { username, password, displayName, role, locationId } = req.body;

    // ユーザー名の重複チェック
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
    }

    // 従業員は自分の拠点のユーザーのみ作成可能
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この拠点のユーザーを作成する権限がありません。' });
    }

    const user = await User.create({
      username,
      password, // モデルのフックでハッシュ化されます
      displayName,
      role: role || 'customer',
      locationId
    });

    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'ユーザーの作成に失敗しました。' });
  }
});

// ユーザーの更新
router.put('/:id', auth, authorize(['admin', 'PA', '店頭PA', '店長']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 従業員は自分の拠点のユーザーのみ更新可能
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && user.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'このユーザーを更新する権限がありません。' });
    }

    const { username, displayName, role, locationId } = req.body;

    // ユーザー名の重複チェック（変更がある場合のみ）
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
      }
    }

    // 従業員は自分の拠点のユーザーのみ更新可能
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && locationId && locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この拠点のユーザーを更新する権限がありません。' });
    }

    await user.update({
      username,
      displayName,
      role,
      locationId
    });

    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'ユーザーの更新に失敗しました。' });
  }
});

// ユーザーの削除
router.delete('/:id', auth, authorize(['admin', 'PA', '店頭PA', '店長']), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 従業員は自分の拠点のユーザーのみ削除可能
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && user.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'このユーザーを削除する権限がありません。' });
    }

    await user.destroy();
    res.json({ message: 'ユーザーが削除されました。' });
  } catch (error) {
    res.status(500).json({ message: 'ユーザーの削除に失敗しました。' });
  }
});

module.exports = router; 