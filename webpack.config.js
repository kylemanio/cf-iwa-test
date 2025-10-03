/* webpack.config.js */
const fs = require("fs");
const path = require('path');
const WebBundlePlugin = require('webbundle-webpack-plugin');
const {
  NodeCryptoSigningStrategy,
  parsePemKey,
  WebBundleId,
} = require('wbn-sign');

const privateKeyFile = "private-key.pem";
console.log('privateKeyFile', privateKeyFile)
if (!fs.existsSync(privateKeyFile)) {
  throw new Error("Cannot read private key.");
}
const privateKey = fs.readFileSync(privateKeyFile);
console.log('privateKey', privateKey)
const key = parsePemKey(privateKey);

module.exports = async () => {
  return {
    entry: './static/index.js',
    mode: 'development',
    output: { path: __dirname },
    plugins: [
      new WebBundlePlugin({
        baseURL: new WebBundleId(key).serializeWithIsolatedWebAppOrigin(),
        static: { dir: path.resolve(__dirname, 'static') },
        output: 'iwa-test.swbn',
        integrityBlockSign: {
          strategy: new NodeCryptoSigningStrategy(key),
        },
      }),
    ],
  };
};