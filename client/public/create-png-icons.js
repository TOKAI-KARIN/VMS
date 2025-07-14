const fs = require('fs');
const path = require('path');

// 簡単なSVGアイコンを生成する関数
function generateSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1565c0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size/10}"/>
  <circle cx="${size/2}" cy="${size/3}" r="${size/8}" fill="white"/>
  <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/4}" fill="white" rx="${size/20}"/>
  <text x="${size/2}" y="${size*0.85}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold">車</text>
</svg>`;
}

// SVGをBase64エンコードされたPNGに変換（簡易版）
function svgToPNGBase64(svg, size) {
  // 実際の実装では、canvas2dやsharpなどのライブラリを使用
  // ここでは簡易的な実装として、SVGファイルをそのまま保存
  return svg;
}

// アイコンファイルを生成
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = `logo${size}.png`;
  const filepath = path.join(__dirname, filename);
  
  // SVGファイルとして保存（実際のPNG変換は別途実装が必要）
  fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
  console.log(`${filename} (SVG) を生成しました`);
});

console.log('アイコンファイルの生成が完了しました。');
console.log('実際のPNGファイルが必要な場合は、SVGファイルをPNGに変換してください。'); 