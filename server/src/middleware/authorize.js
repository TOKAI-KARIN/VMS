const authorize = (allowedRoles) => {
  return (req, res, next) => {
    console.log('権限チェック開始:', {
      user: req.user?.id,
      userRole: req.user?.role,
      allowedRoles: allowedRoles,
      url: req.url,
      method: req.method
    });

    if (!req.user) {
      console.log('認証エラー: ユーザーが存在しません');
      return res.status(401).json({ message: '認証が必要です。' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      console.log('権限エラー:', {
        userRole: req.user.role,
        allowedRoles: roles,
        hasPermission: roles.includes(req.user.role)
      });
      return res.status(403).json({ 
        message: 'この操作を実行する権限がありません。',
        userRole: req.user.role,
        allowedRoles: roles
      });
    }

    console.log('権限チェック成功:', req.user.role);
    next();
  };
};

module.exports = authorize; 