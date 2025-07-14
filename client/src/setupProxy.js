const { createProxyMiddleware } = require('http-proxy-middleware');

// html5-qrcodeのソースマップ警告を抑制
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('html5-qrcode') || 
       args[0].includes('Failed to parse source map') ||
       args[0].includes('source-map-loader'))) {
    return; // html5-qrcodeの警告を無視
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('html5-qrcode') || 
       args[0].includes('Failed to parse source map') ||
       args[0].includes('source-map-loader'))) {
    return; // html5-qrcodeのエラーを無視
  }
  originalConsoleError.apply(console, args);
};

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://192.168.128.153:3001',
      changeOrigin: true,
      secure: false, // 自己署名証明書を許可
      pathRewrite: {
        '^/api': '', // /apiを空文字に置換
      },
    })
  );

  app.use(
    '/lineworks',
    createProxyMiddleware({
      target: 'https://192.168.128.153:3001',
      changeOrigin: true,
      secure: false
    })
  );
}; 