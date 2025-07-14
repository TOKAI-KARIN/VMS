const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/models');
require('dotenv').config();

const app = express();

// ミドルウェアの設定
app.use(cors({
  origin: function (origin, callback) {
    // 許可するオリジンのリスト
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://192.168.128.153:3000',
      'https://192.168.128.153:3000',
      'http://192.168.1.100:3000',
      'https://192.168.1.100:3000'
    ];
    
    // originがnullの場合（モバイルアプリからのアクセスなど）も許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // 開発中は全て許可
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'cache-control']
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// アップロードされたファイルを静的ファイルとして提供
app.use('/uploads', (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://192.168.128.153:3000',
    'https://192.168.128.153:3000',
    'http://192.168.1.100:3000',
    'https://192.168.1.100:3000'
  ];
  const origin = req.headers.origin;
  
  console.log('uploads アクセス:', {
    method: req.method,
    url: req.url,
    origin: origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    host: req.headers.host,
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip']
  });
  
  // モバイル対応：より柔軟なCORS設定
  if (!origin || allowedOrigins.includes(origin) || req.headers['user-agent']?.includes('Mobile')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, cache-control');
    res.setHeader('Vary', 'Origin');
  }
  
  // iPhone/Safari対応のヘッダー
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Content-Disposition', 'inline');
  
  // SameOrigin制約系ヘッダーを除去
  res.removeHeader && res.removeHeader('X-Frame-Options');
  res.removeHeader && res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader && res.removeHeader('Cross-Origin-Resource-Policy');
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// 画像ファイル専用ルート（iPhone/Safari対応）
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  console.log('画像ファイルアクセス:', {
    filename: filename,
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    filePath: filePath,
    host: req.headers.host,
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip']
  });
  
  // ファイルの存在確認
  if (!fs.existsSync(filePath)) {
    console.log('ファイルが見つかりません:', filePath);
    try {
      const uploadsDir = path.join(__dirname, 'uploads');
      const files = fs.readdirSync(uploadsDir);
      console.log('uploadsディレクトリの内容:', files);
      console.log('uploadsディレクトリのパス:', uploadsDir);
      
      // 類似ファイル名を検索
      const similarFiles = files.filter(file => file.includes(filename.split('.')[0]));
      if (similarFiles.length > 0) {
        console.log('類似ファイルが見つかりました:', similarFiles);
      }
    } catch (error) {
      console.log('uploadsディレクトリの読み込みエラー:', error.message);
    }
    return res.status(404).json({ message: 'ファイルが見つかりません。' });
  }
  
  // CORS設定
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://192.168.128.153:3000',
    'https://192.168.128.153:3000',
    'http://192.168.1.100:3000',
    'https://192.168.1.100:3000'
  ];
  const origin = req.headers.origin;
  
  // モバイル対応：より柔軟なCORS設定
  if (!origin || allowedOrigins.includes(origin) || req.headers['user-agent']?.includes('Mobile')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, cache-control');
  }
  
  // iPhone/Safari対応のヘッダー
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Content-Disposition', 'inline');
  
  // ファイル拡張子に基づいてMIMEタイプを設定
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
  
  const fileStats = fs.statSync(filePath);
  console.log('画像ファイル送信:', {
    filename: filename,
    mimeType: mimeTypes[ext] || 'image/jpeg',
    fileSize: fileStats.size,
    filePath: filePath,
    lastModified: fileStats.mtime
  });
  
  // ファイルを送信
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('画像ファイル送信エラー:', err);
    } else {
      console.log('画像ファイル送信完了:', filename);
    }
  });
});

// ルートの設定
app.use('/auth', require('./src/routes/auth'));
app.use('/users', require('./src/routes/users'));
app.use('/locations', require('./src/routes/locations'));
app.use('/vehicles', require('./src/routes/vehicles'));
app.use('/orders', require('./src/routes/orders'));
app.use('/stats', require('./src/routes/stats'));
app.use('/lineworks', require('./src/routes/lineworks'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'サーバーエラーが発生しました。',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// SSL証明書のオプション
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'certificate.crt')),
};

// サーバーの起動
const PORT = process.env.PORT || 3001;

// データベース接続の確認
sequelize.authenticate()
  .then(() => {
    console.log('データベースに接続しました。');
    // テーブルを自動生成
    return sequelize.sync();
  })
  .then(() => {
    console.log('テーブルを同期しました。');
    // HTTPSサーバー起動
    https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
      console.log(`HTTPSサーバーが起動しました。ポート: ${PORT}`);
      console.log(`ローカルアクセス: https://localhost:${PORT}`);
      console.log(`ネットワークアクセス: https://192.168.128.153:${PORT}`);
    });
    
    // HTTPサーバーも起動（Android対応）
    http.createServer(app).listen(PORT + 1, '0.0.0.0', () => {
      console.log(`HTTPサーバーが起動しました。ポート: ${PORT + 1}`);
      console.log(`HTTPアクセス: http://192.168.128.153:${PORT + 1}`);
    });
  })
  .catch(err => {
    console.error('データベース接続エラー:', err);
  }); 