const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// ユーザー登録
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, role = 'customer' } = req.body;

    // ユーザー名の重複チェック
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
    }

    // 新規ユーザーの作成
    const user = await User.create({
      username,
      password,
      displayName,
      role
    });

    // 登録成功時のレスポンス
    res.status(201).json({
      message: 'ユーザー登録が完了しました。',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    res.status(500).json({ message: 'ユーザー登録に失敗しました。' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません。' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        locationId: user.locationId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'ログインに失敗しました。' });
  }
});

// パスワードリセット
router.post('/reset-password', auth, async (req, res) => {
  try {
    // 管理者権限チェック
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
    }

    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
      return res.status(400).json({ message: 'ユーザー名と新しいパスワードは必須です。' });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // パスワードの更新
    await user.update({ password: newPassword });

    res.json({ message: 'パスワードが更新されました。' });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    res.status(500).json({ message: 'パスワードの更新に失敗しました。' });
  }
});

// ユーザー情報の取得
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'ユーザー情報の取得に失敗しました。' });
  }
});

// パスワード変更
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    // 現在のパスワードを確認
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: '現在のパスワードが正しくありません。' });
    }

    // 新しいパスワードを設定
    await user.update({ password: newPassword });

    res.json({ message: 'パスワードが更新されました。' });
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    res.status(500).json({ message: 'パスワードの更新に失敗しました。' });
  }
});

module.exports = router; 