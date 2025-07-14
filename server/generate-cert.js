const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

function generateCert() {
  try {
    const certsDir = path.join(__dirname, 'certs');
    
    // 証明書ディレクトリの作成
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir);
    }

    // キーペアの生成
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // 証明書の作成
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
      name: 'commonName',
      value: 'localhost'
    }, {
      name: 'countryName',
      value: 'JP'
    }, {
      shortName: 'ST',
      value: 'Tokyo'
    }, {
      name: 'localityName',
      value: 'Tokyo'
    }, {
      name: 'organizationName',
      value: 'Vehicle Management'
    }, {
      shortName: 'OU',
      value: 'Development'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // 証明書の署名
    cert.sign(keys.privateKey);

    // 証明書と秘密鍵の保存
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const certPem = forge.pki.certificateToPem(cert);

    fs.writeFileSync(path.join(certsDir, 'private.key'), privateKeyPem);
    fs.writeFileSync(path.join(certsDir, 'certificate.crt'), certPem);

    console.log('証明書が正常に生成されました。');
  } catch (error) {
    console.error('証明書の生成中にエラーが発生しました:', error);
  }
}

generateCert(); 