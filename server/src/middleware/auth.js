const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '認証が必要です。' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません。' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: '認証に失敗しました。' });
  }
};

const authorizeLocation = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  const requestedLocationId = req.params.locationId || req.body.locationId;
  if (requestedLocationId && requestedLocationId !== req.user.locationId) {
    return res.status(403).json({ message: 'この操作を実行する権限がありません。' });
  }
  next();
};

module.exports = {
  auth,
  authorizeLocation,
}; 