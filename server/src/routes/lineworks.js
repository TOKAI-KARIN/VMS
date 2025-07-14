const express = require('express');
const router = express.Router();

// LineWorks関連のルートをここに追加
// 例: LINE WORKS APIとの連携など

// 基本的なGETルート（テスト用）
router.get('/', (req, res) => {
  res.json({ message: 'LineWorks API endpoint' });
});

module.exports = router; 