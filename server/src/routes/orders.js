const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Order, Vehicle, User } = require('../models');
const auth = require('../middleware/auth').auth;
const authorize = require('../middleware/authorize');

// multerの設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    // アップロードディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // ファイル名を一意にする（タイムスタンプ + オリジナル名）
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: function (req, file, cb) {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です。'), false);
    }
  }
});

// 注文一覧の取得
router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (['PA', '店頭PA', '店長'].includes(req.user.role)) {
      where.locationId = req.user.locationId;
    } else if (req.user.role === 'customer') {
      where.customerId = req.user.id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'typeNumber', 'licensePlate', 'frameNumber', 'parts20', 'parts22']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'displayName']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'displayName']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'displayName']
        }
      ],
      order: [['orderDate', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: '注文情報の取得に失敗しました。' });
  }
});

// 注文詳細の取得
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'typeNumber', 'licensePlate', 'frameNumber', 'parts20', 'parts22', 'parts4', 'parts5', 'parts23']
        },
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'displayName']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'displayName']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'displayName']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 権限チェック
    if (['PA', '店頭PA', '店長'].includes(req.user.role) && order.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この注文情報にアクセスする権限がありません。' });
    }
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'この注文情報にアクセスする権限がありません。' });
    }

    const orderJson = order.toJSON();
    if (Array.isArray(orderJson.attachedPhotos) && orderJson.attachedPhotos.length > 0) {
      orderJson.attachedPhotos = orderJson.attachedPhotos.map(f => `/uploads/${f}`);
    } else if (orderJson.remarks) {
      // 備考から画像名を抽出
      const match = orderJson.remarks.match(/\[添付写真:([^[\]]+)\]/);
      if (match && match[1]) {
        orderJson.attachedPhotos = match[1]
          .split(',')
          .map(f => f.trim())
          .map(f => f.replace(/^camera_/, '')) // camera_を消す
          .map(f => `/uploads/${f}`);
      } else {
        orderJson.attachedPhotos = [];
      }
    } else {
      orderJson.attachedPhotos = [];
    }
    res.json(orderJson);
  } catch (error) {
    res.status(500).json({ message: '注文情報の取得に失敗しました。' });
  }
});

// 注文の作成
router.post('/', auth, authorize(['admin', 'PA', 'customer', '店長']), async (req, res) => {
  try {
    console.log('注文作成開始:', {
      user: req.user.id,
      userRole: req.user.role,
      userLocation: req.user.locationId,
      body: req.body,
      headers: req.headers,
      userAgent: req.headers['user-agent']
    });

    const orderData = {
      ...req.body,
      locationId:
        req.user.role === 'PA' ? req.user.locationId :
        req.user.role === 'customer' ? req.user.locationId :
        req.body.locationId,
      customerId: req.user.role === 'customer' ? req.user.id : req.body.customerId,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      attachedPhotos: req.body.attachedPhotos || null
    };

    console.log('注文データ:', orderData);

    const order = await Order.create(orderData);
    
    console.log('注文作成完了:', {
      orderId: order.id,
      orderData: order.toJSON()
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error('注文作成エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      user: req.user?.id,
      userRole: req.user?.role
    });
    res.status(500).json({ message: '注文の作成に失敗しました。', error: error.message });
  }
});

// 注文の更新
router.put('/:id', auth, authorize(['admin', 'PA']), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 権限チェック
    if (req.user.role === 'PA' && order.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この注文を更新する権限がありません。' });
    }

    await order.update({
      ...req.body,
      updatedBy: req.user.id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: '注文の更新に失敗しました。' });
  }
});

// 受注回答（注文の確定）
router.put('/:id/confirm', auth, authorize(['admin', '店頭PA', '店長']), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 権限チェック
    if (['店頭PA', '店長'].includes(req.user.role) && order.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この注文を更新する権限がありません。' });
    }

    await order.update({
      status: '注文済み', // statusフィールドはOrderモデルに必要
      updatedBy: req.user.id
    });

    // 更新後のデータを再取得して返す
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: User, as: 'customer' },
        { model: User, as: 'createdByUser' },
        { model: User, as: 'updatedByUser' },
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: '受注回答の処理に失敗しました。' });
  }
});

// 注文の削除
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    await order.destroy();
    res.json({ message: '注文が削除されました。' });
  } catch (error) {
    res.status(500).json({ message: '注文の削除に失敗しました。' });
  }
});

// 写真アップロード
router.post('/:id/photos', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const orderId = req.params.id;
    
    console.log('写真アップロード開始:', {
      orderId,
      user: req.user.id,
      userRole: req.user.role,
      filesCount: req.files ? req.files.length : 0,
      headers: req.headers,
      userAgent: req.headers['user-agent']
    });
    
    // 注文の存在確認
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.log('注文が見つかりません:', orderId);
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 権限チェック
    if (['PA', '店頭PA'].includes(req.user.role) && order.locationId !== req.user.locationId) {
      console.log('権限エラー - PA/店頭PA:', { userLocation: req.user.locationId, orderLocation: order.locationId });
      return res.status(403).json({ message: 'この注文に写真をアップロードする権限がありません。' });
    }
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      console.log('権限エラー - customer:', { userId: req.user.id, orderCustomerId: order.customerId });
      return res.status(403).json({ message: 'この注文に写真をアップロードする権限がありません。' });
    }

    if (!req.files || req.files.length === 0) {
      console.log('アップロードファイルなし');
      return res.status(400).json({ message: 'アップロードする写真がありません。' });
    }

    console.log('アップロードファイル情報:', req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    })));

    // アップロードされたファイルの情報を注文に保存
    const photoFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    // 既存のattachedPhotosを取得
    let attachedPhotos = Array.isArray(order.attachedPhotos) ? order.attachedPhotos : [];
    attachedPhotos = attachedPhotos.concat(photoFiles.map(file => file.filename));
    
    console.log('更新前のattachedPhotos:', order.attachedPhotos);
    console.log('更新後のattachedPhotos:', attachedPhotos);
    
    await order.update({
      attachedPhotos,
      updatedBy: req.user.id
    });

    console.log('写真アップロード完了:', {
      orderId,
      uploadedFiles: photoFiles.length,
      totalPhotos: attachedPhotos.length
    });

    res.json({
      message: '写真がアップロードされました。',
      photos: photoFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size
      }))
    });
  } catch (error) {
    console.error('写真アップロードエラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
      user: req.user?.id
    });
    res.status(500).json({ message: '写真のアップロードに失敗しました。', error: error.message });
  }
});

// 写真の取得
router.get('/:id/photos', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // 注文の存在確認
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: '注文が見つかりません。' });
    }

    // 権限チェック
    if (['PA', '店頭PA'].includes(req.user.role) && order.locationId !== req.user.locationId) {
      return res.status(403).json({ message: 'この注文の写真を取得する権限がありません。' });
    }
    if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'この注文の写真を取得する権限がありません。' });
    }

    // アップロードディレクトリから写真ファイルを取得
    const uploadDir = path.join(__dirname, '../../uploads');
    const files = fs.readdirSync(uploadDir).filter(file => {
      // 注文IDに関連するファイルをフィルタリング（実装は簡略化）
      return file.match(/\.(jpg|jpeg|png|gif)$/i);
    });

    const photos = files.map(filename => ({
      filename,
      url: `/uploads/${filename}`
    }));

    res.json({ photos });
  } catch (error) {
    console.error('写真取得エラー:', error);
    res.status(500).json({ message: '写真の取得に失敗しました。' });
  }
});

module.exports = router; 